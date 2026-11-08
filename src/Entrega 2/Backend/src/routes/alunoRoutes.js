const express = require('express');
const rota = require('../utils/rota');
const autenticar = require('../middlewares/autenticar');
const exigirAdministrador = require('../middlewares/exigirAdministrador');
const cadastro = require('../controllers/cadastroController');

const router = express.Router();

/* Cadastro de alunos: só administrador */
router.use(autenticar, exigirAdministrador);
router.get('/', rota(cadastro.listar('alunos')));
router.post('/', rota(cadastro.cadastrar('alunos')));
router.get('/:id', rota(cadastro.detalhe('alunos')));
router.put('/:id', rota(cadastro.editar('alunos')));
router.patch('/:id/situacao', rota(cadastro.alterarSituacao('alunos')));
router.delete('/:id', rota(cadastro.excluir('alunos')));

module.exports = router;
