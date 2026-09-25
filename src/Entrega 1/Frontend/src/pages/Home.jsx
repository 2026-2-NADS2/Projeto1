import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import CabecalhoPublico from '../components/layout/CabecalhoPublico.jsx';
import RodapePublico from '../components/layout/RodapePublico.jsx';
import LinkInativo from '../components/layout/LinkInativo.jsx';
import '../styles/pages/home.css';
import bannerAdmin from '../assets/banner-admin.png';
import bannerProfessor from '../assets/banner-professor.jpg';
import bannerResponsavel from '../assets/banner-responsavel.jpg';

/* Destaques do banner */
const SLIDES = [
  {
    perfil: 'Administrador',
    cor: 'admin',
    icone: 'engrenagem',
    titulo: 'Uma plataforma para acompanhar o desenvolvimento escolar',
    texto: 'A 4U conecta professores, administração e família em um só lugar: transforma o boletim bimestral em algo que a família acompanha em tempo real, com todo o histórico de revisão da escola.',
    /* IMAGEM PERSONALIZÁVEL: banner do Administrador */
    imagem: bannerAdmin
  },
  {
    perfil: 'Professor',
    cor: 'professor',
    icone: 'professor',
    titulo: 'O professor registra o acompanhamento do bimestre',
    texto: 'Descrição qualitativa, média e tags para cada aluno e disciplina. O professor salva como rascunho e envia para revisão quando estiver pronto.',
    /* IMAGEM PERSONALIZÁVEL: banner do Professor */
    imagem: bannerProfessor
  },
  {
    perfil: 'Responsável',
    cor: 'responsavel',
    icone: 'usuarios',
    titulo: 'A família acompanha o que a escola publicou',
    texto: 'O responsável consulta os relatórios publicados dos alunos vinculados ao seu cadastro, registra ciência e gera o relatório em PDF quando quiser.',
    /* IMAGEM PERSONALIZÁVEL: banner do Responsável */
    imagem: bannerResponsavel
  }
];

const VANTAGENS = [
  { icone: 'escudo', tom: 'tom-marinho', titulo: 'Nada chega à família sem revisão', texto: 'Todo acompanhamento passa pela escola antes de ser publicado.' },
  { icone: 'relogio', tom: 'tom-primaria', titulo: 'Histórico completo de tudo', texto: 'Toda alteração fica registrada — quem mudou, quando e o quê.' },
  { icone: 'mensagem', tom: 'tom-magenta', titulo: 'A família também pode responder', texto: 'Além de acompanhar, o responsável registra ciência e pode enviar uma observação à escola.' },
  { icone: 'documento', tom: 'tom-sucesso', titulo: 'Relatório em PDF, quando quiser', texto: 'A família baixa o relatório publicado a qualquer momento.' }
];

function Carrossel() {
  const reduzirMovimento = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(reduzirMovimento);
  const [emFoco, setEmFoco] = useState(false);
  const areaRef = useRef(null);

  /* Troca automática a cada 7 s */
  useEffect(() => {
    if (pausado || emFoco) return undefined;
    const timer = setInterval(() => setAtual((a) => (a + 1) % SLIDES.length), 3000);
    return () => clearInterval(timer);
  }, [pausado, emFoco]);

  return (
    <section
      className="container"
      aria-roledescription="carrossel"
      aria-label="Destaques da plataforma"
      ref={areaRef}
      onMouseEnter={() => setEmFoco(true)}
      onMouseLeave={() => setEmFoco(false)}
      onFocus={() => setEmFoco(true)}
      onBlur={(e) => { if (!areaRef.current.contains(e.relatedTarget)) setEmFoco(false); }}
    >
      <div className="banner">
        {SLIDES.map((slide, i) => (
          <article
            key={slide.perfil}
            className={'banner__slide banner__slide--' + slide.cor}
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${SLIDES.length}: ${slide.perfil}`}
            hidden={i !== atual}
          >
            <div className="banner__texto">
              {i === 0 ? <h1>{slide.titulo}</h1> : <h2 className="banner__titulo">{slide.titulo}</h2>}
              <p>{slide.texto}</p>
              <LinkInativo className="banner__link">Conheça mais o 4U</LinkInativo>
            </div>
            <div className="banner__midia">
              <span className="banner__perfil"><Icon nome={slide.icone} />{slide.perfil}</span>
              {slide.imagem ? (
                <img className="banner__imagem" src={slide.imagem} alt={`Banner ${slide.perfil}`} />
              ) : (
                /* Espaço reservado para a imagem */
                <div className="banner__imagem" role="img" aria-label={`Espaço reservado para a imagem do banner do ${slide.perfil}`}>
                  <span>Imagem do banner<br /><strong>{slide.perfil}</strong></span>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="banner__controles">
        <div className="banner__pontos" role="group" aria-label="Escolher destaque">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.perfil}
              type="button"
              className="banner__ponto"
              aria-label={`Destaque ${i + 1}: ${slide.perfil}`}
              aria-current={i === atual ? 'true' : 'false'}
              onClick={() => setAtual(i)}
            />
          ))}
        </div>
        <button
          type="button"
          className="btn btn--icone banner__pausa"
          aria-label={pausado ? 'Retomar troca automática dos destaques' : 'Pausar troca automática dos destaques'}
          onClick={() => setPausado(!pausado)}
        >
          <Icon nome={pausado ? 'tocar' : 'pausar'} />
        </button>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <CabecalhoPublico />

      <main id="conteudo" tabIndex={-1}>
        <Carrossel />

        <hr className="container divisor" />

        <section className="container vantagens" aria-labelledby="vantagens-titulo">
          <h2 id="vantagens-titulo" className="vantagens__titulo">Por que escolher a 4U</h2>
          <p className="vantagens__subtitulo">
            O que a plataforma garante que um grupo de WhatsApp ou um caderno de recados não conseguem.
          </p>
          <ul className="vantagens__lista">
            {VANTAGENS.map((v) => (
              <li key={v.titulo} className="card vantagem">
                <span className={'vantagem__icone ' + v.tom}><Icon nome={v.icone} /></span>
                <h3>{v.titulo}</h3>
                <p>{v.texto}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <RodapePublico />
    </>
  );
}