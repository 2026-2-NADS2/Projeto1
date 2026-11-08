import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { CampoAreaTexto, CampoSelect, CampoTexto } from '../components/Campo.jsx';
import CabecalhoPublico from '../components/layout/CabecalhoPublico.jsx';
import RodapePublico from '../components/layout/RodapePublico.jsx';
import api from '../services/api.js';
import useApi from '../hooks/useApi.js';
import { email as regraEmail, mascaraTelefone, minimo, obrigatorio, telefone as regraTelefone, validar } from '../utils/validacao.js';
import '../styles/pages/contato.css';

const LIMITE_MENSAGEM = 1000;

/* Assuntos do formulário (gravados em mensagem_contato.assunto) */
const ASSUNTOS = ['Dúvida sobre a plataforma', 'Primeiro acesso ou senha', 'Matrícula e cadastro', 'Sugestão', 'Outro assunto'];

const REGRAS = {
  nome: [obrigatorio('Informe seu nome.'), minimo(3, 'Informe seu nome completo.')],
  email: [obrigatorio('Informe seu e-mail para receber a resposta.'), regraEmail()],
  telefone: [regraTelefone()],
  assunto: [obrigatorio('Escolha o assunto da mensagem.')],
  mensagem: [obrigatorio('Escreva sua mensagem.'), minimo(10, 'Escreva sua mensagem com pelo menos 10 caracteres.')]
};

const VAZIO = { nome: '', email: '', telefone: '', assunto: '', mensagem: '' };

/* Cartões com o contato da escola (vem de configuracao_escola) */
function CanaisContato() {
  const { dados, erro, carregando } = useApi(() => api.contatoEscola());

  if (carregando) {
    return (
      <ul className="contato__canais" aria-busy="true" aria-label="Carregando contatos da escola">
        {[1, 2, 3].map((n) => <li key={n} className="card contato__canal"><span className="skeleton skeleton--bloco" /></li>)}
      </ul>
    );
  }
  if (erro) {
    return (
      <div className="alerta alerta--info contato__canais-erro" role="status">
        <Icon nome="info" /><p>Não foi possível carregar os contatos da escola agora. Use o formulário abaixo.</p>
      </div>
    );
  }

  const telefoneLink = 'tel:+55' + String(dados.telefone).replace(/\D/g, '');
  const canais = [
    { icone: 'local', tom: 'tom-marinho', titulo: 'Endereço', valor: dados.endereco },
    { icone: 'telefone', tom: 'tom-alerta', titulo: 'Telefone', valor: dados.telefone, link: telefoneLink },
    { icone: 'email', tom: 'tom-magenta', titulo: 'E-mail', valor: dados.email, link: 'mailto:' + dados.email }
  ];

  return (
    <ul className="contato__canais" aria-label="Canais de atendimento da escola">
      {canais.map((c) => (
        <li key={c.titulo} className="card contato__canal">
          <span className={'contato__canal-icone ' + c.tom}><Icon nome={c.icone} /></span>
          <div>
            <h2>{c.titulo}</h2>
            {c.link ? <a href={c.link}>{c.valor}</a> : <p>{c.valor}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* Página Contato: canais da escola e formulário (grava em mensagem_contato) */
export default function Contato() {
  const [valores, setValores] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);

  useEffect(() => { document.title = 'Contato — 4U'; }, []);

  function alterar(campo, valor) {
    const novos = { ...valores, [campo]: valor };
    setValores(novos);
    if (tentouEnviar) setErros(validar(novos, REGRAS));
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
      await api.enviarContato({
        nome: valores.nome.trim(),
        email: valores.email.trim(),
        telefone: valores.telefone.trim(),
        assunto: valores.assunto,
        mensagem: valores.mensagem.trim()
      });
      setValores(VAZIO);
      setTentouEnviar(false);
      setAviso({ tipo: 'sucesso', icone: 'check', texto: 'Mensagem enviada! A escola vai responder no e-mail informado.' });
    } catch (erro) {
      /* Erros de validação vindos do servidor aparecem nos campos */
      if (erro && erro.campos) setErros(erro.campos);
      setAviso({ tipo: 'erro', icone: 'erro', texto: (erro && erro.mensagem) || 'Não foi possível enviar agora. Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <CabecalhoPublico />

      <main id="conteudo" className="container contato" tabIndex={-1}>
        <h1 className="contato__titulo">Contato</h1>
        <p className="contato__subtitulo texto-secundario">Fale com a escola pelos canais abaixo ou envie uma mensagem.</p>

        <CanaisContato />

        <section className="card contato__form" aria-labelledby="form-titulo">
          <h2 id="form-titulo">Entre em contato!</h2>
          <p className="legenda">Campos com <span className="obrigatorio-legenda">*</span> são obrigatórios.</p>

          <div className="contato__aviso" aria-live="polite">
            {aviso && (
              <div className={'alerta alerta--' + aviso.tipo} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>
                <Icon nome={aviso.icone} /><p>{aviso.texto}</p>
              </div>
            )}
          </div>

          <form onSubmit={enviar} noValidate>
            <div className="form-grid">
              <CampoTexto
                id="nome" rotulo="Nome" obrigatorio autoComplete="name" placeholder="Seu nome completo"
                value={valores.nome} erro={erros.nome} maxLength={120}
                onChange={(e) => alterar('nome', e.target.value)}
              />
              <CampoTexto
                id="email" rotulo="E-mail" obrigatorio type="email" autoComplete="email" inputMode="email"
                placeholder="seu.email@exemplo.com" value={valores.email} erro={erros.email} maxLength={160}
                onChange={(e) => alterar('email', e.target.value)}
              />
              <CampoTexto
                id="telefone" rotulo="Telefone (opcional)" type="tel" inputMode="tel" autoComplete="tel"
                placeholder="(11) 91234-5678" value={valores.telefone} erro={erros.telefone}
                onChange={(e) => alterar('telefone', mascaraTelefone(e.target.value))}
              />
              <CampoSelect
                id="assunto" rotulo="Assunto" obrigatorio placeholder="Selecione o assunto"
                opcoes={ASSUNTOS.map((a) => ({ valor: a, rotulo: a }))}
                value={valores.assunto} erro={erros.assunto} onChange={(e) => alterar('assunto', e.target.value)}
              />
              <CampoAreaTexto
                id="mensagem" rotulo="Mensagem" obrigatorio inteiro placeholder="Escreva sua dúvida, sugestão ou pedido"
                ajuda={`${valores.mensagem.length} de ${LIMITE_MENSAGEM} caracteres`}
                value={valores.mensagem} erro={erros.mensagem} maxLength={LIMITE_MENSAGEM}
                onChange={(e) => alterar('mensagem', e.target.value)}
              />
            </div>

            <p className="legenda contato__lgpd">
              <Icon nome="cadeado" className="icone--inline" /> Usamos seus dados apenas para responder a esta mensagem.
            </p>

            <div className="contato__acoes">
              <button type="submit" className="btn btn--primario" disabled={enviando}>
                {enviando ? <><span className="spinner" aria-hidden="true" />Enviando…</> : <><Icon nome="enviar" />Enviar mensagem</>}
              </button>
            </div>
          </form>
        </section>
      </main>

      <RodapePublico />
    </>
  );
}
