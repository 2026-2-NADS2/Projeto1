const express = require('express');
const rota = require('../utils/rota');
const autenticar = require('../middlewares/autenticar');
const exigirPerfil = require('../middlewares/exigirPerfil');
const painel = require('../controllers/painelController');
const professor = require('../controllers/professorController');
const responsavel = require('../controllers/responsavelController');
const acompanhamento = require('../controllers/acompanhamentoController');
const notificacao = require('../controllers/notificacaoController');

const router = express.Router();
const soProfessor = [autenticar, exigirPerfil('PROFESSOR')];
const soResponsavel = [autenticar, exigirPerfil('RESPONSAVEL')];

/* Tags ativas: qualquer pessoa logada */
router.get('/tags', autenticar, rota(acompanhamento.listarTags));

/* Notificações do sino: pendências de quem está logado */
router.get('/notificacoes', autenticar, rota(notificacao.listar));

/* Área do professor: só os vínculos e registros dele (menor privilégio) */
router.get('/professor/painel', ...soProfessor, rota(painel.painelProfessor));
router.get('/professor/vinculos/:id/alunos', ...soProfessor, rota(professor.alunosDoVinculo));
router.post('/professor/acompanhamentos', ...soProfessor, rota(acompanhamento.registrar));
router.put('/professor/acompanhamentos/:id', ...soProfessor, rota(acompanhamento.salvar));
router.get('/professor/retornos', ...soProfessor, rota(professor.retornos));

/* Área do responsável: só alunos com vínculo autorizado e só registros publicados */
router.get('/responsavel/painel', ...soResponsavel, rota(painel.painelResponsavel));
router.get('/responsavel/alunos', ...soResponsavel, rota(responsavel.meusAlunos));
router.get('/responsavel/alunos/:id/relatorios', ...soResponsavel, rota(painel.mediasPublicadas));
router.get('/responsavel/alunos/:id/relatorio', ...soResponsavel, rota(responsavel.relatorio));
router.post('/responsavel/alunos/:id/ciencia', ...soResponsavel, rota(responsavel.darCienciaEmTodos));
router.post('/responsavel/acompanhamentos/:id/ciencia', ...soResponsavel, rota(responsavel.darCiencia));

module.exports = router;
