import { useEffect, useState } from 'react';
import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import GraficoBarras from '../../components/GraficoBarras.jsx';
import { Indicador, IndicadorCarregando, Media, StatusBadge } from '../../components/Elementos.jsx';
import { Carregando, ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { ROTAS } from '../../utils/rotas.js';
import { formatarMedia } from '../../utils/formatadores.js';
import '../../styles/pages/dashboard.css';
import '../../styles/pages/relatorios.css';

const ORDEM_STATUS = ['RASCUNHO', 'ENVIADO', 'EM_REVISAO', 'DEVOLVIDO', 'PUBLICADO'];

/* Visões da tela: tudo, só o gráfico por disciplina ou só a tabela por turma */
const VISOES = [
  { valor: 'geral', rotulo: 'Geral', icone: 'globo' },
  { valor: 'disciplina', rotulo: 'Por disciplina', icone: 'livro' },
  { valor: 'turma', rotulo: 'Por turma', icone: 'turma' }
];

/* Andamento do fluxo: barra com o total e uma linha por situação */
function AndamentoFluxo({ porStatus }) {
  const total = ORDEM_STATUS.reduce((s, st) => s + (porStatus[st] || 0), 0);
  return (
    <>
      <div className="fluxo__total">
        <span className="progresso" aria-hidden="true">
          <span className="progresso__barra" style={{ width: total ? Math.round(((porStatus.PUBLICADO || 0) / total) * 100) + '%' : 0, display: 'block' }} />
        </span>
        <span className="legenda">{total.toLocaleString('pt-BR')} registros</span>
      </div>
      <ul className="fluxo">
        {ORDEM_STATUS.map((st) => (
          <li key={st}><StatusBadge status={st} /><strong>{(porStatus[st] || 0).toLocaleString('pt-BR')}</strong></li>
        ))}
      </ul>
      <p className="legenda fluxo__nota">A barra mostra quanto já foi publicado para as famílias.</p>
    </>
  );
}

/* Indicadores do bimestre e exportação para Excel */
function PainelRelatorio({ bimestreId, visao, aoCarregar }) {
  const dados = useApi(() => api.indicadores(bimestreId), [bimestreId]);
  const r = dados.dados;

  /* Avisa a tela qual bimestre foi carregado (para o botão Exportar) */
  useEffect(() => { aoCarregar(r); }, [r]);

  if (dados.erro) return <div className="card"><ErroCarregamento erro={dados.erro} aoTentarNovamente={dados.recarregar} /></div>;

  const grafico = (
    <section className="card painel-grafico" aria-labelledby="graf-disciplina">
      <div className="card__cabecalho"><h2 id="graf-disciplina"><Icon nome="grafico" className="icone--titulo" />Média por disciplina</h2></div>
      <div className="card__corpo">
        {!r ? <Carregando linhas={5} /> : !r.por_disciplina.length
          ? <Vazio icone="grafico" titulo="Nenhum registro publicado neste bimestre" />
          : (
            <GraficoBarras
              titulo={`Média por disciplina no ${r.bimestre.numero}º bimestre`}
              itens={r.por_disciplina.map((d) => ({ rotulo: d.disciplina, valor: d.media_geral }))}
              minimo={r.escala.minima} maximo={r.escala.maxima} referencia={r.escala.aprovacao}
              rotuloReferencia="Média de aprovação"
            />
          )}
      </div>
    </section>
  );

  const fluxo = (
    <section className="card" aria-labelledby="andamento">
      <div className="card__cabecalho"><h2 id="andamento"><Icon nome="camadas" className="icone--titulo" />Andamento do fluxo</h2></div>
      <div className="card__corpo">{!r ? <Carregando linhas={5} /> : <AndamentoFluxo porStatus={r.por_status} />}</div>
    </section>
  );

  const tabelaDisciplinas = (
    <section className="card" aria-labelledby="tab-disciplina">
      <div className="card__cabecalho"><h2 id="tab-disciplina">Detalhe por disciplina</h2></div>
      {!r ? <Carregando linhas={4} /> : !r.por_disciplina.length ? <Vazio icone="livro" titulo="Sem registros publicados" /> : (
        <div className="tabela-wrapper">
          <table className="tabela tabela--responsiva">
            <caption className="sr-only">Média por disciplina no {r.bimestre.numero}º bimestre</caption>
            <thead><tr><th scope="col">Disciplina</th><th scope="col">Média geral</th></tr></thead>
            <tbody>
              {r.por_disciplina.map((d) => (
                <tr key={d.disciplina}>
                  <td className="td-principal"><strong>{d.disciplina}</strong></td>
                  <td data-label="Média geral"><Media valor={d.media_geral} aprovacao={r.escala.aprovacao} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const tabelaTurmas = (
    <section className="card" aria-labelledby="por-turma">
      <div className="card__cabecalho"><h2 id="por-turma"><Icon nome="turma" className="icone--titulo" />Por turma</h2></div>
      {!r ? <Carregando linhas={4} /> : !r.por_turma.length ? <Vazio icone="turma" titulo="Sem registros publicados" /> : (
        <div className="tabela-wrapper">
          <table className="tabela tabela--responsiva">
            <caption className="sr-only">Resultados por turma no {r.bimestre.numero}º bimestre</caption>
            <thead><tr><th scope="col">Turma</th><th scope="col">Registros publicados</th><th scope="col">Média geral</th><th scope="col">Abaixo da média</th></tr></thead>
            <tbody>
              {r.por_turma.map((t) => (
                <tr key={t.turma}>
                  <td className="td-principal"><strong>{t.turma}</strong></td>
                  <td data-label="Registros publicados">{t.publicados}</td>
                  <td data-label="Média geral"><Media valor={t.media_geral} aprovacao={r.escala.aprovacao} /></td>
                  <td data-label="Abaixo da média">{t.abaixo} {t.publicados ? `(${Math.round((t.abaixo / t.publicados) * 100)}%)` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  return (
    <>
      <section className="grade-indicadores grade-indicadores--4" aria-label="Resumo do bimestre">
        {!r ? [1, 2, 3, 4].map((i) => <IndicadorCarregando key={i} />) : (
          <>
            <Indicador icone="check" tom="tom-sucesso" valor={r.resumo.publicados.toLocaleString('pt-BR')} rotulo="Registros publicados" detalhe={`${r.resumo.alunos_avaliados} alunos`} />
            <Indicador icone="grafico" tom="tom-primaria" valor={formatarMedia(r.resumo.media_geral)} rotulo="Média geral" detalhe={`Aprovação: ${formatarMedia(r.escala.aprovacao)}`} />
            <Indicador icone="alerta" tom="tom-erro" valor={r.resumo.abaixo_da_media} rotulo="Notas abaixo da média" detalhe="Registros publicados" />
            <Indicador icone="prancheta" tom="tom-alerta" valor={(r.por_status.ENVIADO || 0) + (r.por_status.EM_REVISAO || 0)} rotulo="Aguardando revisão" detalhe="Ainda não chegaram às famílias" />
          </>
        )}
      </section>

      {visao === 'geral' && (
        <>
          <div className="grade-relatorio">{grafico}{fluxo}</div>
          {tabelaTurmas}
        </>
      )}
      {visao === 'disciplina' && <div className="grade-relatorio">{grafico}{tabelaDisciplinas}</div>}
      {visao === 'turma' && tabelaTurmas}
    </>
  );
}

/* Administrador: relatórios por bimestre */
export default function Relatorios() {
  const { mostrar } = useToast();
  const bimestres = useApi(api.listarBimestres);
  const [bimestreId, setBimestreId] = useState('');
  const [visao, setVisao] = useState('geral');
  const [carregado, setCarregado] = useState(null);  /* Indicadores do bimestre na tela */
  const [exportando, setExportando] = useState(false);

  useEffect(() => { document.title = 'Relatórios — 4U'; }, []);

  /* Começa no último bimestre encerrado (com tudo publicado); se não houver, no atual */
  useEffect(() => {
    if (!bimestres.dados || bimestreId) return;
    const lista = bimestres.dados.bimestres;
    const escolhido = lista.filter((b) => b.situacao === 'ENCERRADO').pop() || lista.find((b) => b.situacao === 'ABERTO') || lista[0];
    if (escolhido) setBimestreId(String(escolhido.id));
  }, [bimestres.dados]);

  /* Planilha .csv com os registros publicados do bimestre (abre no Excel) */
  async function exportar() {
    setExportando(true);
    try {
      await api.exportarCsv(carregado.bimestre);
      mostrar({ tipo: 'sucesso', titulo: 'Planilha gerada', mensagem: 'O arquivo .csv abre direto no Excel.' });
    } catch (erro) {
      mostrar({ tipo: 'erro', titulo: 'Não foi possível exportar', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
    } finally {
      setExportando(false);
    }
  }

  let conteudo;
  if (bimestres.erro) conteudo = <div className="card"><ErroCarregamento erro={bimestres.erro} aoTentarNovamente={bimestres.recarregar} /></div>;
  else if (!bimestreId) conteudo = <div className="card"><Carregando linhas={6} /></div>;
  else conteudo = <PainelRelatorio key={bimestreId} bimestreId={bimestreId} visao={visao} aoCarregar={setCarregado} />;

  const podeExportar = carregado && String(carregado.bimestre.id) === bimestreId && carregado.resumo.publicados > 0;

  return (
    <AreaAutenticada paginaAtiva={ROTAS.adminRelatorios} titulo="Relatórios"
      descricao="Desempenho da escola por bimestre, com exportação para Excel.">

      {/* Bimestre, visão e exportação na mesma linha */}
      <div className="relatorio-ferramentas">
        <div className="campo-icone">
          <Icon nome="calendario" />
          <label className="sr-only" htmlFor="rel-bimestre">Bimestre</label>
          <select className="campo__select" id="rel-bimestre" value={bimestreId} onChange={(e) => setBimestreId(e.target.value)}>
            {(bimestres.dados ? bimestres.dados.bimestres : []).map((b) => (
              <option key={b.id} value={b.id}>{b.numero}º bimestre de {b.ano_letivo}{b.situacao === 'ABERTO' ? ' (em andamento)' : ''}</option>
            ))}
          </select>
        </div>
        <div className="segmentado" role="group" aria-label="O que mostrar">
          {VISOES.map((v) => (
            <button key={v.valor} type="button" aria-pressed={visao === v.valor} onClick={() => setVisao(v.valor)}>
              <Icon nome={v.icone} />{v.rotulo}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--primario relatorio-ferramentas__exportar" onClick={exportar}
          disabled={!podeExportar || exportando} title="Planilha com os registros publicados do bimestre">
          {exportando ? <><span className="spinner" aria-hidden="true" />Gerando…</> : <><Icon nome="baixar" />Exportar (CSV)</>}
        </button>
      </div>
      {conteudo}
    </AreaAutenticada>
  );
}
