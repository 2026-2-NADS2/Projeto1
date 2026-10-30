const express = require('express');
const router = express.Router();
const controller = require('../controllers/alunoController');
const exigirAdministrador = require('../middlewares/exigirAdministrador');

router.post('/', exigirAdministrador, controller.criar);
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.put('/:id', controller.editar);
router.patch('/:id/inativar', controller.inativar);

module.exports = router;
