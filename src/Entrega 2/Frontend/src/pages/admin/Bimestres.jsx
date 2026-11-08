import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import Modal from '../../components/Modal.jsx';
import { CampoTexto } from '../../components/Campo.jsx';
import { StatusBadge } from '../../components/Elementos.jsx';
import { Carregando, ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { ROTAS } from '../../utils/rotas.js';
import { formatarDataHora } from '../../utils/formatadores.js';
import '../../styles/pages/bimestres.css';

const SITUACOES = {
  ABERTO: { rotulo: 'Digitação aberta', classe: 'ativo', icone: 'lapis' },
  ENCERRADO: { rotulo: 'Encerrado', classe: 'inativo', icone: 'cadeado' },
  AGENDADO: { rotulo: 'Agendado', classe: 'pendente', icone: 'calendario' }
};
const ORDEM_STATUS = ['RASCUNHO', 'ENVIADO', 'EM_REVISAO', 'DEVOLVIDO', 'PUBLICADO'];

/* Data do navegador no formato do campo datetime-local ('aaaa-mm-ddThh:mm') */
function paraCampo(data) {
  const p = (n) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}T${p(data.getHours())}:${p(data.getMinutes())}`;
}

/* Editar o período de digitação */
function ModalPeriodo({ bimestre, aoFechar, aoSalvar }) {
  const { mostrar } = useToast();
  const [valores, setValores] = useState({ abertura: bimestre.abertura.slice(0, 16), encerramento: bimestre.encerramento.slice(0, 16) });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    const encontrados = {};
    if (!valores.abertura) encontrados.abertura = 'Informe a abertura.';
    if (!valores.encerramento) encontrados.encerramento = 'Informe o encerramento.';
    if (valores.abertura && valores.encerramento && valores.encerramento <= valores.abertura) encontrados.encerramento = 'O encerramento precisa ser depois da abertura.';
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      const r = await api.alterarPeriodo(bimestre.id, valores);
      mostrar({ tipo: 'sucesso', titulo: 'Período salvo', mensagem: r.mensagem });
      aoSalvar();
    } catch (erro) {
      if (erro && erro.campos) setErros(erro.campos);
      mostrar({ tipo: 'erro', titulo: 'Não foi possível salvar', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`${bimestre.numero}º bimestre`} descricao="Período em que os professores podem registrar e corrigir acompanhamentos."
      pequeno aoFechar={aoFechar}
      rodape={(
        <>
          <button type="button" className="btn btn--fantasma" onClick={aoFechar}>Cancelar</button>
          <button type="submit" form="form-periodo" className="btn btn--primario" disabled={enviando}>
            {enviando ? <><span className="spinner" aria-hidden="true" />Salvando…</> : 'Salvar período'}
          </button>
        </>
      )}>
      <form id="form-periodo" noValidate onSubmit={salvar}>
        <CampoTexto id="p-abertura" rotulo="Abertura da digitação" obrigatorio type="datetime-local" value={valores.abertura}
          erro={erros.abertura} onChange={(e) => setValores({ ...valores, abertura: e.target.value })} />
        <CampoTexto id="p-encerramento" rotulo="Encerramento da digitação" obrigatorio type="datetime-local" value={valores.encerramento}
          erro={erros.encerramento} onChange={(e) => setValores({ ...valores, encerramento: e.target.value })} />
      </form>
    </Modal>
  );
}

/* Card de um bimestre: datas, situação e andamento */
function CartaoBimestre({ b, aoEditar, aoAlterarRapido }) {
  const s = SITUACOES[b.situacao];
  const total = Object.values(b.registros).reduce((soma, n) => soma + n, 0);
  const publicados = b.registros.PUBLICADO || 0;
  const pct = total ? Math.round((publicados / total) * 100) : 0;

  return (
    <li className={'card bimestre bimestre--' + s.classe}>
      <div className="bimestre__topo">
        <h2>{b.numero}º bimestre</h2>
        <span className={'situacao situacao--' + s.classe}>{s.rotulo}</span>
      </div>
      <dl className="bimestre__datas">
        <div><dt>Abertura</dt><dd>{formatarDataHora(b.abertura)}</dd></div>
        <div><dt>Encerramento</dt><dd>{formatarDataHora(b.encerramento)}</dd></div>
      </dl>

      <div className="bimestre__progresso">
        <span className="legenda">{total ? `${publicados} de ${total} registros publicados` : 'Nenhum registro ainda'}</span>
        <span className="progresso" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`${pct}% publicados`}>
          <span className="progresso__barra" style={{ width: pct + '%', display: 'block' }} />
        </span>
      </div>
      {total > 0 && (
        <ul className="bimestre__status" aria-label="Registros por situação">
          {ORDEM_STATUS.filter((st) => b.registros[st]).map((st) => (
            <li key={st}><StatusBadge status={st} texto={`${b.registros[st]}`} /></li>
          ))}
        </ul>
      )}

      <div className="bimestre__acoes">
        <button type="button" className="btn btn--secundario btn--sm" onClick={() => aoEditar(b)}><Icon nome="calendario" />Editar período</button>
        {b.situacao === 'ABERTO' && (
          <button type="button" className="btn btn--fantasma btn--sm" onClick={() => aoAlterarRapido(b, 'encerrar')}><Icon nome="cadeado" />Encerrar agora</button>
        )}
        {b.situacao === 'ENCERRADO' && (
          <button type="button" className="btn btn--fantasma btn--sm" onClick={() => aoAlterarRapido(b, 'reabrir')}><Icon nome="lapis" />Reabrir por 7 dias</button>
        )}
      </div>
    </li>
  );
}

/* Administrador: períodos de digitação dos bimestres */
export default function Bimestres() {
  const { mostrar } = useToast();
  const lista = useApi(api.listarBimestres);
  const [editando, setEditando] = useState(null);

  useEffect(() => { document.title = 'Bimestres — 4U'; }, []);

  /* Atalhos: encerrar a digitação agora ou reabrir por mais 7 dias */
  async function alterarRapido(b, acao) {
    const agora = new Date();
    const encerramento = acao === 'encerrar' ? agora : new Date(agora.getTime() + 7 * 24 * 3600 * 1000);
    const abertura = acao === 'reabrir' && new Date(b.abertura) > agora ? agora : new Date(b.abertura);
    try {
      const r = await api.alterarPeriodo(b.id, { abertura: paraCampo(abertura), encerramento: paraCampo(encerramento) });
      mostrar({ tipo: 'sucesso', mensagem: acao === 'encerrar' ? `Digitação do ${b.numero}º bimestre encerrada.` : r.mensagem });
      lista.recarregar();
    } catch (erro) {
      mostrar({ tipo: 'erro', titulo: 'Não foi possível alterar', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
    }
  }

  let conteudo;
  if (lista.carregando) conteudo = <div className="card"><Carregando linhas={6} blocos /></div>;
  else if (lista.erro) conteudo = <div className="card"><ErroCarregamento erro={lista.erro} aoTentarNovamente={lista.recarregar} /></div>;
  else if (!lista.dados.bimestres.length) conteudo = <div className="card"><Vazio icone="calendario" titulo="Nenhum bimestre cadastrado" /></div>;
  else {
    conteudo = (
      <ul className="bimestres">
        {lista.dados.bimestres.map((b) => <CartaoBimestre key={b.id} b={b} aoEditar={setEditando} aoAlterarRapido={alterarRapido} />)}
      </ul>
    );
  }

  return (
    <AreaAutenticada paginaAtiva={ROTAS.adminBimestres}
      titulo={<>Bimestres {lista.dados && <span className="texto-secundario">· {lista.dados.ano_letivo}</span>}</>}
      descricao="Defina quando os professores podem registrar. Fora do período, eles só consultam.">
      <div className="conteudo__acoes">
        <Link className="btn btn--secundario" to={ROTAS.adminAcompanhamentos}><Icon nome="prancheta" />Revisar acompanhamentos</Link>
      </div>
      {conteudo}
      {editando && <ModalPeriodo bimestre={editando} aoFechar={() => setEditando(null)} aoSalvar={() => { setEditando(null); lista.recarregar(); }} />}
    </AreaAutenticada>
  );
}
