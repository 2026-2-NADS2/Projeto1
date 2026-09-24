const ESTADOS_VALIDOS = ['RASCUNHO', 'ENVIADO', 'EM_REVISAO', 'PUBLICADO', 'DEVOLVIDO', 'CANCELADO'];

// Acompanhamento: o registro bimestral do aluno numa disciplina (RF05).
// Guarda duas coisas separadas, igual no banco:
//  - versoes: histórico do TEXTO (tabela acompanhamento_versao)
//  - historico: histórico do STATUS (tabela acompanhamento_historico)

class Acompanhamento {
  constructor({ aluno, turma, disciplina, bimestre, professorId, descricao, media, tags = [] }) {
    this.id = null;
    this.aluno = aluno;
    this.turma = turma;
    this.disciplina = disciplina;
    this.bimestre = bimestre;
    this.professorId = professorId;
    this.revisorId = null;
    this.descricao = descricao;
    this.media = media;
    this.tags = [...tags];
    this.status = 'RASCUNHO';
    this.versaoAtual = 1;
    this.versoes = [{ numeroVersao: 1, descricao, media, autorId: professorId, motivo: 'Versão original do professor' }];
    this.historico = [];
    this.publicadoEm = null;
    this.ciencia = null;

    aluno.adicionarAcompanhamento(this);
  }

  atualizarRascunho({ descricao, media, autorId }) {
    if (this.status !== 'RASCUNHO' && this.status !== 'DEVOLVIDO') {
      throw new Error('Só dá pra editar em RASCUNHO ou DEVOLVIDO.');
    }
    this.registrarNovaVersao({ descricao, media, autorId, motivo: 'Edição do professor' });
  }

  registrarNovaVersao({ descricao, media, autorId, motivo }) {
    this.versaoAtual += 1;
    this.descricao = descricao ?? this.descricao;
    this.media = media ?? this.media;
    this.versoes.push({ numeroVersao: this.versaoAtual, descricao: this.descricao, media: this.media, autorId, motivo });
  }

  // registra o antes/depois do status, isso é a auditoria (RF07)
  mudarEstado(novoEstado, usuarioId, motivo = '') {
    if (!ESTADOS_VALIDOS.includes(novoEstado)) {
      throw new Error(`Estado inválido: ${novoEstado}`);
    }
    this.historico.push({ estadoAnterior: this.status, estadoNovo: novoEstado, usuarioId, data: new Date(), motivo });
    this.status = novoEstado;
  }

  publicar(revisorId) {
    this.revisorId = revisorId;
    this.publicadoEm = new Date();
    this.mudarEstado('PUBLICADO', revisorId);
  }

  registrarCiencia(responsavelId, observacao) {
    if (this.status !== 'PUBLICADO') {
      throw new Error('Só dá pra dar ciência em algo publicado.');
    }
    this.ciencia = { responsavelId, observacao, data: new Date() };
  }

  // monta os dados pro PDF. Gerar o arquivo em si fica pra E2 (lib de PDF)
  gerarResumoPDF() {
    if (this.status !== 'PUBLICADO') {
      throw new Error('Só dá pra gerar PDF do que está publicado.');
    }
    return {
      aluno: this.aluno.nome,
      turma: this.turma.nome,
      disciplina: this.disciplina.nome,
      bimestre: this.bimestre.numero,
      descricao: this.descricao,
      media: this.media,
      tags: this.tags.map((t) => t.nome),
      publicadoEm: this.publicadoEm,
    };
  }
}

module.exports = Acompanhamento;
