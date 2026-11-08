require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

/* SSL: o Aiven (banco na nuvem) exige conexão segura. No MySQL local use DB_SSL=false */
function configuracaoSsl() {
  if (process.env.DB_SSL !== 'true') return undefined;

  /* Certificado: conteúdo direto (Vercel) ou caminho do arquivo ca.pem (computador) */
  let ca = process.env.DB_SSL_CA;
  if (!ca && process.env.DB_SSL_CA_ARQUIVO) ca = fs.readFileSync(process.env.DB_SSL_CA_ARQUIVO, 'utf8');
  if (!ca) throw new Error('DB_SSL=true, mas o certificado não foi informado (DB_SSL_CA ou DB_SSL_CA_ARQUIVO).');

  return { ca: ca.replace(/\\n/g, '\n'), rejectUnauthorized: true };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: configuracaoSsl(),
  /* Datas como texto (sem conversão de fuso) e DECIMAL como número */
  dateStrings: true,
  decimalNumbers: true,
  waitForConnections: true,
  /* Poucas conexões: o plano gratuito do Aiven tem limite */
  connectionLimit: Number(process.env.DB_LIMITE_CONEXOES) || 5
});

/* Fuso horário de Brasília em toda conexão: NOW() e as datas dos bimestres ficam no mesmo horário
   (o Aiven roda em UTC). O Brasil não tem horário de verão desde 2019. */
const FUSO = /^[+-]\d{2}:\d{2}$/.test(process.env.DB_FUSO || '') ? process.env.DB_FUSO : '-03:00';
pool.on('connection', (conexao) => {
  conexao.query(`SET time_zone = '${FUSO}'`);
});

module.exports = pool;
