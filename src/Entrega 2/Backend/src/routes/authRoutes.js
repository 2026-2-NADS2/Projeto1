const express = require('express');
const rota = require('../utils/rota');
const limitarTentativas = require('../middlewares/limitarTentativas');
const controller = require('../controllers/authController');

const router = express.Router();

/* Até 10 tentativas de login a cada 10 minutos por IP (dificulta força bruta) */
router.post('/login',
  limitarTentativas({ maximo: 10, janelaMinutos: 10, mensagem: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.' }),
  rota(controller.login));

/* Esqueci a senha e primeiro acesso (públicas, com limite de tentativas) */
router.post('/esqueci-senha',
  limitarTentativas({ maximo: 5, janelaMinutos: 10, mensagem: 'Muitos pedidos seguidos. Aguarde alguns minutos e tente novamente.' }),
  rota(controller.esqueciSenha));
router.post('/link',
  limitarTentativas({ maximo: 20, janelaMinutos: 10, mensagem: 'Muitas tentativas. Aguarde alguns minutos.' }),
  rota(controller.verificarLink));
router.post('/definir-senha',
  limitarTentativas({ maximo: 10, janelaMinutos: 10, mensagem: 'Muitas tentativas. Aguarde alguns minutos.' }),
  rota(controller.definirSenha));

module.exports = router;
