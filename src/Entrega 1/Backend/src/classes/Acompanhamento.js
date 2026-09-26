const STATUS = {
  RASCUNHO: 'RASCUNHO',
  ENVIADO: 'ENVIADO',
  EM_REVISAO: 'EM_REVISAO',
  DEVOLVIDO: 'DEVOLVIDO',
  PUBLICADO: 'PUBLICADO',
  CANCELADO: 'CANCELADO'
};

const TRANSICOES_VALIDAS = {
  RASCUNHO: [STATUS.ENVIADO, STATUS.CANCELADO],
  ENVIADO: [STATUS.EM_REVISAO, STATUS.CANCELADO],
  EM_REVISAO: [STATUS.PUBLICADO, STATUS.DEVOLVIDO, STATUS.CANCELADO],
  DEVOLVIDO: [STATUS.ENVIADO, STATUS.CANCELADO],
  PUBLICADO: [],
  CANCELADO: []
};

class Acompanhamento {
  constructor({
    id = null,
    aluno,
    professor,
    turmaId,
    disciplinaId,
    bimestreId,
    descricao,
    media = null,
    status = STATUS.RASCUNHO,
    versaoAtual = 1,
    revisorId = null,
    publicadoEm = null
  }) {
    this._id = id;
    this._aluno = aluno;
    this._professor = professor;
    this._turmaId = turmaId;
    this._disciplinaId = disciplinaId;
    this._bimestreId = bimestreId;
    this._descricao = descricao;
    this._media = media;
    this._status = status;
    this._versaoAtual = versaoAtual;
    this._revisorId = revisorId;
    this._publicadoEm = publicadoEm;
  }

  get id() { return this._id; }
  get aluno() { return this._aluno; }
  get professor() { return this._professor; }
  get turmaId() { return this._turmaId; }
  get disciplinaId() { return this._disciplinaId; }
  get bimestreId() { return this._bimestreId; }
  get descricao() { return this._descricao; }
  get media() { return this._media; }
  get status() { return this._status; }
  get versaoAtual() { return this._versaoAtual; }
  get revisorId() { return this._revisorId; }
  get publicadoEm() { return this._publicadoEm; }

  editar({ descricao, media }) {
    if (this._status !== STATUS.RASCUNHO && this._status !== STATUS.DEVOLVIDO) {
      throw new Error('Só é possível editar um acompanhamento em RASCUNHO ou DEVOLVIDO.');
    }
    if (descricao !== undefined) this._descricao = descricao;
    if (media !== undefined) this._media = media;
  }

  _transicionar(novoStatus) {
    const permitidos = TRANSICOES_VALIDAS[this._status] || [];
    if (!permitidos.includes(novoStatus)) {
      throw new Error(
        `Transição inválida: não é possível ir de ${this._status} para ${novoStatus}.`
      );
    }
    this._status = novoStatus;
  }

  enviarParaRevisao() {
    this._transicionar(STATUS.ENVIADO);
  }

  iniciarRevisao(revisorId) {
    this._transicionar(STATUS.EM_REVISAO);
    if (revisorId !== undefined) this._revisorId = revisorId;
  }

  devolver() {
    this._transicionar(STATUS.DEVOLVIDO);
  }

  publicar(revisorId) {
    this._transicionar(STATUS.PUBLICADO);
    if (revisorId !== undefined) this._revisorId = revisorId;
    this._publicadoEm = new Date();
  }

  cancelar() {
    this._transicionar(STATUS.CANCELADO);
  }

  toJSON() {
    return {
      id: this._id,
      aluno: this._aluno ? this._aluno.toJSON() : null,
      professor: this._professor ? this._professor.toJSON() : null,
      turmaId: this._turmaId,
      disciplinaId: this._disciplinaId,
      bimestreId: this._bimestreId,
      descricao: this._descricao,
      media: this._media,
      status: this._status,
      versaoAtual: this._versaoAtual,
      revisorId: this._revisorId,
      publicadoEm: this._publicadoEm
    };
  }
}

Acompanhamento.STATUS = STATUS;

module.exports = Acompanhamento;
