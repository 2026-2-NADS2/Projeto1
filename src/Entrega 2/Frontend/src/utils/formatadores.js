function paraData(valor) {
  if (!valor) return null;
  /* Data sem fuso horário */
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [a, m, d] = valor.split('-').map(Number);
    return new Date(a, m - 1, d);
  }
  return new Date(valor);
}

export function formatarData(valor) {
  const data = paraData(valor);
  if (!data || isNaN(data)) return '—';
  return data.toLocaleDateString('pt-BR');
}

export function formatarDataHora(valor) {
  const data = paraData(valor);
  if (!data || isNaN(data)) return '—';
  return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatarMedia(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return '—';
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function iniciais(nome) {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (partes[0][0] + ultima).toUpperCase();
}

/* Texto sem acentos, para buscas */
export function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function primeiroNome(nome) {
  return String(nome || '').split(' ')[0];
}

export function plural(qtd, singular, pluralTexto) {
  return qtd + ' ' + (qtd === 1 ? singular : pluralTexto);
}

/* Status do acompanhamento */
export const STATUS = {
  RASCUNHO:   { rotulo: 'Rascunho',               classe: 'rascunho',   icone: 'lapis' },
  ENVIADO:    { rotulo: 'Enviado para revisão',   classe: 'enviado',    icone: 'enviar' },
  EM_REVISAO: { rotulo: 'Em revisão',             classe: 'em-revisao', icone: 'olho' },
  PUBLICADO:  { rotulo: 'Publicado',              classe: 'publicado',  icone: 'check' },
  DEVOLVIDO:  { rotulo: 'Devolvido para ajustes', classe: 'devolvido',  icone: 'devolver' },
  CANCELADO:  { rotulo: 'Cancelado',              classe: 'cancelado',  icone: 'cancelar' }
};

export const PERFIS = {
  ADMINISTRADOR: 'Administrador',
  PROFESSOR: 'Professor',
  RESPONSAVEL: 'Responsável'
};
