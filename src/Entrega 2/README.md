# 4U — Entrega 2: como usar

Plataforma de acompanhamento escolar: **site em React**, **API em Node/Express** e **banco MySQL 8**.
Este guia mostra como rodar tudo no seu computador e o que testar.

```
src/Entrega 2/
├── Backend/              API (pasta src/) e scripts do banco (pasta Banco de Dados/)
└── Frontend/             site (pasta src/)
```

---

## 1. Instalar (uma vez só)

- **MySQL Server 8** e **MySQL Workbench**: https://dev.mysql.com/downloads/installer/ (anote a senha do `root`)
- **Node.js 18 ou mais novo**: https://nodejs.org
- **VS Code**: https://code.visualstudio.com

---

## 2. Criar o banco

1. Abra o **MySQL Workbench** e entre na conexão local com a senha do `root`.
2. **File → Open SQL Script…** e escolha `src/Entrega 2/Backend/Banco de Dados/banco_completo.sql`.
3. Clique no **raio** (⚡) para executar. Depois, atualize (🔄) o painel *Schemas*: deve aparecer `acompanhamento_4u`.

Esse arquivo apaga e recria o banco inteiro, com as 20 tabelas, os 7 índices, as 7 views e os dados fictícios.
Rode de novo sempre que quiser **voltar ao estado inicial** (por exemplo, antes de apresentar).

> Erro *"Lost connection"* no Workbench: **Edit → Preferences → SQL Editor**, aumente
> *DBMS connection read timeout* para 600 e rode de novo.

---

## 3. Ligar a API

Na pasta `src/Entrega 2/Backend`, crie um arquivo chamado **`.env`** (com o ponto na frente) e cole:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=senha_do_seu_mysql
DB_NAME=acompanhamento_4u
DB_SSL=false
JWT_SEGREDO=troque-por-um-texto-longo-com-mais-de-40-caracteres
JWT_EXPIRA=2h
CORS_ORIGENS=http://localhost:5173,http://localhost:5174
EMAIL_USUARIO=
EMAIL_SENHA_APP=
EMAIL_REMETENTE=4U Acompanhamento Escolar
SITE_URL=http://localhost:5173
```

Troque **`DB_PASSWORD`** pela senha do seu `root` e **`JWT_SEGREDO`** por qualquer texto longo (40 caracteres ou
mais). O resto pode ficar como está. As linhas `EMAIL_*` são opcionais (passo 7).

No VS Code, abra um terminal (**Terminal → New Terminal**):

```bash
cd "src/Entrega 2/Backend"
npm install
npm run dev
```

Deve aparecer `API 4U rodando em http://localhost:3000/api`. **Deixe este terminal aberto.**
Para conferir, abra http://localhost:3000/api/saude: precisa mostrar `"status":"ok"`, `"tabelas":20` e `"views":7`.

> O `.env` é só seu e **nunca vai para o GitHub** (está no `.gitignore`). Senhas ficam só nele, nunca no código.

---

## 4. Ligar o site

Em um **segundo terminal**:

```bash
cd "src/Entrega 2/Frontend"
npm install
npm run dev
```

Abra o endereço que aparecer (normalmente http://localhost:5173). Rodando local, o site não precisa de `.env`:
ele já procura a API em `http://localhost:3000/api`.

---

## 5. Entrar

Senha de todas as contas: **`4u@demo`**. Na tela de login, clicar em uma conta preenche o formulário.

| Perfil | E-mail |
|---|---|
| Administradoras | rafaela.mello@4u.com · laura.rayssa@4u.com · anna.silva@4u.com · dilly.martins@4u.com |
| Professor (Ricardo Freitas, Matemática) | professor@escola4u.test |
| Responsável (Fernanda Oliveira, dois filhos) | responsavel@escola4u.test |

Esses e-mails são fictícios. Para receber um e-mail de verdade, cadastre alguém com um e-mail real (passo 7).

---

## 6. O que testar

Tudo grava no banco. Para usar dois perfis ao mesmo tempo, abra **outra aba** (cada aba tem a sua sessão).

1. **Cadastrar** — administradora: **Cadastros → Professores → Novo professor**. Ao salvar, abre a janela
   **Gerenciar**. Em **Turmas e disciplinas**, atribua uma turma.
2. **Liberar acesso** — na mesma janela, **Liberar acesso**. A pessoa recebe um e-mail com o link
   **Criar minha senha** (vale 3 dias, uso único).
3. **Registrar** — professor: **Acompanhamentos**, escolhe o aluno, informa média, tags e descrição e
   **Envia para revisão** (ou salva o rascunho).
4. **Revisar** — administradora: **Acompanhamentos → Aguardando revisão**. Pode **Ajustar texto**,
   **Devolver** (com motivo) ou **Publicar**.
5. **Corrigir** — professor: o devolvido aparece em **Retornos**, com o motivo.
6. **Família** — responsável: **Relatórios**, **Dar ciência** (com observação opcional) e **Gerar PDF**.
7. **Desativar acesso** — **Cadastros → Gerenciar → Desativar acesso**: a pessoa sai na hora, mesmo logada, e não
   entra mais. **Reativar acesso** devolve o login.
8. **Esqueci minha senha** — na tela de login. Chega um e-mail com link de 30 minutos, uso único. Só vale para quem
   já tem o acesso liberado e ativo.
9. **Bimestres** — muda o período em que os professores podem registrar.
10. **Relatórios** (administradora) — indicadores do bimestre e **Exportar para Excel**.

**Excluir ou desativar?** Quem já tem histórico (acompanhamentos, ciências) não pode ser excluído: o banco
protege o histórico. Use **Desativar**. **Excluir** só aparece para cadastros sem histórico.

---

## 7. Ligar o envio de e-mail (opcional)

Os e-mails saem por um Gmail do projeto:

1. No Gmail, ative a **Verificação em duas etapas** (https://myaccount.google.com/security).
2. Crie uma **senha de app** em https://myaccount.google.com/apppasswords. São 16 letras: é ela que vai no
   `.env`, não a senha normal do Gmail.
3. No `.env` do backend, preencha `EMAIL_USUARIO` (o Gmail) e `EMAIL_SENHA_APP` (as 16 letras, sem espaços).
4. Pare a API (`Ctrl + C`) e rode `npm run dev` de novo. Em http://localhost:3000/api/saude aparece
   `"email_configurado": true`.

Dica: com um Gmail só dá para criar vários cadastros, usando `+`. Por exemplo, `seuemail+professor@gmail.com` e
`seuemail+familia@gmail.com` chegam todos na mesma caixa.

Sem e-mail configurado, o sistema funciona igual: em **Liberar acesso**, o link aparece na tela para copiar, e
"Esqueci minha senha" avisa para procurar a secretaria. O primeiro e-mail pode cair no spam.

---

## 8. Problemas comuns

| Problema | O que fazer |
|---|---|
| **"Não foi possível conectar ao servidor"** | A API não está rodando, ou o site abriu em uma porta que não está em `CORS_ORIGENS` no `.env` (o padrão aceita 5173 e 5174). |
| **"Não foi possível conectar ao banco de dados"** | Confira `DB_PASSWORD` no `.env` e se o MySQL está ligado. |
| `/api/saude` mostra **tabelas: 0** | Rode o `banco_completo.sql` (passo 2). |
| `'nodemon' não é reconhecido` | Faltou `npm install` na pasta `Backend`. |
| **"ainda não criou sua senha"** no login | Em Cadastros → Gerenciar, clique em **Liberar acesso**. |
| E-mail não chega | Veja o spam. Erro "Invalid login" no terminal da API = senha de app errada. |
| Professor não consegue registrar | A digitação do bimestre está fechada (Bimestres) ou a turma não foi atribuída a ele. |
| Mudei o `.env` e nada mudou | Pare (`Ctrl + C`) e rode `npm run dev` de novo. |

Mais detalhes: rotas da API em [`Backend/README.md`](Backend/README.md), telas em
[`Frontend/README.md`](Frontend/README.md) e banco em [`Backend/Banco de Dados/README.md`](Backend/Banco%20de%20Dados/README.md).
