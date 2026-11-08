const jwt = require('jsonwebtoken');
const pool = require('../database/connection');
const ErroApi = require('../utils/ErroApi');
const { conferirSenha, gerarHash } = require('../utils/senha');
const { regras, validar, texto } = require('../utils/validacao');
const { emailConfigurado, enviarLinkDeAcesso } = require('../utils/email');
const { criarLink, buscarLinkValido, gravarSenha } = require('../repositorios/acessoRepositorio');
const { segredoJwt } = require('../middlewares/autenticar');

/* Hash qualquer, só para o tempo de resposta ser igual quando o e-mail não existe */
const HASH_FALSO = 'scrypt$AAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

const REGRAS_LOGIN = {
  email: [regras.obrigatorio('Informe seu e-mail para entrar.'), regras.email()],
  senha: [regras.obrigatorio('Informe sua senha.')]
};

/* POST /api/auth/login */
async function login(req, res) {
  const erros = validar(req.body, REGRAS_LOGIN);
  if (Object.keys(erros).length) throw new ErroApi(400, 'Confira os campos destacados.', erros);

  const email = texto(req.body.email).toLowerCase();
  const senha = String(req.body.senha);

  const [[usuario]] = await pool.query(
    `SELECT u.id, u.nome, u.email, u.senha_hash, u.perfil, u.ativo,
            p.id AS professor_id, r.id AS responsavel_id
       FROM usuario u
       LEFT JOIN professor p ON p.usuario_id = u.id
       LEFT JOIN responsavel r ON r.usuario_id = u.id
      WHERE u.email = ?`,
    [email]
  );

  if (usuario && !usuario.senha_hash) {
    throw new ErroApi(403, 'Você ainda não criou sua senha. Use o link de primeiro acesso enviado pela escola.');
  }
  const senhaOk = await conferirSenha(senha, usuario ? usuario.senha_hash : HASH_FALSO);
  if (!usuario || !senhaOk) {
    throw new ErroApi(401, 'E-mail ou senha incorretos. Confira os dados e tente novamente.');
  }
  if (!usuario.ativo) throw new ErroApi(403, 'Seu acesso está desativado. Procure a secretaria da escola.');

  const perfilId = usuario.perfil === 'PROFESSOR' ? usuario.professor_id
    : usuario.perfil === 'RESPONSAVEL' ? usuario.responsavel_id : null;

  await pool.query('UPDATE usuario SET ultimo_acesso = NOW() WHERE id = ?', [usuario.id]);

  const token = jwt.sign(
    { sub: String(usuario.id), perfil: usuario.perfil, perfil_id: perfilId, nome: usuario.nome },
    segredoJwt(),
    { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRA || '2h' }
  );

  res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, perfil_id: perfilId, token });
}

/* POST /api/auth/esqueci-senha (público)
   Só quem já tem login liberado (conta ativa e senha criada) recebe o e-mail com o link.
   A resposta é sempre a mesma, para não revelar quais e-mails estão cadastrados. */
async function esqueciSenha(req, res) {
  const erros = validar(req.body, { email: [regras.obrigatorio('Informe o e-mail cadastrado.'), regras.email()] });
  if (Object.keys(erros).length) throw new ErroApi(400, 'Confira os campos destacados.', erros);
  if (!emailConfigurado()) {
    throw new ErroApi(503, 'O envio de e-mail não está configurado. Fale com a secretaria da escola para trocar a senha.');
  }

  const email = texto(req.body.email).toLowerCase();
  const [[usuario]] = await pool.query(
    'SELECT id, nome, email FROM usuario WHERE email = ? AND ativo = 1 AND senha_hash IS NOT NULL', [email]
  );
  if (usuario) {
    const { token } = await criarLink(usuario.id, 'RECUPERACAO_SENHA');
    try {
      await enviarLinkDeAcesso({ tipo: 'RECUPERACAO_SENHA', nome: usuario.nome, email: usuario.email, token });
    } catch (erro) {
      /* Falha no envio fica só no log: a resposta continua a mesma */
      console.error('[4U] Falha ao enviar e-mail de nova senha:', erro.message);
    }
  }
  res.json({
    mensagem: 'Se este e-mail tiver acesso liberado na 4U, enviamos um link para criar uma nova senha. Confira a caixa de entrada e o spam. O link vale por 30 minutos.'
  });
}

/* POST /api/auth/link: confere o link antes de mostrar o formulário de senha */
async function verificarLink(req, res) {
  const link = await buscarLinkValido(req.body && req.body.token);
  if (!link) throw new ErroApi(410, 'Este link não é mais válido. Ele pode ter vencido ou já ter sido usado.');
  res.json({ tipo: link.tipo, nome: link.nome, email: link.email, expira_em: link.expira_em });
}

const REGRAS_NOVA_SENHA = {
  senha: [regras.obrigatorio('Crie uma senha.'), regras.senha()],
  confirmacao: [regras.obrigatorio('Repita a senha.')]
};

/* Senha nova: regras da senha e confirmação igual */
function validarNovaSenha(corpo) {
  const erros = validar(corpo, REGRAS_NOVA_SENHA);
  if (!erros.confirmacao && corpo.senha !== corpo.confirmacao) erros.confirmacao = 'As senhas não são iguais.';
  if (Object.keys(erros).length) throw new ErroApi(400, 'Confira os campos destacados.', erros);
}

/* POST /api/auth/definir-senha: primeiro acesso (convite) ou redefinição (esqueci a senha) */
async function definirSenha(req, res) {
  const corpo = req.body || {};
  const link = await buscarLinkValido(corpo.token);
  if (!link) throw new ErroApi(410, 'Este link não é mais válido. Ele pode ter vencido ou já ter sido usado.');
  validarNovaSenha(corpo);

  await gravarSenha(link.usuario_id, await gerarHash(corpo.senha));
  res.json({ mensagem: link.tipo === 'PRIMEIRO_ACESSO' ? 'Senha criada! Agora é só entrar com seu e-mail.' : 'Senha alterada! Entre com a nova senha.' });
}

module.exports = { login, esqueciSenha, verificarLink, definirSenha };
