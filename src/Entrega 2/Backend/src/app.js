require('dotenv').config();
/* Datas no horário de Brasília também no servidor da nuvem (que roda em UTC) */
process.env.TZ = process.env.FUSO_HORARIO || 'America/Sao_Paulo';
const express = require('express');
const cors = require('cors');
const pool = require('./database/connection');
const rota = require('./utils/rota');
const authRoutes = require('./routes/authRoutes');
const publicoRoutes = require('./routes/publicoRoutes');
const adminRoutes = require('./routes/adminRoutes');
const turmaRoutes = require('./routes/turmaRoutes');
const painelRoutes = require('./routes/painelRoutes');
const alunoRoutes = require('./routes/alunoRoutes');
const professorRoutes = require('./routes/professorRoutes');
const responsavelRoutes = require('./routes/responsavelRoutes');
const acompanhamentoRoutes = require('./routes/acompanhamentoRoutes');
const bimestreRoutes = require('./routes/bimestreRoutes');

const app = express();

/* Na nuvem a API fica atrás de um proxy: assim req.ip é o IP real do usuário */
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* Quem pode chamar a API: o front local e o front publicado */
const origens = (process.env.CORS_ORIGENS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origem) => origem.trim());

app.use(cors({ origin: origens }));
app.use(express.json({ limit: '100kb' }));

/* Teste de conexão: confirma que a API está falando com o banco */
app.get('/api/saude', rota(async (req, res) => {
  const [[{ banco }]] = await pool.query('SELECT DATABASE() AS banco');
  const [objetos] = await pool.query(
    `SELECT TABLE_TYPE AS tipo, COUNT(*) AS total
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      GROUP BY TABLE_TYPE`
  );
  const [usuarios] = await pool.query('SELECT perfil, COUNT(*) AS total FROM usuario GROUP BY perfil');

  const contar = (tipo) => Number((objetos.find((o) => o.tipo === tipo) || {}).total || 0);
  res.json({
    status: 'ok',
    banco,
    tabelas: contar('BASE TABLE'),
    views: contar('VIEW'),
    email_configurado: !!(process.env.EMAIL_USUARIO && process.env.EMAIL_SENHA_APP),
    usuarios_por_perfil: Object.fromEntries(usuarios.map((u) => [u.perfil, Number(u.total)]))
  });
}));

/* Rotas da API */
app.use('/api/auth', authRoutes);                     /* login, esqueci a senha e primeiro acesso */
app.use('/api', publicoRoutes);                        /* contato da escola (público) */
app.use('/api', painelRoutes);                         /* áreas do professor e do responsável */
app.use('/api/admin', adminRoutes);                    /* dashboard e relatórios do administrador */
app.use('/api/turmas', turmaRoutes);
app.use('/api/alunos', alunoRoutes);
app.use('/api/professores', professorRoutes);
app.use('/api/responsaveis', responsavelRoutes);
app.use('/api/acompanhamentos', acompanhamentoRoutes);
app.use('/api/bimestres', bimestreRoutes);

/* Rota que não existe */
app.use((req, res) => {
  res.status(404).json({ mensagem: 'Rota não encontrada.' });
});

/* Erros: resposta sempre no formato { mensagem, campos? }, sem expor detalhes do banco */
const ERROS_DE_CONEXAO = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'HANDSHAKE_SSL_ERROR'];

/* Chave UNIQUE violada -> campo do formulário e mensagem amigável */
const DUPLICADOS = {
  uq_usuario_email: ['email', 'Este e-mail já está cadastrado.'],
  uq_aluno_matricula: ['matricula', 'Já existe um aluno com esta matrícula.'],
  uq_professor_registro: ['registro_funcional', 'Este registro funcional já está cadastrado.'],
  uq_aluno_ano: ['turma_id', 'Este aluno já está em uma turma neste ano letivo.']
};

app.use((erro, req, res, next) => {
  let status = erro.status || 500;
  let mensagem = 'Ocorreu um erro inesperado. Tente novamente.';
  let campos = erro.campos;

  if (erro.type === 'entity.parse.failed') {
    status = 400;
    mensagem = 'O corpo da requisição não é um JSON válido.';
  } else if (erro.code === 'ER_DUP_ENTRY') {
    status = 409;
    const chave = Object.keys(DUPLICADOS).find((k) => String(erro.message).includes(k));
    mensagem = chave ? DUPLICADOS[chave][1] : 'Este registro já existe.';
    if (chave) campos = { [DUPLICADOS[chave][0]]: DUPLICADOS[chave][1] };
  } else if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
    status = 409;
    mensagem = 'Este cadastro tem registros ligados a ele e não pode ser excluído. Use "Desativar".';
  } else if (['ER_NO_REFERENCED_ROW_2', 'ER_CHECK_CONSTRAINT_VIOLATED', 'ER_DATA_TOO_LONG'].includes(erro.code)) {
    status = 400;
    mensagem = 'Algum dado informado não é válido. Confira e tente novamente.';
  } else if (ERROS_DE_CONEXAO.includes(erro.code)) {
    status = 503;
    mensagem = 'Não foi possível conectar ao banco de dados.';
  } else if (erro.status && erro.mensagem) {
    mensagem = erro.mensagem;
  }

  if (status >= 500) console.error(erro);
  const resposta = { mensagem, ...(erro.extras || {}) };
  if (campos) resposta.campos = campos;
  /* Só no computador: mostra o código do erro para facilitar o conserto */
  if (process.env.NODE_ENV !== 'production' && erro.code) resposta.codigo = erro.code;
  res.status(status).json(resposta);
});

/* No computador: sobe o servidor. No Vercel: ele usa o app exportado */
if (require.main === module) {
  if (!process.env.JWT_SEGREDO) console.warn('ATENÇÃO: JWT_SEGREDO não está no .env, o login não vai funcionar.');
  const porta = Number(process.env.PORT) || 3000;
  app.listen(porta, () => {
    console.log(`API 4U rodando em http://localhost:${porta}/api`);
    console.log(`Teste do banco: http://localhost:${porta}/api/saude`);
  });
}

module.exports = app;
