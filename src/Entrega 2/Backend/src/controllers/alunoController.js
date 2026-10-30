const Sistema = require('../classes/Sistema');

const sistema = new Sistema();

async function criar(req, res) {
  try {
    const aluno = await sistema.criarAluno(req.body);
    res.status(201).json(aluno.toJSON());
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
}

async function listar(req, res) {
  try {
    const alunos = await sistema.listarAlunos();
    res.json(alunos.map((a) => a.toJSON()));
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const aluno = await sistema.buscarAlunoPorId(req.params.id);
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });
    res.json(aluno.toJSON());
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function editar(req, res) {
  try {
    const aluno = await sistema.editarAluno(req.params.id, req.body);
    res.json(aluno.toJSON());
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
}

async function inativar(req, res) {
  try {
    const aluno = await sistema.inativarAluno(req.params.id);
    res.json(aluno.toJSON());
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
}

module.exports = { criar, listar, buscarPorId, editar, inativar };
