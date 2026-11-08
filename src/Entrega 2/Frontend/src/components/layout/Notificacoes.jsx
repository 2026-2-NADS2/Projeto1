import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../Icon.jsx';
import api from '../../services/api.js';
import { formatarDataHora } from '../../utils/formatadores.js';

const ICONE_POR_TIPO = { alerta: 'alerta', info: 'info', sucesso: 'mensagem' };
const ATUALIZAR_MS = 60 * 1000;

/* Sino do topo: pendências do usuário logado, atualizadas a cada minuto e a cada troca de tela */
export default function Notificacoes() {
  const location = useLocation();
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(false);
  const caixaRef = useRef(null);
  const botaoRef = useRef(null);

  async function carregar() {
    try {
      setDados(await api.notificacoes());
      setErro(false);
    } catch (e) {
      setErro(true);
    }
  }

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, ATUALIZAR_MS);
    return () => clearInterval(id);
  }, [location.pathname, location.search]);

  /* Fecha com Esc ou clique fora */
  useEffect(() => {
    if (!aberto) return undefined;
    function aoClicar(e) {
      if (caixaRef.current && !caixaRef.current.contains(e.target)) setAberto(false);
    }
    function aoTeclar(e) {
      if (e.key === 'Escape') { setAberto(false); if (botaoRef.current) botaoRef.current.focus(); }
    }
    document.addEventListener('mousedown', aoClicar);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  const itens = dados ? dados.itens : [];
  const total = itens.length;

  return (
    <div className="notificacoes" ref={caixaRef}>
      <button
        type="button"
        ref={botaoRef}
        className="topbar__botao"
        aria-label={total ? `Notificações: ${total} ${total === 1 ? 'pendente' : 'pendentes'}` : 'Notificações'}
        aria-expanded={aberto}
        aria-controls="painel-notificacoes"
        onClick={() => { setAberto(!aberto); if (!aberto) carregar(); }}
      >
        <Icon nome="sino" />
        {total > 0 && <span className="topbar__ponto" aria-hidden="true" />}
      </button>

      {aberto && (
        <div className="notificacoes__painel" id="painel-notificacoes" role="region" aria-label="Notificações">
          <div className="notificacoes__cabecalho">
            <h2>Notificações</h2>
            {total > 0 && <span className="notificacoes__contador">{total}</span>}
          </div>
          {erro && !dados ? (
            <p className="notificacoes__vazio">Não foi possível carregar as notificações agora.</p>
          ) : !dados ? (
            <p className="notificacoes__vazio">Carregando…</p>
          ) : !total ? (
            <p className="notificacoes__vazio"><Icon nome="check" className="icone--inline" /> Tudo em dia. Nenhuma pendência por aqui.</p>
          ) : (
            <ul className="notificacoes__lista">
              {itens.map((n) => (
                <li key={n.id}>
                  <Link className={'notificacao notificacao--' + n.tipo} to={n.link} onClick={() => setAberto(false)}>
                    <span className="notificacao__icone"><Icon nome={ICONE_POR_TIPO[n.tipo] || 'info'} /></span>
                    <span className="notificacao__texto">
                      <strong>{n.titulo}</strong>
                      <span>{n.mensagem}</span>
                      {n.data && <span className="notificacao__data">{formatarDataHora(n.data)}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
