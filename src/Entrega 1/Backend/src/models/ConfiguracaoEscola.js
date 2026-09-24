// A escala de notas é configurável, não fica fixa no código
// (enunciado: "a média deverá respeitar a escala definida pela escola")

class ConfiguracaoEscola {
  constructor({
    nome = 'Escola 4U',
    emailContato = 'secretaria@escola4u.test',
    telefone = '(11) 0000-0000',
    mediaMinima = 0,
    mediaMaxima = 10,
    mediaAprovacao = 6,
  } = {}) {
    if (mediaMaxima <= mediaMinima) {
      throw new Error('A média máxima tem que ser maior que a mínima.');
    }
    if (mediaAprovacao < mediaMinima || mediaAprovacao > mediaMaxima) {
      throw new Error('A média de aprovação precisa estar dentro da escala.');
    }

    this.nome = nome;
    this.emailContato = emailContato;
    this.telefone = telefone;
    this.mediaMinima = mediaMinima;
    this.mediaMaxima = mediaMaxima;
    this.mediaAprovacao = mediaAprovacao;
  }

  mediaValida(media) {
    return typeof media === 'number' && !Number.isNaN(media) && media >= this.mediaMinima && media <= this.mediaMaxima;
  }

  aprovado(media) {
    return media >= this.mediaAprovacao;
  }
}

module.exports = ConfiguracaoEscola;
