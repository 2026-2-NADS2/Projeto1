const sistema = require('../classes/Sistema');

// Sem login nesta entrega: o "usuário logado" é informado no corpo/rota
// só para alimentar o histórico (quem fez a ação).
function usuarioId(req) {
  return req.body.usuario_id || req.query.usuario_id || null;
}

async function listar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.listarAcompanhamentos() }); } catch (erro) { next(erro); }
}
async function buscar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.buscarAcompanhamentoPorId(req.params.id) }); } catch (erro) { next(erro); }
}
async function criar(req, res, next) {
  try { res.status(201).json({ sucesso: true, dados: await sistema.criarAcompanhamento(req.body, usuarioId(req)) }); } catch (erro) { next(erro); }
}
async function atualizar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.editarAcompanhamento(req.params.id, req.body) }); } catch (erro) { next(erro); }
}
async function enviar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.enviarAcompanhamento(req.params.id, usuarioId(req)) }); } catch (erro) { next(erro); }
}
async function revisao(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.iniciarRevisao(req.params.id, usuarioId(req)) }); } catch (erro) { next(erro); }
}
async function devolver(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.devolverAcompanhamento(req.params.id, usuarioId(req)) }); } catch (erro) { next(erro); }
}
async function publicar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.publicarAcompanhamento(req.params.id, usuarioId(req)) }); } catch (erro) { next(erro); }
}
async function cancelar(req, res, next) {
  try { res.json({ sucesso: true, dados: await sistema.cancelarAcompanhamento(req.params.id, usuarioId(req)) }); } catch (erro) { next(erro); }
}

module.exports = { listar, buscar, criar, atualizar, enviar, revisao, devolver, publicar, cancelar };
