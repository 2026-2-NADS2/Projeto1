const Usuario = require('./Usuario');

// Responsável: só vê o que já foi publicado, dos alunos que ele
// está vinculado. Não cadastra nada (isso é lá com o Admin).

class Responsavel extends Usuario {
  constructor({ telefone, alunosVinculados = [], ...dados }) {
    super(dados);
    this.telefone = telefone;
    this.alunosVinculados = alunosVinculados;
  }

  get perfil() {
    return 'RESPONSAVEL';
  }

  vincularAluno(aluno) {
    if (!this.alunosVinculados.includes(aluno)) {
      this.alunosVinculados.push(aluno);
    }
  }

  // todos os relatórios publicados, de todos os alunos vinculados
  consultarRelatoriosPublicados() {
    return this.alunosVinculados.flatMap((aluno) =>
      aluno.acompanhamentos.filter((a) => a.status === 'PUBLICADO')
    );
  }

  // navegação "meus alunos > aluno > bimestre" do sitemap
  relatoriosDoAluno(aluno, bimestre = null) {
    if (!this.alunosVinculados.includes(aluno)) {
      throw new Error(`${this.nome} não é responsável por ${aluno.nome}.`);
    }
    let relatorios = aluno.acompanhamentos.filter((a) => a.status === 'PUBLICADO');
    if (bimestre) {
      relatorios = relatorios.filter((a) => a.bimestre.numero === bimestre.numero);
    }
    return relatorios;
  }

  registrarCiencia(acompanhamento, observacao = '') {
    acompanhamento.registrarCiencia(this.id, observacao);
  }
}

module.exports = Responsavel;
