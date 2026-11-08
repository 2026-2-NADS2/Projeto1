
class Administrador {
  constructor({ id = null, nome, email, ativo = true }) {
    this._id = id; /* id = usuario.id */
    this._nome = nome;
    this._email = email;
    this._ativo = ativo;
  }

  get id() { return this._id; }
  get nome() { return this._nome; }
  get email() { return this._email; }
  get ativo() { return this._ativo; }

  /* Monta o objeto a partir de uma linha de `usuario` com perfil ADMINISTRADOR */
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
