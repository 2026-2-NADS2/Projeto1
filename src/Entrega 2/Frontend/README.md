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
- CSS3
- JavaScript
- React 18
- React Router
- Vite

## Como executar

O passo a passo completo (banco, API e site) está no [README da Entrega 2](../README.md).
Com a API rodando em http://localhost:3000:

```bash
cd "src/Entrega 2/Frontend"
npm install
npm run dev
```

Depois, abra http://localhost:5173.

## Telas

| Perfil | Tela | Rota |
|---|---|---|
| Público | Home, Sobre, Ajuda, Contato | `/`, `/sobre`, `/ajuda`, `/contato` |
| Público | Login, Esqueci minha senha, Criar/nova senha | `/login`, `/esqueci-senha`, `/definir-senha` |
| Administrador | Dashboard | `/admin` |
| Administrador | Cadastros (cadastrar, editar, liberar acesso, desativar, excluir, vínculos) | `/admin/cadastros` |
| Administrador | Acompanhamentos (revisar, ajustar, devolver, publicar) | `/admin/acompanhamentos` |
| Administrador | Bimestres (período de digitação) | `/admin/bimestres` |
| Administrador | Relatórios (indicadores e exportação .csv) | `/admin/relatorios` |
| Professor | Dashboard, Minhas turmas | `/professor`, `/professor/turmas` |
| Professor | Acompanhamentos (registrar, salvar rascunho, enviar, corrigir) | `/professor/acompanhamentos` |
| Professor | Retornos (devolvidos e observações das famílias) | `/professor/retornos` |
| Responsável | Dashboard, Meus alunos | `/responsavel`, `/responsavel/alunos` |
| Responsável | Relatórios (ciência e PDF) | `/responsavel/relatorios` |
| Todos | Página não encontrada (404) | qualquer outra rota |

## Usuários para teste

Senha de todos: `4u@demo`.

| Perfil | E-mail |
|---|---|
| Administradoras | rafaela.mello@4u.com, laura.rayssa@4u.com, anna.silva@4u.com, dilly.martins@4u.com |
| Professor | professor@escola4u.test |
| Responsável | responsavel@escola4u.test |

## Funcionalidades

- Login com JWT, perfis com acesso separado e sessão que expira após 30 minutos sem uso.
- Primeiro acesso por convite e "Esqueci minha senha" com link de uso único enviado por e-mail.
- Desativar o acesso tira a pessoa do sistema na hora.
- Fluxo do acompanhamento: rascunho → enviado → em revisão → publicado, com devolução e histórico.
- Relatório do responsável com ciência, observação e PDF (imprimir → salvar como PDF).
- Mensagens de carregamento, de lista vazia e de erro, com o botão "Tentar novamente".
- Layout responsivo para computador, tablet e celular.

## Dados

Todas as telas buscam os dados na API pelo arquivo `src/services/api.js`. O endereço da API vem de `VITE_API_BASE_URL` (sem essa variável, usa `http://localhost:3000/api`).

## Estrutura

```
src/
├── pages/        telas
├── components/   componentes reutilizáveis
├── contexts/     login e mensagens
├── hooks/        carregamento de dados
├── services/     acesso aos dados
├── data/        contas de demonstração da tela de login
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
