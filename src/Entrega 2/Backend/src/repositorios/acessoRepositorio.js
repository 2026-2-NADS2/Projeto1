const pool = require('../database/connection');
const { gerarToken, hashToken } = require('../utils/token');

/* Validade dos links */
const VALIDADE_HORAS = { PRIMEIRO_ACESSO: 72, RECUPERACAO_SENHA: 0.5 };

/* Cria um link de uso único (convite ou redefinição). Links anteriores do mesmo tipo deixam de valer. */
async function criarLink(usuarioId, tipo) {
  const { token, hash } = gerarToken();
  const minutos = Math.round(VALIDADE_HORAS[tipo] * 60);
  await pool.query(
    'UPDATE token_acesso SET usado_em = NOW() WHERE usuario_id = ? AND tipo = ? AND usado_em IS NULL',
    [usuarioId, tipo]
  );
  await pool.query(
    `INSERT INTO token_acesso (usuario_id, token_hash, tipo, expira_em)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [usuarioId, hash, tipo, minutos]
  );
  const [[{ expira_em: expiraEm }]] = await pool.query('SELECT expira_em FROM token_acesso WHERE token_hash = ?', [hash]);
  return { token, expiraEm };
}

/* Link válido = existe, não foi usado, não venceu e a conta está ativa */
async function buscarLinkValido(token) {
  if (!/^[a-f0-9]{64}$/.test(String(token || ''))) return null;
  const [[linha]] = await pool.query(
    `SELECT t.id, t.usuario_id, t.tipo, t.expira_em, u.nome, u.email, u.perfil
       FROM token_acesso t
       JOIN usuario u ON u.id = t.usuario_id
      WHERE t.token_hash = ? AND t.usado_em IS NULL AND t.expira_em > NOW() AND u.ativo = 1`,
    [hashToken(token)]
  );
  return linha || null;
}

/* Grava a nova senha e invalida todos os links pendentes da pessoa */
async function gravarSenha(usuarioId, senhaHash) {
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    await conexao.query('UPDATE usuario SET senha_hash = ? WHERE id = ?', [senhaHash, usuarioId]);
    await conexao.query('UPDATE token_acesso SET usado_em = NOW() WHERE usuario_id = ? AND usado_em IS NULL', [usuarioId]);
    await conexao.commit();
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

module.exports = { criarLink, buscarLinkValido, gravarSenha };
