import Icon from './Icon.jsx';
import { iniciais, STATUS } from '../utils/formatadores.js';

export function StatusBadge({ status, texto }) {
  const info = STATUS[status];
  if (!info) return null;
  return (
    <span className={'status status--' + info.classe} title={info.rotulo}>
      <Icon nome={info.icone} />{texto || info.rotulo}
    </span>
  );
}

export function Situacao({ ativo }) {
  return <span className={'situacao situacao--' + (ativo ? 'ativo' : 'inativo')}>{ativo ? 'Ativo' : 'Inativo'}</span>;
}

export function Avatar({ nome }) {
  return <span className="avatar" aria-hidden="true">{iniciais(nome)}</span>;
}

/* Card de indicador dos dashboards */
export function Indicador({ icone, tom, valor, rotulo, detalhe, rotuloAntes = false }) {
  return (
    <div className="card indicador">
      <span className={'indicador__icone ' + tom}><Icon nome={icone} /></span>
      <div>
        {rotuloAntes && <div className="indicador__rotulo">{rotulo}</div>}
        <div className="indicador__valor">{valor}</div>
        {!rotuloAntes && <div className="indicador__rotulo">{rotulo}</div>}
        {detalhe && <div className="indicador__detalhe">{detalhe}</div>}
      </div>
    </div>
  );
}

export function IndicadorCarregando() {
  return (
    <div className="card indicador" aria-hidden="true">
      <span className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
      <div style={{ flex: 1 }}>
        <span className="skeleton skeleton--linha" style={{ width: '40%' }} />
        <span className="skeleton skeleton--linha" />
      </div>
    </div>
  );
}
