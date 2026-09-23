const Usuario = require('./Usuario');
const Acompanhamento = require('./Acompanhamento');

// Professor: registra o acompanhamento do aluno (nota, descrição, tags)
// e manda pra revisão. Ele só cria o objeto — as regras que dependem de
// ver o sistema inteiro (vínculo, duplicado, escala) ficam no Sistema.js.

class Professor extends Usuario {
  constructor({ registroFuncional, ...dados }) {
    super(dados);
    this.registroFuncional = registroFuncional;
  }

  get perfil() {
    return 'PROFESSOR';
  }

  registrarAcompanhamento({ aluno, turma, disciplina, bimestre, descricao, media, tags = [] }) {
    if (!bimestre.digitacaoAberta()) {
      throw new Error('O período de digitação desse bimestre já fechou (ou não abriu ainda).');
    }
    return new Acompanhamento({ aluno, turma, disciplina, bimestre, professorId: this.id, descricao, media, tags });
  }

  editarRascunho(acompanhamento, { descricao, media, tags }) {
    acompanhamento.atualizarRascunho({ descricao, media, autorId: this.id });
    if (tags) acompanhamento.tags = [...tags];
  }

  enviarParaRevisao(acompanhamento) {
    acompanhamento.mudarEstado('ENVIADO', this.id);
  }
}

module.exports = Professor;
