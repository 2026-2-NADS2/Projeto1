const Usuario = require('./Usuario');

// Administrador: quem cadastra tudo (RF02) e revisa/publica os
// acompanhamentos que o professor manda (RF06). Os métodos de
// cadastro em si ficam no Sistema.js (ele que guarda as listas),
// aqui só tem o que é ação do próprio admin sobre um acompanhamento.

class Administrador extends Usuario {
  constructor(dados) {
    super(dados);
  }

  get perfil() {
    return 'ADMINISTRADOR';
  }

  // analisa o texto do professor, pode mudar descrição/media antes de publicar
  revisarAcompanhamento(acompanhamento, { novaDescricao, novaMedia, motivo } = {}) {
    if (acompanhamento.status !== 'ENVIADO' && acompanhamento.status !== 'EM_REVISAO') {
      throw new Error(`Só dá pra revisar o que foi enviado. Status atual: ${acompanhamento.status}.`);
    }

    const alterouTexto = novaDescricao !== undefined || novaMedia !== undefined;
    if (alterouTexto) {
      acompanhamento.registrarNovaVersao({
        autorId: this.id,
        descricao: novaDescricao ?? acompanhamento.descricao,
        media: novaMedia ?? acompanhamento.media,
        motivo: motivo ?? 'Ajuste feito pela administração',
      });
    }

    if (acompanhamento.status !== 'EM_REVISAO') {
      acompanhamento.mudarEstado('EM_REVISAO', this.id);
    }
    return acompanhamento;
  }

  // volta pro professor ajustar. motivo é obrigatório, senão ele não sabe o que corrigir
  devolverParaAjustes(acompanhamento, motivo) {
    if (!motivo) throw new Error('Precisa dizer o motivo da devolução.');
    if (acompanhamento.status !== 'ENVIADO' && acompanhamento.status !== 'EM_REVISAO') {
      throw new Error(`Só dá pra devolver o que está em revisão. Status atual: ${acompanhamento.status}.`);
    }
    acompanhamento.mudarEstado('DEVOLVIDO', this.id, motivo);
    return acompanhamento;
  }

  // libera pra família ver
  publicar(acompanhamento) {
    if (acompanhamento.status !== 'EM_REVISAO') {
      throw new Error(`Só dá pra publicar depois da revisão. Status atual: ${acompanhamento.status}.`);
    }
    acompanhamento.publicar(this.id);
    return acompanhamento;
  }
}

module.exports = Administrador;
