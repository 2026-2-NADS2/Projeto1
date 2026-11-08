const express = require('express');
const rota = require('../utils/rota');
const autenticar = require('../middlewares/autenticar');
const exigirAdministrador = require('../middlewares/exigirAdministrador');
const cadastro = require('../controllers/cadastroController');

const router = express.Router();

/* Cadastro de professores e das turmas que cada um leciona: só administrador */
router.use(autenticar, exigirAdministrador);
router.get('/', rota(cadastro.listar('professores')));
router.post('/', rota(cadastro.cadastrar('professores')));
router.get('/:id', rota(cadastro.detalhe('professores')));
router.put('/:id', rota(cadastro.editar('professores')));
router.patch('/:id/situacao', rota(cadastro.alterarSituacao('professores')));
router.delete('/:id', rota(cadastro.excluir('professores')));
router.post('/:id/convite', rota(cadastro.liberarAcesso('professores')));
router.post('/:id/vinculos', rota(cadastro.atribuirTurma));
router.delete('/:id/vinculos/:vinculoId', rota(cadastro.removerTurma));

module.exports = router;
