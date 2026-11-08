const express = require('express');
const rota = require('../utils/rota');
const autenticar = require('../middlewares/autenticar');
const exigirAdministrador = require('../middlewares/exigirAdministrador');
const controller = require('../controllers/adminController');
const relatorio = require('../controllers/relatorioController');

const router = express.Router();

/* Rotas protegidas: só administrador */
router.use(autenticar, exigirAdministrador);
router.get('/resumo', rota(controller.resumo));
router.get('/acompanhamentos', rota(controller.acompanhamentosRecentes));
router.get('/cadastros/contagens', rota(controller.contagensCadastros));
router.get('/disciplinas', rota(controller.listarDisciplinas));
router.get('/relatorios', rota(relatorio.indicadores));
router.get('/relatorios/exportar', rota(relatorio.exportar));

module.exports = router;
