const ErroApi = require('../utils/ErroApi');

/* Limita tentativas por IP numa janela de tempo (ex.: login, formulário de contato).
   Fica em memória: simples e suficiente para o projeto. */
function limitarTentativas({ maximo, janelaMinutos, mensagem }) {
  const registros = new Map();
  const janela = janelaMinutos * 60 * 1000;

  return (req, res, next) => {
    const agora = Date.now();
    const chave = req.ip;
    const recentes = (registros.get(chave) || []).filter((t) => agora - t < janela);
    if (recentes.length >= maximo) return next(new ErroApi(429, mensagem));
    recentes.push(agora);
    registros.set(chave, recentes);
    next();
  };
}

module.exports = limitarTentativas;
