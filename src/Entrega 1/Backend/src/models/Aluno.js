// Aluno não estende Usuario porque não faz login (LGPD, dado de menor).
// É só um cadastro que o Admin mantém.

class Aluno {
  constructor({ id = null, nome, dataNascimento, matricula, ativo = true, observacoes = '' }) {
    this.id = id;
    this.nome = nome;
    this.dataNascimento = dataNascimento;
    this.matricula = matricula;
    this.ativo = ativo;

    // Campo livre pra registrar coisa importante sobre o aluno que a
    // escola/professor precisa saber: deficiência, alergia, restrição
    // alimentar, necessidade especial, uso de medicação etc.
    // Fica vazio por padrão porque nem todo aluno vai ter isso pra
    // declarar. No banco de verdade isso teria que ter acesso restrito
    // (é dado sensível de menor, LGPD de novo).
    this.observacoes = observacoes;

    this.acompanhamentos = [];
  }

  adicionarAcompanhamento(acompanhamento) {
    this.acompanhamentos.push(acompanhamento);
  }

  // muda ou atualiza as observações (ex: professor descobre uma alergia no meio do ano)
  atualizarObservacoes(texto) {
    this.observacoes = texto;
  }

  toString() {
    return `Aluno ${this.nome} (matrícula ${this.matricula})`;
  }
}

module.exports = Aluno;
