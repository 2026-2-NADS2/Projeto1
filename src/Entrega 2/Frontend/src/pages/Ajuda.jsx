import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import CabecalhoPublico from '../components/layout/CabecalhoPublico.jsx';
import RodapePublico from '../components/layout/RodapePublico.jsx';
import { ROTAS } from '../utils/rotas.js';
import { normalizar } from '../utils/formatadores.js';
import { GrupoFaq } from '../components/Faq.jsx';
import { GRUPOS_FAQ } from '../data/perguntasFrequentes.js';
import simbolo from '../assets/simbolo-4u.svg';
import '../styles/pages/ajuda.css';

/* Página Ajuda: perguntas frequentes com busca */
export default function Ajuda() {
  const [busca, setBusca] = useState('');
  useEffect(() => { document.title = 'Ajuda — 4U'; }, []);

  /* Filtra pela pergunta e pela resposta, sem diferenciar acentos */
  const termo = normalizar(busca.trim());
  const grupos = GRUPOS_FAQ
    .filter((g) => g.publico)
    .map((g) => ({
      ...g,
      perguntas: g.perguntas.filter((p) => !termo || normalizar(p.pergunta + ' ' + p.resposta).includes(termo))
    }))
    .filter((g) => g.perguntas.length > 0);
  const total = grupos.reduce((soma, g) => soma + g.perguntas.length, 0);

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <CabecalhoPublico />

      <main id="conteudo" className="container ajuda" tabIndex={-1}>
        <header className="ajuda__topo">
          <img src={simbolo} alt="" width="72" height="48" />
          <h1>Como podemos ajudar?</h1>
          <form className="busca ajuda__busca" role="search" onSubmit={(e) => e.preventDefault()}>
            <Icon nome="buscar" />
            <label className="sr-only" htmlFor="busca-ajuda">Buscar nas perguntas frequentes</label>
            <input
              id="busca-ajuda" className="busca__campo" type="search" placeholder="Qual sua dúvida?"
              value={busca} onChange={(e) => setBusca(e.target.value)}
            />
          </form>
          <p className="sr-only" aria-live="polite">
            {termo ? `${total} ${total === 1 ? 'pergunta encontrada' : 'perguntas encontradas'}` : ''}
          </p>
        </header>

        {grupos.length === 0 ? (
          <div className="card estado ajuda__vazio" role="status">
            <div className="estado__icone"><Icon nome="buscar" /></div>
            <p className="estado__titulo">Nenhuma pergunta encontrada</p>
            <p>Tente outras palavras ou envie sua dúvida para a escola.</p>
            <Link className="btn btn--primario btn--sm" to={ROTAS.contato}>Fale com a gente</Link>
          </div>
        ) : (
          grupos.map((g) => (
            <GrupoFaq key={g.id} grupo={g} />
          ))
        )}

        <aside className="card ajuda__contato">
          <span className="ajuda__contato-icone tom-magenta"><Icon nome="mensagem" /></span>
          <div>
            <h2>Não encontrou o que procurava?</h2>
            <p>Envie sua dúvida pelo formulário de contato e a escola responde no seu e-mail.</p>
          </div>
          <Link className="btn btn--primario" to={ROTAS.contato}>Fale com a gente</Link>
        </aside>
      </main>

      <RodapePublico />
    </>
  );
}
