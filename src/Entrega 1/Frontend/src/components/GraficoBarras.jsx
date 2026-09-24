import Icon from './Icon.jsx';
import { formatarMedia, plural } from '../utils/formatadores.js';

export default function GraficoBarras({ titulo, itens, minimo, maximo, referencia, rotuloReferencia }) {
  const faixa = maximo - minimo;
  const pct = (v) => Math.max(0, Math.min(100, ((v - minimo) / faixa) * 100));
  const abaixo = itens.filter((i) => i.valor < referencia).length;
  const resumo = titulo + '. ' + itens.map((i) => i.rotulo + ': ' + formatarMedia(i.valor)).join('; ') + '.';
  const eixo = [];
  for (let v = maximo; v >= minimo; v -= 2) eixo.push(v);

  return (
    <div className="grafico">
      <div className="grafico__barra-ferramentas">
        <p className="legenda grafico__legenda">
          <span className="grafico__chave-ref" aria-hidden="true" />
          {rotuloReferencia}: {formatarMedia(referencia)}
          {abaixo > 0 && (
            <> · <span className="grafico__nota-baixa"><Icon nome="alerta" />{plural(abaixo, 'disciplina abaixo', 'disciplinas abaixo')}</span></>
          )}
        </p>
      </div>
      <figure className="grafico__area" role="img" aria-label={resumo}>
        <div className="grafico__eixo" aria-hidden="true">
          {eixo.map((v) => <span key={v} style={{ bottom: pct(v) + '%' }}>{v}</span>)}
        </div>
        <div className="grafico__plot">
          {eixo.map((v) => <span key={v} className="grafico__grade" style={{ bottom: pct(v) + '%' }} aria-hidden="true" />)}
          <span className="grafico__referencia" style={{ bottom: pct(referencia) + '%' }} aria-hidden="true" />
          <ol className="grafico__colunas" aria-hidden="true">
            {itens.map((item) => {
              const baixa = item.valor < referencia;
              return (
                <li key={item.rotulo} className="grafico__coluna">
                  <div className="grafico__trilho">
                    <span
                      className={'grafico__barra' + (baixa ? ' grafico__barra--abaixo' : '')}
                      style={{ height: pct(item.valor) + '%', '--largura': (pct(item.valor) * 0.84).toFixed(1) + '%' }}
                    >
                      <span className="grafico__valor">{baixa && <Icon nome="alerta" />}{formatarMedia(item.valor)}</span>
                      <span className="grafico__dica">
                        {item.rotulo}<strong>Média {formatarMedia(item.valor)}</strong>
                        {baixa && <em>Abaixo de {formatarMedia(referencia)}</em>}
                      </span>
                    </span>
                  </div>
                  <span className="grafico__rotulo">{item.rotulo}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </figure>
    </div>
  );
}
