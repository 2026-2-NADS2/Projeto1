// Script Node.js que roda o cenário completo do enunciado, do começo ao fim.
// Rodar com: npm run demo
const Sistema = require('./Sistema');
const ConfiguracaoEscola = require('./models/ConfiguracaoEscola');

const sistema = new Sistema(new ConfiguracaoEscola({
  nome: 'Escola Municipal 4U',
  mediaMinima: 0,
  mediaMaxima: 10,
  mediaAprovacao: 6,
}));

// PASSO 0: instala o sistema (primeiro admin)
const admin = sistema.criarAdministradorInicial({
  nome: 'Coordenação KFKA',
  email: 'admin@escola.com',
  senhaSimulada: '123456',
});
console.log('=== 0. Sistema instalado ===');
console.log(`Admin inicial: ${admin.toString()}\n`);

// PASSO 1: admin monta a estrutura escolar e abre o bimestre
const professor = sistema.cadastrarProfessor(admin, {
  nome: 'Profa. Marina',
  email: 'marina@escola.com',
  registroFuncional: 'P-001',
  senhaSimulada: 'senha-marina',
});

const responsavel = sistema.cadastrarResponsavel(admin, {
  nome: 'Sr. Joao',
  email: 'joao@email.com',
  telefone: '11999990000',
  senhaSimulada: 'senha-joao',
});

const aluno = sistema.cadastrarAluno(admin, {
  nome: 'Pedro Souza',
  dataNascimento: '2015-03-10',
  matricula: '2026001',
  observacoes: 'Alérgico a amendoim. Usa óculos.',
});

sistema.vincularResponsavelAoAluno(admin, responsavel, aluno);

const turma = sistema.cadastrarTurma(admin, { nome: '5o Ano B', anoSerie: '5o Ano', anoLetivo: 2026 });
sistema.matricularAluno(admin, turma, aluno);

const areaMatematica = sistema.cadastrarAreaDisciplina(admin, 'Matematica');
const disciplina = sistema.cadastrarDisciplina(admin, { nome: 'Matematica', areaDisciplina: areaMatematica });
sistema.vincularDocente(admin, turma, professor, disciplina);

const tagParticipacao = sistema.cadastrarTag(admin, 'Participacao ativa');

const bimestre = sistema.abrirBimestre(admin, {
  numero: 3,
  anoLetivo: 2026,
  aberturaDigitacao: '2026-09-01T00:00:00',
  encerramentoDigitacao: '2026-12-31T23:59:59',
});

console.log('=== 1. Estrutura escolar cadastrada e bimestre aberto ===');
console.log(`Turma: ${turma.nome} | Area: ${areaMatematica.nome} > Disciplina: ${disciplina.nome} | Bimestre: ${bimestre.numero}o`);
console.log(`Observações do aluno: ${aluno.observacoes}\n`);

// PASSO 1b: prova que só o admin cadastra
console.log('=== 1b. Controle de acesso aos cadastros (RF02) ===');
try {
  sistema.cadastrarAluno(professor, { nome: 'Aluno Nao Autorizado', dataNascimento: '2015-01-01', matricula: '9999' });
  console.log('ERRO: professor conseguiu cadastrar (não deveria)');
} catch (erro) {
  console.log('Professor tentou cadastrar aluno ->', erro.message);
}
try {
  sistema.abrirBimestre(responsavel, { numero: 4, anoLetivo: 2026, aberturaDigitacao: '2026-01-01', encerramentoDigitacao: '2026-02-01' });
} catch (erro) {
  console.log('Responsavel tentou abrir bimestre ->', erro.message);
}
console.log();

// LOGIN do professor
const professorLogado = sistema.login('marina@escola.com', 'senha-marina');
console.log('=== Login do Professor ===');
console.log(`Login efetuado: ${professorLogado.toString()}\n`);

console.log('=== Minhas turmas (Professor) ===');
sistema.turmasDoProfessor(professor).forEach((t) => console.log(`- ${t.nome}`));
console.log();

// PASSO 2: professor registra e envia
const acompanhamento = sistema.professorRegistraAcompanhamento(professor, {
  aluno, turma, disciplina, bimestre,
  descricao: 'Pedro participou ativamente das aulas e evoluiu em fracoes.',
  media: 8.5,
  tags: [tagParticipacao],
});

console.log('=== Aba "rascunhos" do Professor ===');
console.log(sistema.acompanhamentosDoProfessor(professor, 'RASCUNHO').length, 'item(ns)\n');

console.log('=== Regra de unicidade do acompanhamento ===');
try {
  sistema.professorRegistraAcompanhamento(professor, { aluno, turma, disciplina, bimestre, descricao: 'Tentativa duplicada.', media: 7 });
} catch (erro) {
  console.log('Tentou registrar duplicado ->', erro.message);
}

console.log('=== Regra da escala de notas ===');
try {
  const bimestre4 = sistema.abrirBimestre(admin, { numero: 4, anoLetivo: 2026, aberturaDigitacao: '2026-09-01T00:00:00', encerramentoDigitacao: '2026-12-31T23:59:59' });
  sistema.professorRegistraAcompanhamento(professor, { aluno, turma, disciplina, bimestre: bimestre4, descricao: 'Media invalida.', media: 12 });
} catch (erro) {
  console.log('Tentou media 12 ->', erro.message);
}
console.log();

professor.enviarParaRevisao(acompanhamento);
console.log('=== Aba "enviados" do Professor ===');
console.log(sistema.acompanhamentosDoProfessor(professor, 'ENVIADO').length, 'item(ns)\n');

// PASSO 3: admin revisa e publica
console.log('=== Fila "em revisao" do Administrador ===');
console.log(sistema.acompanhamentosParaRevisao().length, 'item(ns) aguardando\n');

admin.revisarAcompanhamento(acompanhamento, {
  novaDescricao: 'Pedro participou ativamente das aulas e demonstrou evolucao consistente em fracoes.',
  motivo: 'Ajuste de redacao para maior clareza a familia',
});
sistema.adminPublicaAcompanhamento(admin, acompanhamento);

console.log('=== 3. Administrador revisou e publicou ===');
console.log(`Status: ${acompanhamento.status} | Versao atual: ${acompanhamento.versaoAtual}`);
console.log(`Publicado em: ${acompanhamento.publicadoEm}\n`);

console.log('=== Versoes do texto (RF07) ===');
acompanhamento.versoes.forEach((v) => console.log(`v${v.numeroVersao} (autor ${v.autorId}): ${v.motivo}`));
console.log();

console.log('=== Relatorios do Administrador (filtro por turma) ===');
sistema.filtrarAcompanhamentos({ turma }).forEach((a) => console.log(`- ${a.aluno.nome} | ${a.disciplina.nome} | ${a.status}`));
console.log();

console.log('=== Indicadores por disciplina (RF10) ===');
console.table(sistema.indicadoresPorDisciplina(bimestre));
console.log();

// PASSO 4: responsável consulta e gera PDF
console.log('=== 4. Meus alunos > Pedro > 3o bimestre > relatorio ===');
const relatoriosDoBimestre = responsavel.relatoriosDoAluno(aluno, bimestre);
relatoriosDoBimestre.forEach((r) => console.log(`- ${r.disciplina.nome} | media ${r.media}`));

const pdf = relatoriosDoBimestre[0].gerarResumoPDF();
console.log('\nDados prontos para o PDF:', pdf);

responsavel.registrarCiencia(acompanhamento, 'Obrigado pelo retorno!');
console.log('\nCiencia registrada:', acompanhamento.ciencia, '\n');

// PASSO 5: histórico de auditoria
console.log('=== 5. Historico de estados (auditoria) ===');
acompanhamento.historico.forEach((h) => console.log(`${h.estadoAnterior} -> ${h.estadoNovo} (usuario ${h.usuarioId})`));
