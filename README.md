# FECAP - Fundação de Comércio Álvares Penteado

<p align="center">
<a href= "https://www.fecap.br/"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhZPrRa89Kma0ZZogxm0pi-tCn_TLKeHGVxywp-LXAFGR3B1DPouAJYHgKZGV0XTEf4AE&usqp=CAU" alt="FECAP - Fundação de Comércio Álvares Penteado" border="0"></a>
</p>

# Sistema Web Responsivo para Comunicação entre Escola, Professores e Responsáveis
## 4U

## Integrantes: <a href="https://www.linkedin.com/in/anna-paula-alves/">Anna Paula Alves Silva</a>, <a href="https://www.linkedin.com/in/dilly-martins-217176361/">Dilly Martins da Silva</a>, <a href="https://www.linkedin.com/in/laurarayssa/">Laura Rayssa Souza Araújo</a>, <a href="https://www.linkedin.com/in/rafaela-carvalho-barcos-mello-8484ba282/">Rafaela Carvalho Barcos Mello</a>

## Professores Orientadores: <a href="https://www.linkedin.com/in/adriano-valente/">Adriano Felix Valente</a>, <a href="https://www.linkedin.com/in/eduardo-savino/">Eduardo Savino Gomes</a>, <a href="https://www.linkedin.com/in/francisco-escobar/">Francisco Escobar</a>, <a href="https://www.linkedin.com/in/jbuesso/">José Carlos Buesso Junior</a>, <a href="https://www.linkedin.com/in/ronaldo-araujo-pinto-3542811a/">Ronaldo Araujo Pinto</a>

## Descrição

<p align="center">
  <img src="./Imagens/imagem_github.jpg" alt="Símbolo e Logotipo do 4U" width="1000">
</p>

O projeto 4U consiste em uma aplicação web responsiva desenvolvida para escolas de Ensino Fundamental, com o objetivo de otimizar o acompanhamento acadêmico bimestral e integrar a comunicação entre professores, gestão escolar e famílias. Por meio da plataforma, os docentes registram o desempenho de cada estudante em suas disciplinas, inserindo a média do bimestre, tags de acompanhamento e uma descrição qualitativa detalhada. Antes de chegarem aos familiares, esses registros passam por uma etapa de moderação da administração escolar, que pode revisar, ajustar, devolver para correções ou publicar as informações. Uma vez aprovados, os pais ou responsáveis visualizam de forma exclusiva os relatórios publicados dos alunos vinculados ao seu perfil, podendo dar ciência da leitura e gerar o relatório em PDF. A administração acompanha os indicadores de cada bimestre e exporta os dados para o Excel.
<br><br>
O projeto 4U conecta professores, administração e responsáveis através de uma plataforma web responsiva, otimizando o fluxo de informações e o monitoramento pedagógico dentro da comunidade escolar.
<br><br>

## 🌐 Acesse o projeto

| | Endereço |
|---|---|
| Site | https://fouru-site.onrender.com |
| API (teste de saúde) | https://fouru-api.onrender.com/api/saude |


## 🛠 Estrutura de pastas

```
Projeto1/
├── Documentos/
│   ├── Entrega 1/              
│   └── Entrega 2/              
├── Imagens/
├── src/
│   ├── Entrega 1/
│   │   ├── Backend/            
│   │   └── Frontend/           
│   └── Entrega 2/
│       ├── Backend/            
│       ├── Frontend/           
│       └── README.md           
├── .gitignore
└── README.md
```

## 🛠 Tecnologias e Linguagens

<p align="left">
  <img alt="HTML" title="HTML" width="35" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg"/>
  <img alt="CSS" title="CSS" width="35" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg"/>
  <img alt="JavaScript" title="JavaScript" width="35" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg"/>
  <img alt="React" title="React 18" width="35" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg"/>
  <img alt="React Router" title="React Router" width="35" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/reactrouter/reactrouter-original.svg"/>
  <img alt="Vite" title="Vite" width="35" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg"/>
  <img alt="Node.js" title="Node.js" width="35" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg"/>
  <img alt="Express" title="Express" width="35" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg"/>
  <img alt="MySQL" title="MySQL" width="35" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg"/>
  <img alt="Figma" title="Figma" width="35" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg"/>
  <img alt="Visual Studio Code" title="Visual Studio Code" width="35" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vscode/vscode-original.svg"/>
</p>

| Parte | Tecnologia |
|---|---|
| Site | React 18, React Router e Vite |
| API | Node.js, Express, JWT (login) e Nodemailer (e-mails) |
| Banco de dados | MySQL 8 (20 tabelas, 7 índices e 7 views) |
| Nuvem | Render (site e API) e Aiven (banco MySQL) |

## 💻 Configuração para Desenvolvimento

Para abrir este projeto você precisa das seguintes ferramentas:

- <a href="https://code.visualstudio.com/">Visual Studio Code</a>
- <a href="https://nodejs.org">Node.js</a> 18 ou mais novo
- <a href="https://dev.mysql.com/downloads/installer/">MySQL Workbench</a> (Entrega 2, para ver o banco)

### Entrega 1

No terminal do Visual Studio Code, a partir da raiz do repositório:

```sh
cd "src/Entrega 1/Frontend"
npm install
npm run dev
```

Depois, abra http://localhost:5173.

### Entrega 2 (site + API + banco de dados)

1. Em `src/Entrega 2/Backend`, copie o `.env.example` com o nome `.env` e preencha.
2. Ligue a API:

```sh
cd "src/Entrega 2/Backend"
npm install
npm run dev
```

3. Em outro terminal, ligue o site:

```sh
cd "src/Entrega 2/Frontend"
npm install
npm run dev
```

4. Abra http://localhost:5173.

## 📋 Licença/License
<a href="https://github.com/2026-2-NADS2/Projeto1">4U</a> © 2026 by <a href="https://example.com"> Anna Paula Alves Silva, Dilly Martins da Silva, Laura Rayssa Souza Araújo e Rafaela Carvalho Barcos Mello</a> is licensed under <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International (CC BY 4.0)</a>

## 🎓 Referências

Aqui estão as referências usadas no projeto.

1. <https://github.com/iuricode/readme-template>
2. <https://github.com/gabrieldejesus/readme-model>
3. <https://chooser-beta.creativecommons.org/>
4. <https://freesound.org/>
5. <https://www.toptal.com/developers/gitignore>
6. Músicas por: <a href="https://freesound.org/people/DaveJf/sounds/616544/"> DaveJf </a> e <a href="https://freesound.org/people/DRFX/sounds/338986/"> DRFX </a> ambas com Licença CC 0.
