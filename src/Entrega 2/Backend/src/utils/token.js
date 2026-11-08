const crypto = require('crypto');

/* Link de convite e de redefinição de senha.
   O token vai só para a pessoa; no banco fica apenas o SHA-256 dele (token_acesso.token_hash). */
function gerarToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
}

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

module.exports = { gerarToken, hashToken };
