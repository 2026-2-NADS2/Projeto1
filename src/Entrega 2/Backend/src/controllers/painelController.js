const pool = require('../database/connection');
const ErroApi = require('../utils/ErroApi');
const { anoLetivoAtual, bimestresDoAno, bimestreAtual, configuracao } = require('../repositorios/escolaRepositorio');
const { numero } = require('../utils/formato');

/* GET /api/professor/painel: só os vínculos e registros do professor logado */
async function painelProfessor(req, res) {
  const professorId = req.usuario.perfil_id;
  const ano = await anoLetivoAtual();
  const bimestre = await bimestreAtual(ano);
  const bimestreId = bimestre ? bimestre.id : 0;

  const [vinculos] = await pool.query(
    `SELECT v.id, v.turma_id, v.disciplina_id, t.nome AS turma, d.nome AS disciplina,
            (SELECT COUNT(*) FROM matricula_turma m JOIN aluno al ON al.id = m.aluno_id
              WHERE m.turma_id = v.turma_id AND m.ano_letivo = ? AND al.ativo = 1) AS total_alunos
       FROM vinculo_docente v
       JOIN turma t ON t.id = v.turma_id
       JOIN disciplina d ON d.id = v.disciplina_id
      WHERE v.professor_id = ?
      ORDER BY t.nome, d.nome`,
    [ano, professorId]
  );
  const [contagens] = await pool.query(
    `SELECT turma_id, disciplina_id, status, COUNT(*) AS total
       FROM acompanhamento
      WHERE professor_id = ? AND bimestre_id = ? AND status <> 'CANCELADO'
      GROUP BY turma_id, disciplina_id, status`,
    [professorId, bimestreId]
  );

  const totais = { rascunhos: 0, devolvidos: 0, em_revisao: 0, publicados: 0 };
  const CHAVE_TOTAL = { RASCUNHO: 'rascunhos', DEVOLVIDO: 'devolvidos', ENVIADO: 'em_revisao', EM_REVISAO: 'em_revisao', PUBLICADO: 'publicados' };
  contagens.forEach((c) => { totais[CHAVE_TOTAL[c.status]] += Number(c.total); });

  res.json({
    bimestre,
    totais,
    vinculos: vinculos.map((v) => {
      const doVinculo = contagens.filter((c) => c.turma_id === v.turma_id && c.disciplina_id === v.disciplina_id);
      const porStatus = {};
      doVinculo.forEach((c) => { porStatus[c.status] = Number(c.total); });
      return {
        id: v.id,
        turma: v.turma,
        disciplina: v.disciplina,
        total_alunos: Number(v.total_alunos),
        registrados: doVinculo.reduce((s, c) => s + Number(c.total), 0),
        por_status: porStatus
      };
    })
  });
}

/* Alunos que o responsável logado PODE ver (vínculo autorizado: regra de LGPD) */
async function alunosDoResponsavel(responsavelId, ano) {
  const [linhas] = await pool.query(
    `SELECT al.id, al.nome, t.nome AS turma
       FROM aluno_responsavel ar
       JOIN aluno al ON al.id = ar.aluno_id
       LEFT JOIN matricula_turma m ON m.aluno_id = al.id AND m.ano_letivo = ?
       LEFT JOIN turma t ON t.id = m.turma_id
      WHERE ar.responsavel_id = ? AND ar.autorizado = 1
      ORDER BY al.nome`,
    [ano, responsavelId]
  );
  return linhas;
}

/* GET /api/responsavel/painel */
async function painelResponsavel(req, res) {
  const ano = await anoLetivoAtual();
  const [alunos, bimestres, atual, escola] = await Promise.all([
    alunosDoResponsavel(req.usuario.perfil_id, ano), bimestresDoAno(ano), bimestreAtual(ano), configuracao()
  ]);
  /* Bimestre que abre na tela: o último com relatório publicado (se não houver, o atual) */
  const ids = alunos.map((a) => a.id);
  const [[ultimo]] = ids.length
    ? await pool.query(
      `SELECT a.bimestre_id FROM acompanhamento a JOIN bimestre b ON b.id = a.bimestre_id
        WHERE a.aluno_id IN (?) AND a.status = 'PUBLICADO' AND b.ano_letivo = ?
        ORDER BY b.numero DESC LIMIT 1`,
      [ids, ano]
    )
    : [[null]];

  res.json({
    alunos,
    bimestres: bimestres.map((b) => ({ id: b.id, numero: b.numero, ano_letivo: b.ano_letivo })),
    bimestre_inicial_id: ultimo ? ultimo.bimestre_id : (atual ? atual.id : null),
    anos_letivos: [ano],
    bimestre_atual: atual,
    escala: {
      minima: escola ? escola.media_minima : 0,
      maxima: escola ? escola.media_maxima : 10,
      aprovacao: escola ? escola.media_aprovacao : 6
    }
  });
}

/* GET /api/responsavel/alunos/:id/relatorios?bimestre_id= : só registros PUBLICADOS */
async function mediasPublicadas(req, res) {
  const alunoId = parseInt(req.params.id, 10);
  const bimestreId = parseInt(req.query.bimestre_id, 10);
  if (!alunoId || !bimestreId) throw new ErroApi(400, 'Informe o aluno e o bimestre.');

  const [[vinculo]] = await pool.query(
    'SELECT 1 AS ok FROM aluno_responsavel WHERE aluno_id = ? AND responsavel_id = ? AND autorizado = 1',
    [alunoId, req.usuario.perfil_id]
  );
  if (!vinculo) throw new ErroApi(403, 'Este aluno não está vinculado ao seu cadastro.');

  const [linhas] = await pool.query(
    `SELECT d.nome AS disciplina, a.media
       FROM acompanhamento a
       JOIN disciplina d ON d.id = a.disciplina_id
      WHERE a.aluno_id = ? AND a.bimestre_id = ? AND a.status = 'PUBLICADO'
      ORDER BY d.nome`,
    [alunoId, bimestreId]
  );
  const disciplinas = linhas.map((l) => ({ disciplina: l.disciplina, media: numero(l.media) }));
  const soma = disciplinas.reduce((s, d) => s + d.media, 0);
  res.json({
    disciplinas,
    media_geral: disciplinas.length ? Math.round((soma / disciplinas.length) * 10) / 10 : null
  });
}

module.exports = { painelProfessor, painelResponsavel, mediasPublicadas };
