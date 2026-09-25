import Icon from './Icon.jsx';

export function Carregando({ linhas = 4, blocos = false, texto = 'Carregando informações…' }) {
  return (
    <div className="card__corpo" aria-busy="true">
      <span className="sr-only">{texto}</span>
      {Array.from({ length: linhas }, (_, i) => (
        <span
          key={i}
          className={blocos ? 'skeleton skeleton--bloco' : 'skeleton skeleton--linha' + (i % 3 === 2 ? ' skeleton--linha-curta' : '')}
        />
      ))}
    </div>
  );
}

export function Vazio({ icone = 'info', titulo, mensagem, children }) {
  return (
    <div className="estado" role="status">
      <div className="estado__icone"><Icon nome={icone} /></div>
      <p className="estado__titulo">{titulo}</p>
      {mensagem && <p>{mensagem}</p>}
      {children}
    </div>
  );
}

export function ErroCarregamento({ erro, aoTentarNovamente }) {
  return (
    <div className="estado estado--erro" role="alert">
      <div className="estado__icone"><Icon nome="alerta" /></div>
      <p className="estado__titulo">Não foi possível carregar os dados</p>
      <p>{(erro && erro.mensagem) || 'Ocorreu um erro inesperado. Tente novamente em instantes.'}</p>
      <button type="button" className="btn btn--secundario btn--sm" onClick={aoTentarNovamente}>
        <Icon nome="devolver" />Tentar novamente
      </button>
    </div>
  );
}
