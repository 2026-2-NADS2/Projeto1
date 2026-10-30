import configuracao_escola from './configuracao_escola.js';
import usuario from './usuarios.js';
import professor from './professores.js';
import responsavel from './responsaveis.js';
import aluno from './alunos.js';
import aluno_responsavel from './aluno_responsavel.js';
import area_disciplina from './area_disciplina.js';
import disciplina from './disciplinas.js';
import turma from './turmas.js';
import matricula_turma from './matricula_turma.js';
import vinculo_docente from './vinculo_docente.js';
import bimestre from './bimestres.js';
import tag from './tags.js';
import acompanhamento from './acompanhamentos.js';
import acompanhamento_tag from './acompanhamento_tag.js';
import credenciais_demo from './credenciais_demo.js';

const db = {
  configuracao_escola, usuario, professor, responsavel, aluno, aluno_responsavel,
  area_disciplina, disciplina, turma, matricula_turma, vinculo_docente, bimestre,
  tag, acompanhamento, acompanhamento_tag, credenciais_demo
};

export default db;
