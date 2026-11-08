const ErroApi = require('../utils/ErroApi');

/* Menor privilégio: cada perfil só acessa as próprias rotas. Use depois de autenticar. */
const exigirPerfil = (...perfis) => (req, res, next) => {
  if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
    return next(new ErroApi(403, 'Você não tem permissão para acessar estes dados.'));
  }
  next();
};

module.exports = exigirPerfil;
