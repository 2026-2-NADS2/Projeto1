const pool = require('../database/connection');

async function listar() {
  const [linhas] = await pool.query('SELECT id, nome, data_nascimento, matricula, ativo FROM aluno ORDER BY nome');
  return linhas;
}

async function buscarPorId(id) {
  const [linhas] = await pool.execute(
    'SELECT id, nome, data_nascimento, matricula, ativo FROM aluno WHERE id = ?',
    [id]
  );
  return linhas[0] || null;
}

async function criar({ nome, data_nascimento, matricula, ativo }) {
  const [resultado] = await pool.execute(
    'INSERT INTO aluno (nome, data_nascimento, matricula, ativo) VALUES (?, ?, ?, ?)',
    [nome, data_nascimento, matricula, ativo === false ? 0 : 1]
  );
  return buscarPorId(resultado.insertId);
}

async function atualizar(id, { nome, data_nascimento, matricula, ativo }) {
  await pool.execute(
    'UPDATE aluno SET nome = ?, data_nascimento = ?, matricula = ?, ativo = ? WHERE id = ?',
    [nome, data_nascimento, matricula, ativo ? 1 : 0, id]
  );
  return buscarPorId(id);
}

module.exports = { listar, buscarPorId, criar, atualizar };
