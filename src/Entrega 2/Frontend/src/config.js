const config = {
  /* Endereço da API (vem do .env do front; no Vercel, das variáveis do projeto) */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  SESSAO_MINUTOS: 30,  /* Expiração da sessão sem uso (min) */
  ITENS_POR_PAGINA: 10,  /* Itens por página nas listas (o usuário pode trocar para 20 ou 50) */
  CHAVE_SESSAO: 'fouru.sessao'
};

export default config;
