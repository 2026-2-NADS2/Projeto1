const sistema = require('../classes/Sistema');

async function listar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.listarAdministradores() }); } catch (erro) { next(erro); }
}
async function buscar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.buscarAdministradorPorId(req.params.id) }); } catch (erro) { next(erro); }
}
async function criar(req, res, next) {
  try { res.status(201).json({ sucesso: true, dados: await sistema.criarAdministrador(req.body) }); } catch (erro) { next(erro); }
}
async function atualizar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.editarAdministrador(req.params.id, req.body) }); } catch (erro) { next(erro); }
}
async function ativar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.ativarAdministrador(req.params.id) }); } catch (erro) { next(erro); }
}
async function inativar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.inativarAdministrador(req.params.id) }); } catch (erro) { next(erro); }
}

module.exports = { listar, buscar, criar, atualizar, ativar, inativar };
