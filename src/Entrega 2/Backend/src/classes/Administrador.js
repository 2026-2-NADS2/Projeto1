
class Administrador {
  constructor({ id = null, nome, email, ativo = true }) {
    this._id = id; // id = usuario.id
    this._nome = nome;
    this._email = email;
    this._ativo = ativo;
  }

  get id() { return this._id; }
  get nome() { return this._nome; }
  get email() { return this._email; }
  get ativo() { return this._ativo; }

  editar({ nome, email }) {
    if (nome !== undefined) this._nome = nome;
    if (email !== undefined) this._email = email;
  }

  ativar() {
    this._ativo = true;
  }

  inativar() {
    this._ativo = false;
  }

  toJSON() {
    return {
      id: this._id,
      nome: this._nome,
      email: this._email,
      ativo: this._ativo
    };
  }

  // Monta o objeto a partir de uma linha de `usuario` com perfil ADMINISTRADOR.
  static fromRow(row) {
    return new Administrador({
      id: row.id,
      nome: row.nome,
      email: row.email,
      ativo: !!row.ativo
    });
  }
}

module.exports = Administrador;
