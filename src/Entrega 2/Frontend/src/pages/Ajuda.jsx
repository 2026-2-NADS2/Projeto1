import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import CabecalhoPublico from '../components/layout/CabecalhoPublico.jsx';
import RodapePublico from '../components/layout/RodapePublico.jsx';
import { ROTAS } from '../utils/rotas.js';
import { normalizar } from '../utils/formatadores.js';
import simbolo from '../assets/simbolo-4u.svg';
import '../styles/pages/ajuda.css';

/* Perguntas frequentes, agrupadas por assunto */
const GRUPOS = [
  {
    titulo: 'Acesso à plataforma',
    perguntas: [
      {
        pergunta: 'Como faço meu primeiro acesso?',
        resposta: 'A escola faz o seu cadastro e envia um convite para o e-mail informado. Pelo link do convite você cria a sua senha. Não existe cadastro por conta própria: só a escola cadastra professores e responsáveis.'
      },
      {
        pergunta: 'Esqueci minha senha. O que faço?',
        resposta: 'Na tela de entrada, clique em "Esqueci minha senha". Um link temporário será enviado para o e-mail cadastrado. Se não receber, fale com a secretaria da escola.'
      },
      {
        pergunta: 'Por que precisei entrar de novo?',
        resposta: 'Por segurança, a sessão é encerrada depois de 30 minutos sem atividade. Basta entrar novamente com seu e-mail e senha.'
      }
    ]
  },
  {
    titulo: 'Para famílias',
    perguntas: [
      {
        pergunta: 'Quando posso ver o acompanhamento do bimestre?',
        resposta: 'Assim que a escola revisar e publicar. Os registros passam pela coordenação antes de chegar à família, por isso podem aparecer em dias diferentes para cada disciplina.'
      },
      {
        pergunta: 'Tenho mais de um filho na escola. Preciso de outra conta?',
        resposta: 'Não. Um mesmo responsável pode estar vinculado a vários alunos. No seu painel, escolha o aluno que deseja consultar.'
      },
      {
        pergunta: 'Como baixo o relatório em PDF?',
        resposta: 'Abra o relatório publicado do aluno e use o botão de download. O PDF traz as mesmas informações exibidas na tela.'
      },
      {
        pergunta: 'O que significa "dar ciência"?',
        resposta: 'É confirmar que você leu o relatório. Junto com a ciência, você pode enviar uma observação, que fica visível para o professor e para a coordenação.'
      }
    ]
  },
  {
    titulo: 'Para professores',
    perguntas: [
      {
        pergunta: 'Como registro o acompanhamento de um aluno?',
        resposta: 'No seu painel, escolha a turma e a disciplina, informe a média do bimestre, as tags e uma descrição do desenvolvimento do aluno. Salve como rascunho e envie para revisão quando estiver pronto.'
      },
      {
        pergunta: 'Meu registro foi devolvido. E agora?',
        resposta: 'Ele aparece na aba Devolvidos, com o motivo escrito pela coordenação. Faça os ajustes e envie novamente.'
      },
      {
        pergunta: 'Até quando posso registrar?',
        resposta: 'Enquanto a digitação do bimestre estiver aberta. As datas de abertura e encerramento são definidas pela coordenação.'
      }
    ]
  },
  {
    titulo: 'Privacidade',
    perguntas: [
      {
        pergunta: 'Quem pode ver os dados do aluno?',
        resposta: 'Apenas os responsáveis autorizados, os professores das disciplinas do aluno e a equipe escolar. Os dados são tratados conforme a Lei Geral de Proteção de Dados (LGPD).'
      }
    ]
  }
];

/* Ids fixos para ligar cada pergunta à sua resposta (aria-controls) */
const GRUPOS_COM_ID = GRUPOS.map((g, gi) => ({
  ...g,
  id: 'faq-grupo-' + gi,
  perguntas: g.perguntas.map((p, pi) => ({ ...p, id: `resposta-${gi}-${pi}` }))
}));

function Pergunta({ id, pergunta, resposta }) {
  const [aberta, setAberta] = useState(false);
  return (
    <li className={'faq__item' + (aberta ? ' faq__item--aberta' : '')}>
      <h3 className="faq__pergunta">
        <button type="button" aria-expanded={aberta} aria-controls={id} onClick={() => setAberta(!aberta)}>
          <span>{pergunta}</span>
          <Icon nome="chevronBaixo" />
        </button>
      </h3>
      <div className="faq__resposta" id={id} hidden={!aberta}>
        <p>{resposta}</p>
      </div>
    </li>
  );
}

export default function Ajuda() {
  const [busca, setBusca] = useState('');
  useEffect(() => { document.title = 'Ajuda — 4U'; }, []);

  /* Filtra pela pergunta e pela resposta, sem diferenciar acentos */
  const termo = normalizar(busca.trim());
  const grupos = GRUPOS_COM_ID
    .map((g) => ({
      ...g,
      perguntas: g.perguntas.filter((p) => !termo || normalizar(p.pergunta + ' ' + p.resposta).includes(termo))
    }))
    .filter((g) => g.perguntas.length > 0);
  const total = grupos.reduce((soma, g) => soma + g.perguntas.length, 0);

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <CabecalhoPublico />

      <main id="conteudo" className="container ajuda" tabIndex={-1}>
        <header className="ajuda__topo">
          <img src={simbolo} alt="" width="72" height="48" />
          <h1>Como podemos ajudar?</h1>
          <form className="busca ajuda__busca" role="search" onSubmit={(e) => e.preventDefault()}>
            <Icon nome="buscar" />
            <label className="sr-only" htmlFor="busca-ajuda">Buscar nas perguntas frequentes</label>
            <input
              id="busca-ajuda" className="busca__campo" type="search" placeholder="Qual sua dúvida?"
              value={busca} onChange={(e) => setBusca(e.target.value)}
            />
          </form>
          <p className="sr-only" aria-live="polite">
            {termo ? `${total} ${total === 1 ? 'pergunta encontrada' : 'perguntas encontradas'}` : ''}
          </p>
        </header>

        {grupos.length === 0 ? (
          <div className="card estado ajuda__vazio" role="status">
            <div className="estado__icone"><Icon nome="buscar" /></div>
            <p className="estado__titulo">Nenhuma pergunta encontrada</p>
            <p>Tente outras palavras ou envie sua dúvida para a escola.</p>
            <Link className="btn btn--primario btn--sm" to={ROTAS.contato}>Fale com a gente</Link>
          </div>
        ) : (
          grupos.map((g) => (
            <section key={g.id} className="faq" aria-labelledby={g.id}>
              <h2 id={g.id} className="faq__grupo">{g.titulo}</h2>
              <ul className="faq__lista">
                {g.perguntas.map((p) => <Pergunta key={p.id} {...p} />)}
              </ul>
            </section>
          ))
        )}

        <aside className="card ajuda__contato">
          <span className="ajuda__contato-icone tom-magenta"><Icon nome="mensagem" /></span>
          <div>
            <h2>Não encontrou o que procurava?</h2>
            <p>Envie sua dúvida pelo formulário de contato e a escola responde no seu e-mail.</p>
          </div>
          <Link className="btn btn--primario" to={ROTAS.contato}>Fale com a gente</Link>
        </aside>
      </main>

      <RodapePublico />
    </>
  );
}
