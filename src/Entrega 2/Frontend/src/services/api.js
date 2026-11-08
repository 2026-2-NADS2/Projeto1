import config from '../config.js';
import { encerrarSessao, obterSessao } from './sessao.js';

const MENSAGEM_SEM_CONEXAO = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';

/* Token JWT recebido no login vai em todas as chamadas */
function tokenDaSessao() {
  const { sessao } = obterSessao();
  return sessao && sessao.usuario && sessao.usuario.token;
}

/* Erro no formato que as telas leem: { status, mensagem, campos } */
function criarErro(status, json) {
  const e = new Error(json.mensagem || 'Erro na requisição');
  e.status = status;
  e.mensagem = json.mensagem || 'Ocorreu um erro inesperado. Tente novamente.';
  e.campos = json.campos;
  return e;
}

async function requisicao(metodo, caminho, corpo) {
  const token = tokenDaSessao();
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;

  let resposta;
  try {
    resposta = await fetch(config.API_BASE_URL + caminho, {
      method: metodo,
      headers,
      body: corpo ? JSON.stringify(corpo) : undefined
    });
  } catch {
    throw criarErro(0, { mensagem: MENSAGEM_SEM_CONEXAO });
  }
  const json = await resposta.json().catch(() => ({}));
  /* Token vencido, inválido ou acesso desativado pela escola: encerra a sessão e volta para o login */
  if (resposta.status === 401 && token) {
    encerrarSessao();
    const aviso = json.motivo === 'ACESSO_DESATIVADO' ? 'desativado=1' : 'expirada=1';
    window.location.assign(import.meta.env.BASE_URL + 'login?' + aviso);
  }
  if (!resposta.ok) throw criarErro(resposta.status, json);
  return json;
}

/* Baixa um arquivo da API (ex.: planilha .csv) com o token do login */
async function baixarArquivo(caminho, nomeArquivo) {
  const token = tokenDaSessao();
  let resposta;
  try {
    resposta = await fetch(config.API_BASE_URL + caminho, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
  } catch {
    throw criarErro(0, { mensagem: MENSAGEM_SEM_CONEXAO });
  }
  if (!resposta.ok) throw criarErro(resposta.status, await resposta.json().catch(() => ({ mensagem: 'Não foi possível gerar o arquivo.' })));

  /* Link temporário na memória, clicado automaticamente para iniciar o download */
  const url = URL.createObjectURL(await resposta.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Monta a query string sem os filtros vazios */
function consulta(filtros) {
  const p = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) p.set(k, v); });
  const texto = p.toString();
  return texto ? '?' + texto : '';
}

const api = {
  /* Área pública (sem login) */
  contatoEscola: () => requisicao('GET', '/escola/contato'),
  enviarContato: (dados) => requisicao('POST', '/contato', dados),

  /* Autenticação, primeiro acesso e esqueci minha senha */
  entrar: (email, senha) => requisicao('POST', '/auth/login', { email, senha }),
  esqueciSenha: (email) => requisicao('POST', '/auth/esqueci-senha', { email }),
  verificarLink: (token) => requisicao('POST', '/auth/link', { token }),
  definirSenha: (dados) => requisicao('POST', '/auth/definir-senha', dados),

  /* Administrador: dashboard */
  resumoAdministrador: () => requisicao('GET', '/admin/resumo'),
  acompanhamentosRecentes: (limite = 6) => requisicao('GET', '/admin/acompanhamentos' + consulta({ limite })),

  /* Administrador: cadastros, acesso e vínculos */
  listarTurmas: () => requisicao('GET', '/turmas'),
  listarDisciplinas: () => requisicao('GET', '/admin/disciplinas'),
  contagensCadastros: () => requisicao('GET', '/admin/cadastros/contagens'),
  listarCadastros: (entidade, { busca = '', situacao = 'todos', turmaId = '', ordem = 'asc', pagina = 1, porPagina = config.ITENS_POR_PAGINA } = {}) =>
    requisicao('GET', `/${entidade}` + consulta({ busca, situacao, turma_id: turmaId, ordem, pagina, por_pagina: porPagina })),
  cadastrar: (entidade, dados) => requisicao('POST', `/${entidade}`, dados),
  detalheCadastro: (entidade, id) => requisicao('GET', `/${entidade}/${id}`),
  editarCadastro: (entidade, id, dados) => requisicao('PUT', `/${entidade}/${id}`, dados),
  alterarSituacao: (entidade, id, ativo) => requisicao('PATCH', `/${entidade}/${id}/situacao`, { ativo }),
  excluirCadastro: (entidade, id) => requisicao('DELETE', `/${entidade}/${id}`),
  liberarAcesso: (entidade, id) => requisicao('POST', `/${entidade}/${id}/convite`),
  vincularAluno: (responsavelId, dados) => requisicao('POST', `/responsaveis/${responsavelId}/alunos`, dados),
  desvincularAluno: (responsavelId, alunoId) => requisicao('DELETE', `/responsaveis/${responsavelId}/alunos/${alunoId}`),
  atribuirTurma: (professorId, dados) => requisicao('POST', `/professores/${professorId}/vinculos`, dados),
  removerTurma: (professorId, vinculoId) => requisicao('DELETE', `/professores/${professorId}/vinculos/${vinculoId}`),

  /* Administrador: revisão e publicação */
  listarAcompanhamentos: (filtros) => requisicao('GET', '/acompanhamentos' + consulta(filtros)),
  detalheAcompanhamento: (id) => requisicao('GET', `/acompanhamentos/${id}`),
  publicarAcompanhamento: (id) => requisicao('PATCH', `/acompanhamentos/${id}/publicar`),
  devolverAcompanhamento: (id, motivo) => requisicao('PATCH', `/acompanhamentos/${id}/devolver`, { motivo }),
  ajustarAcompanhamento: (id, dados) => requisicao('PUT', `/acompanhamentos/${id}`, dados),

  /* Administrador: bimestres e relatórios */
  listarBimestres: () => requisicao('GET', '/bimestres'),
  alterarPeriodo: (id, dados) => requisicao('PUT', `/bimestres/${id}`, dados),
  indicadores: (bimestreId) => requisicao('GET', '/admin/relatorios' + consulta({ bimestre_id: bimestreId })),
  exportarCsv: (bimestre) => baixarArquivo('/admin/relatorios/exportar' + consulta({ bimestre_id: bimestre.id }),
    `4u-acompanhamentos-${bimestre.numero}bim-${bimestre.ano_letivo}.csv`),

  /* Professor */
  painelProfessor: () => requisicao('GET', '/professor/painel'),
  alunosDoVinculo: (vinculoId, bimestreId) => requisicao('GET', `/professor/vinculos/${vinculoId}/alunos` + consulta({ bimestre_id: bimestreId })),
  registrarAcompanhamento: (dados) => requisicao('POST', '/professor/acompanhamentos', dados),
  salvarAcompanhamento: (id, dados) => requisicao('PUT', `/professor/acompanhamentos/${id}`, dados),
  retornos: () => requisicao('GET', '/professor/retornos'),
  listarTags: () => requisicao('GET', '/tags'),
  notificacoes: () => requisicao('GET', '/notificacoes'),

  /* Responsável */
  painelResponsavel: () => requisicao('GET', '/responsavel/painel'),
  mediasPublicadas: (alunoId, bimestreId) => requisicao('GET', `/responsavel/alunos/${alunoId}/relatorios` + consulta({ bimestre_id: bimestreId })),
  meusAlunos: () => requisicao('GET', '/responsavel/alunos'),
  relatorioAluno: (alunoId, bimestreId) => requisicao('GET', `/responsavel/alunos/${alunoId}/relatorio` + consulta({ bimestre_id: bimestreId })),
  darCiencia: (acompanhamentoId, observacao) => requisicao('POST', `/responsavel/acompanhamentos/${acompanhamentoId}/ciencia`, { observacao }),
  darCienciaEmTodos: (alunoId, bimestreId) => requisicao('POST', `/responsavel/alunos/${alunoId}/ciencia`, { bimestre_id: bimestreId })
};

export default api;
