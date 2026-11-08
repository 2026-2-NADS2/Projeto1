import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import Modal from '../../components/Modal.jsx';
import Paginacao from '../../components/Paginacao.jsx';
import HistoricoAcompanhamento from '../../components/HistoricoAcompanhamento.jsx';
import { CampoAreaTexto, CampoTexto } from '../../components/Campo.jsx';
import { Avatar, Etiqueta, Media, StatusBadge } from '../../components/Elementos.jsx';
import { Carregando, ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { ROTAS } from '../../utils/rotas.js';
import { formatarData, formatarDataHora, formatarMedia } from '../../utils/formatadores.js';
import '../../styles/pages/cadastros.css';
import '../../styles/pages/acompanhamentos.css';

/* Abas da revisão (rascunhos são do professor e não aparecem aqui) */
const ABAS = [
  { chave: 'aguardando', rotulo: 'Aguardando revisão' },
  { chave: 'devolvidos', rotulo: 'Devolvidos' },
  { chave: 'publicados', rotulo: 'Publicados' },
  { chave: 'todos', rotulo: 'Todos' }
];

const lerMedia = (v) => Number(String(v).replace(',', '.'));

/* Revisar: ler, ajustar o texto, devolver com motivo ou publicar para a família */
function ModalRevisao({ id, aoFechar, aoMudar }) {
  const { mostrar } = useToast();
  const detalhe = useApi(() => api.detalheAcompanhamento(id), [id]);
  const a = detalhe.dados;
  const [modo, setModo] = useState('ler'); /* ler | ajustar | devolver */
  const [valores, setValores] = useState({ media: '', descricao: '', motivo: '' });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const emRevisao = a && (a.status === 'ENVIADO' || a.status === 'EM_REVISAO');

  function abrirModo(novo) {
    setErros({});
    setValores({ media: formatarMedia(a.media), descricao: a.descricao, motivo: '' });
    setModo(novo);
  }

  async function executar(acao, sucesso) {
    setEnviando(true);
    try {
      const r = await acao();
      mostrar({ tipo: 'sucesso', titulo: sucesso, mensagem: r.mensagem });
      aoMudar();
      aoFechar();
    } catch (erro) {
      if (erro && erro.campos) setErros(erro.campos);
      mostrar({ tipo: 'erro', titulo: 'Não foi possível concluir', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  function confirmar(e) {
    e.preventDefault();
    if (modo === 'devolver') {
      if (valores.motivo.trim().length < 10) { setErros({ motivo: 'Explique o que o professor deve ajustar (pelo menos 10 caracteres).' }); return; }
      executar(() => api.devolverAcompanhamento(id, valores.motivo.trim()), 'Devolvido ao professor');
    } else {
      const encontrados = {};
      const media = lerMedia(valores.media);
      if (!Number.isFinite(media) || media < 0 || media > 10) encontrados.media = 'Informe uma média de 0 a 10.';
      if (valores.descricao.trim().length < 20) encontrados.descricao = 'Escreva pelo menos 20 caracteres.';
      if (valores.motivo.trim().length < 5) encontrados.motivo = 'Diga o motivo do ajuste (fica no histórico).';
      setErros(encontrados);
      if (Object.keys(encontrados).length) return;
      executar(() => api.ajustarAcompanhamento(id, { media, descricao: valores.descricao.trim(), motivo: valores.motivo.trim() }), 'Ajuste salvo');
    }
  }

  let corpo;
  let rodape = <button type="button" className="btn btn--fantasma" onClick={aoFechar}>Fechar</button>;
  if (detalhe.carregando) corpo = <Carregando linhas={6} />;
  else if (detalhe.erro) corpo = <ErroCarregamento erro={detalhe.erro} aoTentarNovamente={detalhe.recarregar} />;
  else {
    corpo = (
      <>
        <dl className="ficha">
          <div><dt>Aluno</dt><dd>{a.aluno}</dd></div>
          <div><dt>Turma</dt><dd>{a.turma}</dd></div>
          <div><dt>Disciplina</dt><dd>{a.disciplina}</dd></div>
          <div><dt>Professor</dt><dd>{a.professor}</dd></div>
          <div><dt>Bimestre</dt><dd>{a.bimestre}º de {a.ano_letivo}</dd></div>
          <div><dt>Situação</dt><dd><StatusBadge status={a.status} /></dd></div>
        </dl>

        {modo === 'ler' && (
          <>
            <div className="registro">
              <div className="registro__media"><span className="legenda">Média do bimestre</span><Media valor={a.media} aprovacao={a.escala.aprovacao} /></div>
              {a.tags.length > 0 && <div className="registro__tags">{a.tags.map((t) => <Etiqueta key={t.id} {...t} />)}</div>}
              <p className="registro__texto">{a.descricao}</p>
              <p className="legenda">Versão {a.versao_atual} · atualizado em {formatarDataHora(a.atualizado_em)}{a.publicado_em && ` · publicado em ${formatarDataHora(a.publicado_em)}`}</p>
            </div>
            {a.status === 'DEVOLVIDO' && a.ultima_devolucao && (
              <div className="alerta alerta--alerta"><Icon nome="devolver" /><p><strong>Motivo da devolução:</strong> {a.ultima_devolucao.motivo}</p></div>
            )}
            {a.ciencias.length > 0 && (
              <div className="registro__ciencias">
                <h3>Ciência da família</h3>
                <ul className="lista-simples">
                  {a.ciencias.map((c, i) => (
                    <li key={i}><span>{c.responsavel}<small>{formatarDataHora(c.data_hora)}{c.observacao && ` · “${c.observacao}”`}</small></span></li>
                  ))}
                </ul>
              </div>
            )}
            <details className="registro__historico">
              <summary>Histórico do registro</summary>
              <HistoricoAcompanhamento trilha={a.trilha} devolucao={a.ultima_devolucao} />
            </details>
          </>
        )}

        {modo !== 'ler' && (
          <form id="form-revisao" noValidate onSubmit={confirmar}>
            {modo === 'ajustar' && (
              <>
                <div className="alerta alerta--info" style={{ marginBottom: 16 }}>
                  <Icon nome="info" /><p>O ajuste cria uma nova versão. A versão do professor continua no histórico.</p>
                </div>
                <CampoTexto id="r-media" rotulo="Média" obrigatorio inputMode="decimal" maxLength={5} value={valores.media}
                  erro={erros.media} onChange={(e) => setValores({ ...valores, media: e.target.value })} />
                <CampoAreaTexto id="r-descricao" rotulo="Descrição" obrigatorio maxLength={2000} value={valores.descricao}
                  ajuda={`${valores.descricao.length} de 2000 caracteres`} erro={erros.descricao}
                  onChange={(e) => setValores({ ...valores, descricao: e.target.value })} />
              </>
            )}
            <CampoAreaTexto id="r-motivo" rotulo={modo === 'devolver' ? 'O que o professor deve ajustar?' : 'Motivo do ajuste'} obrigatorio
              maxLength={255} rows={3} value={valores.motivo} erro={erros.motivo}
              ajuda={modo === 'devolver' ? 'O professor vê este texto na tela de Retornos.' : 'Fica registrado no histórico.'}
              onChange={(e) => setValores({ ...valores, motivo: e.target.value })} />
          </form>
        )}
      </>
    );

    if (emRevisao && modo === 'ler') {
      rodape = (
        <>
          <button type="button" className="btn btn--fantasma" onClick={() => abrirModo('ajustar')}><Icon nome="editar" />Ajustar texto</button>
          <button type="button" className="btn btn--secundario" onClick={() => abrirModo('devolver')}><Icon nome="devolver" />Devolver</button>
          <button type="button" className="btn btn--primario" disabled={enviando}
            onClick={() => executar(() => api.publicarAcompanhamento(id), 'Publicado')}>
            {enviando ? <><span className="spinner" aria-hidden="true" />Publicando…</> : <><Icon nome="check" />Publicar</>}
          </button>
        </>
      );
    } else if (modo !== 'ler') {
      rodape = (
        <>
          <button type="button" className="btn btn--fantasma" onClick={() => setModo('ler')}>Voltar</button>
          <button type="submit" form="form-revisao" className={'btn ' + (modo === 'devolver' ? 'btn--perigo' : 'btn--primario')} disabled={enviando}>
            {enviando ? <><span className="spinner" aria-hidden="true" />Salvando…</> : (modo === 'devolver' ? 'Devolver ao professor' : 'Salvar ajuste')}
          </button>
        </>
      );
    }
  }

  return (
    <Modal titulo={a ? `${a.disciplina} — ${a.aluno}` : 'Acompanhamento'} descricao={modo === 'devolver' ? 'Devolver para ajustes' : modo === 'ajustar' ? 'Ajustar antes de publicar' : 'Revisão'}
      aoFechar={aoFechar} largo rodape={rodape}>
      {corpo}
    </Modal>
  );
}

/* Seletor dos filtros */
function Filtro({ id, rotulo, valor, opcoes, aoMudar, todos = 'Todos' }) {
  return (
    <div className="campo">
      <label className="campo__label" htmlFor={id}>{rotulo}</label>
      <select className="campo__select" id={id} value={valor} onChange={(e) => aoMudar(e.target.value)}>
        {todos && <option value="">{todos}</option>}
        {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
      </select>
    </div>
  );
}

/* Administrador: fila de revisão com abas, filtros e paginação */
export default function Acompanhamentos() {
  const [params] = useSearchParams();
  const [aba, setAba] = useState('aguardando');
  const [filtros, setFiltros] = useState({ bimestre_id: '', turma_id: '', disciplina_id: '' });
  const [textoBusca, setTextoBusca] = useState(() => params.get('busca') || '');
  const [busca, setBusca] = useState(() => params.get('busca') || '');
  const [pagina, setPagina] = useState(1);
  const [aberto, setAberto] = useState(null);

  const bimestres = useApi(api.listarBimestres);
  const turmas = useApi(api.listarTurmas);
  const disciplinas = useApi(api.listarDisciplinas);

  /* Começa no bimestre com digitação aberta */
  useEffect(() => {
    if (!bimestres.dados || filtros.bimestre_id) return;
    const lista = bimestres.dados.bimestres;
    const atual = lista.find((b) => b.situacao === 'ABERTO') || lista.filter((b) => b.situacao === 'ENCERRADO').pop() || lista[0];
    if (atual) setFiltros((f) => ({ ...f, bimestre_id: String(atual.id) }));
  }, [bimestres.dados]);

  useEffect(() => {
    const timer = setTimeout(() => { setBusca(textoBusca.trim()); setPagina(1); }, 300);
    return () => clearTimeout(timer);
  }, [textoBusca]);

  useEffect(() => { document.title = 'Acompanhamentos — 4U'; }, []);

  const pronto = !!filtros.bimestre_id || (bimestres.dados && !bimestres.dados.bimestres.length);
  const lista = useApi(
    () => (pronto ? api.listarAcompanhamentos({ situacao: aba, ...filtros, busca, pagina }) : new Promise(() => {})),
    [aba, filtros, busca, pagina, pronto]
  );

  function filtrar(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPagina(1);
  }

  let conteudo;
  if (lista.carregando) conteudo = <Carregando linhas={6} blocos />;
  else if (lista.erro) conteudo = <ErroCarregamento erro={lista.erro} aoTentarNovamente={lista.recarregar} />;
  else if (!lista.dados.itens.length) {
    conteudo = (
      <Vazio icone="prancheta" titulo={aba === 'aguardando' ? 'Nada aguardando revisão' : 'Nenhum acompanhamento encontrado'}
        mensagem={aba === 'aguardando' ? 'Quando os professores enviarem registros, eles aparecem aqui.' : 'Mude os filtros para ver outros registros.'} />
    );
  } else {
    conteudo = (
      <>
        <div className="tabela-wrapper">
          <table className="tabela tabela--responsiva">
            <caption className="sr-only">Acompanhamentos: {ABAS.find((x) => x.chave === aba).rotulo}</caption>
            <thead>
              <tr>
                <th scope="col">Aluno</th><th scope="col">Disciplina</th>
                <th scope="col">Média</th><th scope="col">Situação</th><th scope="col">Atualizado em</th>
                <th scope="col" className="col-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.dados.itens.map((a) => (
                <tr key={a.id}>
                  <td className="td-principal">
                    <div className="celula-pessoa"><Avatar nome={a.aluno} /><span>{a.aluno}<small>{a.turma}</small></span></div>
                  </td>
                  <td data-label="Disciplina">{a.disciplina}<small className="celula-detalhe">Prof. {a.professor}</small></td>
                  <td data-label="Média"><Media valor={a.media} aprovacao={lista.dados.aprovacao} /></td>
                  <td data-label="Situação"><StatusBadge status={a.status} /></td>
                  <td data-label="Atualizado em">{formatarData(a.atualizado_em)}</td>
                  <td className="col-acoes">
                    <button type="button" className={'btn btn--sm ' + (aba === 'aguardando' ? 'btn--primario' : 'btn--secundario')}
                      aria-label={`${aba === 'aguardando' ? 'Revisar' : 'Ver'} ${a.disciplina} de ${a.aluno}`} onClick={() => setAberto(a.id)}>
                      <Icon nome={aba === 'aguardando' ? 'prancheta' : 'olho'} />{aba === 'aguardando' ? 'Revisar' : 'Ver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paginacao dados={lista.dados} aoMudar={setPagina} />
      </>
    );
  }

  const contagens = lista.dados && lista.dados.contagens;

  return (
    <AreaAutenticada paginaAtiva={ROTAS.adminAcompanhamentos} titulo="Acompanhamentos"
      descricao="Revise o que os professores enviaram: ajuste, devolva com um motivo ou publique para as famílias.">

      <form className="card filtros" aria-label="Filtros" onSubmit={(e) => e.preventDefault()}>
        <div className="campo">
          <label className="campo__label" htmlFor="filtro-aluno">Aluno</label>
          <input className="campo__input" id="filtro-aluno" type="search" autoComplete="off" placeholder="Nome do aluno"
            value={textoBusca} onChange={(e) => setTextoBusca(e.target.value)} />
        </div>
        <Filtro id="filtro-bimestre" rotulo="Bimestre" valor={filtros.bimestre_id} todos={null} aoMudar={(v) => filtrar('bimestre_id', v)}
          opcoes={(bimestres.dados ? bimestres.dados.bimestres : []).map((b) => ({ valor: b.id, rotulo: `${b.numero}º bimestre` }))} />
        <Filtro id="filtro-turma" rotulo="Turma" valor={filtros.turma_id} aoMudar={(v) => filtrar('turma_id', v)}
          opcoes={(turmas.dados || []).map((t) => ({ valor: t.id, rotulo: t.nome }))} />
        <Filtro id="filtro-disciplina" rotulo="Disciplina" valor={filtros.disciplina_id} aoMudar={(v) => filtrar('disciplina_id', v)}
          opcoes={(disciplinas.dados || []).map((d) => ({ valor: d.id, rotulo: d.nome }))} />
      </form>

      <div className="abas" role="tablist" aria-label="Situação dos acompanhamentos">
        {ABAS.map((x) => (
          <button key={x.chave} type="button" role="tab" id={'aba-' + x.chave} className="aba" aria-selected={aba === x.chave}
            aria-controls="painel-acompanhamentos" tabIndex={aba === x.chave ? 0 : -1}
            onClick={() => { if (aba === x.chave) lista.recarregar(); else { setAba(x.chave); setPagina(1); } }}>
            {x.rotulo}
            {contagens && <span className="aba__contador">{contagens[x.chave]}</span>}
          </button>
        ))}
      </div>

      <section className="card cadastro-painel" id="painel-acompanhamentos" role="tabpanel" aria-labelledby={'aba-' + aba}>
        {conteudo}
      </section>

      {aberto && <ModalRevisao id={aberto} aoFechar={() => setAberto(null)} aoMudar={lista.recarregar} />}
    </AreaAutenticada>
  );
}
