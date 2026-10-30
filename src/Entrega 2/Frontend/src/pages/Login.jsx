import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { CampoTexto } from '../components/Campo.jsx';
import RodapePublico from '../components/layout/RodapePublico.jsx';
import LinkInativo from '../components/layout/LinkInativo.jsx';
import api from '../services/api.js';
import credenciaisDemo from '../data/mock/credenciais_demo.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { DASHBOARD_POR_PERFIL, ROTAS } from '../utils/rotas.js';
import { PERFIS } from '../utils/formatadores.js';
import { email as regraEmail, minimo, obrigatorio, validar } from '../utils/validacao.js';
import simbolo from '../assets/simbolo-4u.svg';
import '../styles/pages/login.css';

const REGRAS = {
  email: [obrigatorio('Informe seu e-mail para entrar.'), regraEmail()],
  senha: [obrigatorio('Informe sua senha.'), minimo(6, 'A senha tem pelo menos 6 caracteres. Confira o que foi digitado.')]
};

function avisoDaUrl(params) {
  if (params.get('saiu') === '1') return { tipo: 'sucesso', icone: 'check', texto: 'Você saiu da 4U com segurança.' };
  if (params.get('expirada') === '1') return { tipo: 'info', icone: 'relogio', texto: 'Sua sessão expirou por inatividade. Entre novamente para continuar.' };
  if (params.get('restrito') === '1') return { tipo: 'info', icone: 'cadeado', texto: 'Entre com seu e-mail e senha para acessar essa área.' };
  return null;
}

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [valores, setValores] = useState({ email: '', senha: '' });
  const [erros, setErros] = useState({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(() => avisoDaUrl(params));

  /* Usuário já logado vai para o painel */
  if (usuario && !enviando) return <Navigate to={DASHBOARD_POR_PERFIL[usuario.perfil]} replace />;

  function alterar(campo, valor) {
    const novos = { ...valores, [campo]: valor };
    setValores(novos);
    if (tentouEnviar) setErros(validar(novos, REGRAS));
  }

  function preencherDemo(conta) {
    const novos = { email: conta.email, senha: credenciaisDemo.senha_padrao };
    setValores(novos);
    setErros({});
    document.getElementById('botao-entrar').focus();
  }

  async function enviar(e) {
    e.preventDefault();
    setAviso(null);
    setTentouEnviar(true);
    const encontrados = validar(valores, REGRAS);
    setErros(encontrados);
    const primeiroInvalido = Object.keys(REGRAS).find((c) => encontrados[c]);
    if (primeiroInvalido) {
      document.getElementById(primeiroInvalido).focus();
      return;
    }

    setEnviando(true);
    try {
      const usuarioLogado = await api.entrar(valores.email.trim(), valores.senha);
      entrar(usuarioLogado);
      navigate(DASHBOARD_POR_PERFIL[usuarioLogado.perfil], { replace: true });
    } catch (erro) {
      setAviso({ tipo: 'erro', icone: 'erro', texto: (erro && erro.mensagem) || 'Não foi possível entrar agora. Tente novamente.' });
      setValores((v) => ({ ...v, senha: '' }));
      setEnviando(false);
      document.getElementById('senha').focus();
    }
  }

  return (
    <div className="pagina-login">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>

      <header className="login__topo container">
        <Link className="login__voltar" to={ROTAS.home}><Icon nome="chevronEsquerda" />Voltar para o início</Link>
      </header>

      <main id="conteudo" className="login" tabIndex={-1}>
        <section className="card login__card" aria-labelledby="login-titulo">
          <div className="login__cabecalho">
            <img src={simbolo} alt="" width="64" height="42" />
            <div>
              <h1 id="login-titulo">Entrar na 4U</h1>
              <p className="texto-secundario">Acompanhamento escolar para escola, professores e famílias.</p>
            </div>
          </div>

          <div className="login__aviso" aria-live="polite">
            {aviso && (
              <div className={'alerta alerta--' + aviso.tipo} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>
                <Icon nome={aviso.icone} /><p>{aviso.texto}</p>
              </div>
            )}
          </div>

          <form onSubmit={enviar} noValidate>
            <CampoTexto
              id="email" rotulo="E-mail" obrigatorio type="email" autoComplete="username" inputMode="email"
              placeholder="seu.email@escola.com" value={valores.email} erro={erros.email}
              onChange={(e) => alterar('email', e.target.value)}
              onBlur={() => tentouEnviar || valores.email ? setErros(validar(valores, REGRAS)) : null}
            />

            <div className={'campo' + (erros.senha ? ' campo--invalido' : '')}>
              <label className="campo__label" htmlFor="senha">Senha<span className="obrigatorio" aria-hidden="true">*</span></label>
              <div className="campo-senha">
                <input
                  className="campo__input" type={mostrarSenha ? 'text' : 'password'} id="senha" autoComplete="current-password"
                  placeholder="Sua senha" aria-required="true" aria-invalid={erros.senha ? true : undefined} aria-describedby="senha-erro"
                  value={valores.senha} onChange={(e) => alterar('senha', e.target.value)}
                />
                <button
                  type="button" className="campo-senha__alternar" aria-pressed={mostrarSenha}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setMostrarSenha(!mostrarSenha)}
                >
                  <Icon nome={mostrarSenha ? 'olhoFechado' : 'olho'} />
                </button>
              </div>
              <span className="campo__erro" id="senha-erro">
                {erros.senha && <><Icon nome="erro" /><span>{erros.senha}</span></>}
              </span>
            </div>

            <button type="submit" className="btn btn--primario btn--bloco" id="botao-entrar" disabled={enviando}>
              {enviando ? <><span className="spinner" aria-hidden="true" />Entrando…</> : 'Entrar'}
            </button>
          </form>

          <p className="login__esqueci"><LinkInativo>Esqueci minha senha</LinkInativo></p>
          <p className="legenda login__primeiro-acesso">
            Primeiro acesso? O convite para criar sua senha é enviado pela escola para o e-mail cadastrado.
          </p>
        </section>

        <aside className="login__demo" aria-labelledby="demo-titulo">
          <h2 id="demo-titulo"><Icon nome="info" />Contas de demonstração</h2>
          <p>Dados fictícios. Clique em um perfil para preencher o formulário.</p>
          <ul className="login__demo-lista">
            {credenciaisDemo.contas.map((conta) => (
              <li key={conta.email}>
                <button type="button" className="login__demo-conta" onClick={() => preencherDemo(conta)}>
                  <strong>{PERFIS[conta.perfil]}</strong>
                  <span>{conta.email}</span>
                </button>
              </li>
            ))}
            <li className="legenda">Senha para todas: <code>{credenciaisDemo.senha_padrao}</code></li>
          </ul>
        </aside>
      </main>

      <RodapePublico />
    </div>
  );
}
