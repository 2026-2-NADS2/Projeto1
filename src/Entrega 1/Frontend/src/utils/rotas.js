export const ROTAS = {
  home: '/',
  login: '/login',
  adminDashboard: '/admin',
  adminCadastros: '/admin/cadastros',
  professorDashboard: '/professor',
  responsavelDashboard: '/responsavel'
};

export const DASHBOARD_POR_PERFIL = {
  ADMINISTRADOR: ROTAS.adminDashboard,
  PROFESSOR: ROTAS.professorDashboard,
  RESPONSAVEL: ROTAS.responsavelDashboard
};

export const MENUS = {
  ADMINISTRADOR: [
    { rotulo: 'Dashboard', icone: 'painel', caminho: ROTAS.adminDashboard },
    { rotulo: 'Cadastros', icone: 'usuarios', caminho: ROTAS.adminCadastros },
    { rotulo: 'Acompanhamentos', icone: 'prancheta', caminho: null },
    { rotulo: 'Bimestres', icone: 'calendario', caminho: null },
    { rotulo: 'Relatórios', icone: 'grafico', caminho: null }
  ],
  PROFESSOR: [
    { rotulo: 'Dashboard', icone: 'painel', caminho: ROTAS.professorDashboard },
    { rotulo: 'Minhas turmas', icone: 'turma', caminho: null },
    { rotulo: 'Acompanhamentos', icone: 'prancheta', caminho: null },
    { rotulo: 'Retornos', icone: 'mensagem', caminho: null }
  ],
  RESPONSAVEL: [
    { rotulo: 'Dashboard', icone: 'painel', caminho: ROTAS.responsavelDashboard },
    { rotulo: 'Meus alunos', icone: 'aluno', caminho: null },
    { rotulo: 'Relatórios', icone: 'documento', caminho: null }
  ]
};
