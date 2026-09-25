const { ErroAplicacao } = require('../erroAplicacao');

class Aluno {
  constructor({ id, nome, data_nascimento, matricula, ativo }) {
    this.id = id;
    this.nome = nome;
    this.data_nascimento = data_nascimento;
    this.matricula = matricula;
    this.ativo = ativo === undefined ? true : !!ativo;
  }

  editar({ nome, data_nascimento, matricula }) {
    if (nome !== undefined) {
      if (!nome || !nome.trim()) {
        throw new ErroAplicacao('VALIDACAO', 'Nome do aluno é obrigatório.');
      }
      this.nome = nome.trim();
    }
    if (data_nascimento !== undefined) this.data_nascimento = data_nascimento;
    if (matricula !== undefined) {
      if (!matricula || !matricula.trim()) {
        throw new ErroAplicacao('VALIDACAO', 'Matrícula é obrigatória.');
      }
      this.matricula = matricula.trim();
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

module.exports = Aluno;
