const { ErroAplicacao } = require('../erroAplicacao');

class Administrador {
  constructor({ id, nome, email, ativo }) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.ativo = ativo === undefined ? true : !!ativo;
  }

  editar({ nome, email }) {
    if (nome !== undefined) {
      if (!nome || !nome.trim()) {
        throw new ErroAplicacao('VALIDACAO', 'Nome do administrador é obrigatório.');
      }
      this.nome = nome.trim();
    }
    if (email !== undefined) {
      if (!email || !email.includes('@')) {
        throw new ErroAplicacao('VALIDACAO', 'E-mail inválido.');
      }
      this.email = email.trim().toLowerCase();
    }
    return this;
  }

  ativar() {
    this.ativo = true;
    return this;
  }

  inativar() {
    this.ativo = false;
    return this;
  }
}

module.exports = Administrador;
