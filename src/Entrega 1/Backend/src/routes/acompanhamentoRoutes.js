const express = require('express');
const controller = require('../controllers/acompanhamentoController');

const router = express.Router();

router.get('/', controller.listar);
router.get('/:id', controller.buscar);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.patch('/:id/enviar', controller.enviar);
router.patch('/:id/revisao', controller.revisao);
router.patch('/:id/devolver', controller.devolver);
router.patch('/:id/publicar', controller.publicar);
router.patch('/:id/cancelar', controller.cancelar);

module.exports = router;
