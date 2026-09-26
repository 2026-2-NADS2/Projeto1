const Sistema = require('../classes/Sistema');

const sistema = new Sistema();

async function criar(req, res) {
  try {
    const acompanhamento = await sistema.criarAcompanhamento(req.body);
    res.status(201).json(acompanhamento.toJSON());
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
}

async function listar(req, res) {
  try {
    const acompanhamentos = await sistema.listarAcompanhamentos();
    res.json(acompanhamentos.map((a) => a.toJSON()));
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const acompanhamento = await sistema.buscarAcompanhamentoPorId(req.params.id);
    if (!acompanhamento) return res.status(404).json({ erro: 'Acompanhamento não encontrado.' });
    res.json(acompanhamento.toJSON());
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function editar(req, res) {
  try {
    const acompanhamento = await sistema.editarAcompanhamento(req.params.id, req.body);
    res.json(acompanhamento.toJSON());
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
}

async function enviar(req, res) {
  try {
    const acompanhamento = await sistema.enviarAcompanhamento(req.params.id);
    res.json(acompanhamento.toJSON());
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
}

async function iniciarRevisao(req, res) {
  try {
    const acompanhamento = await sistema.iniciarRevisao(req.params.id, req.body.revisorId);
    res.json(acompanhamento.toJSON());
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
}

async function devolver(req, res) {
  try {
    const acompanhamento = await sistema.devolverAcompanhamento(req.params.id);
    res.json(acompanhamento.toJSON());
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
}

async function publicar(req, res) {
  try {
    const acompanhamento = await sistema.publicarAcompanhamento(req.params.id, req.body.revisorId);
    res.json(acompanhamento.toJSON());
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
}

module.exports = { criar, listar, buscarPorId, editar, enviar, iniciarRevisao, devolver, publicar };
