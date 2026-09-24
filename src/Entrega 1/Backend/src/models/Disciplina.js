// Disciplina pertence a uma AreaDisciplina (Matemática -> área Matemática)

class Disciplina {
  constructor({ id = null, nome, areaDisciplina }) {
    this.id = id;
    this.nome = nome;
    this.areaDisciplina = areaDisciplina;
  }
}

module.exports = Disciplina;
