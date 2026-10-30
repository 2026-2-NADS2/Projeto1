import config from '../config.js';
import * as mock from './mockBackend.js';
import { obterSessao } from './sessao.js';

/* ?simularErro=1 na URL simula falha ao abrir a página */
const INICIO_PAGINA = Date.now();

function simularRequisicao(executar) {
  const simular = new URLSearchParams(window.location.search).get('simularErro') === '1'
    && Date.now() - INICIO_PAGINA < 1000;
  return new Promise((resolve, reject) => {
    const atraso = config.LATENCIA_MOCK_MS * (0.6 + Math.random() * 0.8);
    setTimeout(() => {
      if (simular) {
        const e = new Error('Falha simulada');
        e.status = 503;
        e.mensagem = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
        reject(e);
        return;
      }
      try {
        /* Cópia dos dados */
        resolve(JSON.parse(JSON.stringify(executar(obterSessao().sessao))));
      } catch (e) {
        reject(e);
      }
    }, atraso);
  });
}

async function requisicaoHttp(metodo, caminho, corpo) {
  let resposta;
  try {
    resposta = await fetch(config.API_BASE_URL + caminho, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: corpo ? JSON.stringify(corpo) : undefined
    });
  } catch {
    const e = new Error('Falha de rede');
    e.status = 0;
    e.mensagem = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
    throw e;
  }
  const json = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const e = new Error(json.mensagem || 'Erro na requisição');
    e.status = resposta.status;
    e.mensagem = json.mensagem || 'Ocorreu um erro inesperado. Tente novamente.';
    e.campos = json.campos;
    throw e;
  }
  return json;
}

/* Usa o mock ou a API real */
function requisicao(metodo, caminho, corpo, execMock) {
  return config.USAR_MOCK ? simularRequisicao(execMock) : requisicaoHttp(metodo, caminho, corpo);
}

const api = {
  /* Autenticação */
  entrar: (email, senha) =>
    requisicao('POST', '/auth/login', { email, senha }, () => mock.autenticar({ email, senha })),

  /* Administrador */
  resumoAdministrador: () =>
    requisicao('GET', '/admin/resumo', null, (s) => mock.resumoAdministrador(s)),
  acompanhamentosRecentes: (limite = 6) =>
    requisicao('GET', `/admin/acompanhamentos?ordenar=atualizado_em&limite=${limite}`, null, (s) => mock.acompanhamentosRecentes(s, limite)),

  /* Cadastros */
  listarTurmas: () =>
    requisicao('GET', '/turmas', null, (s) => mock.listarTurmas(s)),
  contagensCadastros: () =>
    requisicao('GET', '/admin/cadastros/contagens', null, (s) => mock.contagensCadastros(s)),
  listarCadastros: (entidade, { busca = '', situacao = 'todos', pagina = 1 } = {}) =>
    requisicao('GET', `/${entidade}?busca=${encodeURIComponent(busca)}&situacao=${situacao}&pagina=${pagina}&por_pagina=${config.ITENS_POR_PAGINA}`, null,
      (s) => mock.listarCadastros(s, entidade, { busca, situacao, pagina, por_pagina: config.ITENS_POR_PAGINA })),

  /* Professor */
  painelProfessor: () =>
    requisicao('GET', '/professor/painel', null, (s) => mock.painelProfessor(s)),

  /* Responsável */
  painelResponsavel: () =>
    requisicao('GET', '/responsavel/painel', null, (s) => mock.painelResponsavel(s)),
  mediasPublicadas: (alunoId, bimestreId) =>
    requisicao('GET', `/responsavel/alunos/${alunoId}/relatorios?bimestre_id=${bimestreId}`, null,
      (s) => mock.mediasPublicadas(s, alunoId, bimestreId))
};

export default api;
