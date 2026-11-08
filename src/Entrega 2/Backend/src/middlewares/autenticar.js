const jwt = require('jsonwebtoken');
const pool = require('../database/connection');
const ErroApi = require('../utils/ErroApi');

function segredoJwt() {
  const segredo = process.env.JWT_SEGREDO;
  if (!segredo) throw new Error('JWT_SEGREDO não configurado no .env');
  return segredo;
}

/* Rota protegida: exige "Authorization: Bearer <token>" válido */
async function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return next(new ErroApi(401, 'Entre com seu e-mail e senha para continuar.'));
  }

  let dados;
  try {
    dados = jwt.verify(token, segredoJwt(), { algorithms: ['HS256'] });
  } catch (erro) {
    if (erro.message && erro.message.startsWith('JWT_SEGREDO')) return next(erro);
    return next(new ErroApi(401, 'Sua sessão expirou. Entre novamente.'));
  }

  /* Acesso desativado pela escola vale na hora, mesmo para quem já estava logado */
  try {
    const [[usuario]] = await pool.query('SELECT ativo FROM usuario WHERE id = ?', [Number(dados.sub)]);
    if (!usuario || !usuario.ativo) {
      return next(new ErroApi(401, 'Seu acesso foi desativado pela escola.', null, { motivo: 'ACESSO_DESATIVADO' }));
    }
  } catch (erro) {
    return next(erro);
  }

  req.usuario = { id: Number(dados.sub), perfil: dados.perfil, perfil_id: dados.perfil_id, nome: dados.nome };
  next();
}

module.exports = autenticar;
module.exports.segredoJwt = segredoJwt;
