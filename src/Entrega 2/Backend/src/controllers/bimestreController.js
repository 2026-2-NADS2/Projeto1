const pool = require('../database/connection');
const ErroApi = require('../utils/ErroApi');
const { anoLetivoAtual } = require('../repositorios/escolaRepositorio');
const { dataHoraIso } = require('../utils/formato');
const { lerId, lerDataHora } = require('../utils/validacao');

/* GET /api/bimestres: bimestres do ano letivo, situação da digitação e andamento dos registros */
async function listar(req, res) {
  const ano = await anoLetivoAtual();
  const [bimestres] = await pool.query(
    `SELECT id, numero, ano_letivo, abertura, encerramento,
            CASE WHEN NOW() < abertura THEN 'AGENDADO' WHEN NOW() > encerramento THEN 'ENCERRADO' ELSE 'ABERTO' END AS situacao
       FROM bimestre WHERE ano_letivo = ? ORDER BY numero`,
    [ano]
  );
  const [contagens] = await pool.query(
    `SELECT a.bimestre_id, a.status, COUNT(*) AS total
       FROM acompanhamento a JOIN bimestre b ON b.id = a.bimestre_id
      WHERE b.ano_letivo = ? GROUP BY a.bimestre_id, a.status`,
    [ano]
  );
  res.json({
    ano_letivo: ano,
    bimestres: bimestres.map((b) => {
      const por = {};
      contagens.filter((c) => c.bimestre_id === b.id).forEach((c) => { por[c.status] = Number(c.total); });
      return {
        id: b.id,
        numero: b.numero,
        ano_letivo: b.ano_letivo,
        abertura: dataHoraIso(b.abertura),
        encerramento: dataHoraIso(b.encerramento),
        situacao: b.situacao,
        registros: por
      };
    })
  });
}

/* PUT /api/bimestres/:id { abertura, encerramento }: período de digitação dos professores */
async function alterarPeriodo(req, res) {
  const id = lerId(req.params.id);
  if (!id) throw new ErroApi(400, 'Identificador inválido.');
  const b = req.body || {};
  const abertura = lerDataHora(b.abertura);
  const encerramento = lerDataHora(b.encerramento);
  const erros = {};
  if (!abertura) erros.abertura = 'Informe a data e a hora de abertura.';
  if (!encerramento) erros.encerramento = 'Informe a data e a hora de encerramento.';
  if (abertura && encerramento && encerramento <= abertura) erros.encerramento = 'O encerramento precisa ser depois da abertura.';
  if (Object.keys(erros).length) throw new ErroApi(400, 'Confira os campos destacados.', erros);

  const [[bimestre]] = await pool.query('SELECT id, numero, ano_letivo FROM bimestre WHERE id = ?', [id]);
  if (!bimestre) throw new ErroApi(404, 'Bimestre não encontrado.');

  /* Dois bimestres do mesmo ano não podem ficar abertos ao mesmo tempo */
  const [[conflito]] = await pool.query(
    `SELECT numero FROM bimestre
      WHERE ano_letivo = ? AND id <> ? AND abertura < ? AND encerramento > ?
      ORDER BY numero LIMIT 1`,
    [bimestre.ano_letivo, id, encerramento, abertura]
  );
  if (conflito) {
    throw new ErroApi(409, `Este período encosta no ${conflito.numero}º bimestre. Ajuste as datas para não ficarem sobrepostas.`);
  }

  await pool.query('UPDATE bimestre SET abertura = ?, encerramento = ? WHERE id = ?', [abertura, encerramento, id]);
  res.json({ mensagem: `Período do ${bimestre.numero}º bimestre atualizado.` });
}

module.exports = { listar, alterarPeriodo };
