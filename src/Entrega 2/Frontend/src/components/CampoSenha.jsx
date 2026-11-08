import { useState } from 'react';
import Icon from './Icon.jsx';

/* Campo de senha com botão para mostrar/ocultar (mesmo padrão da tela de login) */
export default function CampoSenha({ id, rotulo, erro, ajuda, obrigatorio = true, ...props }) {
  const [visivel, setVisivel] = useState(false);
  const descritoPor = [ajuda ? id + '-ajuda' : null, id + '-erro'].filter(Boolean).join(' ');
  return (
    <div className={'campo' + (erro ? ' campo--invalido' : '')}>
      <label className="campo__label" htmlFor={id}>
        {rotulo}{obrigatorio && <span className="obrigatorio" aria-hidden="true">*</span>}
      </label>
      <div className="campo-senha">
        <input
          id={id} className="campo__input" type={visivel ? 'text' : 'password'} maxLength={72}
          aria-required={obrigatorio || undefined} aria-invalid={erro ? true : undefined} aria-describedby={descritoPor}
          {...props}
        />
        <button
          type="button" className="campo-senha__alternar" aria-pressed={visivel}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisivel(!visivel)}
        >
          <Icon nome={visivel ? 'olhoFechado' : 'olho'} />
        </button>
      </div>
      {ajuda && <span className="campo__ajuda" id={id + '-ajuda'}>{ajuda}</span>}
      <span className="campo__erro" id={id + '-erro'}>
        {erro && <><Icon nome="erro" /><span>{erro}</span></>}
      </span>
    </div>
  );
}

/* Regras da senha nova, mostradas enquanto a pessoa digita */
export function RegrasSenha({ senha }) {
  const regras = [
    { ok: senha.length >= 8, texto: 'Pelo menos 8 caracteres' },
    { ok: /[A-Za-z]/.test(senha), texto: 'Pelo menos uma letra' },
    { ok: /\d/.test(senha), texto: 'Pelo menos um número' }
  ];
  return (
    <ul className="regras-senha" aria-label="Requisitos da senha">
      {regras.map((r) => (
        <li key={r.texto} className={r.ok ? 'regras-senha__ok' : ''}>
          <Icon nome={r.ok ? 'check' : 'info'} />{r.texto}<span className="sr-only">{r.ok ? ' (atendido)' : ' (pendente)'}</span>
        </li>
      ))}
    </ul>
  );
}

/* Mesma regra da API: 8+ caracteres, com letra e número */
export const senhaValida = (s) => s.length >= 8 && s.length <= 72 && /[A-Za-z]/.test(s) && /\d/.test(s);
