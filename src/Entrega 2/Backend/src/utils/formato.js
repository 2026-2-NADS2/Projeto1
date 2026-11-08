/* O MySQL devolve 'AAAA-MM-DD HH:MM:SS'; o front espera ISO 'AAAA-MM-DDTHH:MM:SS' */
function dataHoraIso(valor) {
  if (!valor) return null;
  return String(valor).replace(' ', 'T');
}

const numero = (valor) => (valor === null || valor === undefined ? null : Number(valor));

/* Lê pagina e por_pagina da URL, com limites seguros */
function lerPaginacao(query, padraoPorPagina = 8) {
  const pagina = Math.max(1, parseInt(query.pagina, 10) || 1);
  const porPagina = Math.min(50, Math.max(1, parseInt(query.por_pagina, 10) || padraoPorPagina));
  return { pagina, porPagina };
}

/* Resposta paginada: { itens, total, pagina, paginas, por_pagina } */
function montarPagina(itens, total, pagina, porPagina) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  return { itens, total, pagina: Math.min(pagina, paginas), paginas, por_pagina: porPagina };
}

module.exports = { dataHoraIso, numero, lerPaginacao, montarPagina };
