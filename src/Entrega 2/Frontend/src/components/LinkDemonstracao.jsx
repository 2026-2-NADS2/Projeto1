import { useState } from 'react';
import Icon from './Icon.jsx';
import { linkDefinirSenha } from '../utils/rotas.js';

/* Sem envio de e-mail configurado na API: o link de uso único aparece para o administrador repassar */
export default function LinkDemonstracao({ token, titulo = 'Link gerado' }) {
  const [copiado, setCopiado] = useState(false);
  const link = linkDefinirSenha(token);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      document.getElementById('link-demonstracao').select();
    }
  }

  return (
    <div className="link-demo" role="status">
      <p className="link-demo__titulo"><Icon nome="info" />{titulo}</p>
      <p className="legenda">
        O envio de e-mail não está configurado na API, então o link aparece aqui. Copie e envie para a pessoa.
      </p>
      <label className="sr-only" htmlFor="link-demonstracao">Link</label>
      <input id="link-demonstracao" className="campo__input link-demo__url" readOnly value={link} onFocus={(e) => e.target.select()} />
      <div className="link-demo__acoes">
        <button type="button" className="btn btn--secundario btn--sm" onClick={copiar}>
          <Icon nome={copiado ? 'check' : 'documento'} />{copiado ? 'Copiado!' : 'Copiar link'}
        </button>
        <a className="btn btn--primario btn--sm" href={link} target="_blank" rel="noopener noreferrer">
          Abrir em nova aba<Icon nome="seta" />
        </a>
      </div>
    </div>
  );
}
