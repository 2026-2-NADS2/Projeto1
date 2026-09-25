const sistema = require('../classes/Sistema');

async function listar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.listarAlunos() }); } catch (erro) { next(erro); }
}
async function buscar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.buscarAlunoPorId(req.params.id) }); } catch (erro) { next(erro); }
}
async function criar(req, res, next) {
  try { res.status(201).json({ sucesso: true, dados: await sistema.criarAluno(req.body) }); } catch (erro) { next(erro); }
}
async function atualizar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.editarAluno(req.params.id, req.body) }); } catch (erro) { next(erro); }
}
async function ativar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.ativarAluno(req.params.id) }); } catch (erro) { next(erro); }
}
async function inativar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.inativarAluno(req.params.id) }); } catch (erro) { next(erro); }
}

module.exports = { listar, buscar, criar, atualizar, ativar, inativar };
