const Sistema = require('../classes/Sistema');

const sistema = new Sistema();

async function criar(req, res) {
  try {
    const professor = await sistema.criarProfessor(req.body);
    res.status(201).json(professor.toJSON());
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
}

async function listar(req, res) {
  try {
    const professores = await sistema.listarProfessores();
    res.json(professores.map((p) => p.toJSON()));
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const professor = await sistema.buscarProfessorPorId(req.params.id);
    if (!professor) return res.status(404).json({ erro: 'Professor não encontrado.' });
    res.json(professor.toJSON());
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function editar(req, res) {
  try {
    const professor = await sistema.editarProfessor(req.params.id, req.body);
    res.json(professor.toJSON());
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
}

module.exports = { criar, listar, buscarPorId, editar };
