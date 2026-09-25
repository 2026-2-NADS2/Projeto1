const pool = require('../database/connection');

async function buscarPorId(id) {
  const [linhas] = await pool.execute('SELECT id, nome, email, perfil, ativo FROM usuario WHERE id = ?', [id]);
  return linhas[0] || null;
}

async function criar({ nome, email, perfil }) {
  const [resultado] = await pool.execute(
    'INSERT INTO usuario (nome, email, perfil) VALUES (?, ?, ?)',
    [nome, email, perfil]
  );
  return buscarPorId(resultado.insertId);
}

async function atualizar(id, { nome, email }) {
  await pool.execute('UPDATE usuario SET nome = ?, email = ? WHERE id = ?', [nome, email, id]);
  return buscarPorId(id);
}

async function alterarAtivo(id, ativo) {
  await pool.execute('UPDATE usuario SET ativo = ? WHERE id = ?', [ativo ? 1 : 0, id]);
  return buscarPorId(id);
}

async function listarAdministradores() {
  const [linhas] = await pool.query(
    "SELECT id, nome, email, ativo FROM usuario WHERE perfil = 'ADMINISTRADOR' ORDER BY nome"
  );
  return linhas;
}

module.exports = { buscarPorId, criar, atualizar, alterarAtivo, listarAdministradores };
