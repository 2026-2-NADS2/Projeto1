const { ErroAplicacao } = require('../erroAplicacao');

class Professor {
  constructor({ id, usuario_id, registro, ativo, nome, email }) {
    this.id = id;
    this.usuario_id = usuario_id;
    this.registro = registro;
    this.ativo = ativo === undefined ? true : !!ativo;
    this.nome = nome;
    this.email = email;
  }

  editar({ registro, nome }) {
    if (registro !== undefined) {
      if (!registro || !registro.trim()) {
        throw new ErroAplicacao('VALIDACAO', 'Registro funcional é obrigatório.');
      }
      this.registro = registro.trim();
    }
    if (nome !== undefined) this.nome = nome;
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

module.exports = Professor;
