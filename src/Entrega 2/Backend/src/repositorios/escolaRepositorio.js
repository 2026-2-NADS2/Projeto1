const pool = require('../database/connection');
const { dataHoraIso, numero } = require('../utils/formato');

/* Ano letivo atual = o mais recente com turmas cadastradas */
async function anoLetivoAtual() {
  const [[linha]] = await pool.query('SELECT MAX(ano_letivo) AS ano FROM turma');
  return linha.ano || new Date().getFullYear();
}

async function bimestresDoAno(ano) {
  const [linhas] = await pool.query(
    `SELECT id, numero, ano_letivo, abertura, encerramento
       FROM bimestre
      WHERE ano_letivo = ?
      ORDER BY numero`,
    [ano]
  );
  /* Nomes de campo que o front usa */
  return linhas.map((b) => ({
    id: b.id,
    numero: b.numero,
    ano_letivo: b.ano_letivo,
    abertura_digitacao: dataHoraIso(b.abertura),
    encerramento_digitacao: dataHoraIso(b.encerramento)
  }));
}

/* Bimestre atual: o que está com digitação aberta; se nenhum, o último que já começou */
async function bimestreAtual(ano) {
  const lista = await bimestresDoAno(ano || await anoLetivoAtual());
  if (!lista.length) return null;
  const agora = Date.now();
  const tempo = (iso) => new Date(iso).getTime();

  const aberto = lista.find((b) => agora >= tempo(b.abertura_digitacao) && agora <= tempo(b.encerramento_digitacao));
  if (aberto) return { ...aberto, digitacao_aberta: true };
  const iniciados = lista.filter((b) => tempo(b.abertura_digitacao) <= agora);
  return { ...(iniciados.length ? iniciados[iniciados.length - 1] : lista[0]), digitacao_aberta: false };
}

async function configuracao() {
  const [[c]] = await pool.query(
    `SELECT nome, email_contato, telefone, endereco, media_minima, media_maxima, media_aprovacao
       FROM configuracao_escola WHERE id = 1`
  );
  if (!c) return null;
  return {
    ...c,
    media_minima: numero(c.media_minima),
    media_maxima: numero(c.media_maxima),
    media_aprovacao: numero(c.media_aprovacao)
  };
}

module.exports = { anoLetivoAtual, bimestresDoAno, bimestreAtual, configuracao };
