import Icon from './Icon.jsx';
import { formatarMedia, iniciais, STATUS } from '../utils/formatadores.js';

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
  return <span className={'situacao situacao--' + (ativo ? 'ativo' : 'inativo')}>{ativo ? 'Ativo' : 'Desativado'}</span>;
}

/* Login de professor ou responsável: liberado, aguardando o primeiro acesso ou desativado */
const ACESSO = {
  LIBERADO: { rotulo: 'Acesso liberado', classe: 'ativo' },
  PENDENTE: { rotulo: 'Aguardando primeiro acesso', classe: 'pendente' },
  DESATIVADO: { rotulo: 'Acesso desativado', classe: 'inativo' }
};

export function SituacaoAcesso({ acesso }) {
  const info = ACESSO[acesso] || ACESSO.LIBERADO;
  return <span className={'situacao situacao--' + info.classe}>{info.rotulo}</span>;
}

/* Tag do acompanhamento, com a cor cadastrada na tabela tag */
export function Etiqueta({ nome, cor }) {
  return <span className="etiqueta" style={{ '--etiqueta-cor': cor || '#3F3A36' }}>{nome}</span>;
}

/* Média com aviso quando fica abaixo da média de aprovação da escola */
export function Media({ valor, aprovacao }) {
  const abaixo = valor !== null && valor !== undefined && aprovacao !== undefined && valor < aprovacao;
  return (
    <span className={'media' + (abaixo ? ' media--abaixo' : '')} title={abaixo ? 'Abaixo da média de aprovação' : undefined}>
      {abaixo && <Icon nome="alerta" />}{formatarMedia(valor)}
    </span>
  );
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
