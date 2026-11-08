const pool = require('../database/connection');
const Sistema = require('../classes/Sistema');
const ErroApi = require('../utils/ErroApi');
const { anoLetivoAtual } = require('../repositorios/escolaRepositorio');
const { criarLink } = require('../repositorios/acessoRepositorio');
const { emailConfigurado, enviarLinkDeAcesso } = require('../utils/email');
const { lerPaginacao, montarPagina, dataHoraIso } = require('../utils/formato');
const { regras, validar, lerData, lerId, escaparLike, texto } = require('../utils/validacao');

const sistema = new Sistema();

const PARENTESCOS = ['MAE', 'PAI', 'AVO', 'TUTOR', 'OUTRO'];

/* Situação do login: DESATIVADO (bloqueado), PENDENTE (ainda não criou a senha) ou LIBERADO */
const SQL_ACESSO = `CASE WHEN u.ativo = 0 THEN 'DESATIVADO' WHEN u.senha_hash IS NULL THEN 'PENDENTE' ELSE 'LIBERADO' END AS acesso,
  (SELECT MAX(t.expira_em) FROM token_acesso t
    WHERE t.usuario_id = u.id AND t.tipo = 'PRIMEIRO_ACESSO' AND t.usado_em IS NULL AND t.expira_em > NOW()) AS convite_ate`;

/* Filtro por nome (início do nome ou de um sobrenome), por situação e, na aba de alunos, por turma */
function filtro(c, { busca, situacao, turma_id: turmaId }) {
  const { colunaNome, colunaAtivo } = c;
  const condicoes = [];
  const parametros = [];
  const termo = texto(busca || '').slice(0, 60);
  if (termo) {
    const t = escaparLike(termo);
    if (c.usaAno) {
      /* Alunos: também pela matrícula */
      condicoes.push(`(${colunaNome} LIKE ? OR ${colunaNome} LIKE ? OR a.matricula LIKE ?)`);
      parametros.push(`${t}%`, `% ${t}%`, `${t}%`);
    } else {
      condicoes.push(`(${colunaNome} LIKE ? OR ${colunaNome} LIKE ?)`);
      parametros.push(`${t}%`, `% ${t}%`);
    }
  }
  if (situacao === 'ativos') condicoes.push(`${colunaAtivo} = 1`);
  if (situacao === 'inativos') condicoes.push(`${colunaAtivo} = 0`);
  if (c.usaAno && lerId(turmaId)) {
    condicoes.push('t.id = ?');
    parametros.push(lerId(turmaId));
  }
  return { where: condicoes.length ? 'WHERE ' + condicoes.join(' AND ') : '', parametros };
}

/* Linha da lista com a situação do login já formatada */
const comAcesso = (l) => ({ ...l, ativo: !!l.ativo, convite_ate: dataHoraIso(l.convite_ate) });

/* Consultas de cada aba. "base" é o FROM/JOIN comum à contagem e à página. */
const CONSULTAS = {
  alunos: {
    colunaNome: 'a.nome',
    colunaAtivo: 'a.ativo',
    base: `FROM aluno a
           LEFT JOIN matricula_turma m ON m.aluno_id = a.id AND m.ano_letivo = ?
           LEFT JOIN turma t ON t.id = m.turma_id`,
    /* Primeiro responsável (ordem alfabética) e quantos responsáveis o aluno tem */
    campos: `a.id, a.nome, a.data_nascimento, a.matricula, a.ativo, t.id AS turma_id, t.nome AS turma,
             (SELECT CONCAT(ur.nome, '|', ar.parentesco)
                FROM aluno_responsavel ar JOIN responsavel r ON r.id = ar.responsavel_id JOIN usuario ur ON ur.id = r.usuario_id
               WHERE ar.aluno_id = a.id ORDER BY ur.nome LIMIT 1) AS responsavel,
             (SELECT COUNT(*) FROM aluno_responsavel ar WHERE ar.aluno_id = a.id) AS total_responsaveis`,
    ordem: 'a.nome',
    usaAno: true,
    montar: (l) => {
      const [nomeResp, parentesco] = l.responsavel ? l.responsavel.split('|') : [];
      return {
        ...l,
        ativo: !!l.ativo,
        responsavel: nomeResp ? { nome: nomeResp, parentesco } : null,
        total_responsaveis: Number(l.total_responsaveis)
      };
    }
  },
  professores: {
    colunaNome: 'u.nome',
    colunaAtivo: 'u.ativo',
    base: 'FROM professor p JOIN usuario u ON u.id = p.usuario_id',
    campos: `p.id, u.nome, u.email, p.registro AS registro_funcional, u.ativo, ${SQL_ACESSO},
             (SELECT GROUP_CONCAT(DISTINCT d.nome ORDER BY d.nome SEPARATOR '|')
                FROM vinculo_docente v JOIN disciplina d ON d.id = v.disciplina_id
               WHERE v.professor_id = p.id) AS disciplinas`,
    ordem: 'u.nome',
    montar: (l) => ({ ...comAcesso(l), disciplinas: l.disciplinas ? [...new Set(l.disciplinas.split('|'))] : [] })
  },
  responsaveis: {
    colunaNome: 'u.nome',
    colunaAtivo: 'u.ativo',
    base: 'FROM responsavel r JOIN usuario u ON u.id = r.usuario_id',
    campos: `r.id, u.nome, u.email, r.telefone, u.ativo, ${SQL_ACESSO},
             (SELECT GROUP_CONCAT(al.nome ORDER BY al.nome SEPARATOR '|')
                FROM aluno_responsavel ar JOIN aluno al ON al.id = ar.aluno_id
               WHERE ar.responsavel_id = r.id) AS alunos`,
    ordem: 'u.nome',
    montar: (l) => ({ ...comAcesso(l), alunos: l.alunos ? l.alunos.split('|') : [] })
  }
};

/* GET /api/{alunos|professores|responsaveis}?busca=&situacao=&turma_id=&ordem=asc|desc&pagina=&por_pagina= */
const listar = (entidade) => async (req, res) => {
  const c = CONSULTAS[entidade];
  const { pagina, porPagina } = lerPaginacao(req.query);
  const { where, parametros } = filtro(c, req.query);
  const direcao = req.query.ordem === 'desc' ? 'DESC' : 'ASC';
  const inicio = c.usaAno ? [await anoLetivoAtual()] : [];

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${c.base} ${where}`, [...inicio, ...parametros]);
  const paginas = Math.max(1, Math.ceil(Number(total) / porPagina));
  const atual = Math.min(pagina, paginas);
  const [linhas] = await pool.query(
    `SELECT ${c.campos} ${c.base} ${where} ORDER BY ${c.ordem} ${direcao} LIMIT ? OFFSET ?`,
    [...inicio, ...parametros, porPagina, (atual - 1) * porPagina]
  );
  res.json(montarPagina(linhas.map(c.montar), Number(total), atual, porPagina));
};

/* Validação de cada formulário (mesmas regras do front) */
const nome = (quem) => [regras.obrigatorio(`Informe o nome completo do ${quem}.`), regras.minimo(3, 'Use pelo menos 3 caracteres.'),
  regras.maximo(120, 'Use no máximo 120 caracteres.'), regras.nome()];
/* Regras do e-mail (professor e responsável) */
const email = (quem) => [regras.obrigatorio(`Informe o e-mail do ${quem}.`), regras.email(), regras.maximo(180, 'E-mail muito longo.')];
const REGRAS = {
  alunos: {
    nome: nome('aluno'),
    data_nascimento: [regras.obrigatorio('Informe a data de nascimento.')],
    matricula: [regras.obrigatorio('Informe a matrícula do aluno.'), regras.padrao(/^\d{4,12}$/, 'A matrícula deve ter de 4 a 12 números.')],
    turma_id: [regras.obrigatorio('Selecione a turma do aluno.'), regras.padrao(/^\d+$/, 'Turma inválida.')]
  },
  professores: {
    nome: nome('professor'),
    email: email('professor'),
    registro_funcional: [regras.obrigatorio('Informe o registro funcional.'),
      regras.padrao(/^\d{6}$/, 'O registro funcional tem 6 números, sem letras (ex.: 102310).')]
  },
  responsaveis: {
    nome: nome('responsável'),
    email: email('responsável'),
    telefone: [regras.obrigatorio('Informe um telefone para contato.'), regras.telefone()]
  }
};

/* Valida o corpo do formulário e devolve os dados limpos */
function lerFormulario(entidade, b, novo = false) {
  const erros = validar(b, REGRAS[entidade]);
  let dataNascimento = null;
  if (entidade === 'alunos' && !erros.data_nascimento) {
    dataNascimento = lerData(b.data_nascimento);
    if (!dataNascimento) erros.data_nascimento = 'Data inválida. Use o formato dd/mm/aaaa.';
    else if (dataNascimento > new Date().toISOString().slice(0, 10)) erros.data_nascimento = 'A data de nascimento não pode ser no futuro.';
  }
  /* Novo responsável: precisa de um aluno vinculado e do parentesco (na edição, os vínculos ficam na seção "Alunos vinculados") */
  if (entidade === 'responsaveis' && novo) {
    if (!lerId(b.aluno_id)) erros.aluno_id = 'Escolha o aluno vinculado a este responsável.';
    if (!PARENTESCOS.includes(b.parentesco)) erros.parentesco = 'Escolha o parentesco.';
  }
  if (Object.keys(erros).length) throw new ErroApi(400, 'Confira os campos destacados.', erros);

  if (entidade === 'alunos') {
    return { nome: texto(b.nome), dataNascimento, matricula: texto(b.matricula), turmaId: Number(b.turma_id) };
  }
  if (entidade === 'professores') {
    return { nome: texto(b.nome), email: texto(b.email).toLowerCase(), registro: texto(b.registro_funcional) };
  }
  return {
    nome: texto(b.nome), email: texto(b.email).toLowerCase(), telefone: texto(b.telefone),
    alunoId: lerId(b.aluno_id), parentesco: b.parentesco
  };
}

/* E-mail, matrícula e registro funcional são únicos: confere antes de gravar para avisar no campo certo */
async function exigirUnicos(entidade, dados, idAtual = 0) {
  const erros = {};
  if (entidade === 'alunos') {
    const [[a]] = await pool.query('SELECT id FROM aluno WHERE matricula = ? AND id <> ?', [dados.matricula, idAtual]);
    if (a) erros.matricula = 'Já existe um aluno com esta matrícula.';
  } else {
    const tabela = entidade === 'professores' ? 'professor' : 'responsavel';
    const [[u]] = await pool.query(
      `SELECT u.id FROM usuario u WHERE u.email = ?
          AND u.id <> COALESCE((SELECT x.usuario_id FROM ${tabela} x WHERE x.id = ?), 0)`,
      [dados.email, idAtual]
    );
    if (u) erros.email = 'Este e-mail já está cadastrado.';
    if (entidade === 'professores') {
      const [[p]] = await pool.query('SELECT id FROM professor WHERE registro = ? AND id <> ?', [dados.registro, idAtual]);
      if (p) erros.registro_funcional = 'Este registro funcional já está cadastrado.';
    }
  }
  if (Object.keys(erros).length) throw new ErroApi(409, Object.values(erros)[0], erros);
}

/* POST /api/{alunos|professores|responsaveis}: só administrador (rota protegida) */
const cadastrar = (entidade) => async (req, res) => {
  const dados = lerFormulario(entidade, req.body || {}, true);
  await exigirUnicos(entidade, dados);
  let criado;
  if (entidade === 'alunos') criado = await sistema.criarAlunoNaTurma(dados);
  else if (entidade === 'professores') criado = await sistema.criarProfessor(dados);
  else criado = await sistema.criarResponsavel(dados);

  const aviso = entidade === 'alunos' ? '' : ' Use "Liberar acesso" para enviar o convite por e-mail.';
  res.status(201).json({ mensagem: 'Cadastro realizado com sucesso.' + aviso, dados: criado && criado.toJSON ? criado.toJSON() : criado });
};

/* Id da URL (/:id), validado */
function idDaUrl(req) {
  const id = lerId(req.params.id);
  if (!id) throw new ErroApi(400, 'Identificador inválido.');
  return id;
}

/* GET /api/{entidade}/:id: dados para o formulário de edição e os vínculos */
const detalhe = (entidade) => async (req, res) => {
  const id = idDaUrl(req);
  if (entidade === 'alunos') {
    const ano = await anoLetivoAtual();
    const [[a]] = await pool.query(
      `SELECT a.id, a.nome, a.data_nascimento, a.matricula, a.ativo, t.id AS turma_id, t.nome AS turma,
              (SELECT COUNT(*) FROM acompanhamento ac WHERE ac.aluno_id = a.id) AS acompanhamentos
         FROM aluno a
         LEFT JOIN matricula_turma m ON m.aluno_id = a.id AND m.ano_letivo = ?
         LEFT JOIN turma t ON t.id = m.turma_id
        WHERE a.id = ?`,
      [ano, id]
    );
    if (!a) throw new ErroApi(404, 'Aluno não encontrado.');
    const [responsaveis] = await pool.query(
      `SELECT r.id, u.nome, u.email, ar.parentesco, ar.autorizado
         FROM aluno_responsavel ar JOIN responsavel r ON r.id = ar.responsavel_id JOIN usuario u ON u.id = r.usuario_id
        WHERE ar.aluno_id = ? ORDER BY u.nome`,
      [id]
    );
    return res.json({ ...a, ativo: !!a.ativo, acompanhamentos: Number(a.acompanhamentos),
      responsaveis: responsaveis.map((r) => ({ ...r, autorizado: !!r.autorizado })) });
  }

  if (entidade === 'professores') {
    const [[p]] = await pool.query(
      `SELECT p.id, u.nome, u.email, p.registro AS registro_funcional, u.ativo, ${SQL_ACESSO},
              (SELECT COUNT(*) FROM acompanhamento ac WHERE ac.professor_id = p.id) AS acompanhamentos
         FROM professor p JOIN usuario u ON u.id = p.usuario_id WHERE p.id = ?`,
      [id]
    );
    if (!p) throw new ErroApi(404, 'Professor não encontrado.');
    const [vinculos] = await pool.query(
      `SELECT v.id, v.turma_id, t.nome AS turma, v.disciplina_id, d.nome AS disciplina
         FROM vinculo_docente v JOIN turma t ON t.id = v.turma_id JOIN disciplina d ON d.id = v.disciplina_id
        WHERE v.professor_id = ? ORDER BY t.nome, d.nome`,
      [id]
    );
    return res.json({ ...comAcesso(p), acompanhamentos: Number(p.acompanhamentos), vinculos });
  }

  const [[r]] = await pool.query(
    `SELECT r.id, u.nome, u.email, r.telefone, u.ativo, ${SQL_ACESSO},
            (SELECT COUNT(*) FROM ciencia_responsavel c WHERE c.responsavel_id = r.id) AS ciencias
       FROM responsavel r JOIN usuario u ON u.id = r.usuario_id WHERE r.id = ?`,
    [id]
  );
  if (!r) throw new ErroApi(404, 'Responsável não encontrado.');
  const [alunos] = await pool.query(
    `SELECT al.id, al.nome, al.matricula, t.nome AS turma, ar.parentesco, ar.autorizado
       FROM aluno_responsavel ar
       JOIN aluno al ON al.id = ar.aluno_id
       LEFT JOIN matricula_turma m ON m.aluno_id = al.id AND m.ano_letivo = ?
       LEFT JOIN turma t ON t.id = m.turma_id
      WHERE ar.responsavel_id = ? ORDER BY al.nome`,
    [await anoLetivoAtual(), id]
  );
  res.json({ ...comAcesso(r), ciencias: Number(r.ciencias), alunos: alunos.map((a) => ({ ...a, autorizado: !!a.autorizado })) });
};

/* PUT /api/{entidade}/:id */
const editar = (entidade) => async (req, res) => {
  const id = idDaUrl(req);
  const dados = lerFormulario(entidade, req.body || {});
  await exigirUnicos(entidade, dados, id);
  if (entidade === 'alunos') await sistema.editarAluno(id, dados);
  else if (entidade === 'professores') await sistema.editarProfessor(id, dados);
  else await sistema.editarResponsavel(id, dados);
  res.json({ mensagem: 'Alterações salvas.' });
};

/* Busca o usuário (login) de um professor ou responsável */
async function usuarioDe(entidade, id) {
  const tabela = entidade === 'professores' ? 'professor' : 'responsavel';
  const [[u]] = await pool.query(
    `SELECT u.id, u.nome, u.email, u.ativo, u.senha_hash FROM ${tabela} x JOIN usuario u ON u.id = x.usuario_id WHERE x.id = ?`,
    [id]
  );
  if (!u) throw new ErroApi(404, entidade === 'professores' ? 'Professor não encontrado.' : 'Responsável não encontrado.');
  return u;
}

/* PATCH /api/{entidade}/:id/situacao { ativo }: desativar bloqueia o login na hora */
const alterarSituacao = (entidade) => async (req, res) => {
  const id = idDaUrl(req);
  if (typeof (req.body || {}).ativo !== 'boolean') throw new ErroApi(400, 'Informe se o cadastro fica ativo (true) ou não (false).');
  const ativo = req.body.ativo;

  if (entidade === 'alunos') {
    await sistema.alterarSituacaoAluno(id, ativo);
    return res.json({ mensagem: ativo ? 'Aluno reativado.' : 'Aluno desativado. Ele não aparece mais nas listas dos professores.' });
  }
  const usuario = await usuarioDe(entidade, id);
  await sistema.alterarSituacaoUsuario(usuario.id, ativo);
  res.json({ mensagem: ativo ? 'Acesso reativado.' : `Acesso desativado. ${usuario.nome} não consegue mais entrar na 4U.` });
};

/* DELETE /api/{entidade}/:id: só para cadastros sem histórico */
const excluir = (entidade) => async (req, res) => {
  const id = idDaUrl(req);
  if (entidade === 'alunos') await sistema.excluirAluno(id);
  else if (entidade === 'professores') await sistema.excluirProfessor(id);
  else await sistema.excluirResponsavel(id);
  res.json({ mensagem: 'Cadastro excluído.' });
};

/* POST /api/{professores|responsaveis}/:id/convite: libera o acesso e envia o link de primeiro acesso por e-mail */
const liberarAcesso = (entidade) => async (req, res) => {
  const usuario = await usuarioDe(entidade, idDaUrl(req));
  if (!usuario.ativo) throw new ErroApi(409, 'Este acesso está desativado. Reative o cadastro antes de liberar o acesso.');
  if (usuario.senha_hash) {
    throw new ErroApi(409, `${usuario.nome} já criou a senha e entra normalmente. Se esqueceu, pode usar "Esqueci minha senha".`);
  }
  const { token, expiraEm } = await criarLink(usuario.id, 'PRIMEIRO_ACESSO');
  const resposta = { expira_em: dataHoraIso(expiraEm), email_enviado: false };

  if (emailConfigurado()) {
    try {
      await enviarLinkDeAcesso({ tipo: 'PRIMEIRO_ACESSO', nome: usuario.nome, email: usuario.email, token });
    } catch (erro) {
      console.error('[4U] Falha ao enviar o convite:', erro.message);
      throw new ErroApi(502, 'O acesso foi liberado, mas o e-mail não pôde ser enviado. Confira o e-mail cadastrado e tente "Reenviar convite".');
    }
    resposta.email_enviado = true;
    resposta.mensagem = `Convite enviado para ${usuario.email}. O link vale por 3 dias.`;
  } else {
    /* Sem e-mail configurado (ex.: no computador de um colega): o link aparece para a administradora */
    resposta.token_demonstracao = token;
    resposta.mensagem = 'Acesso liberado. O envio de e-mail não está configurado, então copie o link abaixo e envie para a pessoa.';
  }
  res.json(resposta);
};

/* POST /api/responsaveis/:id/alunos { aluno_id, parentesco, autorizado } */
async function vincularAluno(req, res) {
  const b = req.body || {};
  const alunoId = lerId(b.aluno_id);
  const erros = {};
  if (!alunoId) erros.aluno_id = 'Escolha o aluno.';
  if (!PARENTESCOS.includes(b.parentesco)) erros.parentesco = 'Escolha o parentesco.';
  if (Object.keys(erros).length) throw new ErroApi(400, 'Confira os campos destacados.', erros);
  await sistema.vincularAluno(idDaUrl(req), { alunoId, parentesco: b.parentesco, autorizado: b.autorizado !== false });
  res.json({ mensagem: 'Vínculo salvo.' });
}

/* DELETE /api/responsaveis/:id/alunos/:alunoId */
async function desvincularAluno(req, res) {
  const alunoId = lerId(req.params.alunoId);
  if (!alunoId) throw new ErroApi(400, 'Aluno inválido.');
  await sistema.desvincularAluno(idDaUrl(req), alunoId);
  res.json({ mensagem: 'Vínculo removido.' });
}

/* POST /api/professores/:id/vinculos { turma_id, disciplina_id } */
async function atribuirTurma(req, res) {
  const turmaId = lerId((req.body || {}).turma_id);
  const disciplinaId = lerId((req.body || {}).disciplina_id);
  const erros = {};
  if (!turmaId) erros.turma_id = 'Escolha a turma.';
  if (!disciplinaId) erros.disciplina_id = 'Escolha a disciplina.';
  if (Object.keys(erros).length) throw new ErroApi(400, 'Confira os campos destacados.', erros);
  const r = await sistema.atribuirTurma(idDaUrl(req), { turmaId, disciplinaId });
  let mensagem = r.substituiu ? `Turma atribuída. Antes ela era de ${r.substituiu}.` : 'Turma atribuída.';
  if (r.transferidos) mensagem += ` ${r.transferidos} ${r.transferidos === 1 ? 'registro em andamento passou' : 'registros em andamento passaram'} para este professor.`;
  res.status(201).json({ mensagem });
}

/* DELETE /api/professores/:id/vinculos/:vinculoId */
async function removerTurma(req, res) {
  const vinculoId = lerId(req.params.vinculoId);
  if (!vinculoId) throw new ErroApi(400, 'Vínculo inválido.');
  await sistema.removerTurma(idDaUrl(req), vinculoId);
  res.json({ mensagem: 'Turma removida deste professor.' });
}

module.exports = {
  listar, cadastrar, detalhe, editar, alterarSituacao, excluir, liberarAcesso,
  vincularAluno, desvincularAluno, atribuirTurma, removerTurma
};
