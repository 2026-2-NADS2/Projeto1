const config = {
  USAR_MOCK: true,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  LATENCIA_MOCK_MS: 500,  /* Atraso simulado da API (ms) */
  SESSAO_MINUTOS: 30,  /* Expiração da sessão (min) */
  ITENS_POR_PAGINA: 8,
  CHAVE_SESSAO: 'fouru.sessao'
};

export default config;
