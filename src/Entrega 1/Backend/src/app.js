require('dotenv').config();
const express = require('express');
const cors = require('cors');

const alunoRoutes = require('./routes/alunoRoutes');
const professorRoutes = require('./routes/professorRoutes');
const administradorRoutes = require('./routes/administradorRoutes');
const acompanhamentoRoutes = require('./routes/acompanhamentoRoutes');
const { ErroAplicacao } = require('./erroAplicacao');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ sucesso: true, dados: { status: 'ok' } }));

app.use('/api/alunos', alunoRoutes);
app.use('/api/professores', professorRoutes);
app.use('/api/administradores', administradorRoutes);
app.use('/api/acompanhamentos', acompanhamentoRoutes);

app.use((req, res) => {
  res.status(404).json({ sucesso: false, erro: { codigo: 'ROTA_INEXISTENTE', mensagem: 'Rota não encontrada.' } });
});

app.use((err, req, res, next) => {
  if (err instanceof ErroAplicacao) {
    return res.status(err.status).json({ sucesso: false, erro: { codigo: err.codigo, mensagem: err.message } });
  }
  console.error(err);
  res.status(500).json({ sucesso: false, erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno do servidor.' } });
});

module.exports = app;
