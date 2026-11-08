const express = require('express');
const rota = require('../utils/rota');
const autenticar = require('../middlewares/autenticar');
const exigirAdministrador = require('../middlewares/exigirAdministrador');
const controller = require('../controllers/adminController');

const router = express.Router();

router.use(autenticar, exigirAdministrador);
router.get('/', rota(controller.listarTurmas));

module.exports = router;
