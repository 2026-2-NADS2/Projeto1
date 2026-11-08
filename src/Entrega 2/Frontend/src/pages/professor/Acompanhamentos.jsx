import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import Modal from '../../components/Modal.jsx';
import HistoricoAcompanhamento from '../../components/HistoricoAcompanhamento.jsx';
import { CampoAreaTexto, CampoTexto } from '../../components/Campo.jsx';
import { Avatar, Etiqueta, Media, StatusBadge } from '../../components/Elementos.jsx';
import { Carregando, ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { ROTAS } from '../../utils/rotas.js';
import { formatarDataHora, formatarMedia, normalizar } from '../../utils/formatadores.js';
import '../../styles/pages/dashboard.css';
import '../../styles/pages/acompanhamentos.css';

const LIMITE_DESCRICAO = 2000;
const EDITAVEIS = ['RASCUNHO', 'DEVOLVIDO'];

/* Filtro de situação da lista de alunos */
const SITUACOES = [
  { valor: 'todos', rotulo: 'Todos os alunos' },
  { valor: 'sem', rotulo: 'Sem registro' },
  { valor: 'RASCUNHO', rotulo: 'Rascunhos' },
  { valor: 'DEVOLVIDO', rotulo: 'Devolvidos' },
  { valor: 'revisao', rotulo: 'Enviados / em revisão' },
  { valor: 'PUBLICADO', rotulo: 'Publicados' }
];
function combina(aluno, situacao) {
  const st = aluno.acompanhamento && aluno.acompanhamento.status;
  if (situacao === 'todos') return true;
  if (situacao === 'sem') return !st;
  if (situacao === 'revisao') return st === 'ENVIADO' || st === 'EM_REVISAO';
  return st === situacao;
}

/* Registrar ou corrigir o acompanhamento de um aluno: média, tags e descrição */
function ModalRegistro({ aluno, contexto, tags, aoFechar, aoSalvar }) {
  const { mostrar } = useToast();
  const existente = aluno.acompanhamento;
  const detalhe = useApi(() => (existente ? api.detalheAcompanhamento(existente.id) : Promise.resolve(null)), [existente && existente.id]);
  const d = detalhe.dados;
  const [valores, setValores] = useState(null);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(null);
  const { escala, bimestre, vinculo } = contexto;

  /* Preenche o formulário com o registro salvo */
  useEffect(() => {
    if (detalhe.carregando || valores) return;
    setValores(d
      ? { media: formatarMedia(d.media), descricao: d.descricao, tags: d.tags.map((t) => t.id) }
      : { media: '', descricao: '', tags: [] });
  }, [detalhe.carregando]);

  const status = existente ? existente.status : null;
  const editavel = bimestre.digitacao_aberta && (!status || EDITAVEIS.includes(status));

  function alterar(campo, valor) {
    setValores((v) => ({ ...v, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: null }));
  }

  function alternarTag(id) {
    alterar('tags', valores.tags.includes(id) ? valores.tags.filter((t) => t !== id) : [...valores.tags, id]);
  }

  async function salvar(enviar) {
    const encontrados = {};
    const media = Number(String(valores.media).replace(',', '.'));
    if (String(valores.media).trim() === '' || !Number.isFinite(media)) encontrados.media = 'Informe a média do bimestre.';
    else if (media < escala.minima || media > escala.maxima) encontrados.media = `A média deve ficar entre ${escala.minima} e ${escala.maxima}.`;
    if (valores.descricao.trim().length < 20) encontrados.descricao = 'Escreva pelo menos 20 caracteres sobre o desenvolvimento do aluno.';
    setErros(encontrados);
    const primeiro = ['media', 'descricao'].find((c) => encontrados[c]);
    if (primeiro) { document.getElementById('reg-' + primeiro).focus(); return; }

    setEnviando(enviar ? 'enviar' : 'salvar');
    const dados = { media, descricao: valores.descricao.trim(), tags: valores.tags, enviar };
    try {
      const r = existente
        ? await api.salvarAcompanhamento(existente.id, dados)
        : await api.registrarAcompanhamento({ ...dados, vinculo_id: vinculo.id, aluno_id: aluno.id, bimestre_id: bimestre.id });
      mostrar({ tipo: 'sucesso', titulo: enviar ? 'Enviado para revisão' : 'Rascunho salvo', mensagem: r.mensagem });
      aoSalvar();
    } catch (erro) {
      if (erro && erro.campos) setErros(erro.campos);
      mostrar({ tipo: 'erro', titulo: 'Não foi possível salvar', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
    } finally {
      setEnviando(null);
    }
  }

  let corpo;
  if (detalhe.carregando || !valores) corpo = <Carregando linhas={6} />;
  else if (detalhe.erro) corpo = <ErroCarregamento erro={detalhe.erro} aoTentarNovamente={detalhe.recarregar} />;
  else if (!editavel) {
    corpo = (
      <>
        {!bimestre.digitacao_aberta && (
          <div className="alerta alerta--alerta" style={{ marginBottom: 16 }}><Icon nome="cadeado" /><p>A digitação deste bimestre está fechada. Só é possível consultar.</p></div>
        )}
        {d ? (
          <>
            <div className="registro">
              <div className="registro__media"><span className="legenda">Média do bimestre</span><Media valor={d.media} aprovacao={escala.aprovacao} /></div>
              {d.tags.length > 0 && <div className="registro__tags">{d.tags.map((t) => <Etiqueta key={t.id} {...t} />)}</div>}
              <p className="registro__texto">{d.descricao}</p>
              <p className="legenda"><StatusBadge status={d.status} /> · atualizado em {formatarDataHora(d.atualizado_em)}</p>
            </div>
            {d.ciencias.length > 0 && (
              <div className="registro__ciencias">
                <h3>Ciência da família</h3>
                <ul className="lista-simples">
                  {d.ciencias.map((c, i) => <li key={i}><span>{c.responsavel}<small>{formatarDataHora(c.data_hora)}{c.observacao && ` · “${c.observacao}”`}</small></span></li>)}
                </ul>
              </div>
            )}
            <details className="registro__historico">
              <summary>Histórico do registro</summary>
              <HistoricoAcompanhamento trilha={d.trilha} devolucao={d.ultima_devolucao} />
            </details>
          </>
        ) : <p className="legenda">Nenhum registro para este aluno no bimestre.</p>}
      </>
    );
  } else {
    corpo = (
      <form id="form-registro" noValidate onSubmit={(e) => { e.preventDefault(); salvar(true); }}>
        {status === 'DEVOLVIDO' && d && d.ultima_devolucao && (
          <div className="alerta alerta--alerta" style={{ marginBottom: 16 }}>
            <Icon nome="devolver" />
            <p><strong>Devolvido pela coordenação:</strong> {d.ultima_devolucao.motivo}</p>
          </div>
        )}
        <CampoTexto id="reg-media" rotulo={`Média do bimestre (de ${escala.minima} a ${escala.maxima})`} obrigatorio inputMode="decimal"
          maxLength={5} placeholder="Ex.: 7,5" ajuda={`Média de aprovação da escola: ${formatarMedia(escala.aprovacao)}`}
          value={valores.media} erro={erros.media} onChange={(e) => alterar('media', e.target.value)} />

        <fieldset className="tags-escolha">
          <legend className="campo__label">Tags de acompanhamento</legend>
          <p className="campo__ajuda">Marque o que descreve o aluno neste bimestre.</p>
          <div className="tags-escolha__lista">
            {tags.map((t) => (
              <label key={t.id} className="tag-opcao" style={{ '--etiqueta-cor': t.cor }}>
                <input type="checkbox" checked={valores.tags.includes(t.id)} onChange={() => alternarTag(t.id)} />
                <span>{t.nome}</span>
              </label>
            ))}
          </div>
          {erros.tags && <span className="campo__erro"><Icon nome="erro" /><span>{erros.tags}</span></span>}
        </fieldset>

        <CampoAreaTexto id="reg-descricao" rotulo="Descrição do desenvolvimento" obrigatorio maxLength={LIMITE_DESCRICAO}
          placeholder="Como o aluno participou, o que aprendeu, o que pode melhorar…"
          ajuda={`${valores.descricao.length} de ${LIMITE_DESCRICAO} caracteres. A família lê este texto depois da revisão da escola.`}
          value={valores.descricao} erro={erros.descricao} onChange={(e) => alterar('descricao', e.target.value)} />
      </form>
    );
  }

  const rodape = editavel && valores ? (
    <>
      <button type="button" className="btn btn--fantasma" onClick={aoFechar}>Cancelar</button>
      <button type="button" className="btn btn--secundario" disabled={!!enviando} onClick={() => salvar(false)}>
        {enviando === 'salvar' ? <><span className="spinner" aria-hidden="true" />Salvando…</> : <><Icon nome="lapis" />Salvar rascunho</>}
      </button>
      <button type="submit" form="form-registro" className="btn btn--primario" disabled={!!enviando}>
        {enviando === 'enviar' ? <><span className="spinner" aria-hidden="true" />Enviando…</> : <><Icon nome="enviar" />Enviar para revisão</>}
      </button>
    </>
  ) : <button type="button" className="btn btn--fantasma" onClick={aoFechar}>Fechar</button>;

  return (
    <Modal titulo={aluno.nome} descricao={`${vinculo.disciplina} · ${vinculo.turma} · ${bimestre.numero}º bimestre`} aoFechar={aoFechar} largo rodape={rodape}>
      {corpo}
    </Modal>
  );
}

/* Lista de alunos de uma turma/disciplina no bimestre */
function ListaDoVinculo({ vinculoId, bimestreId, aoTrocarBimestre, busca, abrirId, tags }) {
  const dados = useApi(() => api.alunosDoVinculo(vinculoId, bimestreId), [vinculoId, bimestreId]);
  const [situacao, setSituacao] = useState('todos');
  const [aberto, setAberto] = useState(null);
  const jaAbriu = useRef(false);
  const c = dados.dados;

  /* Link vindo de "Retornos": abre direto o registro devolvido (só uma vez) */
  useEffect(() => {
    if (!c || !abrirId || jaAbriu.current) return;
    jaAbriu.current = true;
    const alvo = c.alunos.find((a) => a.acompanhamento && a.acompanhamento.id === Number(abrirId));
    if (alvo) setAberto(alvo);
  }, [c]);

  if (dados.carregando) return <div className="card"><Carregando linhas={6} blocos /></div>;
  if (dados.erro) return <div className="card"><ErroCarregamento erro={dados.erro} aoTentarNovamente={dados.recarregar} /></div>;

  const termo = normalizar(busca);
  const visiveis = c.alunos.filter((a) => combina(a, situacao) && (!termo || normalizar(a.nome).includes(termo)));
  const contar = (s) => c.alunos.filter((a) => combina(a, s)).length;

  return (
    <>
      {!c.bimestre.digitacao_aberta && (
        <div className="alerta alerta--alerta" role="status" style={{ marginBottom: 16 }}>
          <Icon nome="cadeado" /><p>A digitação do {c.bimestre.numero}º bimestre está fechada. Você pode consultar, mas não registrar nem corrigir.</p>
        </div>
      )}

      <section className="card" aria-labelledby="lista-titulo">
        <div className="card__cabecalho">
          <h2 id="lista-titulo">{c.vinculo.turma} · {c.vinculo.disciplina}</h2>
          <div className="lista-alunos__filtros">
            <label className="sr-only" htmlFor="filtro-bim">Bimestre</label>
            <select className="campo__select" id="filtro-bim" value={c.bimestre.id} onChange={(e) => aoTrocarBimestre(e.target.value)}>
              {c.bimestres.map((b) => <option key={b.id} value={b.id}>{b.numero}º bimestre</option>)}
            </select>
            <label className="sr-only" htmlFor="filtro-sit">Situação</label>
            <select className="campo__select" id="filtro-sit" value={situacao} onChange={(e) => setSituacao(e.target.value)}>
              {SITUACOES.map((s) => <option key={s.valor} value={s.valor}>{s.rotulo} ({contar(s.valor)})</option>)}
            </select>
          </div>
        </div>

        {!visiveis.length ? <Vazio icone="aluno" titulo="Nenhum aluno com esse filtro" /> : (
          <div className="tabela-wrapper">
            <table className="tabela tabela--responsiva">
              <caption className="sr-only">Alunos de {c.vinculo.turma} em {c.vinculo.disciplina}, {c.bimestre.numero}º bimestre</caption>
              <thead>
                <tr><th scope="col">Aluno</th><th scope="col">Média</th><th scope="col">Situação</th><th scope="col">Atualizado em</th><th scope="col" className="col-acoes">Ações</th></tr>
              </thead>
              <tbody>
                {visiveis.map((a) => {
                  const ac = a.acompanhamento;
                  const podeEditar = c.bimestre.digitacao_aberta && (!ac || EDITAVEIS.includes(ac.status));
                  const rotulo = !ac ? 'Registrar' : ac.status === 'DEVOLVIDO' ? 'Corrigir' : podeEditar ? 'Continuar' : 'Ver';
                  return (
                    <tr key={a.id}>
                      <td className="td-principal">
                        <div className="celula-pessoa"><Avatar nome={a.nome} /><span>{a.nome}<small>Matrícula {a.matricula}</small></span></div>
                      </td>
                      <td data-label="Média">{ac ? <Media valor={ac.media} aprovacao={c.escala.aprovacao} /> : '—'}</td>
                      <td data-label="Situação">{ac ? <StatusBadge status={ac.status} /> : <span className="legenda">Sem registro</span>}</td>
                      <td data-label="Atualizado em">{ac ? formatarDataHora(ac.atualizado_em) : '—'}</td>
                      <td className="col-acoes">
                        <button type="button" className={'btn btn--sm ' + (podeEditar ? 'btn--primario' : 'btn--secundario')}
                          aria-label={`${rotulo}: ${a.nome}`} onClick={() => setAberto(a)}>
                          <Icon nome={!ac ? 'mais' : podeEditar ? 'lapis' : 'olho'} />{rotulo}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {aberto && (
        <ModalRegistro aluno={aberto} contexto={c} tags={tags} aoFechar={() => setAberto(null)}
          aoSalvar={() => { setAberto(null); dados.recarregar(); }} />
      )}
    </>
  );
}

/* Professor: escolher turma e disciplina e registrar os alunos */
export default function Acompanhamentos() {
  const [params, setParams] = useSearchParams();
  const painel = useApi(api.painelProfessor);
  const tags = useApi(api.listarTags);
  const [busca, setBusca] = useState('');
  const vinculos = painel.dados ? painel.dados.vinculos : [];
  const vinculoId = params.get('vinculo') || (vinculos[0] ? String(vinculos[0].id) : '');
  const bimestreId = params.get('bimestre') || '';

  useEffect(() => { document.title = 'Acompanhamentos — 4U'; }, []);

  function mudar(campo, valor) {
    const novos = new URLSearchParams(params);
    novos.set(campo, valor);
    novos.delete('abrir');
    if (campo === 'vinculo') novos.delete('bimestre');
    setParams(novos, { replace: true });
  }

  let conteudo;
  if (painel.carregando || tags.carregando) conteudo = <div className="card"><Carregando linhas={6} blocos /></div>;
  else if (painel.erro || tags.erro) {
    conteudo = <div className="card"><ErroCarregamento erro={painel.erro || tags.erro} aoTentarNovamente={() => { painel.recarregar(); tags.recarregar(); }} /></div>;
  } else if (!vinculos.length) {
    conteudo = <div className="card"><Vazio icone="turma" titulo="Você ainda não tem turmas" mensagem="Peça à coordenação para atribuir suas turmas e disciplinas." /></div>;
  } else {
    conteudo = (
      <ListaDoVinculo key={vinculoId + '-' + bimestreId} vinculoId={vinculoId} bimestreId={bimestreId} busca={busca}
        abrirId={params.get('abrir')} tags={tags.dados} aoTrocarBimestre={(v) => mudar('bimestre', v)} />
    );
  }

  return (
    <AreaAutenticada paginaAtiva={ROTAS.professorAcompanhamentos} titulo="Acompanhamentos"
      descricao="Registre a média, as tags e a descrição de cada aluno. Depois de enviado, o registro passa pela revisão da escola.">
      {vinculos.length > 0 && (
        <form className="card filtros" aria-label="Turma e aluno" onSubmit={(e) => e.preventDefault()}>
          <div className="campo">
            <label className="campo__label" htmlFor="filtro-vinculo">Turma e disciplina</label>
            <select className="campo__select" id="filtro-vinculo" value={vinculoId} onChange={(e) => mudar('vinculo', e.target.value)}>
              {vinculos.map((v) => <option key={v.id} value={v.id}>{v.turma} — {v.disciplina}</option>)}
            </select>
          </div>
          <div className="campo">
            <label className="campo__label" htmlFor="filtro-nome">Buscar aluno</label>
            <input className="campo__input" id="filtro-nome" type="search" autoComplete="off" placeholder="Nome do aluno"
              value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </form>
      )}
      {conteudo}
    </AreaAutenticada>
  );
}
