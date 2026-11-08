/* Erro que vira resposta HTTP no formato padrão { mensagem, campos } */
class ErroApi extends Error {
  constructor(status, mensagem, campos, extras) {
    super(mensagem);
    this.status = status;
    this.mensagem = mensagem;
    if (campos && Object.keys(campos).length) this.campos = campos;
    /* Informação extra para o front (ex.: { motivo: 'ACESSO_DESATIVADO' }) */
    if (extras) this.extras = extras;
  }
}

module.exports = ErroApi;
