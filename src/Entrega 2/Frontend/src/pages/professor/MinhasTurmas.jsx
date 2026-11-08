import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import { Indicador, IndicadorCarregando } from '../../components/Elementos.jsx';
import { Carregando, ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { ROTAS } from '../../utils/rotas.js';
import { formatarDataHora, normalizar, plural } from '../../utils/formatadores.js';
import '../../styles/pages/dashboard.css';
import '../../styles/pages/acompanhamentos.css';

/* Pendências de uma turma: alunos sem registro + rascunhos + devolvidos (o que ainda depende do professor) */
const pendencias = (v) => (v.total_alunos - v.registrados) + (v.por_status.RASCUNHO || 0) + (v.por_status.DEVOLVIDO || 0);

const ORDENS = {
  nome: { rotulo: 'Nome da turma', comparar: (a, b) => a.turma.localeCompare(b.turma, 'pt-BR') || a.disciplina.localeCompare(b.disciplina, 'pt-BR') },
  pendencias: { rotulo: 'Mais pendências', comparar: (a, b) => pendencias(b) - pendencias(a) },
  andamento: { rotulo: 'Menos registros', comparar: (a, b) => a.registrados / (a.total_alunos || 1) - b.registrados / (b.total_alunos || 1) }
};

/* Selo de pendências da turma */
function SeloPendencias({ vinculo }) {
  const n = pendencias(vinculo);
  return n
    ? <span className="selo selo--alerta"><Icon nome="relogio" />{plural(n, 'pendência', 'pendências')}</span>
    : <span className="selo selo--sucesso"><Icon nome="check" />Sem pendências</span>;
}

/* Barra "Registros no bimestre: X de Y" */
function Progresso({ vinculo }) {
  const pct = vinculo.total_alunos ? Math.round((vinculo.registrados / vinculo.total_alunos) * 100) : 0;
  return (
    <div>
      <span className="turma-item__progresso-texto"><span>Registros no bimestre</span><strong>{vinculo.registrados} de {vinculo.total_alunos}</strong></span>
      <span className="progresso" role="progressbar" aria-valuemin={0} aria-valuemax={vinculo.total_alunos} aria-valuenow={vinculo.registrados}
        aria-label={`${vinculo.registrados} de ${vinculo.total_alunos} alunos com registro`}>
        <span className="progresso__barra" style={{ width: pct + '%', display: 'block' }} />
      </span>
    </div>
  );
}

const linkTurma = (v) => `${ROTAS.professorAcompanhamentos}?vinculo=${v.id}`;

/* Turmas e disciplinas do professor (vinculo_docente), com o andamento do bimestre */
export default function MinhasTurmas() {
  const painel = useApi(api.painelProfessor);
  const p = painel.dados;
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState('nome');
  const [visao, setVisao] = useState('cards');

  useEffect(() => { document.title = 'Minhas turmas — 4U'; }, []);

  const vinculos = p ? p.vinculos : [];
  const termo = normalizar(busca.trim());
  const visiveis = vinculos
    .filter((v) => !termo || normalizar(v.turma + ' ' + v.disciplina).includes(termo))
    .sort(ORDENS[ordem].comparar);

  let lista;
  if (painel.carregando) lista = <Carregando linhas={6} blocos />;
  else if (painel.erro) lista = <ErroCarregamento erro={painel.erro} aoTentarNovamente={painel.recarregar} />;
  else if (!vinculos.length) {
    lista = <Vazio icone="turma" titulo="Você ainda não tem turmas" mensagem="Quando a coordenação atribuir uma turma e disciplina a você, ela aparece aqui." />;
  } else if (!visiveis.length) {
    lista = (
      <Vazio icone="buscar" titulo="Nenhuma turma encontrada" mensagem="Confira o nome digitado.">
        <button type="button" className="btn btn--secundario btn--sm" onClick={() => setBusca('')}>Limpar busca</button>
      </Vazio>
    );
  } else if (visao === 'cards') {
    lista = (
      <ul className="turmas-cartoes">
        {visiveis.map((v) => (
          <li key={v.id} className="turma-cartao">
            <div className="turma-cartao__topo">
              <span className="turma-item__icone tom-primaria"><Icon nome="turma" /></span>
              <div>
                <h3>{v.turma}</h3>
                <p className="legenda">{v.disciplina} · {plural(v.total_alunos, 'aluno', 'alunos')}</p>
              </div>
            </div>
            <Progresso vinculo={v} />
            <div><SeloPendencias vinculo={v} /></div>
            <Link className="btn btn--primario btn--sm" to={linkTurma(v)}><Icon nome="prancheta" />Abrir turma</Link>
          </li>
        ))}
      </ul>
    );
  } else {
    lista = (
      <div className="tabela-wrapper">
        <table className="tabela tabela--responsiva">
          <caption className="sr-only">Turmas do bimestre</caption>
          <thead>
            <tr><th scope="col">Turma</th><th scope="col">Disciplina</th><th scope="col">Registros</th><th scope="col">Pendências</th><th scope="col" className="col-acoes"><span className="sr-only">Ações</span></th></tr>
          </thead>
          <tbody>
            {visiveis.map((v) => (
              <tr key={v.id}>
                <td className="td-principal"><strong>{v.turma}</strong></td>
                <td data-label="Disciplina">{v.disciplina}</td>
                <td data-label="Registros">{v.registrados} de {v.total_alunos}</td>
                <td data-label="Pendências"><SeloPendencias vinculo={v} /></td>
                <td className="col-acoes"><Link className="btn btn--primario btn--sm" to={linkTurma(v)}><Icon nome="prancheta" />Abrir turma</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const totalRegistros = vinculos.reduce((s, v) => s + v.registrados, 0);
  const totalPendencias = vinculos.reduce((s, v) => s + pendencias(v), 0);

  return (
    <AreaAutenticada paginaAtiva={ROTAS.professorTurmas} titulo="Minhas turmas"
      descricao={p && p.bimestre
        ? `${p.bimestre.numero}º bimestre de ${p.bimestre.ano_letivo} — ` + (p.bimestre.digitacao_aberta
          ? `digitação aberta até ${formatarDataHora(p.bimestre.encerramento_digitacao)}.`
          : 'digitação encerrada.')
        : 'Turmas e disciplinas em que você leciona.'}>

      <section className="grade-indicadores grade-indicadores--3" aria-label="Resumo">
        {!p ? [1, 2, 3].map((i) => <IndicadorCarregando key={i} />) : (
          <>
            <Indicador icone="usuarios" tom="tom-primaria" valor={vinculos.length} rotulo="Turmas vinculadas" />
            <Indicador icone="documento" tom="tom-alerta" valor={totalRegistros} rotulo="Registros realizados" />
            <Indicador icone="relogio" tom="tom-erro" valor={totalPendencias} rotulo="Pendências" />
          </>
        )}
      </section>

      <div className="barra-filtros turmas-filtros">
        <div className="campo-busca">
          <Icon nome="buscar" />
          <label className="sr-only" htmlFor="busca-turma">Buscar turma</label>
          <input className="campo__input" id="busca-turma" type="search" autoComplete="off" placeholder="Buscar turma ou disciplina"
            value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select className="campo__select" aria-label="Ordenar turmas" value={ordem} onChange={(e) => setOrdem(e.target.value)}>
          {Object.entries(ORDENS).map(([chave, o]) => <option key={chave} value={chave}>Ordenar: {o.rotulo}</option>)}
        </select>
      </div>

      <section className="card" aria-labelledby="turmas-titulo">
        <div className="card__cabecalho">
          <h2 id="turmas-titulo">Turmas do {p && p.bimestre ? `${p.bimestre.numero}º bimestre` : 'bimestre'}</h2>
          <div className="segmentado" role="group" aria-label="Forma de exibição">
            <button type="button" aria-pressed={visao === 'cards'} onClick={() => setVisao('cards')}><Icon nome="cards" />Cards</button>
            <button type="button" aria-pressed={visao === 'lista'} onClick={() => setVisao('lista')}><Icon nome="lista" />Lista</button>
          </div>
        </div>
        <div className={visao === 'cards' ? 'card__corpo' : ''}>{lista}</div>
      </section>
    </AreaAutenticada>
  );
}
