const express = require('express');
const rota = require('../utils/rota');
const autenticar = require('../middlewares/autenticar');
const exigirAdministrador = require('../middlewares/exigirAdministrador');
const cadastro = require('../controllers/cadastroController');

const router = express.Router();

/* Cadastro de responsáveis e dos alunos vinculados a cada um: só administrador */
router.use(autenticar, exigirAdministrador);
router.get('/', rota(cadastro.listar('responsaveis')));
router.post('/', rota(cadastro.cadastrar('responsaveis')));
router.get('/:id', rota(cadastro.detalhe('responsaveis')));
router.put('/:id', rota(cadastro.editar('responsaveis')));
router.patch('/:id/situacao', rota(cadastro.alterarSituacao('responsaveis')));
router.delete('/:id', rota(cadastro.excluir('responsaveis')));
router.post('/:id/convite', rota(cadastro.liberarAcesso('responsaveis')));
router.post('/:id/alunos', rota(cadastro.vincularAluno));
router.delete('/:id/alunos/:alunoId', rota(cadastro.desvincularAluno));

module.exports = router;
