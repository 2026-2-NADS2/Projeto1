// Turma: junta os alunos e define quem dá aula de quê (vinculo_docente)

class Turma {
  constructor({ id = null, nome, anoSerie, anoLetivo }) {
    this.id = id;
    this.nome = nome;
    this.anoSerie = anoSerie;
    this.anoLetivo = anoLetivo;
    this.alunos = [];
    this.vinculosDocentes = []; // { professor, disciplina }
  }

  matricular(aluno) {
    if (!this.alunos.includes(aluno)) {
      this.alunos.push(aluno);
    }
  }

  // RF03: não pode ter dois professores na mesma disciplina, na mesma turma
  vincularDocente(professor, disciplina) {
    const jaTem = this.vinculosDocentes.some((v) => v.disciplina === disciplina);
    if (jaTem) {
      throw new Error(`A turma ${this.nome} já tem professor de ${disciplina.nome}.`);
    }
    this.vinculosDocentes.push({ professor, disciplina });
  }
}

module.exports = Turma;
