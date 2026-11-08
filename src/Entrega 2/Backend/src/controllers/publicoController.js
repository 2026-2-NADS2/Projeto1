const pool = require('../database/connection');
const ErroApi = require('../utils/ErroApi');
const { configuracao } = require('../repositorios/escolaRepositorio');
const { regras, validar, texto } = require('../utils/validacao');

/* GET /api/escola/contato (público) */
async function contatoEscola(req, res) {
  const c = await configuracao();
  if (!c) throw new ErroApi(404, 'Os dados de contato da escola ainda não foram cadastrados.');
  res.json({ nome: c.nome, email: c.email_contato, telefone: c.telefone, endereco: c.endereco });
}

const REGRAS_CONTATO = {
  nome: [regras.obrigatorio('Informe seu nome.'), regras.minimo(3, 'Informe seu nome completo.'), regras.maximo(120, 'Use no máximo 120 caracteres.')],
  email: [regras.obrigatorio('Informe seu e-mail para receber a resposta.'), regras.email(), regras.maximo(180, 'E-mail muito longo.')],
  telefone: [regras.telefone()],
  assunto: [regras.obrigatorio('Escolha o assunto.'), regras.maximo(150, 'Use no máximo 150 caracteres.')],
  mensagem: [regras.obrigatorio('Escreva sua mensagem.'), regras.minimo(10, 'Escreva sua mensagem com pelo menos 10 caracteres.'),
    regras.maximo(1000, 'Use no máximo 1000 caracteres.')]
};

/* POST /api/contato (público): grava em mensagem_contato */
async function enviarContato(req, res) {
  const erros = validar(req.body, REGRAS_CONTATO);
  if (Object.keys(erros).length) throw new ErroApi(400, 'Confira os campos destacados.', erros);

  const b = req.body;
  const [resultado] = await pool.query(
    `INSERT INTO mensagem_contato (nome, email, telefone, assunto, mensagem)
     VALUES (?, ?, ?, ?, ?)`,
    [texto(b.nome), texto(b.email).toLowerCase(), texto(b.telefone || '') || null, texto(b.assunto), texto(b.mensagem)]
  );
  res.status(201).json({ id: resultado.insertId, mensagem: 'Mensagem enviada com sucesso.' });
}

module.exports = { contatoEscola, enviarContato };
