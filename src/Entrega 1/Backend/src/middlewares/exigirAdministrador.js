const Sistema = require('../classes/Sistema');

const sistema = new Sistema();

async function exigirAdministrador(req, res, next) {
  const usuarioId = req.header('x-usuario-id');

  if (!usuarioId) {
    return res.status(401).json({
      erro: 'Informe o administrador logado no cabeçalho "x-usuario-id" para cadastrar um novo usuário.'
    });
  }

  try {
    const administrador = await sistema.buscarAdministradorPorId(usuarioId);

    if (!administrador || !administrador.ativo) {
      return res.status(403).json({
        erro: 'Apenas um administrador pode cadastrar novos usuários.'
      });
    }

    req.administradorLogado = administrador;
    next();
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

module.exports = exigirAdministrador;
