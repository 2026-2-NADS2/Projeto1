const express = require('express');
const router = express.Router();
const controller = require('../controllers/acompanhamentoController');

router.post('/', controller.criar);
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.put('/:id', controller.editar);
router.patch('/:id/enviar', controller.enviar);
router.patch('/:id/iniciar-revisao', controller.iniciarRevisao);
router.patch('/:id/devolver', controller.devolver);
router.patch('/:id/publicar', controller.publicar);

module.exports = router;
