// Bimestre define a janela de digitação (RF04) — é o que trava o
// professor de lançar nota fora do prazo.

class Bimestre {
  constructor({ id = null, numero, anoLetivo, aberturaDigitacao, encerramentoDigitacao }) {
    this.id = id;
    this.numero = numero; // 1 a 4
    this.anoLetivo = anoLetivo;
    this.aberturaDigitacao = new Date(aberturaDigitacao);
    this.encerramentoDigitacao = new Date(encerramentoDigitacao);
  }

  digitacaoAberta(agora = new Date()) {
    return agora >= this.aberturaDigitacao && agora <= this.encerramentoDigitacao;
  }
}

module.exports = Bimestre;
