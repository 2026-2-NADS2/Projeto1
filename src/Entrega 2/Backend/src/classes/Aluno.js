class Aluno {
  constructor({ id = null, nome, dataNascimento = null, matricula, ativo = true }) {
    this._id = id;
    this._nome = nome;
    this._dataNascimento = dataNascimento;
    this._matricula = matricula;
    this._ativo = ativo;
  }

  get id() { return this._id; }
  get nome() { return this._nome; }
  get dataNascimento() { return this._dataNascimento; }
  get matricula() { return this._matricula; }
  get ativo() { return this._ativo; }

  editar({ nome, dataNascimento, matricula }) {
    if (nome !== undefined) this._nome = nome;
    if (dataNascimento !== undefined) this._dataNascimento = dataNascimento;
    if (matricula !== undefined) this._matricula = matricula;
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
      data_nascimento: this._dataNascimento,
      matricula: this._matricula,
      ativo: this._ativo
    };
  }

  /* Monta o objeto a partir de uma linha da tabela `aluno`
     (colunas do Dicionário de Dados: id, nome, data_nascimento, matricula, ativo) */
  static fromRow(row) {
    return new Aluno({
      id: row.id,
      nome: row.nome,
      dataNascimento: row.data_nascimento,
      matricula: row.matricula,
      ativo: !!row.ativo
    });
  }
}

module.exports = Aluno;
