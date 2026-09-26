const pool = require('../database/connection');
const Aluno = require('./Aluno');
const Professor = require('./Professor');
const Administrador = require('./Administrador');
const Acompanhamento = require('./Acompanhamento');

class Sistema {
  constructor(dbPool = pool) {
    this._db = dbPool;
  }

  async criarAluno({ nome, dataNascimento, matricula, observacoes }) {
    if (!nome) throw new Error('Nome do aluno é obrigatório.');
    if (!matricula) throw new Error('Matrícula do aluno é obrigatória.');

    const aluno = new Aluno({ nome, dataNascimento, matricula, observacoes });

    const [resultado] = await this._db.query(
      `INSERT INTO aluno (nome, data_nascimento, matricula, observacoes, ativo)
       VALUES (?, ?, ?, ?, ?)`,
      [aluno.nome, aluno.dataNascimento, aluno.matricula, aluno.observacoes, aluno.ativo]
    );

    return this.buscarAlunoPorId(resultado.insertId);
  }

  async listarAlunos() {
    const [linhas] = await this._db.query('SELECT * FROM aluno ORDER BY id');
    return linhas.map(Aluno.fromRow);
  }

  async buscarAlunoPorId(id) {
    const [linhas] = await this._db.query('SELECT * FROM aluno WHERE id = ?', [id]);
    if (linhas.length === 0) return null;
    return Aluno.fromRow(linhas[0]);
  }

  async editarAluno(id, dados) {
    const aluno = await this.buscarAlunoPorId(id);
    if (!aluno) throw new Error('Aluno não encontrado.');

    aluno.editar(dados);

    await this._db.query(
      `UPDATE aluno SET nome = ?, data_nascimento = ?, matricula = ?, observacoes = ?
       WHERE id = ?`,
      [aluno.nome, aluno.dataNascimento, aluno.matricula, aluno.observacoes, id]
    );

    return this.buscarAlunoPorId(id);
  }

  async ativarAluno(id) {
    return this._alterarAtivoAluno(id, true);
  }

  async inativarAluno(id) {
    return this._alterarAtivoAluno(id, false);
  }

  async _alterarAtivoAluno(id, ativo) {
    const aluno = await this.buscarAlunoPorId(id);
    if (!aluno) throw new Error('Aluno não encontrado.');
    ativo ? aluno.ativar() : aluno.inativar();
    await this._db.query('UPDATE aluno SET ativo = ? WHERE id = ?', [aluno.ativo, id]);
    return this.buscarAlunoPorId(id);
  }

  _selectProfessorBase() {
    return `
      SELECT p.id AS professor_id, p.registro AS registro, p.usuario_id AS usuario_id,
             u.nome AS nome, u.email AS email, u.ativo AS ativo
      FROM professor p
      INNER JOIN usuario u ON u.id = p.usuario_id
    `;
  }

  async criarProfessor({ nome, registro, email }) {
    if (!nome) throw new Error('Nome do professor é obrigatório.');
    if (!registro) throw new Error('Registro do professor é obrigatório.');
    if (!email) throw new Error('E-mail do professor é obrigatório.');

    const conexao = await this._db.getConnection();
    try {
      await conexao.beginTransaction();

      const [usuarioResultado] = await conexao.query(
        `INSERT INTO usuario (nome, email, senha_hash, perfil, ativo)
         VALUES (?, ?, NULL, 'PROFESSOR', TRUE)`,
        [nome, email]
      );
      
      const [professorResultado] = await conexao.query(
        `INSERT INTO professor (usuario_id, registro) VALUES (?, ?)`,
        [usuarioResultado.insertId, registro]
      );

      await conexao.commit();
      return this.buscarProfessorPorId(professorResultado.insertId);
    } catch (erro) {
      await conexao.rollback();
      throw erro;
    } finally {
      conexao.release();
    }
  }

  async listarProfessores() {
    const [linhas] = await this._db.query(`${this._selectProfessorBase()} ORDER BY p.id`);
    return linhas.map(Professor.fromRow);
  }

  async buscarProfessorPorId(id) {
    const [linhas] = await this._db.query(`${this._selectProfessorBase()} WHERE p.id = ?`, [id]);
    if (linhas.length === 0) return null;
    return Professor.fromRow(linhas[0]);
  }

  async editarProfessor(id, dados) {
    const professor = await this.buscarProfessorPorId(id);
    if (!professor) throw new Error('Professor não encontrado.');

    professor.editar(dados);

    await this._db.query('UPDATE professor SET registro = ? WHERE id = ?', [professor.registro, id]);
    await this._db.query('UPDATE usuario SET nome = ? WHERE id = ?', [professor.nome, professor.usuarioId]);

    return this.buscarProfessorPorId(id);
  }

  async ativarProfessor(id) {
    return this._alterarAtivoProfessor(id, true);
  }

  async inativarProfessor(id) {
    return this._alterarAtivoProfessor(id, false);
  }

  async _alterarAtivoProfessor(id, ativo) {
    const professor = await this.buscarProfessorPorId(id);
    if (!professor) throw new Error('Professor não encontrado.');
    await this._db.query('UPDATE usuario SET ativo = ? WHERE id = ?', [ativo, professor.usuarioId]);
    return this.buscarProfessorPorId(id);
  }

  async criarAdministrador({ nome, email }) {
    if (!nome) throw new Error('Nome do administrador é obrigatório.');
    if (!email) throw new Error('E-mail do administrador é obrigatório.');

    const [resultado] = await this._db.query(
      `INSERT INTO usuario (nome, email, senha_hash, perfil, ativo)
       VALUES (?, ?, NULL, 'ADMINISTRADOR', TRUE)`,
      [nome, email]
    );

    return this.buscarAdministradorPorId(resultado.insertId);
  }

  async buscarAdministradorPorId(id) {
    const [linhas] = await this._db.query(
      `SELECT * FROM usuario WHERE id = ? AND perfil = 'ADMINISTRADOR'`,
      [id]
    );
    if (linhas.length === 0) return null;
    return Administrador.fromRow(linhas[0]);
  }

  async _existeNaTabela(tabela, id) {
    const [linhas] = await this._db.query(`SELECT id FROM ${tabela} WHERE id = ?`, [id]);
    return linhas.length > 0;
  }

  async criarAcompanhamento({ alunoId, professorId, turmaId, disciplinaId, bimestreId, descricao, media }) {
    if (!descricao) throw new Error('Descrição do acompanhamento é obrigatória.');
    if (media !== undefined && media !== null && (media < 0 || media > 10)) {
      throw new Error('Média deve estar entre 0 e 10.');
    }

    const aluno = await this.buscarAlunoPorId(alunoId);
    if (!aluno) throw new Error('Aluno informado não existe.');

    const professor = await this.buscarProfessorPorId(professorId);
    if (!professor) throw new Error('Professor informado não existe.');

    if (!(await this._existeNaTabela('turma', turmaId))) {
      throw new Error('Turma informada não existe. Cadastre a turma antes (fora do escopo desta entrega).');
    }
    if (!(await this._existeNaTabela('disciplina', disciplinaId))) {
      throw new Error('Disciplina informada não existe.');
    }
    if (!(await this._existeNaTabela('bimestre', bimestreId))) {
      throw new Error('Bimestre informado não existe.');
    }

    const acompanhamento = new Acompanhamento({
      aluno,
      professor,
      turmaId,
      disciplinaId,
      bimestreId,
      descricao,
      media: media ?? null,
      status: Acompanhamento.STATUS.RASCUNHO,
      versaoAtual: 1
    });

    try {
      const [resultado] = await this._db.query(
        `INSERT INTO acompanhamento
          (aluno_id, professor_id, turma_id, disciplina_id, bimestre_id,
           descricao, media, status, versao_atual)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          aluno.id,
          professor.id,
          turmaId,
          disciplinaId,
          bimestreId,
          acompanhamento.descricao,
          acompanhamento.media,
          acompanhamento.status,
          acompanhamento.versaoAtual
        ]
      );
      return this.buscarAcompanhamentoPorId(resultado.insertId);
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        throw new Error('Já existe um acompanhamento para este aluno, disciplina e bimestre.');
      }
      throw erro;
    }
  }

  async listarAcompanhamentos() {
    const [linhas] = await this._db.query('SELECT * FROM acompanhamento ORDER BY id');
    return Promise.all(linhas.map((linha) => this._montarAcompanhamento(linha)));
  }

  async buscarAcompanhamentoPorId(id) {
    const [linhas] = await this._db.query('SELECT * FROM acompanhamento WHERE id = ?', [id]);
    if (linhas.length === 0) return null;
    return this._montarAcompanhamento(linhas[0]);
  }

  async _montarAcompanhamento(linha) {
    const aluno = await this.buscarAlunoPorId(linha.aluno_id);
    const professor = await this.buscarProfessorPorId(linha.professor_id);

    return new Acompanhamento({
      id: linha.id,
      aluno,
      professor,
      turmaId: linha.turma_id,
      disciplinaId: linha.disciplina_id,
      bimestreId: linha.bimestre_id,
      descricao: linha.descricao,
      media: linha.media !== null ? Number(linha.media) : null,
      status: linha.status,
      versaoAtual: linha.versao_atual,
      revisorId: linha.revisor_id,
      publicadoEm: linha.publicado_em
    });
  }

  async _salvarAcompanhamento(acompanhamento) {
    await this._db.query(
      `UPDATE acompanhamento
       SET descricao = ?, media = ?, status = ?, versao_atual = ?, revisor_id = ?, publicado_em = ?
       WHERE id = ?`,
      [
        acompanhamento.descricao,
        acompanhamento.media,
        acompanhamento.status,
        acompanhamento.versaoAtual,
        acompanhamento.revisorId,
        acompanhamento.publicadoEm,
        acompanhamento.id
      ]
    );
  }

  async editarAcompanhamento(id, dados) {
    const acompanhamento = await this.buscarAcompanhamentoPorId(id);
    if (!acompanhamento) throw new Error('Acompanhamento não encontrado.');
    if (dados.media !== undefined && dados.media !== null && (dados.media < 0 || dados.media > 10)) {
      throw new Error('Média deve estar entre 0 e 10.');
    }

    acompanhamento.editar(dados);
    await this._salvarAcompanhamento(acompanhamento);
    return this.buscarAcompanhamentoPorId(id);
  }

  async enviarAcompanhamento(id) {
    const acompanhamento = await this.buscarAcompanhamentoPorId(id);
    if (!acompanhamento) throw new Error('Acompanhamento não encontrado.');
    acompanhamento.enviarParaRevisao();
    await this._salvarAcompanhamento(acompanhamento);
    return this.buscarAcompanhamentoPorId(id);
  }

  async iniciarRevisao(id, revisorId) {
    const acompanhamento = await this.buscarAcompanhamentoPorId(id);
    if (!acompanhamento) throw new Error('Acompanhamento não encontrado.');
    acompanhamento.iniciarRevisao(revisorId);
    await this._salvarAcompanhamento(acompanhamento);
    return this.buscarAcompanhamentoPorId(id);
  }

  async devolverAcompanhamento(id) {
    const acompanhamento = await this.buscarAcompanhamentoPorId(id);
    if (!acompanhamento) throw new Error('Acompanhamento não encontrado.');
    acompanhamento.devolver();
    await this._salvarAcompanhamento(acompanhamento);
    return this.buscarAcompanhamentoPorId(id);
  }

  async publicarAcompanhamento(id, revisorId) {
    const acompanhamento = await this.buscarAcompanhamentoPorId(id);
    if (!acompanhamento) throw new Error('Acompanhamento não encontrado.');
    acompanhamento.publicar(revisorId);
    await this._salvarAcompanhamento(acompanhamento);
    return this.buscarAcompanhamentoPorId(id);
  }

  async cancelarAcompanhamento(id) {
    const acompanhamento = await this.buscarAcompanhamentoPorId(id);
    if (!acompanhamento) throw new Error('Acompanhamento não encontrado.');
    acompanhamento.cancelar();
    await this._salvarAcompanhamento(acompanhamento);
    return this.buscarAcompanhamentoPorId(id);
  }
}

module.exports = Sistema;
