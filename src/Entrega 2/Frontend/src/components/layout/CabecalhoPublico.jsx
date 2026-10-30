import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Icon from '../Icon.jsx';
import logotipo from '../../assets/logotipo-4u-original.png';
import { ROTAS } from '../../utils/rotas.js';

export default function CabecalhoPublico() {
  const [aberto, setAberto] = useState(false);
  return (
    <header className="cabecalho-publico">
      <div className="container cabecalho-publico__barra">
        <Link className="marca" to={ROTAS.home} aria-label="4U — página inicial">
          <img className="marca__logotipo" src={logotipo} alt="4U" width="64" height="38" />
        </Link>
        <button
          type="button"
          className="btn btn--icone nav-publica__menu"
          aria-controls="nav-publica"
          aria-expanded={aberto}
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setAberto(!aberto)}
        >
          <Icon nome={aberto ? 'fechar' : 'menu'} />
        </button>
        <nav className={'nav-publica' + (aberto ? ' aberta' : '')} id="nav-publica" aria-label="Navegação principal">
          <ul className="nav-publica__lista">
            {/* NavLink marca a página atual com aria-current="page" */}
            <li><NavLink className="nav-publica__link" to={ROTAS.sobre}>Sobre</NavLink></li>
            <li><NavLink className="nav-publica__link" to={ROTAS.contato}>Contato</NavLink></li>
            <li><NavLink className="nav-publica__link" to={ROTAS.ajuda}>Ajuda</NavLink></li>
          </ul>
        </nav>
        <Link className="btn btn--primario" to={ROTAS.login}>Entrar</Link>
      </div>
    </header>
  );
}
