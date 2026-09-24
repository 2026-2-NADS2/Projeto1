import Icon from './Icon.jsx';

function Rotulo({ id, rotulo, obrigatorio }) {
  return (
    <label className="campo__label" htmlFor={id}>
      {rotulo}{obrigatorio && <span className="obrigatorio" aria-hidden="true">*</span>}
    </label>
  );
}

function Rodape({ id, ajuda, erro }) {
  return (
    <>
      {ajuda && <span className="campo__ajuda" id={id + '-ajuda'}>{ajuda}</span>}
      <span className="campo__erro" id={id + '-erro'}>
        {erro && <><Icon nome="erro" /><span>{erro}</span></>}
      </span>
    </>
  );
}

const descritoPor = (id, ajuda) => [ajuda ? id + '-ajuda' : null, id + '-erro'].filter(Boolean).join(' ');

export function CampoTexto({ id, rotulo, obrigatorio, ajuda, erro, inteiro, ...props }) {
  return (
    <div className={'campo' + (inteiro ? ' campo--inteiro' : '') + (erro ? ' campo--invalido' : '')}>
      <Rotulo id={id} rotulo={rotulo} obrigatorio={obrigatorio} />
      <input
        id={id}
        className="campo__input"
        aria-required={obrigatorio || undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor(id, ajuda)}
        {...props}
      />
      <Rodape id={id} ajuda={ajuda} erro={erro} />
    </div>
  );
}

export function CampoSelect({ id, rotulo, obrigatorio, ajuda, erro, inteiro, opcoes, placeholder = 'Selecione', ...props }) {
  return (
    <div className={'campo' + (inteiro ? ' campo--inteiro' : '') + (erro ? ' campo--invalido' : '')}>
      <Rotulo id={id} rotulo={rotulo} obrigatorio={obrigatorio} />
      <select
        id={id}
        className="campo__select"
        aria-required={obrigatorio || undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor(id, ajuda)}
        {...props}
      >
        <option value="">{placeholder}</option>
        {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
      </select>
      <Rodape id={id} ajuda={ajuda} erro={erro} />
    </div>
  );
}
