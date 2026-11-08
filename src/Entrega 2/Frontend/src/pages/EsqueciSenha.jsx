import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { CampoTexto } from '../components/Campo.jsx';
import RodapePublico from '../components/layout/RodapePublico.jsx';
import api from '../services/api.js';
import { ROTAS } from '../utils/rotas.js';
import { email as regraEmail, obrigatorio, validar } from '../utils/validacao.js';
import simbolo from '../assets/simbolo-4u.svg';
import '../styles/pages/login.css';

const REGRAS = { email: [obrigatorio('Informe o e-mail cadastrado na escola.'), regraEmail()] };

/* Esqueci minha senha: só quem já tem login liberado recebe o e-mail com o link (válido por 30 minutos) */
export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [resposta, setResposta] = useState(null);
  const [aviso, setAviso] = useState(null);

  useEffect(() => { document.title = 'Esqueci minha senha — 4U'; }, []);

  async function enviar(e) {
    e.preventDefault();
    setAviso(null);
    const encontrados = validar({ email }, REGRAS);
    setErros(encontrados);
    if (encontrados.email) { document.getElementById('email').focus(); return; }

    setEnviando(true);
    try {
      setResposta(await api.esqueciSenha(email.trim()));
    } catch (erro) {
      if (erro && erro.campos) setErros(erro.campos);
      setAviso((erro && erro.mensagem) || 'Não foi possível enviar agora. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagina-login">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="login__topo container">
        <Link className="login__voltar" to={ROTAS.login}><Icon nome="chevronEsquerda" />Voltar para a entrada</Link>
      </header>

      <main id="conteudo" className="login" tabIndex={-1}>
        <section className="card login__card" aria-labelledby="esqueci-titulo">
          <div className="login__cabecalho">
            <img src={simbolo} alt="" width="64" height="42" />
            <div>
              <h1 id="esqueci-titulo">Esqueci minha senha</h1>
              <p className="texto-secundario">Informe o e-mail cadastrado. Vamos enviar um link para você criar uma nova senha.</p>
            </div>
          </div>

          {resposta ? (
            <div aria-live="polite">
              <div className="alerta alerta--sucesso" role="status"><Icon nome="check" /><p>{resposta.mensagem}</p></div>
              <p className="login__esqueci"><Link to={ROTAS.login}>Voltar para a entrada</Link></p>
            </div>
          ) : (
            <>
              <div className="login__aviso" aria-live="polite">
                {aviso && <div className="alerta alerta--erro" role="alert"><Icon nome="erro" /><p>{aviso}</p></div>}
              </div>
              <form onSubmit={enviar} noValidate>
                <CampoTexto
                  id="email" rotulo="E-mail" obrigatorio type="email" autoComplete="username" inputMode="email"
                  placeholder="seu.email@escola.com" value={email} erro={erros.email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="btn btn--primario btn--bloco" disabled={enviando}>
                  {enviando ? <><span className="spinner" aria-hidden="true" />Enviando…</> : 'Enviar link'}
                </button>
              </form>
              <p className="legenda login__primeiro-acesso" style={{ marginTop: 16 }}>
                Ainda não tem senha? O acesso é liberado pela escola. <Link to={ROTAS.contato}>Fale com a secretaria</Link>.
              </p>
            </>
          )}
        </section>
      </main>

      <RodapePublico />
    </div>
  );
}
