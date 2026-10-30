import db from '../data/mock/index.js';
import { normalizar } from '../utils/formatadores.js';

/* Erros */
function erro(status, mensagem) {
  const e = new Error(mensagem);
  e.status = status;
  e.mensagem = mensagem;
  return e;
}

function exigirPerfil(sessao, perfil) {
  if (!sessao) throw erro(401, 'Sua sessão expirou. Entre novamente.');
  if (perfil && sessao.usuario.perfil !== perfil) throw erro(403, 'Você não tem permissão para acessar estes dados.');
}

/* Auxiliares */
const porId = (tabela, id) => db[tabela].find((linha) => linha.id === id);
const usuarioDe = (usuarioId) => porId('usuario', usuarioId);
const ordenarPorNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');

function anoLetivoAtual() {
  return db.turma.reduce((maior, t) => Math.max(maior, t.ano_letivo), 0);
}

function turmaDoAluno(alunoId) {
  const ano = anoLetivoAtual();
  const mat = db.matricula_turma.find((m) => m.aluno_id === alunoId && m.ano_letivo === ano);
  return mat ? porId('turma', mat.turma_id) : null;
}

/* Bimestre atual */
function bimestreAtual() {
  const agora = Date.now();
  const doAno = db.bimestre
    .filter((b) => b.ano_letivo === anoLetivoAtual())
    .sort((a, b) => a.numero - b.numero);
  const aberto = doAno.find((b) =>
    agora >= new Date(b.abertura_digitacao).getTime() && agora <= new Date(b.encerramento_digitacao).getTime());
  if (aberto) return { ...aberto, digitacao_aberta: true };
  const iniciados = doAno.filter((b) => new Date(b.abertura_digitacao).getTime() <= agora);
  return { ...(iniciados.length ? iniciados[iniciados.length - 1] : doAno[0]), digitacao_aberta: false };
}

function paginar(lista, pagina, porPagina) {
  const total = lista.length;
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const atual = Math.min(Math.max(1, pagina || 1), paginas);
  return {
    itens: lista.slice((atual - 1) * porPagina, atual * porPagina),
    total,
    pagina: atual,
    paginas,
    por_pagina: porPagina
  };
}

/* Autenticação */
export function autenticar({ email, senha }) {
  const alvo = normalizar(email);
  const usuario = db.usuario.find((u) => u.email.toLowerCase() === alvo);
  if (!usuario || senha !== db.credenciais_demo.senha_padrao) {
    throw erro(401, 'E-mail ou senha incorretos. Confira os dados e tente novamente.');
  }
  if (!usuario.ativo) throw erro(403, 'Esta conta está inativa. Procure a secretaria da escola.');

  let perfilId = null;
  if (usuario.perfil === 'PROFESSOR') perfilId = db.professor.find((p) => p.usuario_id === usuario.id).id;
  if (usuario.perfil === 'RESPONSAVEL') perfilId = db.responsavel.find((r) => r.usuario_id === usuario.id).id;

  return { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, perfil_id: perfilId };
}

/* Dashboard do administrador */
export function resumoAdministrador(sessao) {
  exigirPerfil(sessao, 'ADMINISTRADOR');
  const bim = bimestreAtual();
  const doBimestre = db.acompanhamento.filter((a) => a.bimestre_id === bim.id);
  return {
    bimestre: bim,
    alunos_ativos: db.aluno.filter((a) => a.ativo).length,
    professores_ativos: db.professor.filter((p) => usuarioDe(p.usuario_id).ativo).length,
    turmas: db.turma.filter((t) => t.ano_letivo === anoLetivoAtual()).length,
    aguardando_revisao: doBimestre.filter((a) => a.status === 'ENVIADO' || a.status === 'EM_REVISAO').length,
    publicados_bimestre: doBimestre.filter((a) => a.status === 'PUBLICADO').length
  };
}

/* Acompanhamentos recentes (sem rascunhos) */
export function acompanhamentosRecentes(sessao, limite = 6) {
  exigirPerfil(sessao, 'ADMINISTRADOR');
  return db.acompanhamento
    .filter((a) => a.status !== 'RASCUNHO')
    .sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em))
    .slice(0, limite)
    .map((a) => ({
      id: a.id,
      aluno: porId('aluno', a.aluno_id).nome,
      turma: porId('turma', a.turma_id).nome,
      disciplina: porId('disciplina', a.disciplina_id).nome,
      bimestre: porId('bimestre', a.bimestre_id).numero,
      status: a.status,
      atualizado_em: a.atualizado_em
    }));
}

/* Cadastros */
export function listarTurmas(sessao) {
  exigirPerfil(sessao, 'ADMINISTRADOR');
  return db.turma.filter((t) => t.ano_letivo === anoLetivoAtual());
}

export function contagensCadastros(sessao) {
  exigirPerfil(sessao, 'ADMINISTRADOR');
  return { alunos: db.aluno.length, professores: db.professor.length, responsaveis: db.responsavel.length };
}

function listaAlunos() {
  return db.aluno.map((a) => {
    const t = turmaDoAluno(a.id);
    return { ...a, turma: t ? t.nome : null };
  });
}

function listaProfessores() {
  return db.professor.map((p) => {
    const usr = usuarioDe(p.usuario_id);
    const disciplinas = [];
    db.vinculo_docente.filter((v) => v.professor_id === p.id).forEach((v) => {
      const nome = porId('disciplina', v.disciplina_id).nome;
      if (!disciplinas.includes(nome)) disciplinas.push(nome);
    });
    return { id: p.id, nome: usr.nome, email: usr.email, registro_funcional: p.registro_funcional, ativo: usr.ativo, disciplinas };
  });
}

function listaResponsaveis() {
  return db.responsavel.map((r) => {
    const usr = usuarioDe(r.usuario_id);
    const alunos = db.aluno_responsavel
      .filter((ar) => ar.responsavel_id === r.id)
      .map((ar) => porId('aluno', ar.aluno_id).nome);
    return { id: r.id, nome: usr.nome, email: usr.email, telefone: r.telefone, ativo: usr.ativo, alunos };
  });
}

/* Lista com busca, situação e paginação */
export function listarCadastros(sessao, entidade, { busca = '', situacao = 'todos', pagina = 1, por_pagina = 8 } = {}) {
  exigirPerfil(sessao, 'ADMINISTRADOR');
  const fonte = { alunos: listaAlunos, professores: listaProfessores, responsaveis: listaResponsaveis }[entidade];
  if (!fonte) throw erro(404, 'Tipo de cadastro não encontrado.');

  let lista = fonte();

  const termo = normalizar(busca);
  if (termo) {
    lista = lista.filter((item) => {
      const nome = normalizar(item.nome);
      return nome.startsWith(termo) || nome.includes(' ' + termo);
    });
  }

  if (situacao === 'ativos') lista = lista.filter((item) => item.ativo);
  if (situacao === 'inativos') lista = lista.filter((item) => !item.ativo);

  return paginar(lista.sort(ordenarPorNome), pagina, por_pagina);
}

/* Dashboard do professor */
export function painelProfessor(sessao) {
  exigirPerfil(sessao, 'PROFESSOR');
  const professorId = sessao.usuario.perfil_id;
  const bim = bimestreAtual();
  const ano = anoLetivoAtual();
  const meus = db.acompanhamento.filter((a) => a.professor_id === professorId && a.bimestre_id === bim.id);

  const vinculos = db.vinculo_docente
    .filter((v) => v.professor_id === professorId)
    .map((v) => {
      const alunosTurma = db.matricula_turma.filter((m) =>
        m.turma_id === v.turma_id && m.ano_letivo === ano && porId('aluno', m.aluno_id).ativo);
      const registros = meus.filter((a) =>
        a.turma_id === v.turma_id && a.disciplina_id === v.disciplina_id && a.status !== 'CANCELADO');
      const porStatus = {};
      registros.forEach((a) => { porStatus[a.status] = (porStatus[a.status] || 0) + 1; });
      return {
        id: v.id,
        turma: porId('turma', v.turma_id).nome,
        disciplina: porId('disciplina', v.disciplina_id).nome,
        total_alunos: alunosTurma.length,
        registrados: registros.length,
        por_status: porStatus
      };
    })
    .sort((a, b) => a.turma.localeCompare(b.turma, 'pt-BR'));

  const contar = (lista) => meus.filter((a) => lista.includes(a.status)).length;
  return {
    bimestre: bim,
    totais: {
      rascunhos: contar(['RASCUNHO']),
      devolvidos: contar(['DEVOLVIDO']),
      em_revisao: contar(['ENVIADO', 'EM_REVISAO']),
      publicados: contar(['PUBLICADO'])
    },
    vinculos
  };
}

/* Dashboard do responsável (só publicados) */
function vinculosDoResponsavel(responsavelId) {
  return db.aluno_responsavel.filter((ar) => ar.responsavel_id === responsavelId && ar.autorizado);
}

export function painelResponsavel(sessao) {
  exigirPerfil(sessao, 'RESPONSAVEL');
  const alunos = vinculosDoResponsavel(sessao.usuario.perfil_id)
    .map((ar) => {
      const aluno = porId('aluno', ar.aluno_id);
      const t = turmaDoAluno(aluno.id);
      return { id: aluno.id, nome: aluno.nome, turma: t ? t.nome : null };
    })
    .sort(ordenarPorNome);
  const ano = anoLetivoAtual();
  const bimestres = db.bimestre
    .filter((b) => b.ano_letivo === ano)
    .sort((a, b) => a.numero - b.numero)
    .map((b) => ({ id: b.id, numero: b.numero, ano_letivo: b.ano_letivo }));
  return {
    alunos,
    bimestres,
    anos_letivos: [ano],
    bimestre_atual: bimestreAtual(),
    escala: {
      minima: db.configuracao_escola.media_minima,
      maxima: db.configuracao_escola.media_maxima,
      aprovacao: db.configuracao_escola.media_aprovacao
    }
  };
}

export function mediasPublicadas(sessao, alunoId, bimestreId) {
  exigirPerfil(sessao, 'RESPONSAVEL');
  const autorizado = vinculosDoResponsavel(sessao.usuario.perfil_id).some((ar) => ar.aluno_id === alunoId);
  if (!autorizado) throw erro(403, 'Este aluno não está vinculado ao seu cadastro.');

  const disciplinas = db.acompanhamento
    .filter((a) => a.aluno_id === alunoId && a.bimestre_id === bimestreId && a.status === 'PUBLICADO')
    .map((a) => ({ disciplina: porId('disciplina', a.disciplina_id).nome, media: a.media }))
    .sort((a, b) => a.disciplina.localeCompare(b.disciplina, 'pt-BR'));

  const soma = disciplinas.reduce((s, d) => s + d.media, 0);
  return {
    disciplinas,
    media_geral: disciplinas.length ? Math.round((soma / disciplinas.length) * 10) / 10 : null
  };
}

