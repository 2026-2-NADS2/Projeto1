import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import { Avatar } from '../../components/Elementos.jsx';
import { Carregando, ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { ROTAS } from '../../utils/rotas.js';
import { formatarMedia, plural } from '../../utils/formatadores.js';
import '../../styles/pages/responsavel.css';

const PARENTESCO = { MAE: 'Mãe', PAI: 'Pai', AVO: 'Avó/avô', TUTOR: 'Tutor(a)', OUTRO: 'Responsável' };

/* Cartão de um aluno: média geral em destaque, mini gráfico por bimestre, pendências e atalhos */
function CartaoAluno({ aluno, bimestres, bimestreEscolhido }) {
  /* Média em destaque: a do bimestre escolhido no filtro; sem filtro, a do último bimestre com relatório */
  const destaque = bimestreEscolhido
    ? aluno.desempenho.find((x) => x.bimestre === bimestreEscolhido.numero)
    : aluno.desempenho[aluno.desempenho.length - 1];
  const bimDestaque = destaque && bimestres.find((b) => b.numero === destaque.bimestre);
  const linkRelatorio = `${ROTAS.responsavelRelatorios}?aluno=${aluno.id}${bimDestaque ? '&bimestre=' + bimDestaque.id : ''}`;

  return (
    <li className="card aluno-cartao-r">
      <div className="aluno-cartao-r__topo">
        <Avatar nome={aluno.nome} />
        <div>
          <h2>{aluno.nome}</h2>
          <ul className="aluno-cartao-r__dados" aria-label="Dados do aluno">
            <li>{aluno.turma || 'Sem turma'}</li>
            <li>Matrícula {aluno.matricula}</li>
            <li>Vínculo: {PARENTESCO[aluno.parentesco] || 'Responsável'}</li>
          </ul>
        </div>
      </div>

      <div className="aluno-cartao-r__desempenho">
        <div className="aluno-cartao-r__media">
          <strong>{destaque ? formatarMedia(destaque.media_geral) : '—'}</strong>
          <span>Média geral</span>
          <span>{destaque ? `${destaque.bimestre}º bimestre` : 'Sem relatório publicado'}</span>
        </div>
        <ol className="evolucao" aria-label={`Média geral de ${aluno.nome} por bimestre`}>
          {bimestres.map((b) => {
            const m = aluno.desempenho.find((x) => x.bimestre === b.numero);
            return (
              <li key={b.id} className={'evolucao__item' + (destaque && destaque.bimestre === b.numero ? ' evolucao__item--atual' : '')}>
                <strong>{m ? formatarMedia(m.media_geral) : '—'}</strong>
                <span className="evolucao__trilho" aria-hidden="true">
                  <span className="evolucao__barra" style={{ height: m ? `${m.media_geral * 10}%` : 0 }} />
                </span>
                <span className="legenda">{b.numero}º bim</span>
              </li>
            );
          })}
        </ol>
      </div>

      {aluno.pendentes > 0 ? (
        <p className="aluno-cartao-r__pendente">
          <span><Icon nome="relogio" className="icone--inline" /> {plural(aluno.pendentes, 'relatório aguarda', 'relatórios aguardam')} a sua ciência</span>
          <Link to={linkRelatorio}>Ver relatórios pendentes</Link>
        </p>
      ) : <p className="aluno-cartao-r__em-dia"><Icon nome="check" className="icone--inline" /> Você já deu ciência em todos os relatórios.</p>}

      <div className="aluno-cartao-r__acoes">
        <Link className="btn btn--primario" to={linkRelatorio}><Icon nome="documento" />Ver resultados</Link>
        {/* Abre o relatório e já chama a impressão (Salvar como PDF) */}
        <Link className="btn btn--secundario" to={linkRelatorio + '&imprimir=1'}><Icon nome="baixar" />Baixar PDF</Link>
      </div>
    </li>
  );
}

/* Alunos vinculados ao responsável, com a média geral de cada bimestre (view vw_desempenho_aluno) */
export default function MeusAlunos() {
  const dados = useApi(api.meusAlunos);
  const d = dados.dados;
  const [alunoId, setAlunoId] = useState('');
  const [bimestreId, setBimestreId] = useState('');

  useEffect(() => { document.title = 'Meus alunos — 4U'; }, []);

  let conteudo;
  if (dados.carregando) conteudo = <div className="card"><Carregando linhas={6} blocos /></div>;
  else if (dados.erro) conteudo = <div className="card"><ErroCarregamento erro={dados.erro} aoTentarNovamente={dados.recarregar} /></div>;
  else if (!d.alunos.length) {
    conteudo = (
      <div className="card">
        <Vazio icone="aluno" titulo="Nenhum aluno vinculado ao seu cadastro"
          mensagem="Se você é responsável por um aluno desta escola, procure a secretaria para que o vínculo seja feito." />
      </div>
    );
  } else {
    const bimestre = d.bimestres.find((b) => String(b.id) === bimestreId);
    const alunos = d.alunos.filter((a) => !alunoId || String(a.id) === alunoId);
    conteudo = (
      <>
        <form className="card filtros" aria-label="Filtrar alunos" onSubmit={(e) => e.preventDefault()}>
          <div className="campo">
            <label className="campo__label" htmlFor="filtro-aluno">Aluno</label>
            <select className="campo__select" id="filtro-aluno" value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
              <option value="">Todos os alunos</option>
              {d.alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <div className="campo">
            <label className="campo__label" htmlFor="filtro-bimestre">Bimestre</label>
            <select className="campo__select" id="filtro-bimestre" value={bimestreId} onChange={(e) => setBimestreId(e.target.value)}>
              <option value="">Último com relatório</option>
              {d.bimestres.map((b) => <option key={b.id} value={b.id}>{b.numero}º bimestre de {b.ano_letivo}</option>)}
            </select>
          </div>
        </form>
        <ul className="alunos-cartoes">
          {alunos.map((a) => <CartaoAluno key={a.id} aluno={a} bimestres={d.bimestres} bimestreEscolhido={bimestre} />)}
        </ul>
      </>
    );
  }

  return (
    <AreaAutenticada paginaAtiva={ROTAS.responsavelAlunos} titulo="Meus alunos"
      descricao="Alunos vinculados ao seu cadastro. Você vê apenas os relatórios já revisados e publicados pela escola.">
      {conteudo}
    </AreaAutenticada>
  );
}
