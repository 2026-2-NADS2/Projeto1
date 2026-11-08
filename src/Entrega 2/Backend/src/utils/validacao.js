/* Regras de validação usadas pelos controllers. Cada regra devolve a mensagem de erro ou null. */
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_NOME = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

const regras = {
  obrigatorio: (msg) => (v) => (texto(String(v ?? '')) === '' ? msg : null),
  minimo: (qtd, msg) => (v) => (v && texto(String(v)).length < qtd ? msg : null),
  maximo: (qtd, msg) => (v) => (v && texto(String(v)).length > qtd ? msg : null),
  email: (msg = 'Informe um e-mail válido.') => (v) => (v && !REGEX_EMAIL.test(texto(v)) ? msg : null),
  nome: (msg = 'Use apenas letras, espaços, hífen ou apóstrofo.') => (v) => (v && !REGEX_NOME.test(texto(v)) ? msg : null),
  padrao: (regex, msg) => (v) => (v && !regex.test(texto(String(v))) ? msg : null),
  telefone: (msg = 'Informe o telefone com DDD, por exemplo: (11) 91234-5678.') => (v) => {
    const d = String(v || '').replace(/\D/g, '');
    return v && d.length !== 10 && d.length !== 11 ? msg : null;
  },
  /* Senha nova: pelo menos 8 caracteres, com letra e número */
  senha: (msg = 'Use pelo menos 8 caracteres, com letras e números.') => (v) => {
    const s = String(v || '');
    return s && (s.length < 8 || s.length > 72 || !/[A-Za-z]/.test(s) || !/\d/.test(s)) ? msg : null;
  }
};

/* Aplica as regras e devolve { campo: mensagem } só dos campos com erro */
function validar(dados, mapaRegras) {
  const erros = {};
  for (const [campo, lista] of Object.entries(mapaRegras)) {
    for (const regra of lista) {
      const msg = regra(dados ? dados[campo] : undefined);
      if (msg) { erros[campo] = msg; break; }
    }
  }
  return erros;
}

/* 'dd/mm/aaaa' ou 'aaaa-mm-dd' -> 'aaaa-mm-dd' (null se a data não existe) */
function lerData(valor) {
  const s = texto(String(valor || ''));
  let dia, mes, ano, m;
  if ((m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s))) [, dia, mes, ano] = m;
  else if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s))) [, ano, mes, dia] = m;
  else return null;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  if (data.getFullYear() !== Number(ano) || data.getMonth() !== Number(mes) - 1 || data.getDate() !== Number(dia)) return null;
  return `${ano}-${mes}-${dia}`;
}

/* 'aaaa-mm-ddThh:mm' (campo datetime-local do navegador) -> 'aaaa-mm-dd hh:mm:00' */
function lerDataHora(valor) {
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(:\d{2})?$/.exec(texto(String(valor || '')));
  if (!m || !lerData(m[1]) || Number(m[2]) > 23 || Number(m[3]) > 59) return null;
  return `${m[1]} ${m[2]}:${m[3]}:00`;
}

/* Id numérico positivo vindo da URL ou do corpo (null se inválido) */
function lerId(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/* Escapa % e _ para o LIKE do MySQL tratar como texto */
const escaparLike = (termo) => termo.replace(/[\\%_]/g, '\\$&');

module.exports = { regras, validar, lerData, lerDataHora, lerId, escaparLike, texto };
