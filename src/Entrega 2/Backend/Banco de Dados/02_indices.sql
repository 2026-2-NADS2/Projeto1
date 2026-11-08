-- =====================================================================
-- 4U - 02_indices.sql : indices de performance (7)
-- Rode depois de 01_schema.sql.
-- =====================================================================

USE acompanhamento_4u;

-- Indice 1: login pelo e-mail (e garante e-mail unico)
CREATE UNIQUE INDEX uq_usuario_email ON usuario (email);

-- Indice 2: relatorios por bimestre, status e disciplina
CREATE INDEX idx_acomp_bim_status_disc_media ON acompanhamento (bimestre_id, status, disciplina_id, media);

-- Indice 3: painel do professor
CREATE INDEX idx_acomp_professor_status_atualizado ON acompanhamento (professor_id, status, atualizado_em);

-- Indice 4: relatorios publicados do aluno (responsavel)
CREATE INDEX idx_acomp_aluno_status_bimestre ON acompanhamento (aluno_id, status, bimestre_id);

-- Indice 5: historico de um acompanhamento em ordem
CREATE INDEX idx_hist_acomp_data ON acompanhamento_historico (acompanhamento_id, data_hora);

-- Indice 6: busca de aluno pelo nome
CREATE INDEX idx_aluno_nome ON aluno (nome);

-- Indice 7: ultimos eventos do sistema (auditoria)
CREATE INDEX idx_hist_data ON acompanhamento_historico (data_hora);
