-- =====================================================================
-- 4U - 01_schema.sql : estrutura do banco (20 tabelas)
-- MySQL 8.0.16+ / InnoDB. Indices de performance em 02_indices.sql.
-- =====================================================================

DROP DATABASE IF EXISTS acompanhamento_4u;
CREATE DATABASE acompanhamento_4u
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE acompanhamento_4u;


-- =====================================================================
-- BLOCO 0 - CONFIGURACAO DA ESCOLA
-- =====================================================================

-- Escala de medias e contato da escola. 
CREATE TABLE configuracao_escola (
  id               TINYINT UNSIGNED NOT NULL DEFAULT 1,
  nome             VARCHAR(150)  NOT NULL,
  email_contato    VARCHAR(180)  NOT NULL,
  telefone         VARCHAR(20)   NOT NULL,
  endereco         VARCHAR(255)  NULL,
  media_minima     DECIMAL(4,2)  NOT NULL DEFAULT 0.00,
  media_maxima     DECIMAL(4,2)  NOT NULL DEFAULT 10.00,
  media_aprovacao  DECIMAL(4,2)  NOT NULL DEFAULT 6.00,
  atualizado_em    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_configuracao_escola PRIMARY KEY (id),
  CONSTRAINT ck_config_linha_unica  CHECK (id = 1),
  CONSTRAINT ck_config_escala       CHECK (media_maxima > media_minima),
  CONSTRAINT ck_config_aprovacao    CHECK (media_aprovacao BETWEEN media_minima AND media_maxima)
) ENGINE=InnoDB;


-- =====================================================================
-- BLOCO 1 - ACESSO E IDENTIDADE
-- =====================================================================

-- Quem acessa o sistema. Aluno nao e usuario (LGPD).
CREATE TABLE usuario (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome           VARCHAR(120) NOT NULL,
  email          VARCHAR(180) NOT NULL,
  senha_hash     VARCHAR(72)  NULL COMMENT 'NULL ate o primeiro acesso ser concluido',
  perfil         ENUM('ADMINISTRADOR','PROFESSOR','RESPONSAVEL') NOT NULL,
  ativo          TINYINT(1)   NOT NULL DEFAULT 1,
  ultimo_acesso  DATETIME     NULL,
  criado_em      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuario PRIMARY KEY (id)
  -- UNIQUE de email criada em 02_indices.sql (indice 1).
) ENGINE=InnoDB;

-- Tokens de primeiro acesso e recuperacao de senha (RF01). Guarda so o hash.
CREATE TABLE token_acesso (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  token_hash  CHAR(64)     NOT NULL COMMENT 'SHA-256 do token enviado por e-mail',
  tipo        ENUM('PRIMEIRO_ACESSO','RECUPERACAO_SENHA') NOT NULL,
  expira_em   DATETIME     NOT NULL,
  usado_em    DATETIME     NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_token_acesso  PRIMARY KEY (id),
  CONSTRAINT uq_token_hash    UNIQUE (token_hash),
  CONSTRAINT fk_token_usuario FOREIGN KEY (usuario_id)
             REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Dados do usuario com perfil PROFESSOR.
CREATE TABLE professor (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  registro    VARCHAR(20)  NOT NULL COMMENT 'registro funcional do docente',
  CONSTRAINT pk_professor          PRIMARY KEY (id),
  CONSTRAINT uq_professor_usuario  UNIQUE (usuario_id),
  CONSTRAINT uq_professor_registro UNIQUE (registro),
  CONSTRAINT fk_professor_usuario  FOREIGN KEY (usuario_id)
             REFERENCES usuario (id)
) ENGINE=InnoDB;

-- Dados do usuario com perfil RESPONSAVEL.
CREATE TABLE responsavel (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  telefone    VARCHAR(20)  NULL,
  CONSTRAINT pk_responsavel         PRIMARY KEY (id),
  CONSTRAINT uq_responsavel_usuario UNIQUE (usuario_id),
  CONSTRAINT fk_responsavel_usuario FOREIGN KEY (usuario_id)
             REFERENCES usuario (id)
) ENGINE=InnoDB;


-- =====================================================================
-- BLOCO 2 - ESTRUTURA ESCOLAR
-- =====================================================================

-- Alunos matriculados.
CREATE TABLE aluno (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome             VARCHAR(120) NOT NULL,
  data_nascimento  DATE         NOT NULL,
  matricula        VARCHAR(20)  NOT NULL,
  ativo            TINYINT(1)   NOT NULL DEFAULT 1,
  criado_em        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_aluno           PRIMARY KEY (id),
  CONSTRAINT uq_aluno_matricula UNIQUE (matricula)
) ENGINE=InnoDB;

-- Vinculo N:N entre aluno e responsavel.
CREATE TABLE aluno_responsavel (
  aluno_id        INT UNSIGNED NOT NULL,
  responsavel_id  INT UNSIGNED NOT NULL,
  parentesco      ENUM('MAE','PAI','AVO','TUTOR','OUTRO') NOT NULL DEFAULT 'OUTRO',
  autorizado      TINYINT(1)   NOT NULL DEFAULT 1,
  CONSTRAINT pk_aluno_responsavel PRIMARY KEY (aluno_id, responsavel_id),
  CONSTRAINT fk_ar_aluno          FOREIGN KEY (aluno_id)
             REFERENCES aluno (id) ON DELETE CASCADE,
  CONSTRAINT fk_ar_responsavel    FOREIGN KEY (responsavel_id)
             REFERENCES responsavel (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Areas do conhecimento que agrupam as disciplinas.
CREATE TABLE area_disciplina (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome  VARCHAR(80)  NOT NULL,
  CONSTRAINT pk_area_disciplina PRIMARY KEY (id),
  CONSTRAINT uq_area_nome       UNIQUE (nome)
) ENGINE=InnoDB;

-- Disciplinas oferecidas.
CREATE TABLE disciplina (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome     VARCHAR(80)  NOT NULL,
  area_id  INT UNSIGNED NOT NULL,
  ativo    TINYINT(1)   NOT NULL DEFAULT 1,
  CONSTRAINT pk_disciplina      PRIMARY KEY (id),
  CONSTRAINT uq_disciplina_nome UNIQUE (nome),
  CONSTRAINT fk_disciplina_area FOREIGN KEY (area_id)
             REFERENCES area_disciplina (id)
) ENGINE=InnoDB;

-- Turmas por ano letivo (1o ao 9o ano).
CREATE TABLE turma (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(40)  NOT NULL COMMENT 'ex.: 5o ano B',
  ano_serie   TINYINT UNSIGNED  NOT NULL COMMENT '1 a 9 (Ensino Fundamental)',
  ano_letivo  SMALLINT UNSIGNED NOT NULL,
  ativo       TINYINT(1)   NOT NULL DEFAULT 1,
  CONSTRAINT pk_turma          PRIMARY KEY (id),
  CONSTRAINT uq_turma_nome_ano UNIQUE (nome, ano_letivo),
  CONSTRAINT ck_turma_serie    CHECK (ano_serie BETWEEN 1 AND 9)
) ENGINE=InnoDB;

-- Aluno na turma. Uma turma por aluno em cada ano letivo.
CREATE TABLE matricula_turma (
  turma_id    INT UNSIGNED NOT NULL,
  aluno_id    INT UNSIGNED NOT NULL,
  ano_letivo  SMALLINT UNSIGNED NOT NULL,
  CONSTRAINT pk_matricula_turma PRIMARY KEY (turma_id, aluno_id),
  CONSTRAINT uq_aluno_ano       UNIQUE (aluno_id, ano_letivo)
             COMMENT 'um aluno so pode estar em uma turma por ano letivo',
  CONSTRAINT fk_mt_turma        FOREIGN KEY (turma_id) REFERENCES turma (id),
  CONSTRAINT fk_mt_aluno        FOREIGN KEY (aluno_id) REFERENCES aluno (id)
) ENGINE=InnoDB;

-- Professor da disciplina na turma. Um por turma e disciplina (RF03).
CREATE TABLE vinculo_docente (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  turma_id       INT UNSIGNED NOT NULL,
  disciplina_id  INT UNSIGNED NOT NULL,
  professor_id   INT UNSIGNED NOT NULL,
  CONSTRAINT pk_vinculo_docente   PRIMARY KEY (id),
  CONSTRAINT uq_vinculo_turma_dis UNIQUE (turma_id, disciplina_id),
  CONSTRAINT fk_vd_turma          FOREIGN KEY (turma_id)      REFERENCES turma (id),
  CONSTRAINT fk_vd_disciplina     FOREIGN KEY (disciplina_id) REFERENCES disciplina (id),
  CONSTRAINT fk_vd_professor      FOREIGN KEY (professor_id)  REFERENCES professor (id)
) ENGINE=InnoDB;


-- =====================================================================
-- BLOCO 3 - CICLO LETIVO
-- =====================================================================

-- Periodo de digitacao de cada bimestre (RF04).
CREATE TABLE bimestre (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ano_letivo    SMALLINT UNSIGNED NOT NULL,
  numero        TINYINT UNSIGNED  NOT NULL,
  abertura      DATETIME NOT NULL,
  encerramento  DATETIME NOT NULL,
  CONSTRAINT pk_bimestre        PRIMARY KEY (id),
  CONSTRAINT uq_bimestre_ano    UNIQUE (ano_letivo, numero),
  CONSTRAINT ck_bimestre_numero CHECK (numero BETWEEN 1 AND 4),
  CONSTRAINT ck_bimestre_data   CHECK (encerramento > abertura)
) ENGINE=InnoDB;


-- =====================================================================
-- BLOCO 4 - ACOMPANHAMENTO
-- =====================================================================

-- Etiquetas usadas nos acompanhamentos.
CREATE TABLE tag (
  id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome   VARCHAR(60)  NOT NULL,
  cor    CHAR(7)      NOT NULL DEFAULT '#3F3A36',
  ativo  TINYINT(1)   NOT NULL DEFAULT 1,
  CONSTRAINT pk_tag      PRIMARY KEY (id),
  CONSTRAINT uq_tag_nome UNIQUE (nome)
) ENGINE=InnoDB;

-- Relatorio do aluno por disciplina e bimestre (versao atual).
CREATE TABLE acompanhamento (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  aluno_id       INT UNSIGNED NOT NULL,
  turma_id       INT UNSIGNED NOT NULL,
  disciplina_id  INT UNSIGNED NOT NULL,
  professor_id   INT UNSIGNED NOT NULL,
  bimestre_id    INT UNSIGNED NOT NULL,
  descricao      TEXT         NOT NULL,
  media          DECIMAL(4,2) NOT NULL,
  status         ENUM('RASCUNHO','ENVIADO','EM_REVISAO',
                      'DEVOLVIDO','PUBLICADO','CANCELADO')
                 NOT NULL DEFAULT 'RASCUNHO',
  versao_atual   SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  revisor_id     INT UNSIGNED NULL,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                 ON UPDATE CURRENT_TIMESTAMP,
  publicado_em   DATETIME NULL,
  CONSTRAINT pk_acompanhamento PRIMARY KEY (id),
  CONSTRAINT uq_acompanhamento UNIQUE (aluno_id, turma_id, disciplina_id, bimestre_id),
  CONSTRAINT ck_acomp_media    CHECK (media >= 0 AND media <= 10),
  CONSTRAINT fk_ac_aluno       FOREIGN KEY (aluno_id)      REFERENCES aluno (id),
  CONSTRAINT fk_ac_turma       FOREIGN KEY (turma_id)      REFERENCES turma (id),
  CONSTRAINT fk_ac_disciplina  FOREIGN KEY (disciplina_id) REFERENCES disciplina (id),
  CONSTRAINT fk_ac_professor   FOREIGN KEY (professor_id)  REFERENCES professor (id),
  CONSTRAINT fk_ac_bimestre    FOREIGN KEY (bimestre_id)   REFERENCES bimestre (id),
  CONSTRAINT fk_ac_revisor     FOREIGN KEY (revisor_id)    REFERENCES usuario (id)
) ENGINE=InnoDB;

-- Versoes do texto e da media. Versao 1 = original do professor (RF07).
CREATE TABLE acompanhamento_versao (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  acompanhamento_id  INT UNSIGNED      NOT NULL,
  numero_versao      SMALLINT UNSIGNED NOT NULL,
  descricao          TEXT              NOT NULL,
  media              DECIMAL(4,2)      NOT NULL,
  autor_id           INT UNSIGNED      NOT NULL COMMENT 'quem gravou esta versao',
  motivo             VARCHAR(255)      NULL COMMENT 'justificativa da alteracao',
  criado_em          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_acompanhamento_versao PRIMARY KEY (id),
  CONSTRAINT uq_acomp_versao          UNIQUE (acompanhamento_id, numero_versao),
  CONSTRAINT fk_av_acompanhamento     FOREIGN KEY (acompanhamento_id)
             REFERENCES acompanhamento (id) ON DELETE CASCADE,
  CONSTRAINT fk_av_autor              FOREIGN KEY (autor_id)
             REFERENCES usuario (id)
) ENGINE=InnoDB;

-- Tags de cada acompanhamento.
CREATE TABLE acompanhamento_tag (
  acompanhamento_id  INT UNSIGNED NOT NULL,
  tag_id             INT UNSIGNED NOT NULL,
  CONSTRAINT pk_acompanhamento_tag PRIMARY KEY (acompanhamento_id, tag_id),
  CONSTRAINT fk_at_acompanhamento  FOREIGN KEY (acompanhamento_id)
             REFERENCES acompanhamento (id) ON DELETE CASCADE,
  CONSTRAINT fk_at_tag             FOREIGN KEY (tag_id) REFERENCES tag (id)
) ENGINE=InnoDB;

-- Mudancas de status do acompanhamento (quem, quando, de/para).
CREATE TABLE acompanhamento_historico (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  acompanhamento_id  INT UNSIGNED NOT NULL,
  usuario_id         INT UNSIGNED NOT NULL,
  status_anterior    ENUM('RASCUNHO','ENVIADO','EM_REVISAO',
                          'DEVOLVIDO','PUBLICADO','CANCELADO') NULL,
  status_novo        ENUM('RASCUNHO','ENVIADO','EM_REVISAO',
                          'DEVOLVIDO','PUBLICADO','CANCELADO') NOT NULL,
  data_hora          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observacao         VARCHAR(255) NULL,
  CONSTRAINT pk_acompanhamento_historico PRIMARY KEY (id),
  CONSTRAINT fk_ah_acompanhamento FOREIGN KEY (acompanhamento_id)
             REFERENCES acompanhamento (id) ON DELETE CASCADE,
  CONSTRAINT fk_ah_usuario        FOREIGN KEY (usuario_id)
             REFERENCES usuario (id)
) ENGINE=InnoDB;

-- Ciencia do responsavel no relatorio, com observacao opcional (RF12).
CREATE TABLE ciencia_responsavel (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  acompanhamento_id  INT UNSIGNED NOT NULL,
  responsavel_id     INT UNSIGNED NOT NULL,
  data_hora          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observacao         VARCHAR(500) NULL,
  CONSTRAINT pk_ciencia_responsavel PRIMARY KEY (id),
  CONSTRAINT uq_ciencia             UNIQUE (acompanhamento_id, responsavel_id),
  CONSTRAINT fk_cr_acompanhamento   FOREIGN KEY (acompanhamento_id)
             REFERENCES acompanhamento (id) ON DELETE CASCADE,
  CONSTRAINT fk_cr_responsavel      FOREIGN KEY (responsavel_id)
             REFERENCES responsavel (id)
) ENGINE=InnoDB;


-- =====================================================================
-- BLOCO 5 - AREA PUBLICA
-- =====================================================================

-- Mensagens do formulario de contato (sem login).
CREATE TABLE mensagem_contato (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(120) NOT NULL,
  email       VARCHAR(180) NOT NULL,
  telefone    VARCHAR(20)  NULL,
  assunto     VARCHAR(150) NOT NULL,
  mensagem    TEXT         NOT NULL,
  status      ENUM('NOVA','LIDA','RESPONDIDA') NOT NULL DEFAULT 'NOVA',
  respondida_por INT UNSIGNED NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_mensagem_contato PRIMARY KEY (id),
  CONSTRAINT fk_mc_respondida_por FOREIGN KEY (respondida_por)
             REFERENCES usuario (id)
) ENGINE=InnoDB;


-- Nao ha auto-cadastro: o administrador cadastra e a pessoa ativa a
-- conta pelo token de PRIMEIRO_ACESSO.

-- Conferencia dos indices criados pelo schema (o InnoDB cria os das FKs):
--   SELECT TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX, COLUMN_NAME, NON_UNIQUE
--   FROM information_schema.STATISTICS
--   WHERE TABLE_SCHEMA = 'acompanhamento_4u'
--   ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
