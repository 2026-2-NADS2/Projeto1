const pool = require('../database/connection');
const ErroApi = require('../utils/ErroApi');
const { anoLetivoAtual, bimestresDoAno, configuracao } = require('../repositorios/escolaRepositorio');
const { dataHoraIso, numero } = require('../utils/formato');
const { lerId, texto } = require('../utils/validacao');

/* LGPD: o responsável só vê alunos com vínculo autorizado */
async function exigirVinculo(alunoId, responsavelId) {
  const [[vinculo]] = await pool.query(
    'SELECT 1 AS ok FROM aluno_responsavel WHERE aluno_id = ? AND responsavel_id = ? AND autorizado = 1',
    [alunoId, responsavelId]
  );
  if (!vinculo) throw new ErroApi(403, 'Este aluno não está vinculado ao seu cadastro.');
}

/* GET /api/responsavel/alunos: alunos vinculados, média geral por bimestre (view vw_desempenho_aluno) e ciências pendentes */
async function meusAlunos(req, res) {
  const responsavelId = req.usuario.perfil_id;
  const ano = await anoLetivoAtual();
  const [alunos] = await pool.query(
    `SELECT al.id, al.nome, al.matricula, al.data_nascimento, t.nome AS turma, ar.parentesco,
            (SELECT COUNT(*) FROM acompanhamento a
              WHERE a.aluno_id = al.id AND a.status = 'PUBLICADO'
                AND NOT EXISTS (SELECT 1 FROM ciencia_responsavel c WHERE c.acompanhamento_id = a.id AND c.responsavel_id = ?)
            ) AS pendentes
       FROM aluno_responsavel ar
       JOIN aluno al ON al.id = ar.aluno_id
       LEFT JOIN matricula_turma m ON m.aluno_id = al.id AND m.ano_letivo = ?
       LEFT JOIN turma t ON t.id = m.turma_id
      WHERE ar.responsavel_id = ? AND ar.autorizado = 1
      ORDER BY al.nome`,
    [responsavelId, ano, responsavelId]
  );
  const ids = alunos.map((a) => a.id);
  const [desempenho] = ids.length
    ? await pool.query('SELECT aluno_id, bimestre, disciplinas, media_geral FROM vw_desempenho_aluno WHERE aluno_id IN (?) ORDER BY bimestre', [ids])
    : [[]];
  const bimestres = await bimestresDoAno(ano);

  res.json({
    bimestres: bimestres.map((b) => ({ id: b.id, numero: b.numero, ano_letivo: b.ano_letivo })),
    alunos: alunos.map((a) => ({
      ...a,
      pendentes: Number(a.pendentes),
      desempenho: desempenho.filter((d) => d.aluno_id === a.id)
        .map((d) => ({ bimestre: d.bimestre, disciplinas: Number(d.disciplinas), media_geral: numero(d.media_geral) }))
    }))
  });
}

/* GET /api/responsavel/alunos/:id/relatorio?bimestre_id= : relatório publicado completo (tela e PDF) */
async function relatorio(req, res) {
  const alunoId = lerId(req.params.id);
  const bimestreId = lerId(req.query.bimestre_id);
  if (!alunoId || !bimestreId) throw new ErroApi(400, 'Informe o aluno e o bimestre.');
  const responsavelId = req.usuario.perfil_id;
  await exigirVinculo(alunoId, responsavelId);

  const [[aluno]] = await pool.query(
    `SELECT al.id, al.nome, al.matricula, t.nome AS turma, b.numero AS bimestre, b.ano_letivo
       FROM aluno al
       JOIN bimestre b ON b.id = ?
       LEFT JOIN matricula_turma m ON m.aluno_id = al.id AND m.ano_letivo = b.ano_letivo
       LEFT JOIN turma t ON t.id = m.turma_id
      WHERE al.id = ?`,
    [bimestreId, alunoId]
  );
  if (!aluno) throw new ErroApi(404, 'Bimestre não encontrado.');

  const [itens] = await pool.query(
    `SELECT a.id, d.nome AS disciplina, up.nome AS professor, a.media, a.descricao, a.publicado_em,
            c.data_hora AS ciencia_em, c.observacao AS ciencia_observacao
       FROM acompanhamento a
       JOIN disciplina d ON d.id = a.disciplina_id
       JOIN professor p ON p.id = a.professor_id
       JOIN usuario up ON up.id = p.usuario_id
       LEFT JOIN ciencia_responsavel c ON c.acompanhamento_id = a.id AND c.responsavel_id = ?
      WHERE a.aluno_id = ? AND a.bimestre_id = ? AND a.status = 'PUBLICADO'
      ORDER BY d.nome`,
    [responsavelId, alunoId, bimestreId]
  );
  const ids = itens.map((i) => i.id);
  const [tags] = ids.length
    ? await pool.query(
      'SELECT x.acompanhamento_id, t.id, t.nome, t.cor FROM acompanhamento_tag x JOIN tag t ON t.id = x.tag_id WHERE x.acompanhamento_id IN (?) ORDER BY t.nome',
      [ids]
    )
    : [[]];
  const escola = await configuracao();
  const medias = itens.map((i) => numero(i.media));

  res.json({
    escola: { nome: escola.nome, telefone: escola.telefone, email: escola.email_contato },
    escala: { minima: escola.media_minima, maxima: escola.media_maxima, aprovacao: escola.media_aprovacao },
    aluno: { id: aluno.id, nome: aluno.nome, matricula: aluno.matricula, turma: aluno.turma },
    bimestre: { id: bimestreId, numero: aluno.bimestre, ano_letivo: aluno.ano_letivo },
    media_geral: medias.length ? Math.round((medias.reduce((s, m) => s + m, 0) / medias.length) * 10) / 10 : null,
    itens: itens.map((i) => ({
      id: i.id,
      disciplina: i.disciplina,
      professor: i.professor,
      media: numero(i.media),
      descricao: i.descricao,
      publicado_em: dataHoraIso(i.publicado_em),
      tags: tags.filter((t) => t.acompanhamento_id === i.id).map(({ id, nome, cor }) => ({ id, nome, cor })),
      ciencia: i.ciencia_em ? { data_hora: dataHoraIso(i.ciencia_em), observacao: i.ciencia_observacao } : null
    }))
  });
}

/* POST /api/responsavel/acompanhamentos/:id/ciencia { observacao? } : "li o relatório" */
async function darCiencia(req, res) {
  const id = lerId(req.params.id);
  if (!id) throw new ErroApi(400, 'Identificador inválido.');
  const observacao = texto((req.body || {}).observacao || '');
  if (observacao.length > 500) throw new ErroApi(400, 'Confira os campos destacados.', { observacao: 'Use no máximo 500 caracteres.' });

  const [[a]] = await pool.query("SELECT aluno_id FROM acompanhamento WHERE id = ? AND status = 'PUBLICADO'", [id]);
  if (!a) throw new ErroApi(404, 'Relatório não encontrado.');
  await exigirVinculo(a.aluno_id, req.usuario.perfil_id);

  const [[ja]] = await pool.query('SELECT 1 AS ok FROM ciencia_responsavel WHERE acompanhamento_id = ? AND responsavel_id = ?', [id, req.usuario.perfil_id]);
  if (ja) throw new ErroApi(409, 'Você já deu ciência neste relatório.');
  await pool.query(
    'INSERT INTO ciencia_responsavel (acompanhamento_id, responsavel_id, observacao) VALUES (?, ?, ?)',
    [id, req.usuario.perfil_id, observacao || null]
  );
  res.status(201).json({ mensagem: observacao ? 'Ciência registrada. Sua observação foi enviada à escola.' : 'Ciência registrada.' });
}

/* POST /api/responsavel/alunos/:id/ciencia { bimestre_id } : ciência em todas as disciplinas do bimestre */
async function darCienciaEmTodos(req, res) {
  const alunoId = lerId(req.params.id);
  const bimestreId = lerId((req.body || {}).bimestre_id);
  if (!alunoId || !bimestreId) throw new ErroApi(400, 'Informe o aluno e o bimestre.');
  const responsavelId = req.usuario.perfil_id;
  await exigirVinculo(alunoId, responsavelId);

  const [r] = await pool.query(
    `INSERT INTO ciencia_responsavel (acompanhamento_id, responsavel_id)
     SELECT a.id, ? FROM acompanhamento a
      WHERE a.aluno_id = ? AND a.bimestre_id = ? AND a.status = 'PUBLICADO'
        AND NOT EXISTS (SELECT 1 FROM ciencia_responsavel c WHERE c.acompanhamento_id = a.id AND c.responsavel_id = ?)`,
    [responsavelId, alunoId, bimestreId, responsavelId]
  );
  const total = r.affectedRows || 0;
  res.status(201).json({ mensagem: total ? `Ciência registrada em ${total} ${total === 1 ? 'disciplina' : 'disciplinas'}.` : 'Não havia relatórios pendentes de ciência.' });
}

module.exports = { meusAlunos, relatorio, darCiencia, darCienciaEmTodos };
