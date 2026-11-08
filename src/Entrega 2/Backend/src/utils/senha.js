const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

/* scrypt: hash de senha lento de propósito (dificulta ataque de força bruta).
   Formato guardado em usuario.senha_hash: scrypt$<salt>$<hash>  (68 caracteres) */
const PARAMETROS = { N: 16384, r: 8, p: 1 };
const TAMANHO_HASH = 32;

async function gerarHash(senha) {
  const salt = crypto.randomBytes(12);
  const hash = await scrypt(String(senha), salt, TAMANHO_HASH, PARAMETROS);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

async function conferirSenha(senha, guardado) {
  if (typeof guardado !== 'string') return false;
  const [algoritmo, salt64, hash64] = guardado.split('$');
  if (algoritmo !== 'scrypt' || !salt64 || !hash64) return false;

  const esperado = Buffer.from(hash64, 'base64');
  if (esperado.length !== TAMANHO_HASH) return false;

  const calculado = await scrypt(String(senha), Buffer.from(salt64, 'base64'), TAMANHO_HASH, PARAMETROS);
  /* Comparação em tempo constante: não revela quantos caracteres acertou */
  return crypto.timingSafeEqual(calculado, esperado);
}

module.exports = { gerarHash, conferirSenha };
