const pool = require('../database/connection');
const Sistema = require('../classes/Sistema');
const ErroApi = require('../utils/ErroApi');
const { configuracao } = require('../repositorios/escolaRepositorio');
const { dataHoraIso, numero, lerPaginacao, montarPagina } = require('../utils/formato');
const { lerId, escaparLike, texto } = require('../utils/validacao');

const sistema = new Sistema();

/* Abas da tela de revisão do administrador (rascunho é do professor e não aparece aqui) */
const SITUACOES = {
  aguardando: ['ENVIADO', 'EM_REVISAO'],
  devolvidos: ['DEVOLVIDO'],
  publicados: ['PUBLICADO'],
  todos: ['ENVIADO', 'EM_REVISAO', 'DEVOLVIDO', 'PUBLICADO', 'CANCELADO']
};

/* GET /api/acompanhamentos?situacao=&bimestre_id=&turma_id=&disciplina_id=&busca=&pagina= (administrador) */
async function listar(req, res) {
  const q = req.query;
  const situacao = SITUACOES[q.situacao] ? q.situacao : 'aguardando';
  const condicoes = ["a.status <> 'RASCUNHO'"];
  const parametros = [];
  for (const [campo, coluna] of [['bimestre_id', 'a.bimestre_id'], ['turma_id', 'a.turma_id'], ['disciplina_id', 'a.disciplina_id']]) {
    const id = lerId(q[campo]);
    if (id) { condicoes.push(`${coluna} = ?`); parametros.push(id); }
  }
  const termo = texto(q.busca || '').slice(0, 60);
  if (termo) {
    condicoes.push('(al.nome LIKE ? OR al.nome LIKE ?)');
    parametros.push(`${escaparLike(termo)}%`, `% ${escaparLike(termo)}%`);
  }
  const base = `FROM acompanhamento a
                JOIN aluno al ON al.id = a.aluno_id
                JOIN turma t ON t.id = a.turma_id
                JOIN disciplina d ON d.id = a.disciplina_id
                JOIN professor p ON p.id = a.professor_id
                JOIN usuario up ON up.id = p.usuario_id`;
  const where = 'WHERE ' + condicoes.join(' AND ');

  /* Números das abas, com os mesmos filtros */
  const [porStatus] = await pool.query(`SELECT a.status, COUNT(*) AS total ${base} ${where} GROUP BY a.status`, parametros);
  const contagens = {};
  for (const [chave, lista] of Object.entries(SITUACOES)) {
    contagens[chave] = porStatus.filter((s) => lista.includes(s.status)).reduce((soma, s) => soma + Number(s.total), 0);
  }

  const lista = SITUACOES[situacao];
  const whereAba = `${where} AND a.status IN (?)`;
  const { pagina, porPagina } = lerPaginacao(q, 10);
  const total = contagens[situacao];
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const atual = Math.min(pagina, paginas);
  /* Aguardando revisão: quem espera há mais tempo aparece primeiro */
  const ordem = situacao === 'aguardando' ? 'a.atualizado_em ASC' : 'a.atualizado_em DESC';
  const [linhas] = await pool.query(
    `SELECT a.id, a.status, a.media, a.atualizado_em, al.nome AS aluno, t.nome AS turma, d.nome AS disciplina, up.nome AS professor
       ${base} ${whereAba}
      ORDER BY ${ordem}, a.id
      LIMIT ? OFFSET ?`,
    [...parametros, lista, porPagina, (atual - 1) * porPagina]
  );
  const itens = linhas.map((l) => ({ ...l, media: numero(l.media), atualizado_em: dataHoraIso(l.atualizado_em) }));
  const escola = await configuracao();
  res.json({ ...montarPagina(itens, total, atual, porPagina), contagens, aprovacao: escola ? escola.media_aprovacao : 6 });
}

/* Quem pode ver o registro: administrador (todos), professor (os dele), responsável (publicados do aluno autorizado) */
async function exigirAcesso(usuario, a) {
  if (usuario.perfil === 'ADMINISTRADOR') return;
  if (usuario.perfil === 'PROFESSOR') {
    /* Autor do registro ou professor que dá a disciplina na turma hoje */
    if (a.professor_id === usuario.perfil_id) return;
    const [[vinculo]] = await pool.query(
      'SELECT 1 AS ok FROM vinculo_docente WHERE turma_id = ? AND disciplina_id = ? AND professor_id = ?',
      [a.turma_id, a.disciplina_id, usuario.perfil_id]
    );
    if (vinculo) return;
  }
  if (usuario.perfil === 'RESPONSAVEL' && a.status === 'PUBLICADO') {
    const [[ok]] = await pool.query(
      'SELECT 1 AS ok FROM aluno_responsavel WHERE aluno_id = ? AND responsavel_id = ? AND autorizado = 1',
      [a.aluno_id, usuario.perfil_id]
    );
    if (ok) return;
  }
  throw new ErroApi(403, 'Você não tem permissão para ver este acompanhamento.');
}

/* GET /api/acompanhamentos/:id: registro completo, com tags, histórico (view vw_trilha_alteracoes) e ciências */
async function detalhe(req, res) {
  const id = lerId(req.params.id);
  if (!id) throw new ErroApi(400, 'Identificador inválido.');
  const [[a]] = await pool.query(
    `SELECT a.id, a.status, a.media, a.descricao, a.versao_atual, a.criado_em, a.atualizado_em, a.publicado_em,
            a.aluno_id, al.nome AS aluno, al.matricula, a.turma_id, t.nome AS turma,
            a.disciplina_id, d.nome AS disciplina, a.professor_id, up.nome AS professor,
            a.bimestre_id, b.numero AS bimestre, b.ano_letivo, ur.nome AS revisor
       FROM acompanhamento a
       JOIN aluno al ON al.id = a.aluno_id
       JOIN turma t ON t.id = a.turma_id
       JOIN disciplina d ON d.id = a.disciplina_id
       JOIN professor p ON p.id = a.professor_id
       JOIN usuario up ON up.id = p.usuario_id
       JOIN bimestre b ON b.id = a.bimestre_id
       LEFT JOIN usuario ur ON ur.id = a.revisor_id
      WHERE a.id = ?`,
    [id]
  );
  if (!a) throw new ErroApi(404, 'Acompanhamento não encontrado.');
  await exigirAcesso(req.usuario, a);

  const [tags] = await pool.query(
    'SELECT t.id, t.nome, t.cor FROM acompanhamento_tag x JOIN tag t ON t.id = x.tag_id WHERE x.acompanhamento_id = ? ORDER BY t.nome',
    [id]
  );
  const escola = await configuracao();
  const resposta = {
    ...a,
    escala: { minima: escola.media_minima, maxima: escola.media_maxima, aprovacao: escola.media_aprovacao },
    media: numero(a.media),
    criado_em: dataHoraIso(a.criado_em),
    atualizado_em: dataHoraIso(a.atualizado_em),
    publicado_em: dataHoraIso(a.publicado_em),
    tags
  };

  /* Responsável vê só o conteúdo publicado; histórico interno fica com a escola */
  if (req.usuario.perfil !== 'RESPONSAVEL') {
    const [trilha] = await pool.query(
      `SELECT v.data_hora, v.tipo, v.detalhe, u.nome AS usuario
         FROM vw_trilha_alteracoes v JOIN usuario u ON u.id = v.usuario_id
        WHERE v.acompanhamento_id = ?
        ORDER BY v.data_hora, v.tipo`,
      [id]
    );
    const [[devolucao]] = await pool.query(
      `SELECT observacao, data_hora FROM acompanhamento_historico
        WHERE acompanhamento_id = ? AND status_novo = 'DEVOLVIDO' ORDER BY data_hora DESC, id DESC LIMIT 1`,
      [id]
    );
    const [ciencias] = await pool.query(
      `SELECT c.data_hora, c.observacao, u.nome AS responsavel
         FROM ciencia_responsavel c JOIN responsavel r ON r.id = c.responsavel_id JOIN usuario u ON u.id = r.usuario_id
        WHERE c.acompanhamento_id = ? ORDER BY c.data_hora`,
      [id]
    );
    resposta.trilha = trilha.map((t) => ({ ...t, data_hora: dataHoraIso(t.data_hora) }));
    resposta.ultima_devolucao = devolucao ? { motivo: devolucao.observacao, data_hora: dataHoraIso(devolucao.data_hora) } : null;
    resposta.ciencias = ciencias.map((c) => ({ ...c, data_hora: dataHoraIso(c.data_hora) }));
  }
  res.json(resposta);
}

/* Média dentro da escala da escola e descrição com tamanho razoável */
async function lerConteudo(b) {
  const escala = await configuracao();
  const erros = {};
  const media = typeof b.media === 'string' ? Number(b.media.replace(',', '.')) : b.media;
  const minima = escala ? escala.media_minima : 0;
  const maxima = escala ? escala.media_maxima : 10;
  if (b.media === '' || b.media === null || b.media === undefined || !Number.isFinite(media)) erros.media = 'Informe a média do bimestre.';
  else if (media < minima || media > maxima) erros.media = `A média deve ficar entre ${minima} e ${maxima}.`;
  else if (Math.abs(media * 100 - Math.round(media * 100)) > 1e-6) erros.media = 'Use no máximo duas casas decimais.';

  const descricao = texto(b.descricao || '');
  if (!descricao) erros.descricao = 'Escreva a descrição do desenvolvimento do aluno.';
  else if (descricao.length < 20) erros.descricao = 'Escreva pelo menos 20 caracteres.';
  else if (descricao.length > 2000) erros.descricao = 'Use no máximo 2000 caracteres.';

  let tags = [];
  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags) || b.tags.some((t) => !lerId(t))) erros.tags = 'Tags inválidas.';
    else tags = [...new Set(b.tags.map(Number))];
    if (tags.length > 6) erros.tags = 'Escolha no máximo 6 tags.';
  }
  return { erros, media, descricao, tags };
}

/* POST /api/professor/acompanhamentos (professor) */
async function registrar(req, res) {
  const b = req.body || {};
  const { erros, media, descricao, tags } = await lerConteudo(b);
  const vinculoId = lerId(b.vinculo_id);
  const alunoId = lerId(b.aluno_id);
  const bimestreId = lerId(b.bimestre_id);
  if (!vinculoId || !alunoId || !bimestreId) throw new ErroApi(400, 'Informe a turma, o aluno e o bimestre.');
  if (Object.keys(erros).length) throw new ErroApi(400, 'Confira os campos destacados.', erros);

  const r = await sistema.registrarAcompanhamento({
    professorId: req.usuario.perfil_id, usuarioId: req.usuario.id, vinculoId, alunoId, bimestreId,
    descricao, media, tags, enviar: b.enviar === true
  });
  res.status(201).json({ ...r, mensagem: b.enviar === true ? 'Acompanhamento enviado para revisão.' : 'Rascunho salvo.' });
}

/* PUT /api/professor/acompanhamentos/:id (professor) */
async function salvar(req, res) {
  const id = lerId(req.params.id);
  if (!id) throw new ErroApi(400, 'Identificador inválido.');
  const b = req.body || {};
  const { erros, media, descricao, tags } = await lerConteudo(b);
  if (Object.keys(erros).length) throw new ErroApi(400, 'Confira os campos destacados.', erros);

  const r = await sistema.salvarAcompanhamentoDoProfessor(id, {
    professorId: req.usuario.perfil_id, usuarioId: req.usuario.id, descricao, media, tags, enviar: b.enviar === true
  });
  res.json({ ...r, mensagem: b.enviar === true ? 'Acompanhamento enviado para revisão.' : 'Rascunho salvo.' });
}

/* PATCH /api/acompanhamentos/:id/publicar (administrador) */
async function publicar(req, res) {
  const id = lerId(req.params.id);
  if (!id) throw new ErroApi(400, 'Identificador inválido.');
  const r = await sistema.publicarAcompanhamento(id, req.usuario.id);
  res.json({ ...r, mensagem: 'Acompanhamento publicado. A família já pode ver o relatório.' });
}

/* PATCH /api/acompanhamentos/:id/devolver { motivo } (administrador) */
async function devolver(req, res) {
  const id = lerId(req.params.id);
  if (!id) throw new ErroApi(400, 'Identificador inválido.');
  const motivo = texto((req.body || {}).motivo || '');
  if (motivo.length < 10) throw new ErroApi(400, 'Confira os campos destacados.', { motivo: 'Explique o que o professor deve ajustar (pelo menos 10 caracteres).' });
  if (motivo.length > 255) throw new ErroApi(400, 'Confira os campos destacados.', { motivo: 'Use no máximo 255 caracteres.' });
  const r = await sistema.devolverAcompanhamento(id, req.usuario.id, motivo);
  res.json({ ...r, mensagem: 'Acompanhamento devolvido ao professor para ajustes.' });
}

/* PUT /api/acompanhamentos/:id { media, descricao, motivo } (administrador, durante a revisão) */
async function editarNaRevisao(req, res) {
  const id = lerId(req.params.id);
  if (!id) throw new ErroApi(400, 'Identificador inválido.');
  const b = req.body || {};
  const { erros, media, descricao } = await lerConteudo({ ...b, tags: undefined });
  const motivo = texto(b.motivo || '');
  if (motivo.length < 5) erros.motivo = 'Diga o motivo do ajuste (fica registrado no histórico).';
  else if (motivo.length > 255) erros.motivo = 'Use no máximo 255 caracteres.';
  if (Object.keys(erros).length) throw new ErroApi(400, 'Confira os campos destacados.', erros);
  const r = await sistema.editarNaRevisao(id, { usuarioId: req.usuario.id, descricao, media, motivo });
  res.json({ ...r, mensagem: 'Ajuste salvo. A versão anterior continua no histórico.' });
}

/* GET /api/tags: tags ativas (para o formulário do professor e as legendas) */
async function listarTags(req, res) {
  const [tags] = await pool.query('SELECT id, nome, cor FROM tag WHERE ativo = 1 ORDER BY nome');
  res.json(tags);
}

module.exports = { listar, detalhe, registrar, salvar, publicar, devolver, editarNaRevisao, listarTags };
