import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../Icon.jsx';
import LinkInativo from './LinkInativo.jsx';
import { ModalConfirmacao } from '../Modal.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { DASHBOARD_POR_PERFIL, MENUS, ROTAS } from '../../utils/rotas.js';
import { iniciais, PERFIS } from '../../utils/formatadores.js';
import simbolo from '../../assets/simbolo-4u.svg';

export default function AreaAutenticada({ paginaAtiva, busca, children }) {
  const { usuario, sair } = useAuth();
  const { mostrar } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const botaoMenuRef = useRef(null);
  const sidebarRef = useRef(null);

  /* Aviso de acesso negado */
  useEffect(() => {
    if (location.state && location.state.negado) {
      mostrar({ tipo: 'erro', titulo: 'Acesso não permitido', mensagem: 'Seu perfil não tem acesso àquela área. Você foi direcionado ao seu painel.' });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, []);

  /* Menu lateral no celular */
  useEffect(() => {
    if (!menuAberto) return undefined;
    const primeiro = sidebarRef.current.querySelector('.menu__link');
    if (primeiro) primeiro.focus();
    const aoTeclar = (e) => { if (e.key === 'Escape') fecharMenu(); };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [menuAberto]);

  function fecharMenu() {
    setMenuAberto(false);
    if (botaoMenuRef.current) botaoMenuRef.current.focus();
  }

  function confirmarSair() {
    sair();
    navigate(ROTAS.login + '?saiu=1', { replace: true });
  }

  const perfil = usuario.perfil;

  return (
    <div className={'app' + (menuAberto ? ' menu-aberto' : '')}>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>

      <aside className="sidebar" id="sidebar" ref={sidebarRef}>
        <button type="button" className="btn btn--icone sidebar__fechar" aria-label="Fechar menu" onClick={fecharMenu}>
          <Icon nome="fechar" />
        </button>
        <Link className="sidebar__marca" to={DASHBOARD_POR_PERFIL[perfil]} aria-label="4U — ir para o dashboard">
          <img src={simbolo} alt="" width="46" height="30" />
          <span>4U</span>
        </Link>
        <p className="sidebar__perfil">{PERFIS[perfil]}</p>
        <nav aria-label="Menu principal">
          <ul className="menu">
            {MENUS[perfil].map((item) => {
              const conteudo = <><Icon nome={item.icone} /><span className="menu__texto">{item.rotulo}</span></>;
              return (
                <li key={item.rotulo}>
                  {item.caminho ? (
                    <Link
                      className="menu__link"
                      to={item.caminho}
                      aria-current={item.caminho === paginaAtiva ? 'page' : undefined}
                      onClick={() => setMenuAberto(false)}
                    >
                      {conteudo}
                    </Link>
                  ) : (
                    <LinkInativo className="menu__link">{conteudo}</LinkInativo>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="sidebar__rodape">
          <button type="button" className="btn btn--fantasma btn--bloco sidebar__sair" onClick={() => setConfirmarSaida(true)}>
            <Icon nome="sair" />Sair
          </button>
        </div>
      </aside>
      <div className="sobreposicao-menu" onClick={fecharMenu} />

      <div className="app__principal">
        <header className="topbar">
          <button
            type="button"
            ref={botaoMenuRef}
            className="btn btn--icone topbar__menu"
            aria-label="Abrir menu"
            aria-controls="sidebar"
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto(true)}
          >
            <Icon nome="menu" />
          </button>
          <div className="topbar__busca">
            {busca && (
              <div className="busca" role="search">
                <label htmlFor="busca-topo" className="sr-only">{busca}</label>
                <Icon nome="buscar" />
                <input id="busca-topo" className="busca__campo" type="search" autoComplete="off" placeholder={busca} />
              </div>
            )}
          </div>
          <div className="topbar__usuario">
            <span className="avatar" aria-hidden="true">{iniciais(usuario.nome)}</span>
            <span className="topbar__usuario-texto">
              <span className="topbar__usuario-nome">{usuario.nome}</span><br />
              <span className="topbar__usuario-perfil">{PERFIS[perfil]}</span>
            </span>
          </div>
        </header>

        <main className="conteudo" id="conteudo" tabIndex={-1}>
          {children}
        </main>

        <footer className="rodape-app">4U — Plataforma de Acompanhamento Escolar</footer>
      </div>

      {confirmarSaida && (
        <ModalConfirmacao
          titulo="Sair da 4U?"
          mensagem="Você precisará informar e-mail e senha para entrar novamente."
          textoConfirmar="Sair"
          aoConfirmar={confirmarSair}
          aoFechar={() => setConfirmarSaida(false)}
        />
      )}
    </div>
  );
}
