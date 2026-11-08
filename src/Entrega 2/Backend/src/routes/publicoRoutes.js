const express = require('express');
const rota = require('../utils/rota');
const limitarTentativas = require('../middlewares/limitarTentativas');
const controller = require('../controllers/publicoController');

const router = express.Router();

/* Área pública: não exige login */
router.get('/escola/contato', rota(controller.contatoEscola));
router.post('/contato',
  limitarTentativas({ maximo: 5, janelaMinutos: 10, mensagem: 'Muitas mensagens enviadas. Tente novamente em alguns minutos.' }),
  rota(controller.enviarContato));

module.exports = router;
