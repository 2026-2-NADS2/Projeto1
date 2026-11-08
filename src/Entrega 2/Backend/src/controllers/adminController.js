const pool = require('../database/connection');
const { anoLetivoAtual, bimestreAtual } = require('../repositorios/escolaRepositorio');
const { dataHoraIso } = require('../utils/formato');

/* GET /api/admin/resumo: indicadores do dashboard */
async function resumo(req, res) {
  const ano = await anoLetivoAtual();
  const bimestre = await bimestreAtual(ano);
  const bimestreId = bimestre ? bimestre.id : 0;

  const [[n]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM aluno WHERE ativo = 1) AS alunos_ativos,
       (SELECT COUNT(*) FROM professor p JOIN usuario u ON u.id = p.usuario_id WHERE u.ativo = 1) AS professores_ativos,
       (SELECT COUNT(*) FROM turma WHERE ano_letivo = ?) AS turmas,
       (SELECT COUNT(*) FROM acompanhamento WHERE bimestre_id = ? AND status IN ('ENVIADO', 'EM_REVISAO')) AS aguardando_revisao,
       (SELECT COUNT(*) FROM acompanhamento WHERE bimestre_id = ? AND status = 'PUBLICADO') AS publicados_bimestre`,
    [ano, bimestreId, bimestreId]
  );

  res.json({
    bimestre,
    alunos_ativos: Number(n.alunos_ativos),
    professores_ativos: Number(n.professores_ativos),
    turmas: Number(n.turmas),
    aguardando_revisao: Number(n.aguardando_revisao),
    publicados_bimestre: Number(n.publicados_bimestre)
  });
}

/* GET /api/admin/acompanhamentos?limite=6: últimas movimentações (sem rascunhos) */
async function acompanhamentosRecentes(req, res) {
  const limite = Math.min(50, Math.max(1, parseInt(req.query.limite, 10) || 6));
  const [linhas] = await pool.query(
    `SELECT a.id, al.nome AS aluno, t.nome AS turma, d.nome AS disciplina,
            b.numero AS bimestre, a.status, a.atualizado_em
       FROM acompanhamento a
       JOIN aluno al ON al.id = a.aluno_id
       JOIN turma t ON t.id = a.turma_id
       JOIN disciplina d ON d.id = a.disciplina_id
       JOIN bimestre b ON b.id = a.bimestre_id
      WHERE a.status <> 'RASCUNHO'
      ORDER BY a.atualizado_em DESC
      LIMIT ?`,
    [limite]
  );
  res.json(linhas.map((l) => ({ ...l, atualizado_em: dataHoraIso(l.atualizado_em) })));
}

/* GET /api/admin/cadastros/contagens: números das abas de Cadastros */
async function contagensCadastros(req, res) {
  const [[n]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM aluno) AS alunos,
            (SELECT COUNT(*) FROM professor) AS professores,
            (SELECT COUNT(*) FROM responsavel) AS responsaveis`
  );
  res.json({ alunos: Number(n.alunos), professores: Number(n.professores), responsaveis: Number(n.responsaveis) });
}

/* GET /api/turmas: turmas do ano letivo atual (lista do formulário de aluno) */
async function listarTurmas(req, res) {
  const ano = await anoLetivoAtual();
  const [linhas] = await pool.query(
    'SELECT id, nome, ano_serie, ano_letivo FROM turma WHERE ano_letivo = ? AND ativo = 1 ORDER BY nome',
    [ano]
  );
  res.json(linhas);
}

/* GET /api/admin/disciplinas: lista para atribuir turmas aos professores */
async function listarDisciplinas(req, res) {
  const [linhas] = await pool.query('SELECT id, nome FROM disciplina WHERE ativo = 1 ORDER BY nome');
  res.json(linhas);
}

module.exports = { resumo, acompanhamentosRecentes, contagensCadastros, listarTurmas, listarDisciplinas };
