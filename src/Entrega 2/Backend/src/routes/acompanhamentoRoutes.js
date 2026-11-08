const express = require('express');
const rota = require('../utils/rota');
const autenticar = require('../middlewares/autenticar');
const exigirAdministrador = require('../middlewares/exigirAdministrador');
const controller = require('../controllers/acompanhamentoController');

const router = express.Router();

router.use(autenticar);

/* Detalhe: cada perfil vê só o que pode (regra dentro do controller) */
router.get('/:id', rota(controller.detalhe));

/* Revisão e publicação: só administrador */
router.get('/', exigirAdministrador, rota(controller.listar));
router.put('/:id', exigirAdministrador, rota(controller.editarNaRevisao));
router.patch('/:id/publicar', exigirAdministrador, rota(controller.publicar));
router.patch('/:id/devolver', exigirAdministrador, rota(controller.devolver));

module.exports = router;
