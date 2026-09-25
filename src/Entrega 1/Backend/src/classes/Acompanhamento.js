const { ErroAplicacao } = require('../erroAplicacao');

const STATUS = {
  RASCUNHO: 'RASCUNHO',
  ENVIADO: 'ENVIADO',
  EM_REVISAO: 'EM_REVISAO',
  DEVOLVIDO: 'DEVOLVIDO',
  PUBLICADO: 'PUBLICADO',
  CANCELADO: 'CANCELADO'
};

const STATUS_QUE_PERMITEM_EDICAO = [STATUS.RASCUNHO, STATUS.DEVOLVIDO, STATUS.EM_REVISAO];

class Acompanhamento {
  constructor({
    id, aluno_id, turma_id, disciplina_id, bimestre_id, professor_id,
    descricao, media, status, versao_atual, revisor_id, publicado_em
  }) {
    this.id = id;
    this.aluno_id = aluno_id;
    this.turma_id = turma_id;
    this.disciplina_id = disciplina_id;
    this.bimestre_id = bimestre_id;
    this.professor_id = professor_id;
    this.descricao = descricao;
    this.media = media;
    this.status = status || STATUS.RASCUNHO;
    this.versao_atual = versao_atual || 1;
    this.revisor_id = revisor_id || null;
    this.publicado_em = publicado_em || null;
  }

  editar({ descricao, media }) {
    if (!STATUS_QUE_PERMITEM_EDICAO.includes(this.status)) {
      throw new ErroAplicacao(
        'ESTADO_INVALIDO',
        `Não é possível editar um acompanhamento com status ${this.status}.`
      );
    }
    if (descricao !== undefined) this.descricao = descricao;
    if (media !== undefined) this.media = media;
    return this;
  }

  enviar() {
    if (![STATUS.RASCUNHO, STATUS.DEVOLVIDO].includes(this.status)) {
      throw new ErroAplicacao('ESTADO_INVALIDO', `Não é possível enviar a partir de ${this.status}.`);
    }
    this.status = STATUS.ENVIADO;
    return this;
  }

  iniciarRevisao() {
    if (this.status !== STATUS.ENVIADO) {
      throw new ErroAplicacao('ESTADO_INVALIDO', `Não é possível iniciar revisão a partir de ${this.status}.`);
    }
    this.status = STATUS.EM_REVISAO;
    return this;
  }

  devolver() {
    if (this.status !== STATUS.EM_REVISAO) {
      throw new ErroAplicacao('ESTADO_INVALIDO', `Não é possível devolver a partir de ${this.status}.`);
    }
    this.status = STATUS.DEVOLVIDO;
    return this;
  }

  publicar(revisorId) {
    if (this.status !== STATUS.EM_REVISAO) {
      throw new ErroAplicacao('ESTADO_INVALIDO', `Não é possível publicar a partir de ${this.status}.`);
    }
    this.status = STATUS.PUBLICADO;
    this.revisor_id = revisorId;
    this.publicado_em = new Date();
    return this;
  }

  cancelar() {
    if ([STATUS.PUBLICADO, STATUS.CANCELADO].includes(this.status)) {
      throw new ErroAplicacao('ESTADO_INVALIDO', `Não é possível cancelar a partir de ${this.status}.`);
    }
    this.status = STATUS.CANCELADO;
    return this;
  }
}

module.exports = { Acompanhamento, STATUS };
