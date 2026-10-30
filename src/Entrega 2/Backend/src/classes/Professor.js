class Professor {
  constructor({ id = null, usuarioId = null, nome, registro, email = null, ativo = true }) {
    this._id = id;
    this._usuarioId = usuarioId;
    this._nome = nome;
    this._registro = registro;
    this._email = email;
    this._ativo = ativo;
  }

  get id() { return this._id; }
  get usuarioId() { return this._usuarioId; }
  get nome() { return this._nome; }
  get registro() { return this._registro; }
  get email() { return this._email; }
  get ativo() { return this._ativo; }

  editar({ nome, registro }) {
    if (nome !== undefined) this._nome = nome;
    if (registro !== undefined) this._registro = registro;
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
      registro: this._registro,
      email: this._email,
      ativo: this._ativo
    };
  }

  // Monta o objeto a partir do JOIN professor + usuario.
  static fromRow(row) {
    return new Professor({
      id: row.professor_id,
      usuarioId: row.usuario_id,
      nome: row.nome,
      registro: row.registro,
      email: row.email,
      ativo: !!row.ativo
    });
  }
}

module.exports = Professor;
