const pool = require('../database/connection');
const ErroApi = require('../utils/ErroApi');
const Aluno = require('./Aluno');
const Professor = require('./Professor');
const Administrador = require('./Administrador');
const Acompanhamento = require('./Acompanhamento');

/* Sistema: regras de negócio da 4U. Toda gravação que mexe em mais de uma tabela
   roda numa transação: ou grava tudo, ou não grava nada. */
class Sistema {
  constructor(dbPool = pool) {
    this._db = dbPool;
  }

  async _transacao(executar) {
    const conexao = await this._db.getConnection();
    try {
      await conexao.beginTransaction();
      const resultado = await executar(conexao);
      await conexao.commit();
      return resultado;
    } catch (erro) {
      await conexao.rollback();
      throw erro;
    } finally {
      conexao.release();
    }
  }

  /* ------------------------------------------------------------------ Alunos */

  /* Cadastra o aluno e já o matricula na turma */
  async criarAlunoNaTurma({ nome, dataNascimento, matricula, turmaId }) {
    const aluno = new Aluno({ nome, dataNascimento, matricula });
    const id = await this._transacao(async (c) => {
      const turma = await this._turma(c, turmaId);
      const [resultado] = await c.query(
        'INSERT INTO aluno (nome, data_nascimento, matricula, ativo) VALUES (?, ?, ?, ?)',
        [aluno.nome, aluno.dataNascimento, aluno.matricula, aluno.ativo]
      );
      await c.query(
        'INSERT INTO matricula_turma (turma_id, aluno_id, ano_letivo) VALUES (?, ?, ?)',
        [turma.id, resultado.insertId, turma.ano_letivo]
      );
      return resultado.insertId;
    });
    return this.buscarAlunoPorId(id);
  }

  async buscarAlunoPorId(id) {
    const [linhas] = await this._db.query('SELECT * FROM aluno WHERE id = ?', [id]);
    return linhas.length ? Aluno.fromRow(linhas[0]) : null;
  }

  /* Edita os dados e, se a turma mudou, a matrícula do ano letivo da turma */
  async editarAluno(id, { nome, dataNascimento, matricula, turmaId }) {
    const aluno = await this.buscarAlunoPorId(id);
    if (!aluno) throw new ErroApi(404, 'Aluno não encontrado.');
    aluno.editar({ nome, dataNascimento, matricula });

    await this._transacao(async (c) => {
      await c.query(
        'UPDATE aluno SET nome = ?, data_nascimento = ?, matricula = ? WHERE id = ?',
        [aluno.nome, aluno.dataNascimento, aluno.matricula, id]
      );
      const turma = await this._turma(c, turmaId);
      const [[atual]] = await c.query(
        'SELECT turma_id FROM matricula_turma WHERE aluno_id = ? AND ano_letivo = ?', [id, turma.ano_letivo]
      );
      if (!atual) {
        await c.query('INSERT INTO matricula_turma (turma_id, aluno_id, ano_letivo) VALUES (?, ?, ?)', [turma.id, id, turma.ano_letivo]);
      } else if (atual.turma_id !== turma.id) {
        await c.query('UPDATE matricula_turma SET turma_id = ? WHERE aluno_id = ? AND ano_letivo = ?', [turma.id, id, turma.ano_letivo]);
      }
    });
    return this.buscarAlunoPorId(id);
  }

  async alterarSituacaoAluno(id, ativo) {
    const aluno = await this.buscarAlunoPorId(id);
    if (!aluno) throw new ErroApi(404, 'Aluno não encontrado.');
    ativo ? aluno.ativar() : aluno.inativar();
    await this._db.query('UPDATE aluno SET ativo = ? WHERE id = ?', [aluno.ativo, id]);
    return this.buscarAlunoPorId(id);
  }

  /* Exclusão definitiva só para quem ainda não tem histórico */
  async excluirAluno(id) {
    const aluno = await this.buscarAlunoPorId(id);
    if (!aluno) throw new ErroApi(404, 'Aluno não encontrado.');
    const [[{ total }]] = await this._db.query('SELECT COUNT(*) AS total FROM acompanhamento WHERE aluno_id = ?', [id]);
    if (Number(total) > 0) {
      throw new ErroApi(409, 'Este aluno já tem acompanhamentos registrados. Para manter o histórico, use "Desativar".');
    }
    await this._transacao(async (c) => {
      await c.query('DELETE FROM matricula_turma WHERE aluno_id = ?', [id]);
      await c.query('DELETE FROM aluno WHERE id = ?', [id]); /* aluno_responsavel sai junto (ON DELETE CASCADE) */
    });
  }

  async _turma(c, turmaId) {
    const [[turma]] = await c.query('SELECT id, ano_letivo FROM turma WHERE id = ? AND ativo = 1', [turmaId]);
    if (!turma) throw new ErroApi(400, 'Confira os campos destacados.', { turma_id: 'Turma não encontrada.' });
    return turma;
  }

  /* -------------------------------------------------------------- Professores */

  _selectProfessorBase() {
    return `
      SELECT p.id AS professor_id, p.registro AS registro, p.usuario_id AS usuario_id,
             u.nome AS nome, u.email AS email, u.ativo AS ativo
      FROM professor p
      INNER JOIN usuario u ON u.id = p.usuario_id
    `;
  }

  /* Professor = usuario (perfil PROFESSOR, sem senha até o primeiro acesso) + professor */
  async criarProfessor({ nome, registro, email }) {
    const id = await this._transacao(async (c) => {
      const [usuario] = await c.query(
        `INSERT INTO usuario (nome, email, senha_hash, perfil, ativo) VALUES (?, ?, NULL, 'PROFESSOR', TRUE)`,
        [nome, email]
      );
      const [professor] = await c.query('INSERT INTO professor (usuario_id, registro) VALUES (?, ?)', [usuario.insertId, registro]);
      return professor.insertId;
    });
    return this.buscarProfessorPorId(id);
  }

  async buscarProfessorPorId(id) {
    const [linhas] = await this._db.query(`${this._selectProfessorBase()} WHERE p.id = ?`, [id]);
    return linhas.length ? Professor.fromRow(linhas[0]) : null;
  }

  async editarProfessor(id, dados) {
    const professor = await this.buscarProfessorPorId(id);
    if (!professor) throw new ErroApi(404, 'Professor não encontrado.');
    professor.editar(dados);
    await this._transacao(async (c) => {
      await c.query('UPDATE professor SET registro = ? WHERE id = ?', [professor.registro, id]);
      await c.query('UPDATE usuario SET nome = ?, email = ? WHERE id = ?', [professor.nome, professor.email, professor.usuarioId]);
    });
    return this.buscarProfessorPorId(id);
  }

  async excluirProfessor(id) {
    const professor = await this.buscarProfessorPorId(id);
    if (!professor) throw new ErroApi(404, 'Professor não encontrado.');
    const [[n]] = await this._db.query(
      `SELECT (SELECT COUNT(*) FROM acompanhamento WHERE professor_id = ?) AS registros,
              (SELECT COUNT(*) FROM vinculo_docente WHERE professor_id = ?) AS vinculos`,
      [id, id]
    );
    if (Number(n.registros) > 0) {
      throw new ErroApi(409, 'Este professor já registrou acompanhamentos. Para manter o histórico, use "Desativar".');
    }
    if (Number(n.vinculos) > 0) {
      throw new ErroApi(409, 'Remova as turmas e disciplinas deste professor antes de excluir o cadastro.');
    }
    await this._transacao(async (c) => {
      await c.query('DELETE FROM professor WHERE id = ?', [id]);
      await c.query('DELETE FROM usuario WHERE id = ?', [professor.usuarioId]); /* convites saem junto (CASCADE) */
    });
  }

  /* Uma turma + disciplina tem um único professor (uq_vinculo_turma_dis): atribuir troca o responsável */
  async atribuirTurma(professorId, { turmaId, disciplinaId }) {
    const professor = await this.buscarProfessorPorId(professorId);
    if (!professor) throw new ErroApi(404, 'Professor não encontrado.');
    return this._transacao(async (c) => {
      await this._turma(c, turmaId);
      const [[disciplina]] = await c.query('SELECT id FROM disciplina WHERE id = ? AND ativo = 1', [disciplinaId]);
      if (!disciplina) throw new ErroApi(400, 'Confira os campos destacados.', { disciplina_id: 'Disciplina não encontrada.' });

      const [[existente]] = await c.query(
        `SELECT v.id, v.professor_id, u.nome
           FROM vinculo_docente v JOIN professor p ON p.id = v.professor_id JOIN usuario u ON u.id = p.usuario_id
          WHERE v.turma_id = ? AND v.disciplina_id = ?`,
        [turmaId, disciplinaId]
      );
      if (existente && existente.professor_id === professorId) {
        throw new ErroApi(409, 'Este professor já leciona esta disciplina nesta turma.');
      }
      if (existente) {
        await c.query('UPDATE vinculo_docente SET professor_id = ? WHERE id = ?', [professorId, existente.id]);
        /* Trabalho em andamento (rascunho ou devolvido) passa para quem assume a turma;
           o que já foi enviado ou publicado continua com o autor original */
        const [r] = await c.query(
          `UPDATE acompanhamento SET professor_id = ?
            WHERE turma_id = ? AND disciplina_id = ? AND status IN ('RASCUNHO', 'DEVOLVIDO')`,
          [professorId, turmaId, disciplinaId]
        );
        return { id: existente.id, substituiu: existente.nome, transferidos: r.affectedRows || 0 };
      }
      const [r] = await c.query(
        'INSERT INTO vinculo_docente (turma_id, disciplina_id, professor_id) VALUES (?, ?, ?)', [turmaId, disciplinaId, professorId]
      );
      return { id: r.insertId, substituiu: null, transferidos: 0 };
    });
  }

  async removerTurma(professorId, vinculoId) {
    const [r] = await this._db.query('DELETE FROM vinculo_docente WHERE id = ? AND professor_id = ?', [vinculoId, professorId]);
    if (!r.affectedRows) throw new ErroApi(404, 'Vínculo não encontrado para este professor.');
  }

  /* ------------------------------------------------------------- Responsáveis */

  /* Responsável = usuario (perfil RESPONSAVEL, sem senha até o primeiro acesso) + responsavel,
     sempre com um aluno vinculado (tudo na mesma transação) */
  async criarResponsavel({ nome, email, telefone, alunoId, parentesco }) {
    return this._transacao(async (c) => {
      const [usuario] = await c.query(
        `INSERT INTO usuario (nome, email, senha_hash, perfil, ativo) VALUES (?, ?, NULL, 'RESPONSAVEL', TRUE)`,
        [nome, email]
      );
      const [responsavel] = await c.query(
        'INSERT INTO responsavel (usuario_id, telefone) VALUES (?, ?)', [usuario.insertId, telefone || null]
      );
      await this._vincular(c, responsavel.insertId, { alunoId, parentesco, autorizado: true });
      return { id: responsavel.insertId, usuario_id: usuario.insertId, nome, email, telefone: telefone || null, ativo: true };
    });
  }

  async _responsavel(id) {
    const [[r]] = await this._db.query(
      'SELECT r.id, r.usuario_id, u.nome, u.email, r.telefone FROM responsavel r JOIN usuario u ON u.id = r.usuario_id WHERE r.id = ?',
      [id]
    );
    if (!r) throw new ErroApi(404, 'Responsável não encontrado.');
    return r;
  }

  async editarResponsavel(id, { nome, email, telefone }) {
    const r = await this._responsavel(id);
    await this._transacao(async (c) => {
      await c.query('UPDATE usuario SET nome = ?, email = ? WHERE id = ?', [nome, email, r.usuario_id]);
      await c.query('UPDATE responsavel SET telefone = ? WHERE id = ?', [telefone || null, id]);
    });
  }

  async excluirResponsavel(id) {
    const r = await this._responsavel(id);
    const [[{ total }]] = await this._db.query('SELECT COUNT(*) AS total FROM ciencia_responsavel WHERE responsavel_id = ?', [id]);
    if (Number(total) > 0) {
      throw new ErroApi(409, 'Este responsável já deu ciência em relatórios. Para manter o histórico, use "Desativar".');
    }
    await this._transacao(async (c) => {
      await c.query('DELETE FROM responsavel WHERE id = ?', [id]); /* vínculos com alunos saem junto (CASCADE) */
      await c.query('DELETE FROM usuario WHERE id = ?', [r.usuario_id]);
    });
  }

  async vincularAluno(responsavelId, dados) {
    await this._responsavel(responsavelId);
    await this._vincular(this._db, responsavelId, dados);
  }

  async _vincular(c, responsavelId, { alunoId, parentesco, autorizado }) {
    const [[aluno]] = await c.query('SELECT id FROM aluno WHERE id = ?', [alunoId]);
    if (!aluno) throw new ErroApi(400, 'Confira os campos destacados.', { aluno_id: 'Aluno não encontrado.' });
    /* Mesmo par aluno + responsável: atualiza parentesco e autorização */
    await c.query(
      `INSERT INTO aluno_responsavel (aluno_id, responsavel_id, parentesco, autorizado) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE parentesco = VALUES(parentesco), autorizado = VALUES(autorizado)`,
      [alunoId, responsavelId, parentesco || 'OUTRO', autorizado === false ? 0 : 1]
    );
  }

  /* Desvincular: o responsável não pode ficar sem nenhum aluno */
  async desvincularAluno(responsavelId, alunoId) {
    const [[{ total }]] = await this._db.query('SELECT COUNT(*) AS total FROM aluno_responsavel WHERE responsavel_id = ?', [responsavelId]);
    if (Number(total) <= 1) {
      throw new ErroApi(409, 'O responsável precisa ter pelo menos um aluno vinculado. Vincule outro aluno antes de remover este.');
    }
    const [r] = await this._db.query('DELETE FROM aluno_responsavel WHERE responsavel_id = ? AND aluno_id = ?', [responsavelId, alunoId]);
    if (!r.affectedRows) throw new ErroApi(404, 'Este aluno não está vinculado a este responsável.');
  }

  /* ------------------------------------------------------- Acesso (usuários) */

  /* Desativar bloqueia o login na hora; reativar devolve o acesso */
  async alterarSituacaoUsuario(usuarioId, ativo) {
    await this._db.query('UPDATE usuario SET ativo = ? WHERE id = ?', [ativo ? 1 : 0, usuarioId]);
  }

  async buscarAdministradorPorId(id) {
    const [linhas] = await this._db.query(`SELECT * FROM usuario WHERE id = ? AND perfil = 'ADMINISTRADOR'`, [id]);
    return linhas.length ? Administrador.fromRow(linhas[0]) : null;
  }

  /* --------------------------------------------------------- Acompanhamentos */

  async _historico(c, acompanhamentoId, usuarioId, anterior, novo, observacao = null) {
    await c.query(
      `INSERT INTO acompanhamento_historico (acompanhamento_id, usuario_id, status_anterior, status_novo, observacao)
       VALUES (?, ?, ?, ?, ?)`,
      [acompanhamentoId, usuarioId, anterior, novo, observacao]
    );
  }

  async _versao(c, acompanhamento, autorId, motivo = null) {
    await c.query(
      `INSERT INTO acompanhamento_versao (acompanhamento_id, numero_versao, descricao, media, autor_id, motivo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [acompanhamento.id, acompanhamento.versaoAtual, acompanhamento.descricao, acompanhamento.media, autorId, motivo]
    );
  }

  async _gravarTags(c, acompanhamentoId, tags) {
    await c.query('DELETE FROM acompanhamento_tag WHERE acompanhamento_id = ?', [acompanhamentoId]);
    if (!tags.length) return;
    const [validas] = await c.query('SELECT id FROM tag WHERE ativo = 1 AND id IN (?)', [tags]);
    if (validas.length !== tags.length) throw new ErroApi(400, 'Confira os campos destacados.', { tags: 'Alguma tag escolhida não existe mais.' });
    await c.query('INSERT INTO acompanhamento_tag (acompanhamento_id, tag_id) VALUES ?', [tags.map((t) => [acompanhamentoId, t])]);
  }

  /* O professor só registra no período de digitação do bimestre */
  async _exigirDigitacaoAberta(c, bimestreId) {
    const [[b]] = await c.query(
      'SELECT id, numero, ano_letivo, (NOW() BETWEEN abertura AND encerramento) AS aberto FROM bimestre WHERE id = ?', [bimestreId]
    );
    if (!b) throw new ErroApi(400, 'Bimestre não encontrado.');
    if (!Number(b.aberto)) throw new ErroApi(409, `A digitação do ${b.numero}º bimestre está fechada. Fale com a coordenação.`);
    return b;
  }

  async _salvarLinha(c, a) {
    await c.query(
      `UPDATE acompanhamento SET descricao = ?, media = ?, status = ?, versao_atual = ?, revisor_id = ? WHERE id = ?`,
      [a.descricao, a.media, a.status, a.versaoAtual, a.revisorId, a.id]
    );
  }

  async _carregarParaAlterar(c, id) {
    const [[linha]] = await c.query('SELECT * FROM acompanhamento WHERE id = ? FOR UPDATE', [id]);
    if (!linha) throw new ErroApi(404, 'Acompanhamento não encontrado.');
    return { linha, acompanhamento: Acompanhamento.fromRow(linha) };
  }

  /* Professor: novo registro (RASCUNHO), com versão 1, tags e histórico. Se enviar = true, já vai para revisão. */
  async registrarAcompanhamento({ professorId, usuarioId, vinculoId, alunoId, bimestreId, descricao, media, tags, enviar }) {
    return this._transacao(async (c) => {
      const [[vinculo]] = await c.query(
        `SELECT v.turma_id, v.disciplina_id, t.ano_letivo
           FROM vinculo_docente v JOIN turma t ON t.id = v.turma_id
          WHERE v.id = ? AND v.professor_id = ?`,
        [vinculoId, professorId]
      );
      if (!vinculo) throw new ErroApi(403, 'Esta turma e disciplina não estão vinculadas a você.');
      const bimestre = await this._exigirDigitacaoAberta(c, bimestreId);
      if (bimestre.ano_letivo !== vinculo.ano_letivo) throw new ErroApi(400, 'O bimestre não é do ano letivo desta turma.');

      const [[matriculado]] = await c.query(
        `SELECT 1 AS ok FROM matricula_turma m JOIN aluno a ON a.id = m.aluno_id
          WHERE m.turma_id = ? AND m.aluno_id = ? AND a.ativo = 1`,
        [vinculo.turma_id, alunoId]
      );
      if (!matriculado) throw new ErroApi(400, 'Este aluno não está matriculado nesta turma.');

      const [[existe]] = await c.query(
        'SELECT id FROM acompanhamento WHERE aluno_id = ? AND turma_id = ? AND disciplina_id = ? AND bimestre_id = ?',
        [alunoId, vinculo.turma_id, vinculo.disciplina_id, bimestreId]
      );
      if (existe) throw new ErroApi(409, 'Este aluno já tem acompanhamento nesta disciplina e bimestre. Abra o registro para editar.');

      const dados = { turmaId: vinculo.turma_id, disciplinaId: vinculo.disciplina_id, bimestreId, descricao, media };
      const novo = new Acompanhamento(dados);
      const [r] = await c.query(
        `INSERT INTO acompanhamento (aluno_id, turma_id, disciplina_id, professor_id, bimestre_id, descricao, media, status, versao_atual)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [alunoId, novo.turmaId, novo.disciplinaId, professorId, novo.bimestreId, novo.descricao, novo.media, novo.status, novo.versaoAtual]
      );
      const acompanhamento = new Acompanhamento({ ...dados, id: r.insertId });
      await this._versao(c, acompanhamento, usuarioId);
      await this._historico(c, acompanhamento.id, usuarioId, null, Acompanhamento.STATUS.RASCUNHO);
      await this._gravarTags(c, acompanhamento.id, tags);

      if (enviar) {
        acompanhamento.enviarParaRevisao();
        await this._salvarLinha(c, acompanhamento);
        await this._historico(c, acompanhamento.id, usuarioId, Acompanhamento.STATUS.RASCUNHO, acompanhamento.status);
      }
      return { id: acompanhamento.id, status: acompanhamento.status };
    });
  }

  /* Professor: edita rascunho ou devolvido (nova versão se mudou texto/média) e, se pedir, envia */
  async salvarAcompanhamentoDoProfessor(id, { professorId, usuarioId, descricao, media, tags, enviar }) {
    return this._transacao(async (c) => {
      const { linha, acompanhamento } = await this._carregarParaAlterar(c, id);
      if (linha.professor_id !== professorId) throw new ErroApi(403, 'Este acompanhamento não é seu.');
      await this._exigirDigitacaoAberta(c, linha.bimestre_id);

      const anterior = acompanhamento.status;
      if (acompanhamento.editar({ descricao, media })) {
        await this._versao(c, acompanhamento, usuarioId, anterior === 'DEVOLVIDO' ? 'Correção após devolução' : null);
      }
      await this._gravarTags(c, id, tags);
      if (enviar) acompanhamento.enviarParaRevisao();
      await this._salvarLinha(c, acompanhamento);
      if (enviar) await this._historico(c, id, usuarioId, anterior, acompanhamento.status);
      return { id, status: acompanhamento.status };
    });
  }

  /* Administrador: ENVIADO passa a EM_REVISAO antes de qualquer decisão */
  async _iniciarRevisaoSeEnviado(c, acompanhamento, usuarioId) {
    if (acompanhamento.status !== Acompanhamento.STATUS.ENVIADO) return;
    acompanhamento.iniciarRevisao(usuarioId);
    await this._historico(c, acompanhamento.id, usuarioId, Acompanhamento.STATUS.ENVIADO, Acompanhamento.STATUS.EM_REVISAO);
  }

  async publicarAcompanhamento(id, usuarioId) {
    return this._transacao(async (c) => {
      const { acompanhamento } = await this._carregarParaAlterar(c, id);
      await this._iniciarRevisaoSeEnviado(c, acompanhamento, usuarioId);
      const anterior = acompanhamento.status;
      acompanhamento.publicar(usuarioId);
      await this._salvarLinha(c, acompanhamento);
      await c.query('UPDATE acompanhamento SET publicado_em = NOW() WHERE id = ?', [id]);
      await this._historico(c, id, usuarioId, anterior, acompanhamento.status);
      return { id, status: acompanhamento.status };
    });
  }

  async devolverAcompanhamento(id, usuarioId, motivo) {
    return this._transacao(async (c) => {
      const { acompanhamento } = await this._carregarParaAlterar(c, id);
      await this._iniciarRevisaoSeEnviado(c, acompanhamento, usuarioId);
      const anterior = acompanhamento.status;
      acompanhamento.devolver();
      await this._salvarLinha(c, acompanhamento);
      await this._historico(c, id, usuarioId, anterior, acompanhamento.status, motivo);
      return { id, status: acompanhamento.status };
    });
  }

  /* Administrador: ajusta texto/média na revisão. Fica registrado quem mudou e por quê. */
  async editarNaRevisao(id, { usuarioId, descricao, media, motivo }) {
    return this._transacao(async (c) => {
      const { acompanhamento } = await this._carregarParaAlterar(c, id);
      await this._iniciarRevisaoSeEnviado(c, acompanhamento, usuarioId);
      if (acompanhamento.editarNaRevisao({ descricao, media })) {
        await this._versao(c, acompanhamento, usuarioId, motivo);
      }
      await this._salvarLinha(c, acompanhamento);
      return { id, status: acompanhamento.status };
    });
  }
}

module.exports = Sistema;
