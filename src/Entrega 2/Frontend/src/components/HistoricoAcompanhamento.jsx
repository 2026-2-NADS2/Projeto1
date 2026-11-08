import Icon from './Icon.jsx';
import { formatarDataHora, STATUS } from '../utils/formatadores.js';

/* Linha do tempo do registro (vem da view vw_trilha_alteracoes): mudanças de status e versões do texto */
export default function HistoricoAcompanhamento({ trilha, devolucao }) {
  if (!trilha || !trilha.length) return <p className="legenda">Nenhuma movimentação registrada.</p>;
  return (
    <ol className="linha-tempo">
      {trilha.map((evento, i) => {
        const estado = evento.tipo === 'ESTADO';
        const info = estado ? STATUS[evento.detalhe] : null;
        /* O motivo da última devolução aparece junto do evento "Devolvido" */
        const motivo = estado && evento.detalhe === 'DEVOLVIDO' && devolucao && devolucao.data_hora === evento.data_hora ? devolucao.motivo : null;
        return (
          <li key={i} className={'linha-tempo__item' + (estado ? ' linha-tempo__item--' + (info ? info.classe : '') : '')}>
            <span className="linha-tempo__marca" aria-hidden="true"><Icon nome={estado ? (info ? info.icone : 'info') : 'editar'} /></span>
            <div>
              <p className="linha-tempo__titulo">
                {estado ? (info ? info.rotulo : evento.detalhe) : 'Texto ou média salvos'}
                {!estado && evento.detalhe && <> — {evento.detalhe}</>}
              </p>
              <p className="legenda">{evento.usuario} · {formatarDataHora(evento.data_hora)}</p>
              {motivo && <p className="linha-tempo__motivo">“{motivo}”</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
