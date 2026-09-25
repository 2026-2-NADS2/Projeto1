const pool = require('../database/connection');

async function listar() {
  const [linhas] = await pool.query(
    `SELECT p.id, p.usuario_id, p.registro, p.ativo, u.nome, u.email
     FROM professor p INNER JOIN usuario u ON u.id = p.usuario_id
     ORDER BY u.nome`
  );
  return linhas;
}

async function buscarPorId(id) {
  const [linhas] = await pool.execute(
    `SELECT p.id, p.usuario_id, p.registro, p.ativo, u.nome, u.email
     FROM professor p INNER JOIN usuario u ON u.id = p.usuario_id
     WHERE p.id = ?`,
    [id]
  );
  return linhas[0] || null;
}

async function criar({ usuario_id, registro }) {
  const [resultado] = await pool.execute(
    'INSERT INTO professor (usuario_id, registro, ativo) VALUES (?, ?, 1)',
    [usuario_id, registro]
  );
  return buscarPorId(resultado.insertId);
}

async function atualizar(id, { registro, ativo }) {
  await pool.execute('UPDATE professor SET registro = ?, ativo = ? WHERE id = ?', [registro, ativo ? 1 : 0, id]);
  return buscarPorId(id);
}

module.exports = { listar, buscarPorId, criar, atualizar };
