import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import RodapePublico from '../components/layout/RodapePublico.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { DASHBOARD_POR_PERFIL, ROTAS } from '../utils/rotas.js';
import logotipo from '../assets/logotipo-4u.svg';
import simbolo from '../assets/simbolo-4u.svg';
import '../styles/pages/erro.css';

export default function NaoEncontrada() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const destino = usuario ? DASHBOARD_POR_PERFIL[usuario.perfil] : ROTAS.home;

  return (
    <div className="pagina-erro">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="cabecalho-publico">
        <div className="container cabecalho-publico__barra">
          <Link className="marca" to={ROTAS.home} aria-label="4U — página inicial">
            <img className="marca__logotipo" src={logotipo} alt="4U" width="64" height="38" />
          </Link>
        </div>
      </header>

      <main id="conteudo" className="erro" tabIndex={-1}>
        <div className="erro__ilustracao" aria-hidden="true">
          <span className="erro__numero">4</span>
          <img src={simbolo} alt="" width="120" height="79" />
          <span className="erro__numero">4</span>
        </div>
        <h1>Página não encontrada</h1>
        <p className="erro__texto">
          O endereço <code>{location.pathname}</code> não existe ou foi movido. Confira o link ou volte para uma página conhecida.
        </p>
        <div className="erro__acoes">
          <Link className="btn btn--primario" to={destino}>
            <Icon nome="painel" />{usuario ? 'Ir para o meu painel' : 'Ir para o início'}
          </Link>
          {window.history.length > 1 && (
            <button type="button" className="btn btn--secundario" onClick={() => navigate(-1)}>
              <Icon nome="chevronEsquerda" />Voltar à página anterior
            </button>
          )}
        </div>
      </main>

      <RodapePublico />
    </div>
  );
}
