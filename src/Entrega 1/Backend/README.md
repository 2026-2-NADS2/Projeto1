# 4U/KFKA — Backend de POO (Entrega 1)

Este é o backend em Node.js do projeto 4U, focado só em **Programação Orientada a Objetos**. Não é o sistema inteiro: é um recorte pequeno (Aluno, Professor, Administrador e Acompanhamento) para mostrar classe, objeto, atributo, método, construtor, encapsulamento e associação funcionando de verdade, ligado no banco de dados real do projeto (as 20 tabelas do nosso Dicionário de Dados).

**Projeto Interdisciplinar — 2º semestre de ADS — FECAP — 2026**

**Integrantes:**
- Anna Paula Alves Silva — RA 26029435
- Dilly Martins da Silva — RA 26029138
- Laura Rayssa Souza Araujo — RA 26029075
- Rafaela Carvalho Barcos Mello — RA 26029304

## O que é esse pedaço do projeto

O projeto 4U inteiro tem um front-end em React (as telas de login, dashboard etc.) e vai ter um backend que conversa com o MySQL. Esta entrega é a primeira parte do backend, e o professor pediu para ela mostrar POO na prática, então focamos só nas quatro coisas que dão para explicar bem na sala:

- **Aluno** — quem está sendo acompanhado.
- **Professor** — quem registra o acompanhamento.
- **Administrador** — quem representa a escola e controla os cadastros.
- **Acompanhamento** — o registro bimestral em si (a nota, a descrição, e o fluxo de revisão até ser publicado para a família).

Não tem tela aqui, é só a API (as rotas que o front vai chamar depois). Para testar, a gente usa o Postman.

## Por que o código conversa com o banco de 20 tabelas e não com um banco "de brinquedo"

Podíamos ter criado um banco simples só para esta entrega, mas achamos mais honesto ligar direto no banco real que o grupo já modelou (`acompanhamento_4u`). Só que o Dicionário de Dados **descreve** as tabelas, não é um script pronto com 100% das colunas. Então tivemos que tomar algumas decisões quando uma coluna não estava clara. Todas estão marcadas com comentário `SUPOSIÇÃO` direto no código, principalmente em `src/classes/Sistema.js`. A tabela abaixo resume:

| Suposição | Onde é usada | Se estiver errado no banco de vocês, ajuste em |
|---|---|---|
| `usuario` tem uma coluna `nome` | Nome do professor e do administrador aparecem daqui | `Sistema.js`, nas queries em `usuario` |
| `turma`, `disciplina`, `bimestre` só precisam ter uma coluna `id` | A gente só confere se o id existe antes de criar um acompanhamento; não cria essas três tabelas | `Sistema._existeNaTabela()` |
| `aluno` ganhou a coluna `observacoes` | Pedido do grupo para esta entrega (não existe no Dicionário de Dados original) | `ajustes_banco_real.sql` |

**Antes de rodar**, execute uma vez o script `ajustes_banco_real.sql` no banco que o grupo já criou:

```bash
mysql -u root -p acompanhamento_4u < ajustes_banco_real.sql
```

Ele adiciona a coluna `observacoes` em `aluno` e deixa comentados alguns `INSERT`s de `turma`/`disciplina`/`bimestre`, caso essas tabelas ainda estejam vazias (o `acompanhamento` depende delas por chave estrangeira).

## Como rodar

```bash
cd backend
npm install
cp .env.example .env      # preencha com o usuário/senha do MySQL de vocês
npm run dev                 # ou: npm start
```

API disponível em `http://localhost:3000/api`.

## O que ficou de fora de propósito

Um projeto desse tamanho não cabe inteiro numa Entrega 1, então cortamos o que não é essencial para mostrar POO. As tabelas já existem no banco, mas o código delas fica para a Entrega 2:

- **Tags** no acompanhamento (`acompanhamento_tag`).
- **Versionamento do texto** (`acompanhamento_versao`) e **histórico de status** (`acompanhamento_historico`).
- **Login de verdade.** O `usuario` já é criado com `senha_hash = NULL`, simulando o "aguardando primeiro acesso" que o Dicionário de Dados descreve, mas ainda não existe rota de login nem token.
- **Cadastro de turma/disciplina/bimestre.** Isso é do módulo Administrador do sistema completo; aqui a gente só valida que o id informado existe.

## Quem pode cadastrar (regra de negócio nova nesta entrega)

Uma regra do projeto 4U inteiro, que já estava definida no front-end, é que **ninguém se cadastra sozinho**: só a escola (o Administrador) cria novos professores e alunos no sistema. Isso faz sentido porque estamos lidando com dados de crianças, então a escola precisa controlar quem entra.

Implementamos isso como um **middleware** do Express, em `src/middlewares/exigirAdministrador.js`, e ligamos ele nas duas rotas de cadastro que existem nesta entrega:

```js
// src/routes/professorRoutes.js e src/routes/alunoRoutes.js
router.post('/', exigirAdministrador, controller.criar);
```

Um middleware é uma função que roda **antes** do controller. Se ela chamar `next()`, a requisição segue; se ela responder direto (com `res.status(...).json(...)`), a requisição para ali e o controller nem é chamado.

Como esta entrega ainda não tem login de verdade (é o próximo item da lista de "fora do escopo"), simplificamos: quem chama `POST /api/alunos` ou `POST /api/professores` precisa mandar, no cabeçalho HTTP, o id do administrador já logado:

```
x-usuario-id: 1
```

O middleware busca esse id na tabela `usuario` e confere duas coisas: se existe **e** se o `perfil` é `ADMINISTRADOR` e está `ativo`. Três respostas possíveis:

| Situação | O que acontece |
|---|---|
| Sem o cabeçalho `x-usuario-id` | `401` — nem chega a consultar o banco |
| Cabeçalho aponta para alguém que não é administrador, ou está inativo | `403` — bloqueado |
| Cabeçalho aponta para um administrador ativo | Segue para o controller, que cadastra normalmente |

Testamos os quatro casos (sem cabeçalho, administrador ativo, administrador inativo, e um id que não é administrador) simulando o banco, e o middleware respondeu do jeito esperado nos quatro. Na Entrega 2, quando existir login de verdade com token, só o **conteúdo** dessa função muda — o resto do sistema (rotas, controllers) continua igual, porque ninguém além do middleware sabe como a autenticação é verificada. Isso é um dos ganhos de organizar o código assim.

Reparem que `GET`, `PUT` e os `PATCH` continuam livres por enquanto — só a criação (`POST`) de aluno e professor foi restrita, porque foi o que pediram para esta entrega. Bloquear os outros verbos também é uma continuação natural para a Entrega 2, junto com o login.

## Onde cada conceito de POO aparece

| Conceito | Onde | Exemplo |
|---|---|---|
| Classe | `src/classes/*.js` | `class Aluno { ... }` |
| Objeto / instanciação | Dentro de `Sistema.js` | `new Aluno({ nome, matricula, ... })` |
| Atributo | Propriedades com `_` no começo | `this._nome`, `this._status` |
| Método | Funções dentro da classe | `editar()`, `publicar()`, `ativar()` |
| Construtor | `constructor({...})` em cada classe | Recebe um objeto com os dados e monta a instância |
| Encapsulamento | Atributo privado (`_nome`) + acesso só por `get nome()` ou por um método (`editar()`) | Ninguém troca `aluno._nome = 'x'` direto de fora |
| Associação entre classes | `Acompanhamento` guarda um `Aluno` e um `Professor` inteiros (objetos), não só o id | `this._aluno = aluno` |
| Máquina de estados | `Acompanhamento._transicionar()` | Um RASCUNHO não pode virar PUBLICADO sem passar por EM_REVISAO |

### Aluno (`src/classes/Aluno.js`)
Atributos: `id`, `nome`, `dataNascimento`, `matricula`, `observacoes` (coluna nova desta entrega), `ativo`. Métodos: `editar()`, `ativar()`, `inativar()`. É a classe mais simples, boa para começar a ler o código.

### Professor (`src/classes/Professor.js`)
Aqui tem um detalhe que achamos importante explicar: no banco real, "professor" não é uma tabela isolada — ela é uma **extensão** de `usuario` (relação 1 para 1, por `professor.usuario_id`). Nome, e-mail e se está ativo moram em `usuario`; `professor` só guarda o registro funcional. A classe `Professor` esconde isso: para quem usa a classe, parece um objeto só, com `professor.nome`, `professor.email` etc. Só o `Sistema.js` sabe que por trás disso são duas tabelas.

### Administrador (`src/classes/Administrador.js`)
Não existe tabela `administrador` no banco — um administrador é só uma linha de `usuario` com `perfil = 'ADMINISTRADOR'`. Mesmo assim criamos a classe, porque em POO ela representa o **papel** (o comportamento de um administrador), não precisa ter uma tabela exclusiva para existir como classe.

### Acompanhamento (`src/classes/Acompanhamento.js`)
A classe mais complexa. Reflete a tabela `acompanhamento`: quem é o aluno, o professor, a turma, a disciplina, o bimestre, a descrição, a média e o **status**. O status segue uma máquina de estados (simplificação das regras completas do projeto):

```
RASCUNHO   → ENVIADO | CANCELADO
ENVIADO    → EM_REVISAO | CANCELADO
EM_REVISAO → PUBLICADO | DEVOLVIDO | CANCELADO
DEVOLVIDO  → ENVIADO | CANCELADO
PUBLICADO  → (não muda mais)
CANCELADO  → (não muda mais)
```

O método `_transicionar()` confere se a mudança de status é permitida antes de aceitar. Por exemplo, não dá para publicar um acompanhamento que ainda está em RASCUNHO — ele precisa passar por ENVIADO e EM_REVISAO primeiro. Isso é regra de negócio dentro da própria classe, e não espalhada pelos controllers.

### Sistema (`src/classes/Sistema.js`) — a classe principal
É a única classe que fala com o banco (`this._db.query(...)`). As outras quatro classes nunca tocam em SQL — isso é proposital, para separar "o que é o objeto" de "como ele é salvo". O fluxo mais completo é `criarAcompanhamento()`:

1. valida `descricao` e `media` (0 a 10);
2. busca o `Aluno` pelo id (erro se não existir);
3. busca o `Professor` pelo id (erro se não existir);
4. confere se `turma_id`, `disciplina_id` e `bimestre_id` existem (essas três tabelas não são criadas por este código);
5. **instancia** um `Acompanhamento`, já com `status: RASCUNHO`;
6. salva no MySQL, tratando o erro de duplicidade (mesmo aluno + turma + disciplina + bimestre) com uma mensagem legível em vez do erro cru do banco;
7. devolve o objeto criado.

## Endpoints da API

### Alunos
| Método | Rota | Quem pode chamar |
|---|---|---|
| POST | `/api/alunos` | Só Administrador (precisa do cabeçalho `x-usuario-id`) |
| GET | `/api/alunos` | Livre nesta entrega |
| GET | `/api/alunos/:id` | Livre nesta entrega |
| PUT | `/api/alunos/:id` | Livre nesta entrega |
| PATCH | `/api/alunos/:id/inativar` | Livre nesta entrega |

### Professores
| Método | Rota | Quem pode chamar |
|---|---|---|
| POST | `/api/professores` | Só Administrador (precisa do cabeçalho `x-usuario-id`) |
| GET | `/api/professores` | Livre nesta entrega |
| GET | `/api/professores/:id` | Livre nesta entrega |
| PUT | `/api/professores/:id` | Livre nesta entrega |

### Acompanhamentos
| Método | Rota |
|---|---|
| POST | `/api/acompanhamentos` |
| GET | `/api/acompanhamentos` |
| GET | `/api/acompanhamentos/:id` |
| PUT | `/api/acompanhamentos/:id` |
| PATCH | `/api/acompanhamentos/:id/enviar` |
| PATCH | `/api/acompanhamentos/:id/iniciar-revisao` |
| PATCH | `/api/acompanhamentos/:id/devolver` |
| PATCH | `/api/acompanhamentos/:id/publicar` |

## Roteiro de testes no Postman

1. Cadastre um administrador direto no banco (esta entrega não tem rota para isso ainda — é só um `INSERT` em `usuario` com `perfil = 'ADMINISTRADOR'`) e guarde o `id`. Vamos chamar esse id de `<ID_ADMIN>`.
2. `POST /api/alunos`, com o cabeçalho `x-usuario-id: <ID_ADMIN>` → guardar o `id` do aluno criado.
3. `POST /api/professores`, com o mesmo cabeçalho → guardar o `id` do professor.
4. Repita o passo 2 ou 3 **sem** o cabeçalho `x-usuario-id` → deve vir `401`.
5. Repita apontando `x-usuario-id` para um id que não é administrador (por exemplo, o id do professor que você acabou de criar) → deve vir `403`.
6. Confirme que existe `turma_id`, `disciplina_id` e `bimestre_id` = 1 no banco (rode os `INSERT`s comentados em `ajustes_banco_real.sql` se precisar).
7. `POST /api/acompanhamentos` com os ids do aluno e do professor → o `status` deve vir `RASCUNHO`.
8. `GET /api/acompanhamentos/:id` → conferir os dados.
9. `PUT /api/acompanhamentos/:id` → editar `descricao`/`media`.
10. `PATCH /:id/enviar` → status vira `ENVIADO`.
11. Tente `PATCH /:id/publicar` direto, pulando a revisão → deve dar `400`, mostrando a máquina de estados funcionando.
12. `PATCH /:id/iniciar-revisao`, com `{ "revisorId": <ID_ADMIN> }` → status `EM_REVISAO`.
13. `PATCH /:id/devolver` ou `PATCH /:id/publicar` → teste os dois desfechos possíveis a partir de `EM_REVISAO`.
14. `PATCH /api/alunos/:id/inativar` → `ativo` deve virar `false`.

## Exemplos de requisição

**Cadastrar aluno (precisa ser administrador)**
```http
POST /api/alunos
Content-Type: application/json
x-usuario-id: 1

{
  "nome": "Lucas Ramos",
  "dataNascimento": "2016-07-08",
  "matricula": "20260001",
  "observacoes": "Aluno participativo, gosta de trabalhos em grupo."
}
```

**Cadastrar professor (cria `usuario` + `professor` numa transação só)**
```http
POST /api/professores
Content-Type: application/json
x-usuario-id: 1

{
  "nome": "Ana Silva",
  "registro": "PROF-001",
  "email": "ana.silva@escola4u.com.br"
}
```

**Criar acompanhamento**
```http
POST /api/acompanhamentos
Content-Type: application/json

{
  "alunoId": 1,
  "professorId": 1,
  "turmaId": 1,
  "disciplinaId": 1,
  "bimestreId": 1,
  "descricao": "O aluno apresentou boa participação nas atividades.",
  "media": 8.5
}
```

## Observação sobre versão do MySQL

`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, usado em `ajustes_banco_real.sql`, exige MySQL 8.0.29 ou mais recente. Se o grupo usa uma versão anterior, tirem o `IF NOT EXISTS` do script (e rodem o comando só se a coluna ainda não existir).
