import { useState } from 'react';
import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import GraficoBarras from '../../components/GraficoBarras.jsx';
import { Indicador, IndicadorCarregando } from '../../components/Elementos.jsx';
import { ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ROTAS } from '../../utils/rotas.js';
import { formatarMedia, primeiroNome, saudacao } from '../../utils/formatadores.js';
import '../../styles/pages/dashboard.css';

/* Filtro */
function Filtro({ id, rotulo, valor, opcoes, aoMudar }) {
  return (
    <div className="campo">
      <label className="campo__label" htmlFor={id}>{rotulo}</label>
      <select className="campo__select" id={id} value={valor} onChange={(e) => aoMudar(Number(e.target.value))}>
        {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
      </select>
    </div>
  );
}

function PainelAluno({ painel }) {
  /* Filtros iniciais */
  const [alunoId, setAlunoId] = useState(painel.alunos[0].id);
  const [anoLetivo, setAnoLetivo] = useState(painel.anos_letivos[0]);
  const [bimestreId, setBimestreId] = useState(painel.bimestre_atual.id);

  const aluno = painel.alunos.find((a) => a.id === alunoId);
  const bimestresDoAno = painel.bimestres.filter((b) => b.ano_letivo === anoLetivo);
  const bimestre = painel.bimestres.find((b) => b.id === bimestreId) || bimestresDoAno[0];
  const atual = painel.bimestre_atual;
  const escala = painel.escala;

  /* Médias do aluno no bimestre */
  const medias = useApi(() => api.mediasPublicadas(aluno.id, bimestre.id), [aluno.id, bimestre.id]);
  const m = medias.dados;
  const mediaGeral = m ? m.media_geral : null;
  const abaixo = mediaGeral !== null && mediaGeral < escala.aprovacao;

  function trocarAno(ano) {
    setAnoLetivo(ano);
    const primeiroDoAno = painel.bimestres.find((b) => b.ano_letivo === ano);
    if (primeiroDoAno) setBimestreId(primeiroDoAno.id);
  }

  let grafico;
  if (medias.carregando) grafico = <div aria-busy="true"><span className="sr-only">Carregando médias…</span><span className="skeleton" style={{ height: 280, display: 'block' }} /></div>;
  else if (medias.erro) grafico = <ErroCarregamento erro={medias.erro} aoTentarNovamente={medias.recarregar} />;
  else if (!m.disciplinas.length) {
    grafico = <Vazio icone="documento" titulo="Nenhum relatório publicado neste bimestre"
      mensagem={`Quando a escola publicar os acompanhamentos de ${primeiroNome(aluno.nome)} no ${bimestre.numero}º bimestre, as médias aparecerão aqui.`} />;
  } else {
    grafico = (
      <GraficoBarras
        titulo={`Média por disciplina de ${aluno.nome} no ${bimestre.numero}º bimestre`}
        itens={m.disciplinas.map((d) => ({ rotulo: d.disciplina, valor: d.media }))}
        minimo={escala.minima}
        maximo={escala.maxima}
        referencia={escala.aprovacao}
        rotuloReferencia="Média de aprovação da escola"
      />
    );
  }

  return (
    <>
      <section className="grade-indicadores grade-indicadores--3" aria-label="Resumo">
        <Indicador rotuloAntes icone="aluno" tom="tom-primaria" valor={painel.alunos.length} rotulo="Alunos vinculados"
          detalhe={painel.alunos.map((a) => primeiroNome(a.nome)).join(' e ')} />
        {medias.carregando ? <IndicadorCarregando /> : (
          <Indicador rotuloAntes icone={abaixo ? 'alerta' : 'grafico'} tom={abaixo ? 'tom-erro' : 'tom-sucesso'} rotulo="Média geral"
            valor={mediaGeral !== null ? <>{formatarMedia(mediaGeral)} <span className="unidade">de {escala.maxima}</span></> : '—'}
            detalhe={`${primeiroNome(aluno.nome)} · ${bimestre.numero}º bimestre` + (abaixo ? ` · abaixo de ${formatarMedia(escala.aprovacao)}` : '')} />
        )}
        <Indicador rotuloAntes icone="calendario" tom="tom-marinho" rotulo="Bimestre atual"
          valor={<span className="indicador__valor--texto">{atual.numero}º bimestre</span>}
          detalhe={(atual.digitacao_aberta ? 'Em andamento · ' : '') + 'ano letivo ' + atual.ano_letivo} />
      </section>

      <form className="card filtros" aria-label="Filtros do relatório" onSubmit={(e) => e.preventDefault()}>
        <Filtro id="filtro-aluno" rotulo="Aluno" valor={alunoId} aoMudar={setAlunoId}
          opcoes={painel.alunos.map((a) => ({ valor: a.id, rotulo: a.nome + (a.turma ? ' — ' + a.turma : '') }))} />
        <Filtro id="filtro-ano" rotulo="Ano letivo" valor={anoLetivo} aoMudar={trocarAno}
          opcoes={painel.anos_letivos.map((ano) => ({ valor: ano, rotulo: String(ano) }))} />
        <Filtro id="filtro-bimestre" rotulo="Bimestre" valor={bimestre.id} aoMudar={setBimestreId}
          opcoes={bimestresDoAno.map((b) => ({ valor: b.id, rotulo: b.numero + 'º bimestre' }))} />
      </form>

      <section className="card painel-grafico" aria-labelledby="grafico-titulo">
        <div className="card__cabecalho">
          <h2 id="grafico-titulo">Média por disciplina — {aluno.nome}, {bimestre.numero}º bimestre</h2>
        </div>
        <div className="card__corpo" aria-live="polite">{grafico}</div>
        <p className="legenda painel-grafico__rodape">
          <Icon nome="info" className="icone--inline" /> Aparecem aqui apenas os acompanhamentos já revisados e publicados pela escola.
        </p>
      </section>
    </>
  );
}

export default function ResponsavelDashboard() {
  const { usuario } = useAuth();
  const painel = useApi(api.painelResponsavel);

  let conteudo;
  if (painel.carregando) {
    conteudo = (
      <div aria-busy="true">
        <span className="sr-only">Carregando…</span>
        <div className="grade-indicadores grade-indicadores--3"><IndicadorCarregando /><IndicadorCarregando /><IndicadorCarregando /></div>
        <span className="card skeleton" style={{ display: 'block', height: 360 }} />
      </div>
    );
  } else if (painel.erro) {
    conteudo = <div className="card"><ErroCarregamento erro={painel.erro} aoTentarNovamente={painel.recarregar} /></div>;
  } else if (!painel.dados.alunos.length) {
    conteudo = (
      <div className="card">
        <Vazio icone="aluno" titulo="Nenhum aluno vinculado ao seu cadastro"
          mensagem="Se você é responsável por um aluno desta escola, procure a secretaria para que o vínculo seja feito." />
      </div>
    );
  } else {
    conteudo = <PainelAluno painel={painel.dados} />;
  }

  return (
    <AreaAutenticada paginaAtiva={ROTAS.responsavelDashboard}>
      <div className="conteudo__cabecalho">
        <div>
          <h1>{saudacao()}, {primeiroNome(usuario.nome)}</h1>
          <p>Acompanhe o desenvolvimento dos alunos vinculados ao seu cadastro.</p>
        </div>
      </div>
      {conteudo}
    </AreaAutenticada>
  );
}
