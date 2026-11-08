import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import CampoSenha, { RegrasSenha, senhaValida } from '../components/CampoSenha.jsx';
import RodapePublico from '../components/layout/RodapePublico.jsx';
import useApi from '../hooks/useApi.js';
import api from '../services/api.js';
import { ROTAS } from '../utils/rotas.js';
import { primeiroNome } from '../utils/formatadores.js';
import simbolo from '../assets/simbolo-4u.svg';
import '../styles/pages/login.css';

/* Primeiro acesso (convite da escola) ou nova senha (esqueci minha senha): o link de uso único traz o token */
export default function DefinirSenha() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const link = useApi(() => api.verificarLink(token), [token]);
  const [valores, setValores] = useState({ senha: '', confirmacao: '' });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(null);
  const [aviso, setAviso] = useState(null);

  const primeiroAcesso = link.dados && link.dados.tipo === 'PRIMEIRO_ACESSO';
  useEffect(() => { document.title = (primeiroAcesso ? 'Criar senha' : 'Nova senha') + ' — 4U'; }, [primeiroAcesso]);

  function alterar(campo, valor) {
    setValores((v) => ({ ...v, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: null }));
  }

  async function enviar(e) {
    e.preventDefault();
    setAviso(null);
    const encontrados = {};
    if (!senhaValida(valores.senha)) encontrados.senha = 'Use pelo menos 8 caracteres, com letras e números.';
    if (!valores.confirmacao) encontrados.confirmacao = 'Repita a senha.';
    else if (valores.confirmacao !== valores.senha) encontrados.confirmacao = 'As senhas não são iguais.';
    setErros(encontrados);
    const primeiro = ['senha', 'confirmacao'].find((c) => encontrados[c]);
    if (primeiro) { document.getElementById(primeiro).focus(); return; }

    setEnviando(true);
    try {
      setConcluido(await api.definirSenha({ token, ...valores }));
    } catch (erro) {
      if (erro && erro.campos) setErros(erro.campos);
      setAviso((erro && erro.mensagem) || 'Não foi possível salvar a senha. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  let conteudo;
  if (link.carregando) {
    conteudo = <p className="legenda" aria-busy="true"><span className="spinner" aria-hidden="true" /> Conferindo o link…</p>;
  } else if (link.erro || !token) {
    conteudo = (
      <div className="estado estado--erro" role="alert">
        <div className="estado__icone"><Icon nome="alerta" /></div>
        <p className="estado__titulo">Link inválido</p>
        <p>{(link.erro && link.erro.mensagem) || 'Este link está incompleto.'}</p>
        <Link className="btn btn--secundario btn--sm" to={ROTAS.esqueciSenha}>Pedir um novo link</Link>
        <Link className="legenda" to={ROTAS.contato}>Primeiro acesso? Peça um novo convite à escola</Link>
      </div>
    );
  } else if (concluido) {
    conteudo = (
      <div role="status">
        <div className="alerta alerta--sucesso"><Icon nome="check" /><p>{concluido.mensagem}</p></div>
        <Link className="btn btn--primario btn--bloco" style={{ marginTop: 16 }}
          to={ROTAS.login + '?senha=1&email=' + encodeURIComponent(link.dados.email)}>
          Entrar na 4U
        </Link>
      </div>
    );
  } else {
    conteudo = (
      <>
        <p>
          Olá, <strong>{primeiroNome(link.dados.nome)}</strong>! {primeiroAcesso
            ? 'A escola liberou o seu acesso. Crie uma senha para entrar.'
            : 'Crie uma nova senha para a sua conta.'}
        </p>
        <p className="legenda">Conta: {link.dados.email}</p>
        <div className="login__aviso" aria-live="polite">
          {aviso && <div className="alerta alerta--erro" role="alert"><Icon nome="erro" /><p>{aviso}</p></div>}
        </div>
        <form onSubmit={enviar} noValidate>
          <input type="email" autoComplete="username" value={link.dados.email} readOnly hidden />
          <CampoSenha id="senha" rotulo="Nova senha" autoComplete="new-password" value={valores.senha} erro={erros.senha}
            onChange={(e) => alterar('senha', e.target.value)} />
          <RegrasSenha senha={valores.senha} />
          <CampoSenha id="confirmacao" rotulo="Repita a senha" autoComplete="new-password" value={valores.confirmacao}
            erro={erros.confirmacao} onChange={(e) => alterar('confirmacao', e.target.value)} />
          <button type="submit" className="btn btn--primario btn--bloco" disabled={enviando}>
            {enviando ? <><span className="spinner" aria-hidden="true" />Salvando…</> : (primeiroAcesso ? 'Criar senha' : 'Salvar nova senha')}
          </button>
        </form>
      </>
    );
  }

  return (
    <div className="pagina-login">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="login__topo container">
        <Link className="login__voltar" to={ROTAS.login}><Icon nome="chevronEsquerda" />Voltar para a entrada</Link>
      </header>

      <main id="conteudo" className="login" tabIndex={-1}>
        <section className="card login__card" aria-labelledby="senha-titulo">
          <div className="login__cabecalho">
            <img src={simbolo} alt="" width="64" height="42" />
            <div>
              <h1 id="senha-titulo">{primeiroAcesso ? 'Criar sua senha' : 'Nova senha'}</h1>
              <p className="texto-secundario">{primeiroAcesso ? 'Primeiro acesso à 4U.' : 'O link vale por 30 minutos e só pode ser usado uma vez.'}</p>
            </div>
          </div>
          <div aria-live="polite">{conteudo}</div>
        </section>
      </main>

      <RodapePublico />
    </div>
  );
}
