# 4U — API (Entrega 2)

API em **Node.js + Express + mysql2** que liga as telas ao banco MySQL `acompanhamento_4u`.
O passo a passo para rodar (banco, `.env`, `npm install`) está no [README da Entrega 2](../README.md).

```bash
npm install
npm run dev        # http://localhost:3000/api  ·  teste do banco: /api/saude
```

## Arquitetura em camadas

```
routes/         qual URL chama qual função e quais middlewares protegem a rota
middlewares/    autenticar (JWT), exigirPerfil, exigirAdministrador, limitarTentativas
controllers/    lê e valida a requisição, monta a resposta; consultas de leitura (listas, relatórios)
classes/        POO: regras de negócio e gravações (Sistema, Aluno, Professor, Administrador, Acompanhamento)
repositorios/   consultas reaproveitadas (bimestre atual, configuração da escola, links de acesso)
utils/          ErroApi, validação, senha (scrypt), token, formato
database/       pool de conexões do MySQL (lê o .env)
```

- Toda gravação que mexe em mais de uma tabela roda em **transação** (grava tudo ou nada).
- SQL sempre **parametrizado** (`?`): nada de concatenar valores (proteção contra SQL injection).
- Erros sempre no formato `{ "mensagem": "...", "campos": { "campo": "erro" } }`, sem expor o erro do banco.
- Horário de Brasília em toda conexão (`SET time_zone = '-03:00'`), também na nuvem.

## Segurança

| Item | Como |
|---|---|
| Senha | hash **scrypt** com salt (`usuario.senha_hash`), comparação em tempo constante |
| Login | JWT (HS256) com validade de 2 h; até 10 tentativas a cada 10 min por IP |
| Desativar acesso | o middleware `autenticar` confere `usuario.ativo` a cada requisição: quem é desativado sai na hora |
| Primeiro acesso / nova senha | link de uso único enviado por **e-mail** (Gmail + nodemailer, `utils/email.js`); no banco fica só o **SHA-256** do token (`token_acesso`). Convite vale 3 dias, nova senha 30 min |
| Esqueci a senha | resposta igual para qualquer e-mail (não revela quem é cadastrado); só gera link para conta ativa e com senha criada |
| Menor privilégio | professor só acessa os próprios vínculos; responsável só alunos com `autorizado = 1` e só registros `PUBLICADO` (LGPD) |
| Auditoria | toda mudança de status grava em `acompanhamento_historico`; toda mudança de texto ou média gera uma versão em `acompanhamento_versao` |
| CSV | proteção contra fórmula injetada nas células exportadas |

## Rotas

`🔒` = exige login. Perfis: **A** administrador, **P** professor, **R** responsável.

| Método e rota | Quem | O que faz |
|---|---|---|
| `POST /api/auth/login` | público | entra e recebe o token |
| `POST /api/auth/esqueci-senha` | público | envia por e-mail o link de nova senha (30 min) |
| `POST /api/auth/link` | público | confere se um link ainda vale |
| `POST /api/auth/definir-senha` | público | cria a senha (primeiro acesso) ou troca (esqueci a senha) |
| `GET /api/escola/contato` · `POST /api/contato` | público | contato da escola e formulário |
| `GET /api/admin/resumo` · `/admin/acompanhamentos` · `/admin/cadastros/contagens` | 🔒 A | dashboard |
| `GET /api/turmas` · `GET /api/admin/disciplinas` | 🔒 A | listas para os formulários |
| `GET POST /api/{alunos,professores,responsaveis}` | 🔒 A | lista paginada com busca / cadastra |
| `GET PUT DELETE /api/{entidade}/:id` | 🔒 A | detalhe / edita / exclui (só sem histórico) |
| `PATCH /api/{entidade}/:id/situacao` | 🔒 A | desativa ou reativa (`{ "ativo": false }`) |
| `POST /api/{professores,responsaveis}/:id/convite` | 🔒 A | libera o acesso e envia o convite por e-mail |
| `POST DELETE /api/professores/:id/vinculos` | 🔒 A | atribui ou remove turma e disciplina |
| `POST DELETE /api/responsaveis/:id/alunos` | 🔒 A | vincula ou desvincula aluno (parentesco, autorização) |
| `GET /api/acompanhamentos` | 🔒 A | fila de revisão com filtros e paginação |
| `GET /api/acompanhamentos/:id` | 🔒 A P R | detalhe, tags, histórico (`vw_trilha_alteracoes`) e ciências |
| `PUT /api/acompanhamentos/:id` | 🔒 A | ajusta texto/média na revisão (com motivo) |
| `PATCH /api/acompanhamentos/:id/publicar` · `/devolver` | 🔒 A | publica / devolve com motivo |
| `GET PUT /api/bimestres` | 🔒 A | lista / altera o período de digitação |
| `GET /api/admin/relatorios` · `/relatorios/exportar` | 🔒 A | indicadores (`vw_indicadores_disciplina`) / planilha .csv |
| `GET /api/tags` | 🔒 todos | tags ativas |
| `GET /api/professor/painel` · `/professor/vinculos/:id/alunos` · `/professor/retornos` | 🔒 P | painel, alunos da turma, devolvidos e observações |
| `POST /api/professor/acompanhamentos` · `PUT /professor/acompanhamentos/:id` | 🔒 P | registra / corrige (`"enviar": true` manda para revisão) |
| `GET /api/responsavel/painel` · `/responsavel/alunos` | 🔒 R | painel / alunos (`vw_desempenho_aluno`) |
| `GET /api/responsavel/alunos/:id/relatorio?bimestre_id=` | 🔒 R | relatório publicado completo |
| `POST /api/responsavel/acompanhamentos/:id/ciencia` · `/responsavel/alunos/:id/ciencia` | 🔒 R | dá ciência em uma disciplina / em todas do bimestre |
| `GET /api/saude` | público | confere a conexão com o banco |

## Onde cada conceito de POO aparece

| Conceito | Onde | Exemplo |
|---|---|---|
| Classe | `src/classes/*.js` | `class Acompanhamento { ... }` |
| Objeto / instanciação | `Sistema.js` | `new Acompanhamento({ ... })`, `Aluno.fromRow(linha)` |
| Encapsulamento | atributos com `_` e acesso por `get` ou por métodos | `acompanhamento.editar({ descricao, media })` |
| Método estático | `fromRow()` em cada classe | monta o objeto a partir de uma linha do banco |
| Máquina de estados | `Acompanhamento._transicionar()` | RASCUNHO não vira PUBLICADO sem passar pela revisão |

### Acompanhamento (`src/classes/Acompanhamento.js`)

```
RASCUNHO   → ENVIADO | CANCELADO
ENVIADO    → EM_REVISAO | CANCELADO
EM_REVISAO → PUBLICADO | DEVOLVIDO | CANCELADO
DEVOLVIDO  → ENVIADO | CANCELADO
PUBLICADO  → (não muda mais)
```

- `editar()`: o professor só edita RASCUNHO ou DEVOLVIDO.
- `editarNaRevisao()`: o administrador ajusta o texto em EM_REVISAO.
- Cada alteração real de texto ou média aumenta `versaoAtual` e vira uma linha em `acompanhamento_versao`.

### Sistema (`src/classes/Sistema.js`)

Reúne as regras de negócio e as gravações: cadastrar aluno já matriculado na turma, liberar e desativar
acessos, excluir só quem não tem histórico, atribuir turma ao professor (rascunhos em andamento passam para
quem assume a turma), e todo o fluxo do acompanhamento (registrar, enviar, revisar, devolver, publicar), sempre
gravando histórico e versões na mesma transação.

### Professor, Aluno e Administrador

`professor` e `responsavel` são extensões 1:1 de `usuario` (nome, e-mail, senha e situação ficam em `usuario`).
Não existe tabela de administrador: é `usuario.perfil = 'ADMINISTRADOR'`. O aluno não é usuário: quem acessa é o
responsável vinculado.
