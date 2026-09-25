const Aluno = require('./Aluno');
const Professor = require('./Professor');
const Administrador = require('./Administrador');
const { Acompanhamento } = require('./Acompanhamento');

const { ErroAplicacao } = require('../erroAplicacao');

const alunoRepo = require('../repositories/alunoRepository');
const professorRepo = require('../repositories/professorRepository');
const usuarioRepo = require('../repositories/usuarioRepository');
const acompanhamentoRepo = require('../repositories/acompanhamentoRepository');

class Sistema {

  async criarAluno(dados) {
    const aluno = new Aluno({ ...dados, id: undefined });
    aluno.editar(dados);
    return alunoRepo.criar(aluno);
  }

  async listarAlunos() {
    return alunoRepo.listar();
  }

  async buscarAlunoPorId(id) {
    const registro = await alunoRepo.buscarPorId(id);
    if (!registro) throw new ErroAplicacao('NAO_ENCONTRADO', 'Aluno não encontrado.', 404);
    return registro;
  }

  async editarAluno(id, dados) {
    const registro = await this.buscarAlunoPorId(id);
    const aluno = new Aluno(registro);
    aluno.editar(dados);
    return alunoRepo.atualizar(id, aluno);
  }

  async ativarAluno(id) {
    const registro = await this.buscarAlunoPorId(id);
    const aluno = new Aluno(registro).ativar();
    return alunoRepo.atualizar(id, aluno);
  }

  async inativarAluno(id) {
    const registro = await this.buscarAlunoPorId(id);
    const aluno = new Aluno(registro).inativar();
    return alunoRepo.atualizar(id, aluno);
  }

  async criarProfessor({ nome, email, registro }) {
    if (!nome || !email || !registro) {
      throw new ErroAplicacao('VALIDACAO', 'Nome, e-mail e registro são obrigatórios.');
    }
    const usuario = await usuarioRepo.criar({ nome, email, perfil: 'PROFESSOR' });
    return professorRepo.criar({ usuario_id: usuario.id, registro });
  }

  async listarProfessores() {
    return professorRepo.listar();
  }

  async buscarProfessorPorId(id) {
    const registro = await professorRepo.buscarPorId(id);
    if (!registro) throw new ErroAplicacao('NAO_ENCONTRADO', 'Professor não encontrado.', 404);
    return registro;
  }

  async editarProfessor(id, dados) {
    const registro = await this.buscarProfessorPorId(id);
    const professor = new Professor(registro);
    professor.editar(dados);
    return professorRepo.atualizar(id, professor);
  }

  async ativarProfessor(id) {
    const registro = await this.buscarProfessorPorId(id);
    const professor = new Professor(registro).ativar();
    return professorRepo.atualizar(id, professor);
  }

  async inativarProfessor(id) {
    const registro = await this.buscarProfessorPorId(id);
    const professor = new Professor(registro).inativar();
    return professorRepo.atualizar(id, professor);
  }

  async criarAdministrador({ nome, email }) {
    if (!nome || !email) {
      throw new ErroAplicacao('VALIDACAO', 'Nome e e-mail são obrigatórios.');
    }
    const usuario = await usuarioRepo.criar({ nome, email, perfil: 'ADMINISTRADOR' });
    return new Administrador(usuario);
  }

  async listarAdministradores() {
    return usuarioRepo.listarAdministradores();
  }

  async buscarAdministradorPorId(id) {
    const registro = await usuarioRepo.buscarPorId(id);
    if (!registro || registro.perfil !== 'ADMINISTRADOR') {
      throw new ErroAplicacao('NAO_ENCONTRADO', 'Administrador não encontrado.', 404);
    }
    return registro;
  }

  async editarAdministrador(id, dados) {
    const registro = await this.buscarAdministradorPorId(id);
    const administrador = new Administrador(registro);
    administrador.editar(dados);
    return usuarioRepo.atualizar(id, administrador);
  }

  async ativarAdministrador(id) {
    await this.buscarAdministradorPorId(id);
    return usuarioRepo.alterarAtivo(id, true);
  }

  async inativarAdministrador(id) {
    await this.buscarAdministradorPorId(id);
    return usuarioRepo.alterarAtivo(id, false);
  }

  async _carregarAcompanhamento(id) {
    const registro = await acompanhamentoRepo.buscarPorId(id);
    if (!registro) throw new ErroAplicacao('NAO_ENCONTRADO', 'Acompanhamento não encontrado.', 404);
    return { registro, dominio: new Acompanhamento(registro) };
  }

  async criarAcompanhamento(dados, usuarioLogadoId) {
    const { aluno_id, turma_id, disciplina_id, bimestre_id, professor_id, descricao, media } = dados;
    if (!aluno_id || !turma_id || !disciplina_id || !bimestre_id || !professor_id) {
      throw new ErroAplicacao('VALIDACAO', 'aluno, turma, disciplina, bimestre e professor são obrigatórios.');
    }

    const acompanhamento = new Acompanhamento({ aluno_id, turma_id, disciplina_id, bimestre_id, professor_id });
    acompanhamento.editar({ descricao, media });

    const id = await acompanhamentoRepo.criar(acompanhamento);
    await acompanhamentoRepo.registrarHistorico({
      acompanhamento_id: id, usuario_id: usuarioLogadoId, status_anterior: null, status_novo: 'RASCUNHO'
    });
    return this._carregarAcompanhamento(id).then((r) => r.registro);
  }

  async listarAcompanhamentos() {
    return acompanhamentoRepo.listar();
  }

  async buscarAcompanhamentoPorId(id) {
    const { registro } = await this._carregarAcompanhamento(id);
    return registro;
  }

  async editarAcompanhamento(id, dados) {
    const { dominio } = await this._carregarAcompanhamento(id);
    dominio.editar(dados);
    await acompanhamentoRepo.atualizar(id, dominio);
    return this.buscarAcompanhamentoPorId(id);
  }

  async _transicionar(id, usuarioLogadoId, aplicarTransicao) {
    const { dominio } = await this._carregarAcompanhamento(id);
    const statusAnterior = dominio.status;
    aplicarTransicao(dominio);
    await acompanhamentoRepo.atualizar(id, dominio);
    await acompanhamentoRepo.registrarHistorico({
      acompanhamento_id: id, usuario_id: usuarioLogadoId, status_anterior: statusAnterior, status_novo: dominio.status
    });
    return this.buscarAcompanhamentoPorId(id);
  }

  async enviarAcompanhamento(id, usuarioLogadoId) {
    return this._transicionar(id, usuarioLogadoId, (a) => a.enviar());
  }

  async iniciarRevisao(id, usuarioLogadoId) {
    return this._transicionar(id, usuarioLogadoId, (a) => a.iniciarRevisao());
  }

  async devolverAcompanhamento(id, usuarioLogadoId) {
    return this._transicionar(id, usuarioLogadoId, (a) => a.devolver());
  }

  async publicarAcompanhamento(id, usuarioLogadoId) {
    return this._transicionar(id, usuarioLogadoId, (a) => a.publicar(usuarioLogadoId));
  }

  async cancelarAcompanhamento(id, usuarioLogadoId) {
    return this._transicionar(id, usuarioLogadoId, (a) => a.cancelar());
  }
}

module.exports = new Sistema();
