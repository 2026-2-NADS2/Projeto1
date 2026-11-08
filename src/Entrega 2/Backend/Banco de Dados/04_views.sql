-- =====================================================================
-- 4U - 04_views.sql : views do sistema (7)
-- Rode depois de 01_schema.sql.
-- =====================================================================

USE acompanhamento_4u;

-- Remove views antigas que nao sao mais usadas.
DROP VIEW IF EXISTS vw_indicadores_turma, vw_progresso_bimestre,
                    vw_tags_por_bimestre, vw_ciencia_pendente,
                    vw_vinculos_academicos;


-- View 1 - vw_relatorio_publicado  (Pai/Responsavel: Relatorio do aluno - RF08)
CREATE OR REPLACE VIEW vw_relatorio_publicado AS
SELECT a.aluno_id, al.nome AS aluno, b.numero AS bimestre,
       d.nome AS disciplina, a.media, a.descricao
FROM acompanhamento a
INNER JOIN aluno al ON al.id = a.aluno_id
INNER JOIN bimestre b ON b.id = a.bimestre_id
INNER JOIN disciplina d ON d.id = a.disciplina_id
WHERE a.status = 'PUBLICADO';


-- View 2 - vw_desempenho_aluno  (Pai/Responsavel: Dashboard do responsavel - RF08)
CREATE OR REPLACE VIEW vw_desempenho_aluno AS
SELECT a.aluno_id, b.numero AS bimestre,
       COUNT(*) AS disciplinas,
       ROUND(AVG(a.media), 2) AS media_geral
FROM acompanhamento a
INNER JOIN bimestre b ON b.id = a.bimestre_id
WHERE a.status = 'PUBLICADO'
GROUP BY a.aluno_id, b.numero;


-- View 3 - vw_painel_professor  (Professor: Painel do Professor - RF06)
CREATE OR REPLACE VIEW vw_painel_professor AS
SELECT a.id AS acompanhamento_id, a.professor_id,
       al.nome AS aluno, d.nome AS disciplina,
       a.status, a.atualizado_em
FROM acompanhamento a
INNER JOIN aluno al ON al.id = a.aluno_id
INNER JOIN disciplina d ON d.id = a.disciplina_id
WHERE a.status IN ('RASCUNHO', 'ENVIADO', 'EM_REVISAO', 'DEVOLVIDO');


-- View 4 - vw_turmas_professor  (Professor: Minhas turmas - RF03)
CREATE OR REPLACE VIEW vw_turmas_professor AS
SELECT v.professor_id, t.nome AS turma, d.nome AS disciplina
FROM vinculo_docente v
INNER JOIN turma t ON t.id = v.turma_id
INNER JOIN disciplina d ON d.id = v.disciplina_id;


-- View 5 - vw_fila_revisao  (Administrador: Revisao e publicacao - RF06)
CREATE OR REPLACE VIEW vw_fila_revisao AS
SELECT a.id AS acompanhamento_id, al.nome AS aluno,
       d.nome AS disciplina, a.media, a.atualizado_em
FROM acompanhamento a
INNER JOIN aluno al ON al.id = a.aluno_id
INNER JOIN disciplina d ON d.id = a.disciplina_id
WHERE a.status IN ('ENVIADO', 'EM_REVISAO');


-- View 6 - vw_indicadores_disciplina  (Administrador: Relatorio Gerencial - RF10)
CREATE OR REPLACE VIEW vw_indicadores_disciplina AS
SELECT b.numero AS bimestre, d.nome AS disciplina,
       COUNT(*) AS publicados,
       ROUND(AVG(a.media), 2) AS media_geral
FROM acompanhamento a
INNER JOIN bimestre b ON b.id = a.bimestre_id
INNER JOIN disciplina d ON d.id = a.disciplina_id
WHERE a.status = 'PUBLICADO'
GROUP BY b.numero, d.nome;


-- View 7 - vw_trilha_alteracoes  (Administrador: Auditoria do sistema - RF07)
CREATE OR REPLACE VIEW vw_trilha_alteracoes AS
SELECT acompanhamento_id, data_hora, usuario_id,
       'ESTADO' AS tipo, status_novo AS detalhe
FROM acompanhamento_historico
UNION ALL
SELECT acompanhamento_id, criado_em, autor_id,
       'TEXTO', motivo
FROM acompanhamento_versao;


-- Conferencia: lista as 7 views.
SELECT TABLE_NAME FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = 'acompanhamento_4u' ORDER BY TABLE_NAME;


-- =====================================================================
-- CONSULTAS DE EXEMPLO (precisam dos dados de 03_carga.sql)
-- =====================================================================

-- View 1
SELECT disciplina, media, descricao
FROM vw_relatorio_publicado
WHERE aluno_id = 42 AND bimestre = 3;

-- View 2
SELECT bimestre, media_geral
FROM vw_desempenho_aluno
WHERE aluno_id = 42
ORDER BY bimestre;

-- View 3
SELECT aluno, disciplina, atualizado_em
FROM vw_painel_professor
WHERE professor_id = 12 AND status = 'DEVOLVIDO'
ORDER BY atualizado_em DESC;

-- View 4
SELECT turma, disciplina
FROM vw_turmas_professor
WHERE professor_id = 12
ORDER BY turma;

-- View 5
SELECT aluno, disciplina, media
FROM vw_fila_revisao
ORDER BY atualizado_em
LIMIT 20;

-- View 6
SELECT disciplina, media_geral
FROM vw_indicadores_disciplina
WHERE bimestre = 3
ORDER BY media_geral;

-- View 7
SELECT data_hora, tipo, detalhe
FROM vw_trilha_alteracoes
WHERE acompanhamento_id = 15230
ORDER BY data_hora;
