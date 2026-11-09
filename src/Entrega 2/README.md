# 4U — Entrega 2

Plataforma de acompanhamento escolar bimestral com três perfis: **Administrador**, **Professor** e **Responsável**.
O professor registra média, tags e descrição de cada aluno, a escola revisa e publica, e o responsável lê o
relatório, dá ciência e gera o PDF.

## 🌐 Acesse

| | Endereço |
|---|---|
| Site | https://fouru-site.onrender.com |
| API | https://fouru-api.onrender.com/api/saude |

Senha de todas as contas: **`4u@demo`**

| Perfil | E-mail |
|---|---|
| Administradoras | rafaela.mello@4u.com · laura.rayssa@4u.com · anna.silva@4u.com · dilly.martins@4u.com |
| Professor | professor@escola4u.test |
| Responsável | responsavel@escola4u.test |

## 🛠 Tecnologias

| Parte | Tecnologia |
|---|---|
| Site | React 18, React Router e Vite |
| API | Node.js, Express, JWT (login) e Nodemailer (e-mails) |
| Banco | MySQL 8: 20 tabelas, 7 índices e 7 views |
| Nuvem | Render (site e API) e Aiven (banco) |

## 📁 Estrutura

```
src/Entrega 2/
├── Backend/
│   ├── Banco de Dados/   01_schema, 02_indices, 03_carga, 04_views e banco_completo (os 4 juntos)
│   └── src/
│       ├── routes/        URLs da API e quem pode acessar
│       ├── middlewares/   login (JWT), perfil e limite de tentativas
│       ├── controllers/   recebe a requisição, valida e responde
│       ├── classes/       POO: Sistema, Acompanhamento, Aluno, Professor, Administrador
│       ├── repositorios/  consultas reaproveitadas
│       ├── utils/         erros, validação, senha, token e e-mail
│       └── database/      conexão com o MySQL
└── Frontend/
    └── src/
        ├── pages/         telas de cada perfil (admin, professor, responsavel) e públicas
        ├── components/    layout, formulários, tabelas, modais e gráficos
        ├── services/      api.js (todas as chamadas à API)
        └── styles/        CSS global e de cada tela
```

## 💻 Rodar no computador

Precisa de **Node.js 18+** e **VS Code**. O MySQL local é opcional: dá para usar o banco da nuvem.

1. **Banco:** no MySQL Workbench, rode `Backend/Banco de Dados/banco_completo.sql`.
2. **API:** em `Backend`, copie o `.env.example` com o nome `.env` e preencha (banco local ou da nuvem).
   ```bash
   cd "src/Entrega 2/Backend"
   npm install
   npm run dev
   ```
   Teste em http://localhost:3000/api/saude.
3. **Site:** em outro terminal.
   ```bash
   cd "src/Entrega 2/Frontend"
   npm install
   npm run dev
   ```
   Abra http://localhost:5173.

## ✅ Funcionalidades

| Perfil | O que faz |
|---|---|
| Administrador | Cadastra alunos, professores e responsáveis; libera acesso por e-mail; desativa e reativa; atribui turmas; revisa, ajusta, devolve e publica acompanhamentos; abre e fecha bimestres; vê indicadores e exporta para Excel |
| Professor | Vê suas turmas e pendências; registra média, tags e descrição; salva rascunho ou envia para revisão; corrige os devolvidos; lê as observações das famílias |
| Responsável | Vê os alunos vinculados e a média por bimestre; lê os relatórios publicados; dá ciência com observação; gera o PDF |
| Todos | Login, "Esqueci minha senha", notificações, perguntas frequentes e layout responsivo |

**Fluxo do acompanhamento:** Rascunho → Enviado → Em revisão → Publicado (ou Devolvido para correção).
Toda mudança fica registrada no histórico.

## 📧 E-mails automáticos

A 4U envia e-mails de verdade (Gmail + Nodemailer):

| Quando | O que chega | Validade |
|---|---|---|
| A administradora clica em **Liberar acesso** | Convite com o botão **Criar minha senha** | 3 dias, uso único |
| Alguém clica em **Esqueci minha senha** no login | Link para criar uma nova senha | 30 minutos, uso único |

Para testar com um e-mail seu, cadastre um professor ou responsável usando `+`, por exemplo
`seuemail+professor@gmail.com`: o convite chega na sua própria caixa (veja também o spam).

## 🔌 Principais rotas da API

`🔒` exige login. **A** administrador · **P** professor · **R** responsável.

| Rota | Quem | O que faz |
|---|---|---|
| `POST /api/auth/login` | público | entra e recebe o token |
| `POST /api/auth/esqueci-senha` · `/definir-senha` | público | nova senha por e-mail / cria a senha |
| `GET POST /api/{alunos,professores,responsaveis}` | 🔒 A | lista com busca e paginação / cadastra |
| `POST /api/{professores,responsaveis}/:id/convite` | 🔒 A | libera o acesso e envia o e-mail |
| `GET /api/acompanhamentos` | 🔒 A | fila de revisão |
| `PATCH /api/acompanhamentos/:id/publicar` · `/devolver` | 🔒 A | publica / devolve com motivo |
| `GET /api/admin/relatorios` · `/relatorios/exportar` | 🔒 A | indicadores / planilha .csv |
| `GET /api/professor/painel` · `/professor/retornos` | 🔒 P | turmas, pendências e retornos |
| `POST /api/professor/acompanhamentos` | 🔒 P | registra (rascunho ou envio) |
| `GET /api/responsavel/alunos/:id/relatorio` | 🔒 R | relatório publicado |
| `POST /api/responsavel/acompanhamentos/:id/ciencia` | 🔒 R | dá ciência |
| `GET /api/saude` | público | confere a conexão com o banco |

## 🔒 Segurança

- Senhas com hash **scrypt**; login com **JWT** (2 h) e limite de tentativas.
- Links de primeiro acesso e de nova senha são de **uso único** (3 dias e 30 minutos).
- Cada perfil só vê o que é seu: o responsável só lê relatórios **publicados** dos seus alunos.
- Senhas e chaves ficam só no `.env` e nas variáveis do Render. **Nunca no GitHub.**

## ☁️ Atualizar a versão na nuvem

1. Suba a alteração no GitHub.
2. No Render, abra o serviço que mudou (**4u-api** ou **4u-site**) → **Manual Deploy → Deploy latest commit**.
