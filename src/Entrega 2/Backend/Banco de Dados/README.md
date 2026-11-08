# Banco de Dados — 4U (Entrega 2)

Banco **MySQL 8** `acompanhamento_4u`: 20 tabelas, 7 índices e 7 views.
Como criar no MySQL Workbench: veja o passo 2 do [README da Entrega 2](../../README.md).

| Arquivo | O que faz |
|---|---|
| `banco_completo.sql` | **Use este.** Apaga e recria tudo de uma vez (os quatro arquivos abaixo, na ordem). |
| `01_schema.sql` | Cria o banco e as 20 tabelas. |
| `02_indices.sql` | Cria os 7 índices de performance documentados na Entrega 1. |
| `03_carga.sql` | Insere os **dados fictícios** de demonstração. |
| `04_views.sql` | Cria as 7 views do documento da Entrega 2. |

Para rodar separado, siga a numeração: `01` → `02` → `03` → `04`.

## Dados de demonstração

Todos os dados são **fictícios**. Senha de todos os usuários: `4u@demo`.

| Perfil | E-mail |
|---|---|
| Administradora | rafaela.mello@4u.com · laura.rayssa@4u.com · anna.silva@4u.com · dilly.martins@4u.com |
| Professor | professor@escola4u.test |
| Responsável | responsavel@escola4u.test |

- Escola com turmas do 1º ao 5º ano (6 turmas), 9 disciplinas, 12 professores e 120 alunos.
- Ano letivo de 2026: do 1º ao 3º bimestre, tudo publicado. O **4º bimestre está aberto** (26/10 a 11/12), com registros em todos os estados.
- O registro funcional do professor tem **6 números** (ex.: `202601`).
- O professor de demonstração dá Matemática no 4º ano A, no 5º ano A e no 5º ano B.
- A responsável de demonstração tem dois filhos (2º ano A e 5º ano A) e relatórios ainda sem ciência.
- A professora Luciana Teixeira está **aguardando o primeiro acesso** (sem senha): bom exemplo para "Liberar acesso".
- Todo responsável tem pelo menos um aluno vinculado.
- Um responsável está cadastrado como **não autorizado**: pela regra de LGPD, ele não vê os relatórios.

As senhas são guardadas como hash **scrypt** (`scrypt$salt$hash`, 68 caracteres, cabe em `senha_hash VARCHAR(72)`).

## Revisão da estrutura

- 3ª forma normal: dados de pessoa ficam em `usuario`; `professor` e `responsavel` são extensões 1:1; o aluno não é usuário (LGPD).
- Integridade garantida pelo banco: chaves estrangeiras, `UNIQUE` (e-mail, matrícula, registro, um aluno por turma no ano, um registro por aluno/disciplina/bimestre) e `CHECK` (média de 0 a 10, bimestre de 1 a 4, encerramento depois da abertura).
- `acompanhamento.turma_id` repete a turma de propósito: o registro guarda em que turma o aluno estava naquele bimestre, mesmo se ele mudar de turma depois.
- Histórico nunca é apagado: o sistema **desativa** pessoas com registros em vez de excluir, e as tabelas de auditoria (`acompanhamento_historico`, `acompanhamento_versao`) guardam cada mudança.
- Links de acesso guardam só o SHA-256 do token (`token_acesso.token_hash`), nunca o link em si.
