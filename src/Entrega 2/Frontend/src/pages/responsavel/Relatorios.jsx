import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import Modal from '../../components/Modal.jsx';
import { CampoAreaTexto } from '../../components/Campo.jsx';
import { Etiqueta, Media } from '../../components/Elementos.jsx';
import { Carregando, ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { ROTAS } from '../../utils/rotas.js';
import { formatarData, formatarDataHora, formatarMedia, plural } from '../../utils/formatadores.js';
import '../../styles/pages/dashboard.css';
import '../../styles/pages/responsavel.css';

/* "Dar ciência": confirma a leitura, com uma observação opcional para a escola */
function ModalCiencia({ item, aoFechar, aoConfirmar }) {
  const { mostrar } = useToast();
  const [observacao, setObservacao] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function confirmar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await api.darCiencia(item.id, observacao.trim());
      mostrar({ tipo: 'sucesso', titulo: 'Ciência registrada', mensagem: r.mensagem });
      aoConfirmar();
    } catch (erro) {
      mostrar({ tipo: 'erro', titulo: 'Não foi possível registrar', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Dar ciência — ${item.disciplina}`} descricao="Confirma que você leu este relatório." pequeno aoFechar={aoFechar}
      rodape={(
        <>
          <button type="button" className="btn btn--fantasma" onClick={aoFechar}>Cancelar</button>
          <button type="submit" form="form-ciencia" className="btn btn--primario" disabled={enviando}>
            {enviando ? <><span className="spinner" aria-hidden="true" />Enviando…</> : <><Icon nome="check" />Confirmar leitura</>}
          </button>
        </>
      )}>
      <form id="form-ciencia" noValidate onSubmit={confirmar}>
        <CampoAreaTexto id="ciencia-obs" rotulo="Observação para a escola (opcional)" rows={4} maxLength={500}
          ajuda={`${observacao.length} de 500 caracteres. O professor e a coordenação veem este texto.`}
          value={observacao} onChange={(e) => setObservacao(e.target.value)} />
      </form>
    </Modal>
  );
}

/* Relatório do bimestre: o mesmo conteúdo vai para o PDF (Imprimir > Salvar como PDF).
   Com imprimir = true (botão "Baixar PDF" de Meus alunos), abre a impressão assim que carrega. */
function Relatorio({ alunoId, bimestreId, imprimir, aoImprimir }) {
  const { mostrar } = useToast();
  const rel = useApi(() => api.relatorioAluno(alunoId, bimestreId), [alunoId, bimestreId]);
  const [ciencia, setCiencia] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const r = rel.dados;

  useEffect(() => {
    if (!imprimir || !r || !r.itens.length) return undefined;
    const timer = setTimeout(() => { aoImprimir(); window.print(); }, 400);
    return () => clearTimeout(timer);
  }, [imprimir, r]);

  if (rel.carregando) return <div className="card"><Carregando linhas={8} blocos /></div>;
  if (rel.erro) return <div className="card"><ErroCarregamento erro={rel.erro} aoTentarNovamente={rel.recarregar} /></div>;
  if (!r.itens.length) {
    return (
      <div className="card">
        <Vazio icone="documento" titulo="Nenhum relatório publicado neste bimestre"
          mensagem="Os registros passam pela revisão da escola antes de chegar até você. Volte mais tarde." />
      </div>
    );
  }

  const pendentes = r.itens.filter((i) => !i.ciencia).length;

  async function cienciaEmTodos() {
    setEnviando(true);
    try {
      const resposta = await api.darCienciaEmTodos(alunoId, bimestreId);
      mostrar({ tipo: 'sucesso', titulo: 'Ciência registrada', mensagem: resposta.mensagem });
      rel.recarregar();
    } catch (erro) {
      mostrar({ tipo: 'erro', titulo: 'Não foi possível registrar', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <div className="relatorio-barra nao-imprimir">
        <p className="legenda">
          {pendentes ? `${plural(pendentes, 'disciplina aguarda', 'disciplinas aguardam')} a sua ciência.` : 'Você já deu ciência em todas as disciplinas deste bimestre.'}
        </p>
        <div className="relatorio-barra__acoes">
          {pendentes > 0 && (
            <button type="button" className="btn btn--secundario" disabled={enviando} onClick={cienciaEmTodos}>
              <Icon nome="check" />Dar ciência em todas ({pendentes})
            </button>
          )}
          <button type="button" className="btn btn--primario" onClick={() => window.print()}>
            <Icon nome="baixar" />Gerar PDF
          </button>
        </div>
      </div>

      <article className="card relatorio" aria-labelledby="relatorio-titulo">
        <header className="relatorio__cabecalho">
          <div>
            <p className="relatorio__escola">{r.escola.nome}</p>
            <h2 id="relatorio-titulo">Relatório de acompanhamento — {r.bimestre.numero}º bimestre de {r.bimestre.ano_letivo}</h2>
            <p><strong>{r.aluno.nome}</strong> · {r.aluno.turma || 'Sem turma'} · matrícula {r.aluno.matricula}</p>
          </div>
          <div className="relatorio__media-geral">
            <span className="legenda">Média geral</span>
            <Media valor={r.media_geral} aprovacao={r.escala.aprovacao} />
            <span className="legenda">Aprovação: {formatarMedia(r.escala.aprovacao)}</span>
          </div>
        </header>

        <ol className="relatorio__itens">
          {r.itens.map((i) => (
            <li key={i.id} className="relatorio__item">
              <div className="relatorio__item-topo">
                <div>
                  <h3>{i.disciplina}</h3>
                  <p className="legenda">Prof. {i.professor} · publicado em {formatarData(i.publicado_em)}</p>
                </div>
                <Media valor={i.media} aprovacao={r.escala.aprovacao} />
              </div>
              {i.tags.length > 0 && <div className="registro__tags">{i.tags.map((t) => <Etiqueta key={t.id} {...t} />)}</div>}
              <p className="registro__texto">{i.descricao}</p>
              <div className="relatorio__ciencia">
                {i.ciencia ? (
                  <p className="legenda"><Icon nome="check" className="icone--inline" /> Ciência dada em {formatarDataHora(i.ciencia.data_hora)}
                    {i.ciencia.observacao && <> · “{i.ciencia.observacao}”</>}</p>
                ) : (
                  <button type="button" className="btn btn--secundario btn--sm nao-imprimir" onClick={() => setCiencia(i)}>
                    <Icon nome="check" />Dar ciência
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>

        <footer className="relatorio__rodape">
          <p className="legenda">
            Documento gerado pela 4U em {formatarDataHora(new Date().toISOString())}. Contém apenas registros revisados e publicados pela escola.
            Dúvidas: {r.escola.telefone} · {r.escola.email}
          </p>
        </footer>
      </article>

      {ciencia && <ModalCiencia item={ciencia} aoFechar={() => setCiencia(null)} aoConfirmar={() => { setCiencia(null); rel.recarregar(); }} />}
    </>
  );
}

/* Responsável: escolher aluno e bimestre e ler o relatório */
export default function Relatorios() {
  const [params, setParams] = useSearchParams();
  const meus = useApi(api.meusAlunos);
  const d = meus.dados;

  useEffect(() => { document.title = 'Relatórios — 4U'; }, []);

  /* Aluno e bimestre vêm da URL; se não vierem, o primeiro aluno e o último bimestre com relatório */
  const aluno = d && (d.alunos.find((a) => a.id === Number(params.get('aluno'))) || d.alunos[0]);
  let bimestreId = params.get('bimestre');
  if (d && aluno && !bimestreId) {
    const ultimo = aluno.desempenho[aluno.desempenho.length - 1];
    const bim = ultimo ? d.bimestres.find((b) => b.numero === ultimo.bimestre) : d.bimestres[0];
    bimestreId = bim ? String(bim.id) : '';
  }

  function mudar(campo, valor) {
    const novos = new URLSearchParams(params);
    if (valor === null) novos.delete(campo);
    else novos.set(campo, valor);
    if (campo === 'aluno') novos.delete('bimestre');
    setParams(novos, { replace: true });
  }

  let conteudo;
  if (meus.carregando) conteudo = <div className="card"><Carregando linhas={8} blocos /></div>;
  else if (meus.erro) conteudo = <div className="card"><ErroCarregamento erro={meus.erro} aoTentarNovamente={meus.recarregar} /></div>;
  else if (!aluno) {
    conteudo = <div className="card"><Vazio icone="aluno" titulo="Nenhum aluno vinculado ao seu cadastro" mensagem="Procure a secretaria da escola para fazer o vínculo." /></div>;
  } else {
    conteudo = (
      <>
        <form className="card filtros nao-imprimir" aria-label="Escolha do relatório" onSubmit={(e) => e.preventDefault()}>
          <div className="campo">
            <label className="campo__label" htmlFor="rel-aluno">Aluno</label>
            <select className="campo__select" id="rel-aluno" value={aluno.id} onChange={(e) => mudar('aluno', e.target.value)}>
              {d.alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}{a.turma ? ' — ' + a.turma : ''}</option>)}
            </select>
          </div>
          <div className="campo">
            <label className="campo__label" htmlFor="rel-bim">Bimestre</label>
            <select className="campo__select" id="rel-bim" value={bimestreId} onChange={(e) => mudar('bimestre', e.target.value)}>
              {d.bimestres.map((b) => <option key={b.id} value={b.id}>{b.numero}º bimestre</option>)}
            </select>
          </div>
        </form>
        <Relatorio key={aluno.id + '-' + bimestreId} alunoId={aluno.id} bimestreId={bimestreId}
          imprimir={params.get('imprimir') === '1'} aoImprimir={() => mudar('imprimir', null)} />
      </>
    );
  }

  return (
    <AreaAutenticada paginaAtiva={ROTAS.responsavelRelatorios} titulo="Relatórios"
      descricao="Leia o relatório de cada bimestre, dê ciência e gere o PDF.">
      {conteudo}
    </AreaAutenticada>
  );
}
