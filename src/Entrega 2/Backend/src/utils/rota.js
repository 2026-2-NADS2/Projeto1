/* Envolve uma função async: qualquer erro vai para o tratador central do app.js */
const rota = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = rota;
