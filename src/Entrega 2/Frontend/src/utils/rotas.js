export const ROTAS = {
  home: '/',
  login: '/login',
  esqueciSenha: '/esqueci-senha',
  definirSenha: '/definir-senha',
  sobre: '/sobre',
  ajuda: '/ajuda',
  contato: '/contato',
  adminDashboard: '/admin',
  adminCadastros: '/admin/cadastros',
  adminAcompanhamentos: '/admin/acompanhamentos',
  adminBimestres: '/admin/bimestres',
  adminRelatorios: '/admin/relatorios',
  professorDashboard: '/professor',
  professorTurmas: '/professor/turmas',
  professorAcompanhamentos: '/professor/acompanhamentos',
  professorRetornos: '/professor/retornos',
  responsavelDashboard: '/responsavel',
  responsavelAlunos: '/responsavel/alunos',
  responsavelRelatorios: '/responsavel/relatorios'
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
    { rotulo: 'Acompanhamentos', icone: 'prancheta', caminho: ROTAS.adminAcompanhamentos },
    { rotulo: 'Bimestres', icone: 'calendario', caminho: ROTAS.adminBimestres },
    { rotulo: 'Relatórios', icone: 'grafico', caminho: ROTAS.adminRelatorios }
  ],
  PROFESSOR: [
    { rotulo: 'Dashboard', icone: 'painel', caminho: ROTAS.professorDashboard },
    { rotulo: 'Minhas turmas', icone: 'turma', caminho: ROTAS.professorTurmas },
    { rotulo: 'Acompanhamentos', icone: 'prancheta', caminho: ROTAS.professorAcompanhamentos },
    { rotulo: 'Retornos', icone: 'mensagem', caminho: ROTAS.professorRetornos }
  ],
  RESPONSAVEL: [
    { rotulo: 'Dashboard', icone: 'painel', caminho: ROTAS.responsavelDashboard },
    { rotulo: 'Meus alunos', icone: 'aluno', caminho: ROTAS.responsavelAlunos },
    { rotulo: 'Relatórios', icone: 'documento', caminho: ROTAS.responsavelRelatorios }
  ]
};

/* Link de convite ou de nova senha a partir do token (modo demonstração) */
export function linkDefinirSenha(token) {
  return window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '') + ROTAS.definirSenha + '?token=' + token;
}
