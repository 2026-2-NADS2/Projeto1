const app = require('./app');

const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
  console.log(`Backend Entrega 1 (KFKA/4U) rodando em http://localhost:${PORTA}/api`);
});
