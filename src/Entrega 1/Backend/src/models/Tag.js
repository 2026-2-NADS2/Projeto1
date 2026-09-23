// Tags que o Admin cadastra e o professor usa pra marcar o acompanhamento
// (ex: "Participação ativa", "Precisa de reforço")

class Tag {
  constructor({ id = null, nome }) {
    this.id = id;
    this.nome = nome;
  }
}

module.exports = Tag;
