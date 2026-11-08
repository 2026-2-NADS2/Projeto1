const express = require('express');
const rota = require('../utils/rota');
const autenticar = require('../middlewares/autenticar');
const exigirAdministrador = require('../middlewares/exigirAdministrador');
const controller = require('../controllers/bimestreController');

const router = express.Router();

/* Período de digitação de cada bimestre: só administrador */
router.use(autenticar, exigirAdministrador);
router.get('/', rota(controller.listar));
router.put('/:id', rota(controller.alterarPeriodo));

module.exports = router;
