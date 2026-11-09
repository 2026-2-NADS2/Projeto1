# Entregas do PI
### **DECLARAÇÃO DE USO DE INTELIGÊNCIA ARTIFICIAL**

## Entrega 1
<br><br>
### Banco de Dados

| **Aluno(s) Responsável(veis)** | Rafaela Carvalho Barcos Mello |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Anthropic) |
| **Versão/modelo** | Sonnet 5.5 |
| **Disciplina / Trabalho** | Banco de Dados - Criação de Índices do projeto 4U  |
| **Finalidade de uso** | Apoio na modelagem do banco de dados. Utilizando o Claude para tirar dúvidas de instalação e uso do MySQL Workbench e para revisar a documentação e o formato dos índices. |
| ***Prompts* principais utilizados** | “Me passa o passo a passo de como mexer no MySQL Workbench e como fazer a instalação.”, “Verifique se a minha documentação dos índices está boa?”, “Consegue verificar se os índices estão em formato correto?” |
| **Trechos ou entregas afetadas** | Criação dos 7 índices do projeto no banco de dados. Os índices servem para acelerar as consultas mais usadas do sistema, como a busca de acompanhamentos por bimestre, status e professor, o histórico de cada acompanhamento e o login por e-mail. Sem eles, o MySQL leria a tabela inteira a cada consulta. As sugestões do Claude foram usadas apenas como revisão e ajuste de formato. Os índices foram executados por mim no MySQL Workbench, e o documento foi escrito, revisado e ajustado por mim antes da entrega. |


### Desenvolvimento Web Full Stack

| **Aluno(s) Responsável(veis)** |Anna Paula, Dilly Martins, Laura Rayssa e Rafaela Carvalho |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Anthropic) |
| **Versão/modelo** | Sonnet 5.5 |
| **Disciplina / Trabalho** | [preencher] |
| **Finalidade de uso** | [preencher] |
| ***Prompts* principais utilizados** | [preencher] |
| **Trechos ou entregas afetadas** | [preencher] |

### Design de Interface Digital

| **Aluno(s) Responsável(veis)** |Laura Rayssa Souza Araújo |
| :--- | :--- |
| **Ferramenta utilizada** | ChatGPT (OpenAI) e Claude (Anthropic) |
| **Versão/modelo** | GPT-6  e Sonnet 5.5 |
| **Disciplina / Trabalho** | Design de Interface Digital - Projeto Interdisciplinar 4U |
| **Finalidade de uso** | Apoio na análise e no aprimoramento da identidade visual e das interfaces da plataforma 4U. Utilização das ferramentas para esclarecer dúvidas, revisar decisões de design e verificar a adequação do trabalho aos requisitos acadêmicos. |
| ***Prompts* principais utilizados** | ChatGPT: solicitações de orientação e avaliação sobre a identidade visual e a organização das interfaces da 4U. Claude: solicitações de revisão do trabalho e verificação de conformidade com os requisitos descritos nos documentos da atividade. |
| **Trechos ou entregas afetadas** | Textos explicativos das interfaces e decisões de organização visual. Parte dos textos sugeridos por IA foi incorporada ao projeto. |

### Estrutura de Dados

| **Aluno(s) Responsável(veis)** |Anna Paula Alves Silva |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Anthropic) |
| **Versão/modelo** | Sonnet 5.5 |
| **Disciplina / Trabalho** | Estrutura de Dados - Lista de Alunos |
| **Finalidade de uso** | Apoio no desenvolvimento e na revisão da aplicação de console em C# que simula a listagem paginada de alunos (ListaAluno_PI). Utilização da ferramenta para estruturar o código, esclarecer dúvidas e verificar a adequação do trabalho aos requisitos da atividade.  |
| ***Prompts* principais utilizados** | “Como poderia ser estruturada uma simulação de listagem de alunos em C#?”, “O projeto é compatível com o Visual Studio?”, “Como poderia ser adicionada a paginação, considerando a busca dos alunos no banco de dados, o armazenamento em uma lista e a exibição por páginas no console?”, “Quais podem ser as causas de uma falha no build do projeto?”, “Como funciona a parte do código responsável por percorrer e exibir os alunos da lista?”, “Onde deve ser alterado o nome do projeto para ListaAluno_PI?”, “Como verificar se o banco de dados está incluído corretamente no projeto?” |
| **Trechos ou entregas afetadas** | Código C# da listagem de alunos (classes, paginação, CSV e banco de dados). Parte do código sugerido por IA foi incorporada ao projeto, e a solução foi revisada e executada por mim no Visual Studio.  |

### Programação Orientada a Objetos

| **Aluno(s) Responsável(veis)** |Dilly Martins Silva |
| :--- | :--- |
| **Ferramenta utilizada** | ChatGPT (OpenAI) e Claude (Anthropic) |
| **Versão/modelo** | GPT-6  e Sonnet 5.5 |
| **Disciplina / Trabalho** | Programação Orientada a Objetos - Projeto Interdisciplinar 4U |
| **Finalidade de uso** | Utilização das ferramentas de inteligência artificial como apoio à estruturação do Backend, à criação e organização das classes que representam os usuários do sistema e ao desenvolvimento da classe principal responsável por centralizar as operações e funcionalidades do projeto. |
| ***Prompts* principais utilizados** | “Me ajude a organizar as classes”; “Veja se esse código está certo”; “O que está errado aqui?”; “Como faço para conectar essas classes?” |
| **Trechos ou entregas afetadas** | Código JavaScript do Backend, principalmente na criação e organização das classes e dos métodos. O código foi revisado e corrigido várias vezes com a ajuda das ferramentas de inteligência artificial durante o desenvolvimento.  |

## Entrega 2
<br><br>

### Banco de Dados

| **Aluno(s) Responsável(veis)** |Rafaela Carvalho Barcos Mello |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Anthropic) |
| **Versão/modelo** | Sonnet 5.5 |
| **Disciplina / Trabalho** | Banco de Dados - Criação de Views do projeto 4U  |
| **Finalidade de uso** | Apoio na criação das views do sistema, em dúvidas sobre como elas funcionam no MySQL e em sugestões de melhoria, como encurtar as consultas. |
| ***Prompts* principais utilizados** | “Como consulto e crio uma view no mysql?”, “Consegue ver se faz sentido essa consulta de exemplo?”, “Valide se a documentação das views está boa?” |
| **Trechos ou entregas afetadas** | Criação das 7 views do projeto. As views servem para guardar as consultas mais usadas de cada perfil (responsável, professor e administrador), como relatório publicado, painel do professor e fila de revisão. Assim o sistema consulta uma view pronta, sem repetir JOINs longos, e cada tela recebe só os dados de que precisa. O SQL das views foi elaborado com apoio do Claude, a partir dos requisitos e das telas do projeto. As views foram executadas e testadas por mim no MySQL Workbench, e o documento foi escrito, revisado e ajustado por mim antes da entrega. |


### Desenvolvimento Web Full Stack

| **Aluno(s) Responsável(veis)** |Rafaela Carvalho Barcos Mello |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Anthropic)  |
| **Versão/modelo** | Opus 5.5 Sonnet 5.5 |
| **Disciplina / Trabalho** | Desenvolvimento Web Full Stack - Integração do front-end com o back-end e o banco de dados do projeto 4U |
| **Finalidade de uso** | Apoio na integração do site em React com a API em Node/Express e o banco MySQL. Usamos o Claude para tirar dúvidas, montar e revisar partes do código das rotas, do login com token e do envio de e-mail também usamos para entender como testar as rotas no Postman, resolver erros na hora de rodar o projeto e planejar como subir o banco e o site para a nuvem. |
| ***Prompts* principais utilizados** | “Fui rodar o npm run dev e deu erro de porta em uso. O que pode ser?”, “Como posso criar e utilizar uma API em Node com Express?”, “Me dê sugestões de como fazer a integração da API com o MySQL.”, “Qual biblioteca do Node podemos usar para enviar e-mail?”, “Me explique como testar as rotas do back-end no Postman.” |
| **Trechos ou entregas afetadas** | Integração do site com a API e o banco de dados: login, cadastros de alunos, professores e responsáveis, registro e revisão dos acompanhamentos, relatórios do responsável e exportação para Excel. Também entraram o envio de e-mail de primeiro acesso e de recuperação de senha, o cabeçalho com notificações, os ajustes de layout e responsividade das telas e o README. O código foi elaborado com apoio do Claude, juntamente com as classes de POO, do banco de dados que já tínhamos e das telas da Entrega 1. O projeto foi executado por nós no VS Code, as rotas foram testadas no Postman e as telas no navegador, e o código foi revisado e ajustado por nós antes da entrega. |

### Design de Interface Digital

| **Aluno(s) Responsável(veis)** |Laura Rayssa Souza Araújo |
| :--- | :--- |
| **Ferramenta utilizada** | ChatGPT (OpenAI) e Claude (Anthropic) |
| **Versão/modelo** | GPT-6  e Sonnet 5.5 |
| **Disciplina / Trabalho** | Design de Interface Digital - Projeto Interdisciplinar 4U |
| **Finalidade de uso** | Apoio na elaboração e documentação do Design System, incluindo identidade visual, tipografia, grids, formas, componentes e acessibilidade. Análise de interfaces e sugestões para aprimorar a hierarquia visual, os espaçamentos e a organização das informações. Revisão da adequação das entregas aos requisitos acadêmicos. |
| ***Prompts* principais utilizados** | ChatGPT: "Na parte do grid, como eu faria? Seguindo o meu arquivo .zip"; "Na parte da tipografia eu queria colocar a identificação da família da fonte, o espaçamento e tals. Pode me ajudar a ilustrar isso?"; "A parte das formas está vazio, o que eu coloco?"; "A disposição das infos está muito junto e aparenta estar bagunçada, pode me ajudar?". Claude: solicitações de revisão e avaliação da conformidade do trabalho com os documentos da disciplina. |
| **Trechos ou entregas afetadas** | Design System da 4U, documentação da identidade visual, tipografia, grids, formas e acessibilidade, textos explicativos e sugestões de melhoria das interfaces dos módulos. Parte dos textos sugeridos por IA foi incorporada ao projeto. |

### Estrutura de Dados

| **Aluno(s) Responsável(veis)** |Anna Paula Alves Silva |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Anthropic) |
| **Versão/modelo** | Sonnet 5.5 |
| **Disciplina / Trabalho** | Estrutura de Dados - Mini-Relatório |
| **Finalidade de uso** | Apoio na revisão do mini-relatório de Estrutura de Dados do projeto 4U. Utilização da ferramenta para verificar se o conteúdo atende ao que o professor pediu, corrigir erros de texto e formatação e organizar o documento final para entrega.  |
| ***Prompts* principais utilizados** | “O PDF está coerente com o que foi pedido?”, “Pode enviar um Word corrigindo os pontos que você apontou?” |
| **Trechos ou entregas afetadas** | Revisão de texto e de formatação do mini-relatório (capa, espaçamento e quebras de página, correções de digitação), reescrita de trechos explicativos. |

### Programação Orientada a Objetos

| **Aluno(s) Responsável(veis)** |Rafela Carvalho Barcos Mello |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Anthropic) |
| **Versão/modelo** | Opus 5.5 |
| **Disciplina / Trabalho** | Programação Orientada a Objetos - Projeto rodando em nuvem |
| **Finalidade de uso** | Apoio para colocar o sistema no ar, primeiro no localhost e depois na nuvem. Usamos a IA como auxílio e explicação para rodar o backend com as classes de POO, conectar a API ao MySQL e publicar o projeto (banco no Aiven, API e site no Render), além de resolver erros como porta em uso, certificado SSL e variáveis. |
| ***Prompts* principais utilizados** | “Quais ferramentas podemos utilizar para hospedar meu banco de dados, backend e frontend”, “Tem algum serviço que não durma? Acha melhor o Aiven ou usar o TiDB?”, “O banco vai funcionar se o projeto não estiver no meu computador?”, “Como utilizar o render?” |
| **Trechos ou entregas afetadas** | Publicação do backend da Entrega 2, com as classes de POO, primeiro no localhost e depois na nuvem. A API foi conectada ao banco MySQL no Aiven por variáveis de ambiente e certificado SSL, e o site e a API foram publicados no Render, funcionando juntos em produção. Sem essa configuração, o sistema só funcionaria no computador de quem estivesse rodando o projeto. O Claude foi usado para orientar o passo a passo da publicação e ajudar a resolver os erros que apareceram. As contas e os serviços foram criados e configurados por mim, e a API e as telas foram testadas e conferidas por mim antes da entrega.  |

***Declaro que o uso acima descrito está em conformidade com o GUIA PARA O USO RESPONSÁVEL DE
INTELIGÊNCIA ARTIFICIAL NA FECAP e que o conteúdo final é de minha plena responsabilidade
autoral.***
