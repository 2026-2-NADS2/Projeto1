# 4U — Plataforma de Acompanhamento Escolar

Frontend da 4U, plataforma web para acompanhamento escolar bimestral de alunos do Ensino Fundamental.

**Projeto Interdisciplinar — 2º semestre de ADS — FECAP — 2026**

**Integrantes:**
- Anna Paula Alves Silva — RA 26029435
- Dilly Martins da Silva — RA 26029138
- Laura Rayssa Souza Araujo — RA 26029075
- Rafaela Carvalho Barcos Mello — RA 26029304

## Sobre o projeto

A 4U liga escola, professores e famílias. O professor registra o acompanhamento de cada aluno (descrição, média e tags), a escola revisa e publica, e o responsável consulta os relatórios publicados.

Perfis: **Administrador**, **Professor** e **Responsável**.

## Tecnologias

- HTML5
- SS3
- JavaScript
- React 18
- React Router
- Vite

## Como executar

É preciso ter o [Node.js](https://nodejs.org) instalado.

No terminal, a partir da raiz do repositório:

```bash
cd "src/Entrega 1/Frontend"
npm install
npm run dev
```

Depois, abra http://localhost:5173.

## Telas

| Tela | Rota |
|---|---|
| Home | `/` |
| Login | `/login` |
| Dashboard do Administrador | `/admin` |
| Cadastros | `/admin/cadastros` |
| Dashboard do Professor | `/professor` |
| Dashboard do Responsável | `/responsavel` |
| Página não encontrada (404) | qualquer outra rota |

## Usuários para teste

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@escola4u.test | 4u@demo |
| Professor | professor@escola4u.test | 4u@demo |
| Responsável | responsavel@escola4u.test | 4u@demo |

## Funcionalidades

- Login com validação dos campos e acesso de acordo com o perfil.
- Cada perfil só acessa o próprio painel.
- Cadastros com abas (alunos, professores e responsáveis), busca por nome, filtro por situação e paginação.
- Formulário de novo cadastro com validação. A data de nascimento é digitada no formato dd/mm/aaaa.
- No painel do Responsável, os filtros de aluno, ano letivo e bimestre atualizam a média e o gráfico.
- Mensagens de carregamento, de lista vazia e de erro, com o botão "Tentar novamente".
- Layout responsivo para computador, tablet e celular.

## Dados

Os dados usados são fictícios e ficam em `src/data/mock`, organizados conforme as tabelas do banco do projeto. As telas buscam esses dados pelo arquivo `src/services/api.js`, que depois será ligado ao backend.

## Estrutura

```
src/
├── pages/        telas
├── components/   componentes reutilizáveis
├── contexts/     login e mensagens
├── hooks/        carregamento de dados
├── services/     acesso aos dados
├── data/mock/    dados fictícios
├── utils/        validações, formatação e rotas
├── styles/       estilos
└── assets/       logo e símbolo
```
## Identidade visual

As cores e fontes seguem o nosso Guia de Estilos.

### Cores

| Cor | Código | Uso |
|---|---|---|
| Azul marinho | `#1B2A4A` | Cor da marca: logo, títulos e menu lateral |
| Azul petróleo | `#0E6E85` | Botões e elementos interativos |
| Azul petróleo (hover) | `#0A5A6D` | Botões ao passar o mouse |
| Bege claro | `#FFF8ED` | Fundo das páginas |
| Branco | `#FFFFFF` | Fundo dos cards |
| Marrom | `#3F3A36` | Texto principal |
| Marrom claro | `#6B645C` | Texto secundário |
| Bege | `#E5D9C6` | Bordas |
| Verde | `#5B7F4B` | Sucesso |
| Terracota | `#B3543E` | Erro |
| Dourado | `#E8B33D` | Alerta |

### Tipografia

- **Títulos:** Capriola (H1 32px, H2 24px, H3 20px)
- **Texto:** Quicksand (16px; legendas 14px)

### Espaçamento e bordas

- **Espaçamentos:** 4, 8, 16, 24, 32 e 48px
- **Raio de borda:** 10px
