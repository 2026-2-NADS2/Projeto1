const Administrador = require('./models/Administrador');
const Professor = require('./models/Professor');
const Responsavel = require('./models/Responsavel');
const Aluno = require('./models/Aluno');
const Turma = require('./models/Turma');
const AreaDisciplina = require('./models/AreaDisciplina');
const Disciplina = require('./models/Disciplina');
const Bimestre = require('./models/Bimestre');
const Tag = require('./models/Tag');
const ConfiguracaoEscola = require('./models/ConfiguracaoEscola');

// Sistema.js roda em Node.js — é essa "classe principal" que depois vira
// a base da API (Express) que vai ligar o front-end ao banco de dados
// na Entrega 2. Por enquanto guarda tudo em memória (arrays).
//
// Controle de acesso: RF02 diz que só o Administrador cadastra
// (responsáveis, alunos, professores, disciplinas, turmas, tags...).
// Por isso todo método de cadastro pede o admin como primeiro parâmetro
// e passa pelo _exigirAdministrador antes de fazer qualquer coisa.

class Sistema {
  constructor(configuracao = new ConfiguracaoEscola()) {
    this.configuracao = configuracao;

    this.usuarios = [];
    this.alunos = [];
    this.turmas = [];
    this.areas = [];
    this.disciplinas = [];
    this.bimestres = [];
    this.tags = [];
    this.acompanhamentos = []; // lista central, senão fica difícil achar "o que está em revisão"

    this._sequencias = {}; // contador de id por coleção
  }

  // ---------- controle de acesso ----------

  _exigirAdministrador(usuario, acao) {
    if (!usuario || usuario.perfil !== 'ADMINISTRADOR') {
      throw new Error(`Apenas o Administrador pode ${acao}.`);
    }
    if (!usuario.ativo) {
      throw new Error('Administrador inativo não pode fazer cadastro.');
    }
    if (!this.usuarios.includes(usuario)) {
      throw new Error('Esse administrador não é deste sistema.');
    }
  }

  // ---------- instalação (primeiro admin) ----------

  // resolve o problema do "quem cadastra o primeiro admin". Só funciona uma vez.
  criarAdministradorInicial(dados) {
    const jaExiste = this.usuarios.some((u) => u.perfil === 'ADMINISTRADOR');
    if (jaExiste) {
      throw new Error('Já existe admin. Use cadastrarAdministrador(admin, dados).');
    }
    const admin = new Administrador({ id: this._proximoId('usuario'), ...dados });
    this.usuarios.push(admin);
    return admin;
  }

  // ---------- cadastros (tudo exige admin) ----------

  cadastrarAdministrador(admin, dados) {
    this._exigirAdministrador(admin, 'cadastrar administradores');
    this._exigirEmailDisponivel(dados.email);
    const novo = new Administrador({ id: this._proximoId('usuario'), ...dados });
    this.usuarios.push(novo);
    return novo;
  }

  cadastrarProfessor(admin, dados) {
    this._exigirAdministrador(admin, 'cadastrar professores');
    this._exigirEmailDisponivel(dados.email);
    const professor = new Professor({ id: this._proximoId('usuario'), ...dados });
    this.usuarios.push(professor);
    return professor;
  }

  cadastrarResponsavel(admin, dados) {
    this._exigirAdministrador(admin, 'cadastrar responsáveis');
    this._exigirEmailDisponivel(dados.email);
    const responsavel = new Responsavel({ id: this._proximoId('usuario'), ...dados });
    this.usuarios.push(responsavel);
    return responsavel;
  }

  cadastrarAluno(admin, dados) {
    this._exigirAdministrador(admin, 'cadastrar alunos');
    const duplicada = this.alunos.some((a) => a.matricula === dados.matricula);
    if (duplicada) throw new Error(`Já existe aluno com matrícula ${dados.matricula}.`);
    const aluno = new Aluno({ id: this._proximoId('aluno'), ...dados });
    this.alunos.push(aluno);
    return aluno;
  }

  // liga responsável e aluno (tabela N:N aluno_responsavel)
  vincularResponsavelAoAluno(admin, responsavel, aluno) {
    this._exigirAdministrador(admin, 'vincular responsáveis a alunos');
    responsavel.vincularAluno(aluno);
    return { responsavel, aluno };
  }

  cadastrarTurma(admin, dados) {
    this._exigirAdministrador(admin, 'cadastrar turmas');
    const duplicada = this.turmas.some((t) => t.nome === dados.nome && t.anoLetivo === dados.anoLetivo);
    if (duplicada) throw new Error(`Turma ${dados.nome} já existe em ${dados.anoLetivo}.`);
    const turma = new Turma({ id: this._proximoId('turma'), ...dados });
    this.turmas.push(turma);
    return turma;
  }

  matricularAluno(admin, turma, aluno) {
    this._exigirAdministrador(admin, 'matricular alunos em turmas');
    turma.matricular(aluno);
    return turma;
  }

  vincularDocente(admin, turma, professor, disciplina) {
    this._exigirAdministrador(admin, 'vincular professores a disciplinas');
    turma.vincularDocente(professor, disciplina);
    return turma;
  }

  cadastrarAreaDisciplina(admin, nome) {
    this._exigirAdministrador(admin, 'cadastrar áreas de disciplina');
    const area = new AreaDisciplina({ id: this._proximoId('area'), nome });
    this.areas.push(area);
    return area;
  }

  cadastrarDisciplina(admin, dados) {
    this._exigirAdministrador(admin, 'cadastrar disciplinas');
    const disciplina = new Disciplina({ id: this._proximoId('disciplina'), ...dados });
    this.disciplinas.push(disciplina);
    return disciplina;
  }

  cadastrarTag(admin, nome) {
    this._exigirAdministrador(admin, 'cadastrar tags');
    const tag = new Tag({ id: this._proximoId('tag'), nome });
    this.tags.push(tag);
    return tag;
  }

  abrirBimestre(admin, dados) {
    this._exigirAdministrador(admin, 'abrir bimestres');
    const duplicado = this.bimestres.some((b) => b.numero === dados.numero && b.anoLetivo === dados.anoLetivo);
    if (duplicado) throw new Error(`${dados.numero}º bimestre de ${dados.anoLetivo} já foi aberto.`);
    const bimestre = new Bimestre({ id: this._proximoId('bimestre'), ...dados });
    this.bimestres.push(bimestre);
    return bimestre;
  }

  inativarUsuario(admin, usuario) {
    this._exigirAdministrador(admin, 'inativar usuários');
    if (usuario === admin) throw new Error('O admin não pode inativar a própria conta.');
    usuario.desativar();
    return usuario;
  }

  ativarUsuario(admin, usuario) {
    this._exigirAdministrador(admin, 'ativar usuários');
    usuario.ativar();
    return usuario;
  }

  // ---------- login ----------

  // mensagem igual pra email errado e senha errada, senão dá pra
  // descobrir quais emails existem no sistema só testando
  login(email, senha) {
    const usuario = this.usuarios.find((u) => u.email === email);
    if (!usuario || usuario.senhaSimulada !== senha) {
      throw new Error('E-mail ou senha inválidos.');
    }
    if (!usuario.ativo) {
      throw new Error('Usuário inativo. Procure a administração da escola.');
    }
    return usuario;
  }

  // ---------- módulo professor ----------

  turmasDoProfessor(professor) {
    return this.turmas.filter((turma) => turma.vinculosDocentes.some((v) => v.professor === professor));
  }

  // valida 3 regras antes de criar: vínculo, escala de nota e duplicidade
  professorRegistraAcompanhamento(professor, args) {
    const { aluno, turma, disciplina, bimestre, media } = args;

    const vinculado = turma.vinculosDocentes.some((v) => v.professor === professor && v.disciplina === disciplina);
    if (!vinculado) {
      throw new Error(`${professor.nome} não dá ${disciplina.nome} na turma ${turma.nome}.`);
    }

    if (!this.configuracao.mediaValida(media)) {
      throw new Error(`Média fora da escala (${this.configuracao.mediaMinima} a ${this.configuracao.mediaMaxima}).`);
    }

    const jaExiste = this.acompanhamentos.some(
      (a) => a.aluno === aluno && a.turma === turma && a.disciplina === disciplina
        && a.bimestre.numero === bimestre.numero && a.status !== 'CANCELADO'
    );
    if (jaExiste) {
      throw new Error(`Já existe acompanhamento de ${aluno.nome} em ${disciplina.nome} no ${bimestre.numero}º bimestre.`);
    }

    const acompanhamento = professor.registrarAcompanhamento(args);
    this.acompanhamentos.push(acompanhamento);
    return acompanhamento;
  }

  // abas rascunhos/enviados/devolvidos do professor
  acompanhamentosDoProfessor(professor, status = null) {
    const doProfessor = this.acompanhamentos.filter((a) => a.professorId === professor.id);
    if (!status) return doProfessor;
    if (status === 'ENVIADO') {
      return doProfessor.filter((a) => a.status === 'ENVIADO' || a.status === 'EM_REVISAO');
    }
    return doProfessor.filter((a) => a.status === status);
  }

  // ---------- módulo admin: revisão, publicação, relatórios ----------

  acompanhamentosParaRevisao() {
    return this.acompanhamentos.filter((a) => a.status === 'ENVIADO' || a.status === 'EM_REVISAO');
  }

  adminPublicaAcompanhamento(admin, acompanhamento) {
    this._exigirAdministrador(admin, 'publicar acompanhamentos');
    admin.publicar(acompanhamento);
    return acompanhamento;
  }

  adminDevolveAcompanhamento(admin, acompanhamento, motivo) {
    this._exigirAdministrador(admin, 'devolver acompanhamentos');
    admin.devolverParaAjustes(acompanhamento, motivo);
    return acompanhamento;
  }

  filtrarAcompanhamentos({ turma, disciplina, professor, bimestre, aluno, tag, status } = {}) {
    let resultado = this.acompanhamentos;
    if (turma) resultado = resultado.filter((a) => a.turma === turma);
    if (disciplina) resultado = resultado.filter((a) => a.disciplina === disciplina);
    if (professor) resultado = resultado.filter((a) => a.professorId === professor.id);
    if (bimestre) resultado = resultado.filter((a) => a.bimestre.numero === bimestre.numero);
    if (aluno) resultado = resultado.filter((a) => a.aluno === aluno);
    if (tag) resultado = resultado.filter((a) => a.tags.includes(tag));
    if (status) resultado = resultado.filter((a) => a.status === status);
    return resultado;
  }

  indicadoresPorDisciplina(bimestre) {
    const publicados = this.filtrarAcompanhamentos({ bimestre, status: 'PUBLICADO' });
    const porDisciplina = new Map();

    publicados.forEach((a) => {
      const chave = a.disciplina.nome;
      if (!porDisciplina.has(chave)) {
        porDisciplina.set(chave, { disciplina: chave, registros: 0, soma: 0, abaixoDaMedia: 0 });
      }
      const item = porDisciplina.get(chave);
      item.registros += 1;
      item.soma += a.media;
      if (!this.configuracao.aprovado(a.media)) item.abaixoDaMedia += 1;
    });

    return [...porDisciplina.values()].map((item) => ({
      disciplina: item.disciplina,
      registros: item.registros,
      mediaGeral: Number((item.soma / item.registros).toFixed(2)),
      abaixoDaMedia: item.abaixoDaMedia,
    }));
  }

  // ---------- módulo responsável ----------

  responsavelConsultaRelatorios(responsavel) {
    return responsavel.consultarRelatoriosPublicados();
  }

  // ---------- auxiliares ----------

  _exigirEmailDisponivel(email) {
    if (this.usuarios.some((u) => u.email === email)) {
      throw new Error(`Já existe usuário com o e-mail ${email}.`);
    }
  }

  _proximoId(chave) {
    this._sequencias[chave] = (this._sequencias[chave] || 0) + 1;
    return this._sequencias[chave];
  }
}

module.exports = Sistema;
