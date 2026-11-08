const ErroApi = require('../utils/ErroApi');

const STATUS = {
  RASCUNHO: 'RASCUNHO',
  ENVIADO: 'ENVIADO',
  EM_REVISAO: 'EM_REVISAO',
  DEVOLVIDO: 'DEVOLVIDO',
  PUBLICADO: 'PUBLICADO',
  CANCELADO: 'CANCELADO'
};

const ROTULOS = {
  RASCUNHO: 'Rascunho',
  ENVIADO: 'Enviado para revisão',
  EM_REVISAO: 'Em revisão',
  DEVOLVIDO: 'Devolvido para ajustes',
  PUBLICADO: 'Publicado',
  CANCELADO: 'Cancelado'
};

/* Fluxo: RASCUNHO -> ENVIADO -> EM_REVISAO -> PUBLICADO, com DEVOLVIDO e CANCELADO */
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
  get turmaId() { return this._turmaId; }
  get disciplinaId() { return this._disciplinaId; }
  get bimestreId() { return this._bimestreId; }
  get descricao() { return this._descricao; }
  get media() { return this._media; }
  get status() { return this._status; }
  get versaoAtual() { return this._versaoAtual; }
  get revisorId() { return this._revisorId; }
  get publicadoEm() { return this._publicadoEm; }

  /* Professor: só edita rascunho ou registro devolvido para ajustes */
  editar({ descricao, media }) {
    if (this._status !== STATUS.RASCUNHO && this._status !== STATUS.DEVOLVIDO) {
      throw new ErroApi(409, 'Este acompanhamento já foi enviado e não pode mais ser editado pelo professor.');
    }
    return this._aplicarEdicao({ descricao, media });
  }

  /* Administrador: ajusta o texto durante a revisão, antes de publicar */
  editarNaRevisao({ descricao, media }) {
    if (this._status !== STATUS.EM_REVISAO) {
      throw new ErroApi(409, 'Só é possível ajustar o texto de um acompanhamento em revisão.');
    }
    return this._aplicarEdicao({ descricao, media });
  }

  _aplicarEdicao({ descricao, media }) {
    const mudou = (descricao !== undefined && descricao !== this._descricao)
      || (media !== undefined && Number(media) !== Number(this._media));
    if (descricao !== undefined) this._descricao = descricao;
    if (media !== undefined) this._media = media;
    /* Cada alteração de texto ou média vira uma nova versão (acompanhamento_versao) */
    if (mudou) this._versaoAtual += 1;
    return mudou;
  }

  _transicionar(novoStatus) {
    const permitidos = TRANSICOES_VALIDAS[this._status] || [];
    if (!permitidos.includes(novoStatus)) {
      throw new ErroApi(409, `Não é possível passar de "${ROTULOS[this._status]}" para "${ROTULOS[novoStatus]}".`);
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

  /* Monta o objeto a partir de uma linha da tabela `acompanhamento` */
  static fromRow(row) {
    return new Acompanhamento({
      id: row.id,
      turmaId: row.turma_id,
      disciplinaId: row.disciplina_id,
      bimestreId: row.bimestre_id,
      descricao: row.descricao,
      media: row.media !== null ? Number(row.media) : null,
      status: row.status,
      versaoAtual: row.versao_atual,
      revisorId: row.revisor_id,
      publicadoEm: row.publicado_em
    });
  }
}

Acompanhamento.STATUS = STATUS;

module.exports = Acompanhamento;
