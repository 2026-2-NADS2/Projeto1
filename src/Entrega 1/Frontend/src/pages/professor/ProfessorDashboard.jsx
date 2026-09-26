import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import { Indicador, IndicadorCarregando, StatusBadge } from '../../components/Elementos.jsx';
import { Carregando, ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ROTAS } from '../../utils/rotas.js';
import { formatarDataHora, plural, primeiroNome, saudacao } from '../../utils/formatadores.js';
import '../../styles/pages/dashboard.css';

const ATALHOS = [
  { icone: 'mais', tom: 'tom-primaria', titulo: 'Novo acompanhamento', texto: 'Descrição, média e tags' },
  { icone: 'turma', tom: 'tom-marinho', titulo: 'Minhas turmas', texto: 'Alunos das turmas vinculadas' },
  { icone: 'devolver', tom: 'tom-erro', titulo: 'Registros devolvidos', texto: 'Corrigir e reenviar para revisão' },
  { icone: 'mensagem', tom: 'tom-magenta', titulo: 'Retornos dos responsáveis', texto: 'Ciência e observações das famílias' }
];

/* Rótulos das contagens */
const CURTOS = { RASCUNHO: ['rascunho', 'rascunhos'], DEVOLVIDO: ['devolvido', 'devolvidos'] };

function LinhaTurma({ v }) {
  const pct = v.total_alunos ? Math.round((v.registrados / v.total_alunos) * 100) : 0;
  const pendencias = ['DEVOLVIDO', 'RASCUNHO'].filter((s) => v.por_status[s]);
  return (
    <li className="turma-item">
      <div className="turma-item__resumo">
        <span className="turma-item__icone tom-primaria"><Icon nome="turma" /></span>
        <span>
          <span className="turma-item__nome">{v.turma}</span>
          <span className="turma-item__meta">{v.disciplina} · {plural(v.total_alunos, 'aluno', 'alunos')}</span>
        </span>
        <span className="turma-item__progresso">
          <span className="turma-item__progresso-texto"><span>Registros</span><strong>{v.registrados} de {v.total_alunos}</strong></span>
          <span className="progresso" role="progressbar" aria-valuemin={0} aria-valuemax={v.total_alunos} aria-valuenow={v.registrados}
            aria-label={`${v.registrados} de ${v.total_alunos} alunos com registro`}>
            <span className="progresso__barra" style={{ width: pct + '%', display: 'block' }} />
          </span>
        </span>
        <span className="turma-item__alertas">
          {pendencias.length
            ? pendencias.map((s) => {
              const qtd = v.por_status[s];
              return <StatusBadge key={s} status={s} texto={`${qtd} ${CURTOS[s][qtd === 1 ? 0 : 1]}`} />;
            })
            : <span className="legenda">Sem pendências</span>}
        </span>
      </div>
    </li>
  );
}

export default function ProfessorDashboard() {
  const { usuario } = useAuth();
  const painel = useApi(api.painelProfessor);
  const p = painel.dados;
  const b = p && p.bimestre;

  let indicadores;
  if (painel.carregando) indicadores = [1, 2, 3].map((i) => <IndicadorCarregando key={i} />);
  else if (p) {
    indicadores = (
      <>
        <Indicador icone="lapis" tom="tom-alerta" valor={p.totais.rascunhos} rotulo="Rascunhos" detalhe="Ainda não enviados para revisão" />
        <Indicador icone="devolver" tom="tom-erro" valor={p.totais.devolvidos} rotulo="Devolvidos para ajustes" detalhe="Corrigir e reenviar" />
        <Indicador icone="enviar" tom="tom-primaria" valor={p.totais.em_revisao} rotulo="Em revisão" detalhe={`${p.totais.publicados} já publicados às famílias`} />
      </>
    );
  }

  let turmas;
  if (painel.carregando) turmas = <Carregando linhas={4} blocos />;
  else if (painel.erro) turmas = <ErroCarregamento erro={painel.erro} aoTentarNovamente={painel.recarregar} />;
  else if (!p.vinculos.length) turmas = <Vazio icone="turma" titulo="Você ainda não tem turmas vinculadas" mensagem="Quando a escola vincular você a uma turma e disciplina, ela aparecerá aqui." />;
  else turmas = <ul className="turmas-lista">{p.vinculos.map((v) => <LinhaTurma key={v.id} v={v} />)}</ul>;

  return (
    <AreaAutenticada paginaAtiva={ROTAS.professorDashboard} busca="Buscar aluno das suas turmas…">
      <div className="conteudo__cabecalho">
        <div>
          <h1>{saudacao()}, Prof. {primeiroNome(usuario.nome)}</h1>
          <p>
            {b
              ? `${b.numero}º bimestre de ${b.ano_letivo} — ` +
                (b.digitacao_aberta ? `digitação aberta até ${formatarDataHora(b.encerramento_digitacao)}.` : 'período de digitação encerrado.')
              : 'Acompanhamento das suas turmas no bimestre atual.'}
          </p>
        </div>
      </div>

      {b && !b.digitacao_aberta && (
        <div className="alerta alerta--alerta" role="status" style={{ marginBottom: 24 }}>
          <Icon nome="cadeado" />
          <p>O período de digitação está fechado. Novos registros e edições só serão possíveis quando a escola abrir o próximo bimestre.</p>
        </div>
      )}

      <section className="grade-indicadores grade-indicadores--3" aria-label="Situação dos seus registros no bimestre">
        {indicadores}
      </section>

      <div className="grade-dashboard">
        <section className="card" aria-labelledby="turmas-titulo">
          <div className="card__cabecalho">
            <h2 id="turmas-titulo">Analítico das turmas</h2>
            {p && <span className="legenda">{plural(p.vinculos.length, 'vínculo', 'vínculos')} · {b.numero}º bimestre</span>}
          </div>
          {turmas}
        </section>

        <section className="card" aria-labelledby="atalhos-titulo">
          <div className="card__cabecalho"><h2 id="atalhos-titulo">Atalhos</h2></div>
          <ul className="atalhos">
            {ATALHOS.map((a, i) => (
              <li key={a.titulo}>
                <div className="atalho">
                  <span className={'atalho__icone ' + a.tom}><Icon nome={a.icone} /></span>
                  <span className="atalho__texto">
                    {a.titulo}
                    <small>
                      {i === 2 && p
                        ? (p.totais.devolvidos ? plural(p.totais.devolvidos, 'registro aguardando', 'registros aguardando') + ' correção' : 'Nenhum registro devolvido')
                        : a.texto}
                    </small>
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
