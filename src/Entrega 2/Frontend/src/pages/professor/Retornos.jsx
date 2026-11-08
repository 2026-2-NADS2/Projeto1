import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import { Indicador, IndicadorCarregando } from '../../components/Elementos.jsx';
import { Carregando, ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { ROTAS } from '../../utils/rotas.js';
import { formatarDataHora, plural } from '../../utils/formatadores.js';
import '../../styles/pages/dashboard.css';
import '../../styles/pages/acompanhamentos.css';

const PARENTESCO = { MAE: 'Mãe', PAI: 'Pai', AVO: 'Avó/avô', TUTOR: 'Tutor(a)', OUTRO: 'Responsável' };

/* Retornos: o que a coordenação devolveu e o que as famílias escreveram */
export default function Retornos() {
  const dados = useApi(api.retornos);
  const r = dados.dados;

  useEffect(() => { document.title = 'Retornos — 4U'; }, []);

  if (dados.erro) {
    return (
      <AreaAutenticada paginaAtiva={ROTAS.professorRetornos} titulo="Retornos">
        <div className="card"><ErroCarregamento erro={dados.erro} aoTentarNovamente={dados.recarregar} /></div>
      </AreaAutenticada>
    );
  }

  const c = r && r.ciencia_bimestre;
  return (
    <AreaAutenticada paginaAtiva={ROTAS.professorRetornos} titulo="Retornos"
      descricao="Registros devolvidos pela coordenação e observações das famílias sobre os seus relatórios.">

      <section className="grade-indicadores grade-indicadores--3" aria-label="Resumo">
        {!r ? [1, 2, 3].map((i) => <IndicadorCarregando key={i} />) : (
          <>
            <Indicador icone="devolver" tom="tom-erro" valor={r.devolvidos.length} rotulo="Para corrigir" detalhe="Devolvidos pela coordenação" />
            <Indicador icone="mensagem" tom="tom-alerta" valor={r.observacoes.length} rotulo="Observações das famílias" detalhe="As mais recentes" />
            <Indicador icone="check" tom="tom-sucesso" valor={c.publicados ? `${c.com_ciencia}/${c.publicados}` : '—'} rotulo="Ciência das famílias"
              detalhe={c.bimestre ? `Relatórios publicados no ${c.bimestre}º bimestre` : ''} />
          </>
        )}
      </section>

      <div className="grade-retornos">
        <section className="card" aria-labelledby="devolvidos-titulo">
          <div className="card__cabecalho"><h2 id="devolvidos-titulo">Devolvidos para ajustes</h2></div>
          {!r ? <Carregando linhas={4} blocos /> : !r.devolvidos.length ? (
            <Vazio icone="check" titulo="Nada para corrigir" mensagem="Quando a coordenação devolver um registro, ele aparece aqui com o motivo." />
          ) : (
            <ul className="retornos">
              {r.devolvidos.map((d) => (
                <li key={d.id} className="retorno">
                  <div>
                    <p className="retorno__titulo">{d.aluno}</p>
                    <p className="legenda">{d.disciplina} · {d.turma} · {d.bimestre}º bimestre · {formatarDataHora(d.atualizado_em)}</p>
                    {d.motivo && <p className="retorno__texto">“{d.motivo}”</p>}
                  </div>
                  {d.vinculo_id && (
                    <Link className="btn btn--primario btn--sm"
                      to={`${ROTAS.professorAcompanhamentos}?vinculo=${d.vinculo_id}&bimestre=${d.bimestre_id}&abrir=${d.id}`}>
                      <Icon nome="lapis" />Corrigir
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="familias-titulo">
          <div className="card__cabecalho"><h2 id="familias-titulo">Observações das famílias</h2></div>
          {!r ? <Carregando linhas={4} blocos /> : !r.observacoes.length ? (
            <Vazio icone="mensagem" titulo="Nenhuma observação ainda" mensagem="Quando um responsável der ciência com uma observação, ela aparece aqui." />
          ) : (
            <ul className="retornos">
              {r.observacoes.map((o) => (
                <li key={o.id} className="retorno retorno--familia">
                  <div>
                    <p className="retorno__titulo">{o.responsavel} <span className="legenda">({PARENTESCO[o.parentesco] || 'Responsável'} de {o.aluno})</span></p>
                    <p className="legenda">{o.disciplina} · {o.bimestre}º bimestre · {formatarDataHora(o.data_hora)}</p>
                    <p className="retorno__texto">“{o.observacao}”</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {r && r.observacoes.length > 0 && <p className="legenda painel-grafico__rodape">{plural(r.observacoes.length, 'observação', 'observações')} mais recentes.</p>}
        </section>
      </div>
    </AreaAutenticada>
  );
}
