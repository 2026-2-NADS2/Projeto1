const pool = require('../database/connection');
const { bimestreAtual } = require('../repositorios/escolaRepositorio');
const { dataHoraIso } = require('../utils/formato');

const DIA = 24 * 3600 * 1000;

/* Aviso de fim da digitação: só quando faltam 7 dias ou menos */
function avisoEncerramento(bimestre, link) {
  if (!bimestre || !bimestre.digitacao_aberta) return null;
  const faltam = Math.ceil((new Date(bimestre.encerramento_digitacao).getTime() - Date.now()) / DIA);
  if (faltam > 7) return null;
  return {
    id: 'encerramento-' + bimestre.id,
    tipo: 'alerta',
    titulo: `Digitação do ${bimestre.numero}º bimestre termina ${faltam <= 1 ? 'em menos de 1 dia' : `em ${faltam} dias`}`,
    mensagem: 'Depois do encerramento, os professores só consultam os registros.',
    link,
    data: bimestre.encerramento_digitacao
  };
}

/* Administrador: o que espera revisão e os acessos sem senha criada */
async function doAdministrador() {
  const atual = await bimestreAtual();
  const itens = [];

  const [[fila]] = await pool.query(
    `SELECT COUNT(*) AS total, MAX(atualizado_em) AS ultimo
       FROM acompanhamento WHERE status IN ('ENVIADO', 'EM_REVISAO') AND bimestre_id = ?`,
    [atual ? atual.id : 0]
  );
  if (Number(fila.total)) {
    itens.push({
      id: 'revisao',
      tipo: 'info',
      titulo: `${fila.total} ${Number(fila.total) === 1 ? 'registro aguarda' : 'registros aguardam'} revisão`,
      mensagem: 'Os professores enviaram e as famílias só veem depois da publicação.',
      link: '/admin/acompanhamentos',
      data: dataHoraIso(fila.ultimo)
    });
  }

  const [[pendentes]] = await pool.query(
    `SELECT COUNT(*) AS total FROM usuario
      WHERE perfil IN ('PROFESSOR', 'RESPONSAVEL') AND ativo = 1 AND senha_hash IS NULL`
  );
  if (Number(pendentes.total)) {
    itens.push({
      id: 'acessos',
      tipo: 'info',
      titulo: `${pendentes.total} ${Number(pendentes.total) === 1 ? 'pessoa ainda não criou' : 'pessoas ainda não criaram'} a senha`,
      mensagem: 'Em Cadastros, use "Liberar acesso" para enviar ou reenviar o convite.',
      link: '/admin/cadastros',
      data: null
    });
  }

  const fim = avisoEncerramento(atual, '/admin/bimestres');
  if (fim) itens.push(fim);
  return itens;
}

/* Professor: devolvidos, rascunhos, observações recentes das famílias e fim da digitação */
async function doProfessor(professorId) {
  const atual = await bimestreAtual();
  const itens = [];

  const [devolvidos] = await pool.query(
    `SELECT a.id, al.nome AS aluno, d.nome AS disciplina, a.atualizado_em
       FROM acompanhamento a
       JOIN aluno al ON al.id = a.aluno_id
       JOIN disciplina d ON d.id = a.disciplina_id
      WHERE a.professor_id = ? AND a.status = 'DEVOLVIDO'
      ORDER BY a.atualizado_em DESC`,
    [professorId]
  );
  devolvidos.slice(0, 5).forEach((d) => itens.push({
    id: 'devolvido-' + d.id,
    tipo: 'alerta',
    titulo: `Registro devolvido: ${d.aluno}`,
    mensagem: `${d.disciplina}. Veja o motivo e corrija.`,
    link: '/professor/retornos',
    data: dataHoraIso(d.atualizado_em)
  }));
  if (devolvidos.length > 5) {
    itens.push({
      id: 'devolvidos-mais',
      tipo: 'alerta',
      titulo: `Mais ${devolvidos.length - 5} registros devolvidos`,
      mensagem: 'A lista completa está em Retornos.',
      link: '/professor/retornos',
      data: null
    });
  }

  const [[rascunhos]] = await pool.query(
    `SELECT COUNT(*) AS total FROM acompanhamento WHERE professor_id = ? AND status = 'RASCUNHO' AND bimestre_id = ?`,
    [professorId, atual ? atual.id : 0]
  );
  if (Number(rascunhos.total)) {
    itens.push({
      id: 'rascunhos',
      tipo: 'info',
      titulo: `${rascunhos.total} ${Number(rascunhos.total) === 1 ? 'rascunho ainda não foi enviado' : 'rascunhos ainda não foram enviados'}`,
      mensagem: 'Envie para revisão para o registro chegar à família.',
      link: '/professor/acompanhamentos',
      data: null
    });
  }

  const [observacoes] = await pool.query(
    `SELECT c.id, c.data_hora, al.nome AS aluno, d.nome AS disciplina
       FROM ciencia_responsavel c
       JOIN acompanhamento a ON a.id = c.acompanhamento_id
       JOIN aluno al ON al.id = a.aluno_id
       JOIN disciplina d ON d.id = a.disciplina_id
      WHERE a.professor_id = ? AND c.observacao IS NOT NULL AND c.observacao <> ''
        AND c.data_hora >= NOW() - INTERVAL 7 DAY
      ORDER BY c.data_hora DESC
      LIMIT 5`,
    [professorId]
  );
  observacoes.forEach((o) => itens.push({
    id: 'observacao-' + o.id,
    tipo: 'sucesso',
    titulo: `A família de ${o.aluno} deixou uma observação`,
    mensagem: o.disciplina,
    link: '/professor/retornos',
    data: dataHoraIso(o.data_hora)
  }));

  const fim = avisoEncerramento(atual, '/professor/acompanhamentos');
  if (fim) itens.push(fim);
  return itens;
}

/* Responsável: relatórios publicados que ainda esperam a ciência dele */
async function doResponsavel(responsavelId) {
  const [linhas] = await pool.query(
    `SELECT al.id AS aluno_id, al.nome AS aluno, b.id AS bimestre_id, b.numero AS bimestre,
            COUNT(*) AS total, MAX(a.publicado_em) AS ultimo
       FROM aluno_responsavel ar
       JOIN aluno al ON al.id = ar.aluno_id
       JOIN acompanhamento a ON a.aluno_id = al.id AND a.status = 'PUBLICADO'
       JOIN bimestre b ON b.id = a.bimestre_id
       LEFT JOIN ciencia_responsavel c ON c.acompanhamento_id = a.id AND c.responsavel_id = ar.responsavel_id
      WHERE ar.responsavel_id = ? AND ar.autorizado = 1 AND c.id IS NULL
      GROUP BY al.id, al.nome, b.id, b.numero
      ORDER BY ultimo DESC
      LIMIT 10`,
    [responsavelId]
  );
  return linhas.map((l) => ({
    id: `ciencia-${l.aluno_id}-${l.bimestre_id}`,
    tipo: 'info',
    titulo: `Relatório do ${l.bimestre}º bimestre de ${l.aluno.split(' ')[0]}`,
    mensagem: `${l.total} ${Number(l.total) === 1 ? 'disciplina aguarda' : 'disciplinas aguardam'} a sua ciência.`,
    link: `/responsavel/relatorios?aluno=${l.aluno_id}&bimestre=${l.bimestre_id}`,
    data: dataHoraIso(l.ultimo)
  }));
}

/* GET /api/notificacoes: pendências do usuário logado (calculadas na hora, nada fica gravado) */
async function listar(req, res) {
  const { perfil, perfil_id: perfilId } = req.usuario;
  let itens = [];
  if (perfil === 'ADMINISTRADOR') itens = await doAdministrador();
  else if (perfil === 'PROFESSOR') itens = await doProfessor(perfilId);
  else if (perfil === 'RESPONSAVEL') itens = await doResponsavel(perfilId);
  res.json({ total: itens.length, itens });
}

module.exports = { listar };
