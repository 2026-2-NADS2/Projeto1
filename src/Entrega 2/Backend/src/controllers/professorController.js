const pool = require('../database/connection');
const ErroApi = require('../utils/ErroApi');
const { bimestresDoAno, bimestreAtual, configuracao } = require('../repositorios/escolaRepositorio');
const { dataHoraIso, numero } = require('../utils/formato');
const { lerId } = require('../utils/validacao');

/* GET /api/professor/vinculos/:id/alunos?bimestre_id= : alunos da turma e o registro de cada um na disciplina */
async function alunosDoVinculo(req, res) {
  const vinculoId = lerId(req.params.id);
  if (!vinculoId) throw new ErroApi(400, 'Identificador inválido.');
  const [[vinculo]] = await pool.query(
    `SELECT v.id, v.turma_id, v.disciplina_id, t.nome AS turma, t.ano_letivo, d.nome AS disciplina
       FROM vinculo_docente v JOIN turma t ON t.id = v.turma_id JOIN disciplina d ON d.id = v.disciplina_id
      WHERE v.id = ? AND v.professor_id = ?`,
    [vinculoId, req.usuario.perfil_id]
  );
  if (!vinculo) throw new ErroApi(403, 'Esta turma e disciplina não estão vinculadas a você.');

  const bimestres = await bimestresDoAno(vinculo.ano_letivo);
  const atual = await bimestreAtual(vinculo.ano_letivo);
  const escolhido = bimestres.find((b) => b.id === lerId(req.query.bimestre_id)) || atual;
  if (!escolhido) throw new ErroApi(404, 'Nenhum bimestre cadastrado para este ano letivo.');
  const agora = Date.now();
  const bimestre = {
    ...escolhido,
    digitacao_aberta: agora >= new Date(escolhido.abertura_digitacao).getTime() && agora <= new Date(escolhido.encerramento_digitacao).getTime()
  };

  const [linhas] = await pool.query(
    `SELECT al.id AS aluno_id, al.nome, al.matricula, a.id AS acompanhamento_id, a.status, a.media, a.atualizado_em
       FROM matricula_turma m
       JOIN aluno al ON al.id = m.aluno_id AND al.ativo = 1
       LEFT JOIN acompanhamento a ON a.aluno_id = al.id AND a.turma_id = m.turma_id
                                 AND a.disciplina_id = ? AND a.bimestre_id = ?
      WHERE m.turma_id = ? AND m.ano_letivo = ?
      ORDER BY al.nome`,
    [vinculo.disciplina_id, bimestre.id, vinculo.turma_id, vinculo.ano_letivo]
  );
  const escala = await configuracao();
  res.json({
    vinculo: { id: vinculo.id, turma: vinculo.turma, disciplina: vinculo.disciplina },
    bimestre,
    bimestres: bimestres.map((b) => ({ id: b.id, numero: b.numero })),
    escala: { minima: escala.media_minima, maxima: escala.media_maxima, aprovacao: escala.media_aprovacao },
    alunos: linhas.map((l) => ({
      id: l.aluno_id,
      nome: l.nome,
      matricula: l.matricula,
      acompanhamento: l.acompanhamento_id
        ? { id: l.acompanhamento_id, status: l.status, media: numero(l.media), atualizado_em: dataHoraIso(l.atualizado_em) }
        : null
    }))
  });
}

/* GET /api/professor/retornos: registros devolvidos (com o motivo) e observações das famílias */
async function retornos(req, res) {
  const professorId = req.usuario.perfil_id;
  const [devolvidos] = await pool.query(
    `SELECT a.id, al.nome AS aluno, t.nome AS turma, d.nome AS disciplina, b.numero AS bimestre, v.id AS vinculo_id,
            a.bimestre_id, a.atualizado_em,
            (SELECT h.observacao FROM acompanhamento_historico h
              WHERE h.acompanhamento_id = a.id AND h.status_novo = 'DEVOLVIDO'
              ORDER BY h.data_hora DESC, h.id DESC LIMIT 1) AS motivo
       FROM acompanhamento a
       JOIN aluno al ON al.id = a.aluno_id
       JOIN turma t ON t.id = a.turma_id
       JOIN disciplina d ON d.id = a.disciplina_id
       JOIN bimestre b ON b.id = a.bimestre_id
       LEFT JOIN vinculo_docente v ON v.turma_id = a.turma_id AND v.disciplina_id = a.disciplina_id AND v.professor_id = a.professor_id
      WHERE a.professor_id = ? AND a.status = 'DEVOLVIDO'
      ORDER BY a.atualizado_em DESC`,
    [professorId]
  );
  const [observacoes] = await pool.query(
    `SELECT c.id, c.data_hora, c.observacao, ur.nome AS responsavel, ar.parentesco,
            al.nome AS aluno, d.nome AS disciplina, b.numero AS bimestre
       FROM ciencia_responsavel c
       JOIN acompanhamento a ON a.id = c.acompanhamento_id
       JOIN aluno al ON al.id = a.aluno_id
       JOIN disciplina d ON d.id = a.disciplina_id
       JOIN bimestre b ON b.id = a.bimestre_id
       JOIN responsavel r ON r.id = c.responsavel_id
       JOIN usuario ur ON ur.id = r.usuario_id
       LEFT JOIN aluno_responsavel ar ON ar.aluno_id = a.aluno_id AND ar.responsavel_id = r.id
      WHERE a.professor_id = ? AND c.observacao IS NOT NULL AND c.observacao <> ''
      ORDER BY c.data_hora DESC
      LIMIT 30`,
    [professorId]
  );

  /* Ciência das famílias no bimestre atual */
  const atual = await bimestreAtual();
  const [[ciencia]] = await pool.query(
    `SELECT COUNT(DISTINCT a.id) AS publicados,
            COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN a.id END) AS com_ciencia
       FROM acompanhamento a LEFT JOIN ciencia_responsavel c ON c.acompanhamento_id = a.id
      WHERE a.professor_id = ? AND a.bimestre_id = ? AND a.status = 'PUBLICADO'`,
    [professorId, atual ? atual.id : 0]
  );

  res.json({
    devolvidos: devolvidos.map((d) => ({ ...d, atualizado_em: dataHoraIso(d.atualizado_em) })),
    observacoes: observacoes.map((o) => ({ ...o, data_hora: dataHoraIso(o.data_hora) })),
    ciencia_bimestre: { bimestre: atual ? atual.numero : null, publicados: Number(ciencia.publicados), com_ciencia: Number(ciencia.com_ciencia) }
  });
}

module.exports = { alunosDoVinculo, retornos };
