import config from '../config.js';

function ler() {
  try {
    const bruto = window.sessionStorage.getItem(config.CHAVE_SESSAO);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

function gravar(sessao) {
  try {
    if (sessao) window.sessionStorage.setItem(config.CHAVE_SESSAO, JSON.stringify(sessao));
    else window.sessionStorage.removeItem(config.CHAVE_SESSAO);
  } catch {
    /* Sem armazenamento disponível */
  }
}

const novaExpiracao = () => Date.now() + config.SESSAO_MINUTOS * 60 * 1000;

export function obterSessao() {
  const sessao = ler();
  if (!sessao) return { sessao: null, expirou: false };
  if (Date.now() > sessao.expira_em) {
    gravar(null);
    return { sessao: null, expirou: true };
  }
  return { sessao, expirou: false };
}

export function iniciarSessao(usuario) {
  const sessao = { usuario, expira_em: novaExpiracao() };
  gravar(sessao);
  return sessao;
}

export function renovarSessao() {
  const { sessao } = obterSessao();
  if (sessao) gravar({ ...sessao, expira_em: novaExpiracao() });
}

export function encerrarSessao() {
  gravar(null);
}
