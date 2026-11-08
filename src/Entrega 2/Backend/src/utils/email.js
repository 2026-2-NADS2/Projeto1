const nodemailer = require('nodemailer');

/* Envio de e-mail pelo Gmail do projeto (senha de app do Google, guardada no .env) */
const emailConfigurado = () => !!(process.env.EMAIL_USUARIO && process.env.EMAIL_SENHA_APP);

let transporte = null;
function obterTransporte() {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USUARIO, pass: process.env.EMAIL_SENHA_APP }
    });
  }
  return transporte;
}

/* Endereço do site, para montar o link do e-mail */
function enderecoSite() {
  const site = process.env.SITE_URL || (process.env.CORS_ORIGENS || 'http://localhost:5173').split(',')[0];
  return site.trim().replace(/\/$/, '');
}

const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Modelo do e-mail com as cores da 4U */
function montarHtml({ nome, titulo, texto, botao, link, rodape }) {
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:#FFF8ED;font-family:Arial,Helvetica,sans-serif;color:#3F3A36">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #E5D9C6;border-radius:12px">
    <tr><td style="padding:24px 28px;border-bottom:4px solid #0E6E85">
      <span style="font-size:24px;font-weight:bold;color:#1B2A4A">4U</span>
      <span style="font-size:13px;color:#6B645C;margin-left:8px">Acompanhamento escolar</span>
    </td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 16px;font-size:20px;color:#1B2A4A">${escapar(titulo)}</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5">Olá, ${escapar(nome)}!</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5">${escapar(texto)}</p>
      <p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;padding:12px 24px;background:#0E6E85;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold">${escapar(botao)}</a></p>
      <p style="margin:0 0 8px;font-size:13px;color:#6B645C">${escapar(rodape)}</p>
      <p style="margin:0;font-size:12px;color:#6B645C;word-break:break-all">Se o botão não funcionar, copie este endereço no navegador:<br>${link}</p>
    </td></tr>
    <tr><td style="padding:16px 28px;background:#FFFCF6;border-top:1px solid #E5D9C6;border-radius:0 0 12px 12px;font-size:12px;color:#6B645C">
      Você recebeu este e-mail porque está cadastrado(a) na 4U. Se não foi você que pediu, ignore esta mensagem.
    </td></tr>
  </table>
</body></html>`;
}

const MODELOS = {
  PRIMEIRO_ACESSO: {
    assunto: 'Seu acesso à 4U foi liberado',
    titulo: 'Bem-vindo(a) à 4U',
    texto: 'A escola liberou o seu acesso à plataforma 4U. Clique no botão abaixo para criar a sua senha.',
    botao: 'Criar minha senha',
    rodape: 'Este link vale por 3 dias e só pode ser usado uma vez.'
  },
  RECUPERACAO_SENHA: {
    assunto: 'Redefinir a sua senha da 4U',
    titulo: 'Redefinir a senha',
    texto: 'Recebemos um pedido para criar uma nova senha para a sua conta. Clique no botão abaixo para continuar.',
    botao: 'Criar nova senha',
    rodape: 'Este link vale por 30 minutos e só pode ser usado uma vez.'
  }
};

/* Envia o link de primeiro acesso ou de nova senha. O envio termina antes da resposta da API
   (na nuvem, a função é encerrada logo depois de responder). */
async function enviarLinkDeAcesso({ tipo, nome, email, token }) {
  const m = MODELOS[tipo];
  const link = `${enderecoSite()}/definir-senha?token=${token}`;
  await obterTransporte().sendMail({
    from: `"${process.env.EMAIL_REMETENTE || '4U Acompanhamento Escolar'}" <${process.env.EMAIL_USUARIO}>`,
    to: email,
    subject: m.assunto,
    text: `Olá, ${nome}!\n\n${m.texto}\n\n${link}\n\n${m.rodape}`,
    html: montarHtml({ nome, link, ...m })
  });
}

module.exports = { emailConfigurado, enviarLinkDeAcesso };
