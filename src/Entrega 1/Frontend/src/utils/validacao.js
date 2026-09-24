export const obrigatorio = (mensagem = 'Preencha este campo.') =>
  (v) => (String(v || '').trim() === '' ? mensagem : null);

export const minimo = (qtd, mensagem) =>
  (v) => (v && String(v).trim().length < qtd ? mensagem || `Use pelo menos ${qtd} caracteres.` : null);

export const padrao = (regex, mensagem) =>
  (v) => (v && !regex.test(String(v).trim()) ? mensagem : null);

export const email = (mensagem = 'Informe um e-mail válido, por exemplo: nome@escola.com.') =>
  padrao(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, mensagem);

export const telefone = (mensagem = 'Informe o telefone com DDD, por exemplo: (11) 91234-5678.') =>
  (v) => {
    const d = String(v || '').replace(/\D/g, '');
    return v && d.length !== 10 && d.length !== 11 ? mensagem : null;
  };

/* Converte dd/mm/aaaa em data */
export function lerDataBr(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(texto || '').trim());
  if (!m) return null;
  const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;
  return data;
}

/* Data no formato dd/mm/aaaa */
export const dataNascimento = () => (v) => {
  if (!v) return null;
  return lerDataBr(v) ? null : 'Data inválida. Use o formato dd/mm/aaaa, por exemplo: 15/03/2016.';
};

/* Retorna os erros de cada campo */
export function validar(valores, regras) {
  const erros = {};
  Object.keys(regras).forEach((campo) => {
    for (const regra of regras[campo]) {
      const msg = regra(valores[campo]);
      if (msg) { erros[campo] = msg; break; }
    }
  });
  return erros;
}

/* Máscaras de digitação */
export function mascaraData(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 8);
  if (d.length > 4) return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
  if (d.length > 2) return d.slice(0, 2) + '/' + d.slice(2);
  return d;
}

export function mascaraTelefone(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  const corte = d.length === 11 ? 7 : 6;
  if (d.length <= corte) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
  return '(' + d.slice(0, 2) + ') ' + d.slice(2, corte) + '-' + d.slice(corte);
}
