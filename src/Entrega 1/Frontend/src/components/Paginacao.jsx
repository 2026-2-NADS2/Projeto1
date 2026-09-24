import Icon from './Icon.jsx';

function paginasVisiveis(atual, total) {
  const lista = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - atual) <= 1) lista.push(p);
    else if (lista[lista.length - 1] !== '…') lista.push('…');
  }
  return lista;
}

export default function Paginacao({ dados, aoMudar }) {
  if (!dados || !dados.total) return null;
  const inicio = (dados.pagina - 1) * dados.por_pagina + 1;
  const fim = Math.min(dados.pagina * dados.por_pagina, dados.total);

  return (
    <nav className="paginacao" aria-label="Paginação">
      <p className="paginacao__info" aria-live="polite">Mostrando {inicio}–{fim} de {dados.total}</p>
      <div className="paginacao__botoes">
        <button type="button" className="btn btn--fantasma btn--sm" disabled={dados.pagina === 1}
          aria-label="Página anterior" onClick={() => aoMudar(dados.pagina - 1)}>
          <Icon nome="chevronEsquerda" />
        </button>
        {paginasVisiveis(dados.pagina, dados.paginas).map((p, i) => (p === '…'
          ? <span key={'r' + i} className="legenda" aria-hidden="true" style={{ alignSelf: 'center' }}>…</span>
          : (
            <button key={p} type="button" className="btn btn--fantasma btn--sm"
              aria-current={p === dados.pagina ? 'page' : undefined} aria-label={'Página ' + p}
              onClick={() => aoMudar(p)}>
              {p}
            </button>
          )))}
        <button type="button" className="btn btn--fantasma btn--sm" disabled={dados.pagina === dados.paginas}
          aria-label="Próxima página" onClick={() => aoMudar(dados.pagina + 1)}>
          <Icon nome="chevronDireita" />
        </button>
      </div>
    </nav>
  );
}
