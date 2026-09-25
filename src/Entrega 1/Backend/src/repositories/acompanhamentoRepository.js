const pool = require('../database/connection');

async function listar() {
  const [linhas] = await pool.query(
    `SELECT a.id, a.aluno_id, al.nome AS aluno_nome, a.turma_id, a.disciplina_id, a.bimestre_id,
            a.professor_id, a.descricao, a.media, a.status, a.versao_atual, a.revisor_id, a.publicado_em
     FROM acompanhamento a
     INNER JOIN aluno al ON al.id = a.aluno_id
     ORDER BY a.atualizado_em DESC`
  );
  return linhas;
}

async function buscarPorId(id) {
  const [linhas] = await pool.execute('SELECT * FROM acompanhamento WHERE id = ?', [id]);
  return linhas[0] || null;
}

async function criar(dados) {
  const [resultado] = await pool.execute(
    `INSERT INTO acompanhamento
      (aluno_id, turma_id, disciplina_id, bimestre_id, professor_id, descricao, media, status, versao_atual)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      dados.aluno_id, dados.turma_id, dados.disciplina_id, dados.bimestre_id, dados.professor_id,
      dados.descricao || null, dados.media === undefined ? null : dados.media, dados.status || 'RASCUNHO'
    ]
  );
  return resultado.insertId;
}

async function atualizar(id, acompanhamento) {
  await pool.execute(
    `UPDATE acompanhamento
     SET descricao = ?, media = ?, status = ?, revisor_id = ?, publicado_em = ?
     WHERE id = ?`,
    [acompanhamento.descricao, acompanhamento.media, acompanhamento.status,
     acompanhamento.revisor_id, acompanhamento.publicado_em, id]
  );
}

async function registrarHistorico({ acompanhamento_id, usuario_id, status_anterior, status_novo }) {
  await pool.execute(
    `INSERT INTO acompanhamento_historico (acompanhamento_id, usuario_id, status_anterior, status_novo)
     VALUES (?, ?, ?, ?)`,
    [acompanhamento_id, usuario_id, status_anterior || null, status_novo]
  );
}

module.exports = { listar, buscarPorId, criar, atualizar, registrarHistorico };
