// Node.js — classe base de quem faz login no sistema (Admin, Professor, Responsavel)
// O Aluno não entra aqui porque ele não loga (RF01/RF02 + LGPD)

class Usuario {
  constructor({ id = null, nome, email, senhaHash = null, ativo = true, senhaSimulada = null }) {
    if (this.constructor === Usuario) {
      throw new Error('Usuario é abstrata, use Administrador, Professor ou Responsavel.');
    }
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.senhaHash = senhaHash; // só é preenchido depois do primeiro acesso
    this.ativo = ativo;
    this.senhaSimulada = senhaSimulada; // gambiarra da E1, na E2 vira hash de verdade (bcrypt)
  }

  get perfil() {
    throw new Error('Cada subclasse precisa implementar o getter perfil.');
  }

  desativar() {
    this.ativo = false;
  }

  ativar() {
    this.ativo = true;
  }

  toString() {
    return `[${this.perfil}] ${this.nome} <${this.email}>`;
  }
}

module.exports = Usuario;
