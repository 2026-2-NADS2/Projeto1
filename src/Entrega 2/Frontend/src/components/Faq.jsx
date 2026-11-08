import { useState } from 'react';
import Icon from './Icon.jsx';
import '../styles/pages/ajuda.css';

/* Pergunta que abre e fecha (acordeão) */
export function Pergunta({ id, pergunta, resposta }) {
  const [aberta, setAberta] = useState(false);
  return (
    <li className={'faq__item' + (aberta ? ' faq__item--aberta' : '')}>
      <h3 className="faq__pergunta">
        <button type="button" aria-expanded={aberta} aria-controls={id} onClick={() => setAberta(!aberta)}>
          <span>{pergunta}</span>
          <Icon nome="chevronBaixo" />
        </button>
      </h3>
      <div className="faq__resposta" id={id} hidden={!aberta}>
        <p>{resposta}</p>
      </div>
    </li>
  );
}

/* Grupo de perguntas com título */
export function GrupoFaq({ grupo }) {
  return (
    <section className="faq" aria-labelledby={grupo.id}>
      <h2 id={grupo.id} className="faq__grupo">{grupo.titulo}</h2>
      <ul className="faq__lista">
        {grupo.perguntas.map((p) => <Pergunta key={p.id} {...p} />)}
      </ul>
    </section>
  );
}
