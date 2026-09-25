
const Aluno = require('./src/classes/Aluno');
const Professor = require('./src/classes/Professor');
const Administrador = require('./src/classes/Administrador');
const { Acompanhamento } = require('./src/classes/Acompanhamento');

console.log('--- Aluno ---');
const aluno = new Aluno({ id: 1, nome: 'Lucas Ramos', data_nascimento: '2016-07-08', matricula: '20260001' });
console.log(aluno);
aluno.editar({ nome: 'Lucas Ramos Silva' });
aluno.inativar();
console.log(aluno);

console.log('--- Professor ---');
const professor = new Professor({ id: 1, usuario_id: 2, registro: 'PROF-0001', nome: 'Professor Demo' });
professor.editar({ registro: 'PROF-0002' });
console.log(professor);

console.log('--- Administrador ---');
const admin = new Administrador({ id: 1, nome: 'Admin 4U', email: 'admin@escola4u.test' });
admin.editar({ email: 'novo-email@escola4u.test' });
console.log(admin);

console.log('--- Acompanhamento (máquina de estados) ---');
const acompanhamento = new Acompanhamento({
  id: 1, aluno_id: 1, turma_id: 1, disciplina_id: 1, bimestre_id: 1, professor_id: 1
});
acompanhamento.editar({ descricao: 'Bom desempenho no bimestre', media: 8.5 });
console.log('depois de editar:', acompanhamento.status);
acompanhamento.enviar();
console.log('depois de enviar:', acompanhamento.status);
acompanhamento.iniciarRevisao();
console.log('depois de iniciarRevisao:', acompanhamento.status);
acompanhamento.publicar(99);
console.log('depois de publicar:', acompanhamento.status, '| publicado_em:', acompanhamento.publicado_em);

// Tentativa inválida: publicar de novo (já está PUBLICADO) deve lançar erro
try {
  acompanhamento.publicar(99);
} catch (erro) {
  console.log('Erro esperado ao tentar publicar de novo:', erro.message);
}
