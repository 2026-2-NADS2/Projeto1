const express = require('express');
const controller = require('../controllers/administradorController');

const router = express.Router();

router.get('/', controller.listar);
router.get('/:id', controller.buscar);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.patch('/:id/ativar', controller.ativar);
router.patch('/:id/inativar', controller.inativar);

module.exports = router;
