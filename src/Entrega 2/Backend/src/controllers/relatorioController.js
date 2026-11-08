const pool = require('../database/connection');
const ErroApi = require('../utils/ErroApi');
const { bimestreAtual, configuracao } = require('../repositorios/escolaRepositorio');
const { numero } = require('../utils/formato');
const { lerId } = require('../utils/validacao');

/* Bimestre pedido na URL; sem id, o bimestre atual */
async function lerBimestre(valor) {
  const id = lerId(valor);
  if (!id) {
    const atual = await bimestreAtual();
    if (!atual) throw new ErroApi(404, 'Nenhum bimestre cadastrado.');
    return { id: atual.id, numero: atual.numero, ano_letivo: atual.ano_letivo };
  }
  const [[b]] = await pool.query('SELECT id, numero, ano_letivo FROM bimestre WHERE id = ?', [id]);
  if (!b) throw new ErroApi(404, 'Bimestre não encontrado.');
  return b;
}

/* GET /api/admin/relatorios?bimestre_id= : indicadores do bimestre (média por disciplina vem da view vw_indicadores_disciplina) */
async function indicadores(req, res) {
  const bimestre = await lerBimestre(req.query.bimestre_id);
  const escola = await configuracao();
  const aprovacao = escola.media_aprovacao;

  const [porDisciplina] = await pool.query(
    'SELECT disciplina, publicados, media_geral FROM vw_indicadores_disciplina WHERE bimestre = ? ORDER BY disciplina',
    [bimestre.numero]
  );
  const [porTurma] = await pool.query(
    `SELECT t.nome AS turma, COUNT(*) AS publicados, ROUND(AVG(a.media), 2) AS media_geral,
            SUM(CASE WHEN a.media < ? THEN 1 ELSE 0 END) AS abaixo
       FROM acompanhamento a JOIN turma t ON t.id = a.turma_id
      WHERE a.bimestre_id = ? AND a.status = 'PUBLICADO'
      GROUP BY t.nome ORDER BY t.nome`,
    [aprovacao, bimestre.id]
  );
  const [porStatus] = await pool.query(
    'SELECT status, COUNT(*) AS total FROM acompanhamento WHERE bimestre_id = ? GROUP BY status', [bimestre.id]
  );
  const [[resumo]] = await pool.query(
    `SELECT COUNT(*) AS publicados, ROUND(AVG(media), 2) AS media_geral,
            SUM(CASE WHEN media < ? THEN 1 ELSE 0 END) AS abaixo,
            COUNT(DISTINCT aluno_id) AS alunos
       FROM acompanhamento WHERE bimestre_id = ? AND status = 'PUBLICADO'`,
    [aprovacao, bimestre.id]
  );

  res.json({
    bimestre,
    escala: { minima: escola.media_minima, maxima: escola.media_maxima, aprovacao },
    resumo: {
      publicados: Number(resumo.publicados),
      media_geral: numero(resumo.media_geral),
      abaixo_da_media: Number(resumo.abaixo || 0),
      alunos_avaliados: Number(resumo.alunos)
    },
    por_status: Object.fromEntries(porStatus.map((s) => [s.status, Number(s.total)])),
    por_disciplina: porDisciplina.map((d) => ({ disciplina: d.disciplina, publicados: Number(d.publicados), media_geral: numero(d.media_geral) })),
    por_turma: porTurma.map((t) => ({ turma: t.turma, publicados: Number(t.publicados), media_geral: numero(t.media_geral), abaixo: Number(t.abaixo) }))
  });
}

/* Célula do CSV: separador ";" e vírgula decimal, como o Excel em português espera */
function celula(valor) {
  if (valor === null || valor === undefined) return '';
  const texto = typeof valor === 'number' ? String(valor).replace('.', ',') : String(valor);
  /* Proteção contra fórmula injetada (texto começando com =, +, - ou @) */
  const seguro = /^[=+\-@]/.test(texto) && typeof valor !== 'number' ? "'" + texto : texto;
  return /[;"\n\r]/.test(seguro) ? '"' + seguro.replace(/"/g, '""') + '"' : seguro;
}

/* GET /api/admin/relatorios/exportar?bimestre_id= : planilha .csv dos acompanhamentos publicados */
async function exportar(req, res) {
  const bimestre = await lerBimestre(req.query.bimestre_id);
  const escola = await configuracao();
  const [linhas] = await pool.query(
    `SELECT al.nome AS aluno, al.matricula, t.nome AS turma, d.nome AS disciplina, up.nome AS professor,
            a.media, a.publicado_em
       FROM acompanhamento a
       JOIN aluno al ON al.id = a.aluno_id
       JOIN turma t ON t.id = a.turma_id
       JOIN disciplina d ON d.id = a.disciplina_id
       JOIN professor p ON p.id = a.professor_id
       JOIN usuario up ON up.id = p.usuario_id
      WHERE a.bimestre_id = ? AND a.status = 'PUBLICADO'
      ORDER BY t.nome, al.nome, d.nome`,
    [bimestre.id]
  );
  const cabecalho = ['Aluno', 'Matrícula', 'Turma', 'Disciplina', 'Professor', 'Bimestre', 'Média', 'Situação', 'Publicado em'];
  const corpo = linhas.map((l) => [
    l.aluno, l.matricula, l.turma, l.disciplina, l.professor, `${bimestre.numero}º/${bimestre.ano_letivo}`,
    numero(l.media), numero(l.media) < escola.media_aprovacao ? 'Abaixo da média' : 'Na média ou acima',
    l.publicado_em ? String(l.publicado_em).slice(0, 16).replace(/^(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1') : ''
  ].map(celula).join(';'));

  /* ﻿: o Excel reconhece os acentos (UTF-8) */
  const csv = '﻿' + [cabecalho.join(';'), ...corpo].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="4u-acompanhamentos-${bimestre.numero}bim-${bimestre.ano_letivo}.csv"`);
  res.send(csv);
}

module.exports = { indicadores, exportar };
