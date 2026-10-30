import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import CabecalhoPublico from '../components/layout/CabecalhoPublico.jsx';
import RodapePublico from '../components/layout/RodapePublico.jsx';
import { ROTAS } from '../utils/rotas.js';
import imagemSobre from '../assets/sobre-4u.png';
import '../styles/pages/sobre.css';

/* Cada perfil com a cor da sua asa */
const PILARES = [
  { icone: 'professor', tom: 'tom-alerta', titulo: 'Professores', texto: 'Registram o desempenho de cada aluno no bimestre.' },
  { icone: 'escudo', tom: 'tom-marinho', titulo: 'Equipe escolar', texto: 'Acompanha, revisa e publica as informações.' },
  { icone: 'usuarios', tom: 'tom-magenta', titulo: 'Famílias', texto: 'Consultam os relatórios publicados dos seus filhos.' }
];

export default function Sobre() {
  useEffect(() => { document.title = 'Sobre a 4U'; }, []);

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <CabecalhoPublico />

      <main id="conteudo" className="container sobre" tabIndex={-1}>
        <img className="sobre__imagem" src={imagemSobre} alt="Logotipo da 4U com a borboleta de quatro asas" width="1024" height="207" />

        <section className="card sobre__card" aria-labelledby="sobre-titulo">
          <h1 id="sobre-titulo">Sobre a 4U</h1>
          <p className="sobre__subtitulo">Acompanhando cada etapa da aprendizagem.</p>

          <p>
            A 4U é uma plataforma de acompanhamento escolar criada para aproximar escolas, professores e famílias,
            tornando a comunicação sobre o desenvolvimento dos alunos mais simples, organizada e acessível.
          </p>
          <p>
            Por meio de um ambiente digital intuitivo, os professores podem registrar o desempenho dos estudantes,
            a equipe escolar pode acompanhar e revisar essas informações e os responsáveis podem consultar os
            relatórios publicados.
          </p>
          <p>
            Acreditamos que acompanhar a educação é também uma forma de cuidar. Por isso, unimos tecnologia,
            clareza e acolhimento para fortalecer a conexão entre escola e família.
          </p>

          <ul className="sobre__pilares" aria-label="Quem usa a 4U">
            {PILARES.map((p) => (
              <li key={p.titulo} className="sobre__pilar">
                <span className={'sobre__pilar-icone ' + p.tom}><Icon nome={p.icone} /></span>
                <div>
                  <h2>{p.titulo}</h2>
                  <p>{p.texto}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="sobre__slogan">
            <strong>4U</strong> — Acompanhar de perto faz toda a diferença.
          </p>
        </section>

        <p className="sobre__acoes">
          <Link className="btn btn--secundario" to={ROTAS.ajuda}>Dúvidas frequentes</Link>
          <Link className="btn btn--primario" to={ROTAS.contato}>Fale com a gente</Link>
        </p>
      </main>

      <RodapePublico />
    </>
  );
}
