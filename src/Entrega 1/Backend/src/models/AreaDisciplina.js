// Area do conhecimento (Linguagens, Matemática, etc). Fica separada de
// Disciplina porque no banco também são tabelas diferentes.

class AreaDisciplina {
  constructor({ id = null, nome }) {
    this.id = id;
    this.nome = nome;
  }
}

module.exports = AreaDisciplina;
