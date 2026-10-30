import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import { Avatar, Indicador, IndicadorCarregando, StatusBadge } from '../../components/Elementos.jsx';
import { Carregando, ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ROTAS } from '../../utils/rotas.js';
import { formatarData, formatarDataHora, plural, primeiroNome, saudacao } from '../../utils/formatadores.js';
import '../../styles/pages/dashboard.css';

const ACOES_RAPIDAS = [
  { icone: 'usuarios', tom: 'tom-primaria', titulo: 'Gerenciar cadastros', texto: 'Alunos, professores e responsáveis' },
  { icone: 'prancheta', tom: 'tom-alerta', titulo: 'Revisar acompanhamentos', texto: 'Enviados pelos professores' },
  { icone: 'calendario', tom: 'tom-marinho', titulo: 'Configurar bimestres', texto: 'Abertura e encerramento da digitação' },
  { icone: 'baixar', tom: 'tom-sucesso', titulo: 'Exportar dados', texto: 'Arquivo .csv compatível com Excel' }
];

function Indicadores({ resumo }) {
  if (resumo.carregando) return [1, 2, 3, 4].map((i) => <IndicadorCarregando key={i} />);
  if (resumo.erro) return <ErroCarregamento erro={resumo.erro} aoTentarNovamente={resumo.recarregar} />;
  const r = resumo.dados;
  return (
    <>
      <Indicador icone="aluno" tom="tom-primaria" valor={r.alunos_ativos} rotulo="Alunos ativos" detalhe="Matriculados no ano letivo" />
      <Indicador icone="professor" tom="tom-marinho" valor={r.professores_ativos} rotulo="Professores ativos" />
      <Indicador icone="turma" tom="tom-magenta" valor={r.turmas} rotulo="Turmas" detalhe={'Ano letivo ' + r.bimestre.ano_letivo} />
      <Indicador icone="prancheta" tom="tom-alerta" valor={r.aguardando_revisao} rotulo="Aguardando revisão"
        detalhe={`${r.publicados_bimestre} publicados no ${r.bimestre.numero}º bimestre`} />
    </>
  );
}

function TabelaRecentes({ recentes }) {
  if (recentes.carregando) return <Carregando linhas={6} blocos />;
  if (recentes.erro) return <ErroCarregamento erro={recentes.erro} aoTentarNovamente={recentes.recarregar} />;
  if (!recentes.dados.length) {
    return <Vazio icone="prancheta" titulo="Nenhum acompanhamento recebido ainda"
      mensagem="Quando os professores enviarem registros para revisão, eles aparecerão aqui." />;
  }
  return (
    <div className="tabela-wrapper">
      <table className="tabela tabela--responsiva">
        <caption className="sr-only">Últimos acompanhamentos enviados, revisados ou publicados</caption>
        <thead>
          <tr><th scope="col">Aluno</th><th scope="col">Disciplina</th><th scope="col">Status</th><th scope="col">Atualizado em</th></tr>
        </thead>
        <tbody>
          {recentes.dados.map((a) => (
            <tr key={a.id}>
              <td className="td-principal">
                <div className="celula-pessoa">
                  <Avatar nome={a.aluno} />
                  <span>{a.aluno}<small>{a.turma} · {a.bimestre}º bim.</small></span>
                </div>
              </td>
              <td data-label="Disciplina">{a.disciplina}</td>
              <td data-label="Status"><StatusBadge status={a.status} /></td>
              <td data-label="Atualizado em">{formatarData(a.atualizado_em)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const { usuario } = useAuth();
  const resumo = useApi(api.resumoAdministrador);
  const recentes = useApi(() => api.acompanhamentosRecentes(6));
  const r = resumo.dados;

  return (
    <AreaAutenticada paginaAtiva={ROTAS.adminDashboard} busca="Buscar aluno pelo nome…">
      <div className="conteudo__cabecalho">
        <div>
          <h1>{saudacao()}, {primeiroNome(usuario.nome)}</h1>
          <p>
            {r
              ? `${r.bimestre.numero}º bimestre de ${r.bimestre.ano_letivo} — ` +
                (r.bimestre.digitacao_aberta ? `digitação aberta até ${formatarDataHora(r.bimestre.encerramento_digitacao)}.` : 'digitação encerrada.')
              : 'Visão geral da escola no bimestre atual.'}
          </p>
        </div>
      </div>

      <section className="grade-indicadores grade-indicadores--4" aria-label="Indicadores gerais">
        <Indicadores resumo={resumo} />
      </section>

      <div className="grade-dashboard">
        <section className="card" aria-labelledby="recentes-titulo">
          <div className="card__cabecalho">
            <h2 id="recentes-titulo">Acompanhamentos recentes</h2>
            <span className="link-seta">Ver todos<Icon nome="seta" /></span>
          </div>
          <TabelaRecentes recentes={recentes} />
        </section>

        <section className="card" aria-labelledby="atalhos-titulo">
          <div className="card__cabecalho"><h2 id="atalhos-titulo">Ações rápidas</h2></div>
          <ul className="atalhos">
            {ACOES_RAPIDAS.map((acao, i) => (
              <li key={acao.titulo}>
                <div className="atalho">
                  <span className={'atalho__icone ' + acao.tom}><Icon nome={acao.icone} /></span>
                  <span className="atalho__texto">
                    {acao.titulo}
                    <small>{i === 1 && r ? plural(r.aguardando_revisao, 'registro aguardando', 'registros aguardando') + ' revisão' : acao.texto}</small>
                  </span>
                  <Icon nome="chevronDireita" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AreaAutenticada>
  );
}
