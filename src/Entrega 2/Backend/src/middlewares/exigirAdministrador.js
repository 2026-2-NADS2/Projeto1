const Sistema = require('../classes/Sistema');
const ErroApi = require('../utils/ErroApi');

const sistema = new Sistema();

/* Só administrador ATIVO passa. Use depois de autenticar (que preenche req.usuario).
   Na Entrega 1 o usuário vinha no cabeçalho "x-usuario-id"; agora vem do token JWT. */
async function exigirAdministrador(req, res, next) {
  try {
    if (!req.usuario || req.usuario.perfil !== 'ADMINISTRADOR') {
      throw new ErroApi(403, 'Apenas um administrador pode acessar esta função.');
    }
    const administrador = await sistema.buscarAdministradorPorId(req.usuario.id);
    if (!administrador || !administrador.ativo) {
      throw new ErroApi(403, 'Apenas um administrador ativo pode acessar esta função.');
    }
    req.administradorLogado = administrador;
    next();
  } catch (erro) {
    next(erro);
  }
}

module.exports = exigirAdministrador;
