const express = require('express');
const router = express.Router();
const controller = require('../controllers/professorController');
const exigirAdministrador = require('../middlewares/exigirAdministrador');

router.post('/', exigirAdministrador, controller.criar);
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.put('/:id', controller.editar);

module.exports = router;
