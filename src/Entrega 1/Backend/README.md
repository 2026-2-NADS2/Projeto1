# 4U/KFKA — Backend (Entrega 1 de Programação Orientada a Objetos)

Projeto Interdisciplinar — 2º ADS — 2º Semestre 2026
Disciplina: Programação Orientada a Objetos

## O que é isso aqui

Esse repositório é a parte de **backend** do projeto 4U/KFKA, feita pra
Entrega 1 da disciplina de POO. O enunciado pedia pra gente entregar a
"estruturação básica do backend (com classes e banco de dados)" e,
principalmente, a **classe principal do sistema**, que integra tudo e
orquestra as operações, no nosso caso, essa classe é a `Sistema`.

Resolvemos não inventar um banco de dados separado só pra essa entrega. O
banco `acompanhamento_4u` já existe (foi modelado na disciplina de Banco de
Dados, com as 20 tabelas do Dicionário de Dados do projeto), então esse
backend já se conecta direto nele. Isso significa que as classes que
fizemos aqui não fingem que o banco é simples, elas lidam com as tabelas
reais, incluindo coisas meio chatas tipo "professor não é uma tabela
sozinha, ele é ligado a uma tabela `usuario`".

## ⚠️ Sobre o front-end: ainda não está integrado

Isso é de propósito, não esquecemos de nada. O front-end do projeto 4U foi
desenvolvido **separado**, em paralelo, pela disciplina de Desenvolvimento
Web Full Stack, e por enquanto ele usa só **dados fictícios** (um
`mockBackend.js` que finge ser uma API). O arquivo `api.js` do front já
está preparado pra um dia chamar um backend de verdade em
`http://localhost:3000/api` — que é exatamente o endereço que esse backend
usa — mas essa ligação **não foi feita ainda**.

A integração front + back está prevista pra **Entrega 2** (a matriz de
entregas da disciplina de Full Stack pede isso explicitamente: "Aplicação
publicada e acessível (front e back funcionando juntos em produção)").
Por enquanto, cada parte foi construída e pode ser testada separadamente:
o front com os dados mockados, e esse backend com ferramentas tipo Postman
ou Insomnia.

## Como rodar

```bash
cd backend
npm install
cp .env.example .env
```

Edite o `.env` com o usuário/senha do MySQL de vocês e confirme que
`DB_NAME` aponta pro banco `acompanhamento_4u` que já existe.

Depois, rode o script de ajuste (só uma vez):

```bash
mysql -u root -p acompanhamento_4u < ajustes_banco_real.sql
```

Ele adiciona uma coluna nova (`observacoes`) na tabela `aluno`, que a gente
precisou pra essa entrega e que não existia no banco original.

Aí é só subir o servidor:

```bash
npm run dev
```

A API sobe em `http://localhost:3000/api`.

## O que tem dentro

```
backend/
├── src/
│   ├── classes/         ← as classes de POO (o coração da entrega)
│   ├── controllers/     ← recebem a requisição HTTP e chamam o Sistema
│   ├── routes/           ← só define os endereços da API
│   ├── database/
│   │   └── connection.js ← conexão com o MySQL
│   └── app.js            ← liga tudo e sobe o servidor
├── ajustes_banco_real.sql
├── .env.example
├── package.json
├── README.md              ← esse arquivo
├── GUIA_DE_ESTUDO.md       ← explicação linha por linha, pra gente estudar
└── PERGUNTAS_DO_PROFESSOR.md ← perguntas que o professor pode fazer + respostas
```

As classes obrigatórias que o enunciado pediu estão todas em
`src/classes/`: `Aluno`, `Professor`, `Administrador`, `Acompanhamento` e
`Sistema` (a principal).

## Resumindo o que cada classe faz

- **Aluno**: representa o estudante. Tem nome, matrícula, data de
  nascimento e um campo novo que a gente adicionou, `observacoes`.
- **Professor**: representa o professor. No banco, ele tá "grudado" numa
  tabela `usuario` (que também serve pra admin e responsável fazerem
  login), então essa classe é um pouco mais chatinha por dentro.
- **Administrador**: no banco real nem existe uma tabela só pra
  administrador — ele também é um `usuario`, só que com
  `perfil = 'ADMINISTRADOR'`.
- **Acompanhamento**: é o registro que o professor faz sobre o aluno (nota,
  descrição, status). Tem uma "máquina de estados" simples que impede, por
  exemplo, publicar um acompanhamento que ainda nem foi enviado.
- **Sistema**: é quem junta tudo. Nenhuma rota conversa direto com o banco
  — sempre passa pelo `Sistema`. É essa classe que o enunciado da
  disciplina chama de "classe principal, que orquestra o fluxo das
  operações".
  