import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import Modal from '../../components/Modal.jsx';
import Paginacao from '../../components/Paginacao.jsx';
import BuscaAluno from '../../components/BuscaAluno.jsx';
import LinkDemonstracao from '../../components/LinkDemonstracao.jsx';
import { CampoSelect, CampoTexto } from '../../components/Campo.jsx';
import { Avatar, Situacao, SituacaoAcesso } from '../../components/Elementos.jsx';
import { Carregando, ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import config from '../../config.js';
import { ROTAS } from '../../utils/rotas.js';
import { formatarData, formatarDataHora, plural } from '../../utils/formatadores.js';
import {
  dataNascimento, email, mascaraData, mascaraTelefone, minimo, obrigatorio, padrao, telefone, validar
} from '../../utils/validacao.js';
import '../../styles/pages/cadastros.css';

const REGEX_NOME = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
const regrasNome = (quem) => [
  obrigatorio(`Informe o nome completo do ${quem}.`),
  minimo(3),
  padrao(REGEX_NOME, 'Use apenas letras, espaços, hífen ou apóstrofo.')
];

/* Parentesco (ENUM de aluno_responsavel) */
const PARENTESCOS = [
  { valor: 'MAE', rotulo: 'Mãe' }, { valor: 'PAI', rotulo: 'Pai' }, { valor: 'AVO', rotulo: 'Avó ou avô' },
  { valor: 'TUTOR', rotulo: 'Tutor(a) legal' }, { valor: 'OUTRO', rotulo: 'Outro' }
];
const rotuloParentesco = (v) => (PARENTESCOS.find((p) => p.valor === v) || {}).rotulo || v;

/* Configuração de cada aba */
const ENTIDADES = {
  alunos: {
    rotuloAba: 'Alunos',
    singular: 'aluno',
    novo: 'Novo aluno',
    vazio: 'Nenhum aluno cadastrado',
    colunas: ['Aluno', 'Matrícula', 'Turma', 'Responsável', 'Situação'],
    celulas: (a) => (
      <>
        <td className="td-principal">
          <div className="celula-pessoa"><Avatar nome={a.nome} /><span>{a.nome}<small>Nasc. {formatarData(a.data_nascimento)}</small></span></div>
        </td>
        <td data-label="Matrícula">{a.matricula}</td>
        <td data-label="Turma">{a.turma || <span className="texto-secundario">Sem turma</span>}</td>
        <td data-label="Responsável">
          {a.responsavel ? (
            <span className="celula-dupla">{a.responsavel.nome}
              <small>{rotuloParentesco(a.responsavel.parentesco)}{a.total_responsaveis > 1 ? ` · +${a.total_responsaveis - 1}` : ''}</small>
            </span>
          ) : <span className="sem-vinculo"><Icon nome="erro" className="icone--inline" /> Sem vínculo</span>}
        </td>
        <td data-label="Situação"><Situacao ativo={a.ativo} /></td>
      </>
    ),
    valoresIniciais: { nome: '', data_nascimento: '', matricula: '', turma_id: '' },
    regras: {
      nome: regrasNome('aluno'),
      data_nascimento: [obrigatorio('Informe a data de nascimento.'), dataNascimento()],
      matricula: [obrigatorio('Informe a matrícula do aluno.'), padrao(/^\d{4,12}$/, 'A matrícula deve ter de 4 a 12 números, sem letras ou espaços.')],
      turma_id: [obrigatorio('Selecione a turma do aluno.')]
    },
    aviso: 'Alunos não acessam a 4U: quem acessa é o responsável vinculado. Assim a plataforma guarda o mínimo de dados de menores (LGPD).'
  },
  professores: {
    rotuloAba: 'Professores',
    singular: 'professor',
    novo: 'Novo professor',
    vazio: 'Nenhum professor cadastrado',
    colunas: ['Professor', 'Registro funcional', 'Disciplinas', 'Acesso'],
    celulas: (p) => (
      <>
        <td className="td-principal">
          <div className="celula-pessoa"><Avatar nome={p.nome} /><span>{p.nome}<small>{p.email}</small></span></div>
        </td>
        <td data-label="Registro funcional">{p.registro_funcional}</td>
        <td data-label="Disciplinas">{p.disciplinas.length ? p.disciplinas.join(', ') : <span className="texto-secundario">Sem turma</span>}</td>
        <td data-label="Acesso"><SituacaoAcesso acesso={p.acesso} /></td>
      </>
    ),
    valoresIniciais: { nome: '', email: '', registro_funcional: '' },
    regras: {
      nome: regrasNome('professor'),
      email: [obrigatorio('Informe o e-mail do professor.'), email()],
      registro_funcional: [obrigatorio('Informe o registro funcional.'), padrao(/^\d{6}$/, 'O registro funcional tem 6 números, sem letras (ex.: 102310).')]
    },
    aviso: 'Depois de cadastrar, use "Liberar acesso": o professor recebe por e-mail o link para criar a própria senha.'
  },
  responsaveis: {
    rotuloAba: 'Responsáveis',
    singular: 'responsável',
    novo: 'Novo responsável',
    vazio: 'Nenhum responsável cadastrado',
    colunas: ['Responsável', 'Telefone', 'Alunos vinculados', 'Acesso'],
    celulas: (r) => (
      <>
        <td className="td-principal">
          <div className="celula-pessoa"><Avatar nome={r.nome} /><span>{r.nome}<small>{r.email}</small></span></div>
        </td>
        <td data-label="Telefone">{r.telefone}</td>
        <td data-label="Alunos vinculados">{r.alunos.length ? r.alunos.join(', ') : <span className="texto-secundario">Nenhum</span>}</td>
        <td data-label="Acesso"><SituacaoAcesso acesso={r.acesso} /></td>
      </>
    ),
    valoresIniciais: { nome: '', email: '', telefone: '', aluno: null, parentesco: 'MAE' },
    regras: {
      nome: regrasNome('responsável'),
      email: [obrigatorio('Informe o e-mail do responsável.'), email()],
      telefone: [obrigatorio('Informe um telefone para contato.'), telefone()]
    },
    /* No cadastro novo, o responsável já sai com um aluno vinculado (obrigatório) */
    regrasNovo: {
      aluno: [(v) => (v ? null : 'Escolha o aluno vinculado a este responsável.')],
      parentesco: [obrigatorio('Escolha o parentesco.')]
    },
    aviso: 'Depois de cadastrar, use "Liberar acesso": o responsável recebe por e-mail o link para criar a própria senha.'
  }
};

const ORDEM_ABAS = ['alunos', 'professores', 'responsaveis'];

/* 'aaaa-mm-dd' do banco -> 'dd/mm/aaaa' do formulário */
const dataBr = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');

/* Foco no primeiro campo com erro */
function focarErro(form) {
  setTimeout(() => {
    const alvo = form.querySelector('[aria-invalid="true"]');
    if (alvo) alvo.focus();
  }, 0);
}

/* Campos do formulário */
function CamposFormulario({ entidade, valores, erros, alterar, turmas, novo = false }) {
  const comuns = (
    <CampoTexto id="f-nome" rotulo="Nome completo" obrigatorio inteiro maxLength={120} autoComplete="off"
      value={valores.nome} erro={erros.nome} onChange={(e) => alterar('nome', e.target.value)} />
  );

  if (entidade === 'alunos') {
    return (
      <>
        {comuns}
        <CampoTexto id="f-nascimento" rotulo="Data de nascimento" obrigatorio inputMode="numeric" placeholder="dd/mm/aaaa"
          maxLength={10} ajuda="Digite só os números; as barras entram sozinhas." value={valores.data_nascimento}
          erro={erros.data_nascimento} onChange={(e) => alterar('data_nascimento', mascaraData(e.target.value))} />
        <CampoTexto id="f-matricula" rotulo="Matrícula" obrigatorio inputMode="numeric" maxLength={12} ajuda="Somente números."
          value={valores.matricula} erro={erros.matricula} onChange={(e) => alterar('matricula', e.target.value)} />
        <CampoSelect id="f-turma" rotulo={'Turma' + (turmas.length ? ` (ano letivo ${turmas[0].ano_letivo})` : '')}
          obrigatorio inteiro placeholder="Selecione a turma" ajuda="Cada aluno fica em uma única turma por ano letivo."
          opcoes={turmas.map((t) => ({ valor: t.id, rotulo: t.nome }))}
          value={valores.turma_id} erro={erros.turma_id} onChange={(e) => alterar('turma_id', e.target.value)} />
      </>
    );
  }

  return (
    <>
      {comuns}
      <CampoTexto id="f-email" rotulo="E-mail" obrigatorio type="email" autoComplete="off"
        inteiro={entidade === 'professores'} ajuda="Usado para entrar na 4U."
        value={valores.email} erro={erros.email} onChange={(e) => alterar('email', e.target.value)} />
      {entidade === 'professores' ? (
        <CampoTexto id="f-registro" rotulo="Registro funcional" obrigatorio inputMode="numeric"
          placeholder="000000" ajuda="6 números, sem letras. Ex.: 102310"
          value={valores.registro_funcional} erro={erros.registro_funcional}
          onChange={(e) => alterar('registro_funcional', e.target.value.replace(/\D/g, '').slice(0, 6))} />
      ) : (
        <CampoTexto id="f-telefone" rotulo="Telefone" obrigatorio type="tel" inputMode="tel" placeholder="(11) 91234-5678"
          value={valores.telefone} erro={erros.telefone} onChange={(e) => alterar('telefone', mascaraTelefone(e.target.value))} />
      )}
      {entidade === 'responsaveis' && novo && (
        <>
          <BuscaAluno id="f-aluno" rotulo="Aluno vinculado" obrigatorio selecionado={valores.aluno}
            aoSelecionar={(a) => alterar('aluno', a)} erro={erros.aluno || erros.aluno_id} />
          <CampoSelect id="f-parentesco" rotulo="Parentesco" obrigatorio inteiro opcoes={PARENTESCOS}
            value={valores.parentesco} erro={erros.parentesco} onChange={(e) => alterar('parentesco', e.target.value)} />
        </>
      )}
    </>
  );
}

/* Dados enviados para a API (o responsável leva o id do aluno escolhido) */
function paraApi(entidade, valores) {
  if (entidade !== 'responsaveis') return valores;
  const { aluno, ...resto } = valores;
  return { ...resto, aluno_id: aluno ? aluno.id : null };
}

/* Formulário de novo cadastro */
function FormularioNovo({ entidade, turmas, aoFechar, aoSalvar }) {
  const cfg = ENTIDADES[entidade];
  const regras = { ...cfg.regras, ...(cfg.regrasNovo || {}) };
  const { mostrar } = useToast();
  const [valores, setValores] = useState(cfg.valoresIniciais);
  const [erros, setErros] = useState({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function alterar(campo, valor) {
    const novos = { ...valores, [campo]: valor };
    setValores(novos);
    if (tentouEnviar) setErros(validar(novos, regras));
  }

  async function enviar(e) {
    e.preventDefault();
    setTentouEnviar(true);
    const encontrados = validar(valores, regras);
    setErros(encontrados);
    const form = e.currentTarget;
    if (Object.keys(encontrados).length) {
      focarErro(form);
      return;
    }

    /* Grava no banco pela API (rota protegida: só administrador) */
    setEnviando(true);
    try {
      const resposta = await api.cadastrar(entidade, paraApi(entidade, valores));
      aoSalvar(resposta.dados);
      mostrar({ tipo: 'sucesso', titulo: 'Cadastro realizado', mensagem: (resposta && resposta.mensagem) || 'Os dados foram salvos.' });
    } catch (erro) {
      /* Erros de validação do servidor (ex.: e-mail já cadastrado) aparecem no campo */
      if (erro && erro.campos) {
        setErros(erro.campos);
        focarErro(form);
      }
      mostrar({ tipo: 'erro', titulo: 'Não foi possível cadastrar', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo={cfg.novo}
      descricao="Campos marcados com * são obrigatórios."
      aoFechar={aoFechar}
      rodape={(
        <>
          <button type="button" className="btn btn--fantasma" onClick={aoFechar}>Cancelar</button>
          <button type="submit" form="form-cadastro" className="btn btn--primario" disabled={enviando}>
            {enviando ? <><span className="spinner" aria-hidden="true" />Salvando…</> : <><Icon nome="check" />Cadastrar</>}
          </button>
        </>
      )}
    >
      <div className="alerta alerta--info" style={{ marginBottom: 16 }}>
        <Icon nome="info" /><p>{cfg.aviso}</p>
      </div>
      <form id="form-cadastro" className="form-grid" noValidate onSubmit={enviar}>
        <CamposFormulario entidade={entidade} valores={valores} erros={erros} alterar={alterar} turmas={turmas} novo />
      </form>
    </Modal>
  );
}

/* Dados do cadastro (edição) */
function SecaoDados({ entidade, dados, turmas, aoSalvar }) {
  const cfg = ENTIDADES[entidade];
  const { mostrar } = useToast();
  const [valores, setValores] = useState(() => (entidade === 'alunos'
    ? { nome: dados.nome, data_nascimento: dataBr(dados.data_nascimento), matricula: dados.matricula, turma_id: dados.turma_id ? String(dados.turma_id) : '' }
    : entidade === 'professores'
      ? { nome: dados.nome, email: dados.email, registro_funcional: dados.registro_funcional }
      : { nome: dados.nome, email: dados.email, telefone: dados.telefone || '' }));
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  function alterar(campo, valor) {
    setValores((v) => ({ ...v, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: null }));
  }

  async function salvar(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const encontrados = validar(valores, cfg.regras);
    setErros(encontrados);
    if (Object.keys(encontrados).length) { focarErro(form); return; }
    setEnviando(true);
    try {
      const r = await api.editarCadastro(entidade, dados.id, valores);
      mostrar({ tipo: 'sucesso', titulo: 'Cadastro atualizado', mensagem: r.mensagem });
      aoSalvar();
    } catch (erro) {
      if (erro && erro.campos) { setErros(erro.campos); focarErro(form); }
      mostrar({ tipo: 'erro', titulo: 'Não foi possível salvar', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="gerenciar__secao" aria-labelledby="sec-dados">
      <h3 id="sec-dados">Dados do cadastro</h3>
      <form className="form-grid" noValidate onSubmit={salvar}>
        <CamposFormulario entidade={entidade} valores={valores} erros={erros} alterar={alterar} turmas={turmas} />
        <div className="gerenciar__acoes campo--inteiro">
          <button type="submit" className="btn btn--secundario btn--sm" disabled={enviando}>
            {enviando ? <><span className="spinner" aria-hidden="true" />Salvando…</> : <><Icon nome="check" />Salvar alterações</>}
          </button>
        </div>
      </form>
    </section>
  );
}

/* Acesso à 4U: liberar (convite de primeiro acesso), desativar e reativar */
function SecaoAcesso({ entidade, dados, aoMudar }) {
  const { mostrar } = useToast();
  const [convite, setConvite] = useState(null);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const nome = dados.nome.split(' ')[0];

  async function executar(acao) {
    setEnviando(true);
    try {
      const r = await acao();
      mostrar({ tipo: 'sucesso', mensagem: r.mensagem });
      return r;
    } catch (erro) {
      mostrar({ tipo: 'erro', titulo: 'Não foi possível concluir', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
      return null;
    } finally {
      setEnviando(false);
      setConfirmar(false);
    }
  }

  async function liberar() {
    const r = await executar(() => api.liberarAcesso(entidade, dados.id));
    if (r) { setConvite(r); aoMudar(); }
  }

  async function alterarSituacao(ativo) {
    const r = await executar(() => api.alterarSituacao(entidade, dados.id, ativo));
    if (r) { setConvite(null); aoMudar(); }
  }

  const TEXTOS = {
    LIBERADO: `${nome} já criou a senha e entra na 4U com o e-mail ${dados.email}.`,
    PENDENTE: dados.convite_ate
      ? `Acesso liberado. ${nome} ainda não criou a senha. O link vale até ${formatarDataHora(dados.convite_ate)}.`
      : `${nome} ainda não pode entrar. Libere o acesso para enviar o convite ao e-mail ${dados.email}.`,
    DESATIVADO: `O acesso está bloqueado: ${nome} não consegue entrar, mesmo com a senha certa.`
  };

  return (
    <section className="gerenciar__secao" aria-labelledby="sec-acesso">
      <h3 id="sec-acesso">Acesso à 4U</h3>
      <div className="gerenciar__linha">
        <SituacaoAcesso acesso={dados.acesso} />
        <p className="legenda">{TEXTOS[dados.acesso]}</p>
      </div>

      {convite && convite.email_enviado && (
        <div className="alerta alerta--sucesso" role="status"><Icon nome="email" /><p>{convite.mensagem} Peça para conferir também a caixa de spam.</p></div>
      )}
      {convite && convite.token_demonstracao && <LinkDemonstracao token={convite.token_demonstracao} titulo={`Link de primeiro acesso de ${nome}`} />}

      {confirmar ? (
        <div className="confirmacao-inline" role="alertdialog" aria-labelledby="conf-desativar">
          <p id="conf-desativar"><strong>Desativar o acesso de {nome}?</strong> A pessoa sai da 4U na hora e não consegue entrar de novo até ser reativada. O histórico continua salvo.</p>
          <div className="gerenciar__acoes">
            <button type="button" className="btn btn--fantasma btn--sm" onClick={() => setConfirmar(false)}>Cancelar</button>
            <button type="button" className="btn btn--perigo btn--sm" disabled={enviando} onClick={() => alterarSituacao(false)}>
              <Icon nome="desligar" />Desativar acesso
            </button>
          </div>
        </div>
      ) : (
        <div className="gerenciar__acoes gerenciar__acoes--inicio">
          {dados.acesso === 'PENDENTE' && (
            <button type="button" className="btn btn--primario btn--sm" disabled={enviando} onClick={liberar}>
              <Icon nome="enviar" />{dados.convite_ate ? 'Reenviar convite' : 'Liberar acesso'}
            </button>
          )}
          {dados.acesso === 'DESATIVADO' ? (
            <button type="button" className="btn btn--secundario btn--sm" disabled={enviando} onClick={() => alterarSituacao(true)}>
              <Icon nome="ativar" />Reativar acesso
            </button>
          ) : (
            <button type="button" className="btn btn--fantasma btn--sm" onClick={() => setConfirmar(true)}>
              <Icon nome="desligar" />Desativar acesso
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* Aluno: ativo ou desativado (desativado some das listas dos professores) */
function SecaoSituacaoAluno({ dados, aoMudar }) {
  const { mostrar } = useToast();
  const [enviando, setEnviando] = useState(false);

  async function alterar(ativo) {
    setEnviando(true);
    try {
      const r = await api.alterarSituacao('alunos', dados.id, ativo);
      mostrar({ tipo: 'sucesso', mensagem: r.mensagem });
      aoMudar();
    } catch (erro) {
      mostrar({ tipo: 'erro', titulo: 'Não foi possível concluir', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="gerenciar__secao" aria-labelledby="sec-situacao">
      <h3 id="sec-situacao">Situação</h3>
      <div className="gerenciar__linha">
        <Situacao ativo={dados.ativo} />
        <p className="legenda">{dados.ativo ? 'Aparece para os professores da turma.' : 'Não aparece mais para os professores. O histórico continua salvo.'}</p>
      </div>
      <div className="gerenciar__acoes gerenciar__acoes--inicio">
        <button type="button" className={'btn btn--sm ' + (dados.ativo ? 'btn--fantasma' : 'btn--secundario')} disabled={enviando}
          onClick={() => alterar(!dados.ativo)}>
          <Icon nome={dados.ativo ? 'desligar' : 'ativar'} />{dados.ativo ? 'Desativar aluno' : 'Reativar aluno'}
        </button>
      </div>
      {dados.responsaveis.length > 0 && (
        <>
          <h3 className="gerenciar__subtitulo">Responsáveis</h3>
          <ul className="lista-simples">
            {dados.responsaveis.map((r) => (
              <li key={r.id}>
                <span>{r.nome}<small>{rotuloParentesco(r.parentesco)} · {r.email}</small></span>
                {!r.autorizado && <span className="situacao situacao--inativo">Sem acesso aos relatórios</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/* Professor: turmas e disciplinas que leciona (vinculo_docente) */
function SecaoTurmas({ dados, turmas, aoMudar }) {
  const { mostrar } = useToast();
  const disciplinas = useApi(api.listarDisciplinas);
  const [novo, setNovo] = useState({ turma_id: '', disciplina_id: '' });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function atribuir(e) {
    e.preventDefault();
    const encontrados = {};
    if (!novo.turma_id) encontrados.turma_id = 'Escolha a turma.';
    if (!novo.disciplina_id) encontrados.disciplina_id = 'Escolha a disciplina.';
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      const r = await api.atribuirTurma(dados.id, novo);
      mostrar({ tipo: 'sucesso', mensagem: r.mensagem });
      setNovo({ turma_id: '', disciplina_id: '' });
      aoMudar();
    } catch (erro) {
      if (erro && erro.campos) setErros(erro.campos);
      mostrar({ tipo: 'erro', titulo: 'Não foi possível atribuir', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  async function remover(v) {
    try {
      const r = await api.removerTurma(dados.id, v.id);
      mostrar({ tipo: 'sucesso', mensagem: r.mensagem });
      aoMudar();
    } catch (erro) {
      mostrar({ tipo: 'erro', titulo: 'Não foi possível remover', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
    }
  }

  return (
    <section className="gerenciar__secao" aria-labelledby="sec-turmas">
      <h3 id="sec-turmas">Turmas e disciplinas</h3>
      {dados.vinculos.length ? (
        <ul className="lista-simples">
          {dados.vinculos.map((v) => (
            <li key={v.id}>
              <span>{v.turma}<small>{v.disciplina}</small></span>
              <button type="button" className="btn btn--fantasma btn--sm" aria-label={`Remover ${v.disciplina} do ${v.turma}`} onClick={() => remover(v)}>
                <Icon nome="fechar" />Remover
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="legenda">Ainda sem turma. O professor só registra acompanhamentos das turmas atribuídas aqui.</p>}

      <form className="gerenciar__adicionar" noValidate onSubmit={atribuir}>
        <CampoSelect id="v-turma" rotulo="Turma" opcoes={turmas.map((t) => ({ valor: t.id, rotulo: t.nome }))}
          value={novo.turma_id} erro={erros.turma_id} onChange={(e) => setNovo({ ...novo, turma_id: e.target.value })} />
        <CampoSelect id="v-disciplina" rotulo="Disciplina" opcoes={(disciplinas.dados || []).map((d) => ({ valor: d.id, rotulo: d.nome }))}
          value={novo.disciplina_id} erro={erros.disciplina_id} onChange={(e) => setNovo({ ...novo, disciplina_id: e.target.value })} />
        <button type="submit" className="btn btn--secundario btn--sm" disabled={enviando}><Icon nome="mais" />Atribuir</button>
      </form>
      <p className="legenda">Cada disciplina de uma turma tem um só professor: atribuir aqui tira a turma de quem dava a aula antes.</p>
    </section>
  );
}

/* Responsável: alunos vinculados e autorização (LGPD) */
function SecaoAlunos({ dados, aoMudar }) {
  const { mostrar } = useToast();
  const [aluno, setAluno] = useState(null);
  const [parentesco, setParentesco] = useState('MAE');
  const [enviando, setEnviando] = useState(false);

  async function executar(acao, depois) {
    setEnviando(true);
    try {
      const r = await acao();
      mostrar({ tipo: 'sucesso', mensagem: r.mensagem });
      if (depois) depois();
      aoMudar();
    } catch (erro) {
      mostrar({ tipo: 'erro', titulo: 'Não foi possível concluir', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  const vincular = (e) => {
    e.preventDefault();
    if (!aluno) return;
    executar(() => api.vincularAluno(dados.id, { aluno_id: aluno.id, parentesco, autorizado: true }), () => setAluno(null));
  };

  return (
    <section className="gerenciar__secao" aria-labelledby="sec-alunos">
      <h3 id="sec-alunos">Alunos vinculados</h3>
      {dados.alunos.length ? (
        <ul className="lista-simples">
          {dados.alunos.map((a) => (
            <li key={a.id}>
              <span>{a.nome}<small>{rotuloParentesco(a.parentesco)} · {a.turma || 'Sem turma'}{!a.autorizado && ' · sem acesso aos relatórios'}</small></span>
              <span className="lista-simples__acoes">
                <button type="button" className="btn btn--fantasma btn--sm" disabled={enviando}
                  onClick={() => executar(() => api.vincularAluno(dados.id, { aluno_id: a.id, parentesco: a.parentesco, autorizado: !a.autorizado }))}>
                  <Icon nome={a.autorizado ? 'cadeado' : 'ativar'} />{a.autorizado ? 'Bloquear relatórios' : 'Autorizar relatórios'}
                </button>
                <button type="button" className="btn btn--fantasma btn--sm" disabled={enviando || dados.alunos.length === 1} aria-label={`Desvincular ${a.nome}`}
                  onClick={() => executar(() => api.desvincularAluno(dados.id, a.id))}>
                  <Icon nome="fechar" />Desvincular
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="legenda">Nenhum aluno vinculado. Vincule um aluno: sem vínculo, o responsável não vê relatórios.</p>}
      {dados.alunos.length === 1 && <p className="legenda">O responsável precisa ter pelo menos um aluno: para trocar, vincule o novo aluno antes de desvincular este.</p>}

      <form className="form-grid" noValidate onSubmit={vincular}>
        <BuscaAluno id="v-aluno" rotulo="Vincular aluno" selecionado={aluno} aoSelecionar={setAluno} />
        {aluno && (
          <>
            <CampoSelect id="v-parentesco" rotulo="Parentesco" opcoes={PARENTESCOS} value={parentesco} onChange={(e) => setParentesco(e.target.value)} />
            <div className="gerenciar__acoes" style={{ alignSelf: 'center' }}>
              <button type="submit" className="btn btn--secundario btn--sm" disabled={enviando}><Icon nome="mais" />Vincular</button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}

/* Exclusão definitiva: só para cadastros sem histórico */
function SecaoExcluir({ entidade, dados, aoExcluir }) {
  const { mostrar } = useToast();
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const historico = entidade === 'alunos' ? dados.acompanhamentos
    : entidade === 'professores' ? dados.acompanhamentos : dados.ciencias;
  const impedimento = historico > 0
    ? (entidade === 'responsaveis' ? `Já deu ciência em ${plural(historico, 'relatório', 'relatórios')}.` : `Já tem ${plural(historico, 'acompanhamento', 'acompanhamentos')} registrados.`)
    : entidade === 'professores' && dados.vinculos.length ? 'Ainda tem turmas atribuídas. Remova as turmas antes.' : null;

  async function excluir() {
    setEnviando(true);
    try {
      const r = await api.excluirCadastro(entidade, dados.id);
      mostrar({ tipo: 'sucesso', mensagem: r.mensagem });
      aoExcluir();
    } catch (erro) {
      mostrar({ tipo: 'erro', titulo: 'Não foi possível excluir', mensagem: (erro && erro.mensagem) || 'Tente novamente.' });
      setEnviando(false);
      setConfirmar(false);
    }
  }

  return (
    <section className="gerenciar__secao gerenciar__secao--perigo" aria-labelledby="sec-excluir">
      <h3 id="sec-excluir">Excluir cadastro</h3>
      {impedimento ? (
        <p className="legenda"><Icon nome="cadeado" className="icone--inline" /> Não pode ser excluído: {impedimento} Para manter o histórico, use “Desativar”.</p>
      ) : confirmar ? (
        <div className="confirmacao-inline" role="alertdialog" aria-labelledby="conf-excluir">
          <p id="conf-excluir"><strong>Excluir {dados.nome} de vez?</strong> Esta ação não pode ser desfeita.</p>
          <div className="gerenciar__acoes">
            <button type="button" className="btn btn--fantasma btn--sm" onClick={() => setConfirmar(false)}>Cancelar</button>
            <button type="button" className="btn btn--perigo btn--sm" disabled={enviando} onClick={excluir}><Icon nome="cancelar" />Excluir</button>
          </div>
        </div>
      ) : (
        <>
          <p className="legenda">Ainda não há histórico ligado a este cadastro, então ele pode ser apagado.</p>
          <button type="button" className="btn btn--fantasma btn--sm gerenciar__excluir" onClick={() => setConfirmar(true)}>
            <Icon nome="cancelar" />Excluir cadastro
          </button>
        </>
      )}
    </section>
  );
}

/* Janela "Gerenciar": dados, acesso, vínculos e exclusão de um cadastro */
function ModalGerenciar({ entidade, id, turmas, aoFechar, aoMudar }) {
  const cfg = ENTIDADES[entidade];
  const [versao, setVersao] = useState(0);
  const detalhe = useApi(() => api.detalheCadastro(entidade, id), [entidade, id, versao]);
  /* Mantém os dados na tela enquanto recarrega (assim o link de convite gerado não some) */
  const [ultimo, setUltimo] = useState({ dados: null, carga: 0 });
  useEffect(() => {
    if (detalhe.dados) setUltimo((u) => ({ dados: detalhe.dados, carga: u.carga + 1 }));
  }, [detalhe.dados]);
  const d = detalhe.dados || ultimo.dados;

  /* Depois de qualquer alteração: recarrega a janela e a lista */
  function mudou() {
    setVersao((v) => v + 1);
    aoMudar();
  }

  let corpo;
  if (!d && detalhe.erro) corpo = <ErroCarregamento erro={detalhe.erro} aoTentarNovamente={detalhe.recarregar} />;
  else if (!d) corpo = <Carregando linhas={6} />;
  else {
    corpo = (
      <div className="gerenciar" aria-busy={detalhe.carregando}>
        <SecaoDados key={'dados-' + ultimo.carga} entidade={entidade} dados={d} turmas={turmas} aoSalvar={mudou} />
        {entidade === 'alunos'
          ? <SecaoSituacaoAluno dados={d} aoMudar={mudou} />
          : <SecaoAcesso key={'acesso-' + d.id} entidade={entidade} dados={d} aoMudar={mudou} />}
        {entidade === 'professores' && <SecaoTurmas dados={d} turmas={turmas} aoMudar={mudou} />}
        {entidade === 'responsaveis' && <SecaoAlunos dados={d} aoMudar={mudou} />}
        <SecaoExcluir entidade={entidade} dados={d} aoExcluir={() => { aoMudar(); aoFechar(); }} />
      </div>
    );
  }

  return (
    <Modal
      titulo={d ? d.nome : 'Carregando…'}
      descricao={`Gerenciar ${cfg.singular}`}
      aoFechar={aoFechar}
      largo
      rodape={<button type="button" className="btn btn--fantasma" onClick={aoFechar}>Fechar</button>}
    >
      {corpo}
    </Modal>
  );
}

/* Administrador: abas de alunos, professores e responsáveis */
export default function Cadastros() {
  const [params] = useSearchParams();
  const [aba, setAba] = useState(() => (ORDEM_ABAS.includes(params.get('aba')) ? params.get('aba') : 'alunos'));
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(config.ITENS_POR_PAGINA);
  const [formAberto, setFormAberto] = useState(false);
  const [gerenciando, setGerenciando] = useState(null);
  const [textoBusca, setTextoBusca] = useState(() => params.get('busca') || '');  /* Texto digitado */
  const [busca, setBusca] = useState(() => params.get('busca') || '');  /* Termo da consulta */
  const [situacao, setSituacao] = useState('todos');
  const [turmaId, setTurmaId] = useState('');  /* Só na aba de alunos */
  const [ordem, setOrdem] = useState('asc');
  const cfg = ENTIDADES[aba];

  const contagens = useApi(api.contagensCadastros);
  const turmas = useApi(api.listarTurmas);
  const lista = useApi(
    () => api.listarCadastros(aba, { busca, situacao, turmaId: aba === 'alunos' ? turmaId : '', ordem, pagina, porPagina }),
    [aba, busca, situacao, turmaId, ordem, pagina, porPagina]
  );

  useEffect(() => { document.title = 'Cadastros — 4U'; }, []);

  /* Espera 300 ms para buscar */
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusca(textoBusca.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [textoBusca]);

  function trocarAba(nova) {
    setAba(nova);
    setPagina(1);
    setTextoBusca('');
    setBusca('');
    setTurmaId('');
  }

  function limparFiltros() {
    setTextoBusca('');
    setBusca('');
    setSituacao('todos');
    setTurmaId('');
    setPagina(1);
  }

  function recarregarLista() {
    lista.recarregar();
    contagens.recarregar();
  }

  /* Setas do teclado nas abas */
  function teclarAba(e, indice) {
    let destino = null;
    if (e.key === 'ArrowRight') destino = ORDEM_ABAS[(indice + 1) % ORDEM_ABAS.length];
    if (e.key === 'ArrowLeft') destino = ORDEM_ABAS[(indice - 1 + ORDEM_ABAS.length) % ORDEM_ABAS.length];
    if (destino) {
      e.preventDefault();
      trocarAba(destino);
      document.getElementById('aba-' + destino).focus();
    }
  }

  /* Filtros ativos, mostrados como chips que podem ser removidos */
  const listaTurmas = turmas.dados || [];
  const turmaEscolhida = listaTurmas.find((t) => String(t.id) === String(turmaId));
  const ativos = [
    busca && { chave: 'busca', rotulo: `“${busca}”`, limpar: () => setTextoBusca('') },
    turmaEscolhida && { chave: 'turma', rotulo: turmaEscolhida.nome, limpar: () => { setTurmaId(''); setPagina(1); } },
    situacao !== 'todos' && { chave: 'situacao', rotulo: situacao === 'ativos' ? 'Ativos' : 'Desativados', limpar: () => { setSituacao('todos'); setPagina(1); } }
  ].filter(Boolean);

  let conteudoLista;
  if (lista.carregando) conteudoLista = <Carregando linhas={5} blocos />;
  else if (lista.erro) conteudoLista = <ErroCarregamento erro={lista.erro} aoTentarNovamente={lista.recarregar} />;
  else if (!lista.dados.itens.length && ativos.length) {
    conteudoLista = (
      <Vazio icone="buscar" titulo="Nenhum resultado para os filtros"
        mensagem="Confira a grafia do nome ou limpe os filtros para ver todos os cadastros.">
        <button type="button" className="btn btn--secundario btn--sm" onClick={limparFiltros}>Limpar filtros</button>
      </Vazio>
    );
  } else if (!lista.dados.itens.length) conteudoLista = <Vazio icone="usuarios" titulo={cfg.vazio} mensagem={`Use o botão “${cfg.novo}” para fazer o primeiro cadastro.`} />;
  else {
    conteudoLista = (
      <>
        <div className="tabela-wrapper">
          <table className="tabela tabela--responsiva">
            <caption className="sr-only">Lista de {cfg.rotuloAba.toLowerCase()}, página {lista.dados.pagina} de {lista.dados.paginas}</caption>
            <thead>
              <tr>
                {cfg.colunas.map((c, i) => (i === 0 ? (
                  /* Primeira coluna: clique para ordenar A–Z ou Z–A */
                  <th key={c} scope="col" aria-sort={ordem === 'asc' ? 'ascending' : 'descending'}>
                    <button type="button" className="tabela__ordenar" onClick={() => { setOrdem(ordem === 'asc' ? 'desc' : 'asc'); setPagina(1); }}>
                      {c}<Icon nome={ordem === 'asc' ? 'setaBaixo' : 'setaCima'} />
                      <span className="sr-only">{ordem === 'asc' ? '(A a Z, clique para inverter)' : '(Z a A, clique para inverter)'}</span>
                    </button>
                  </th>
                ) : <th key={c} scope="col">{c}</th>))}
                <th scope="col" className="col-acoes"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {lista.dados.itens.map((item) => (
                <tr key={item.id}>
                  {cfg.celulas(item)}
                  <td className="col-acoes">
                    <button type="button" className="btn btn--fantasma btn--sm" aria-label={'Gerenciar ' + item.nome}
                      onClick={() => setGerenciando({ entidade: aba, id: item.id })}>
                      <Icon nome="editar" />Gerenciar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paginacao dados={lista.dados} aoMudar={setPagina} aoMudarPorPagina={(n) => { setPorPagina(n); setPagina(1); }} />
      </>
    );
  }

  return (
    <AreaAutenticada paginaAtiva={ROTAS.adminCadastros} titulo="Cadastros"
      descricao="Gerencie alunos, professores e responsáveis, e libere o acesso de cada um à 4U.">

      {/* Abas e botão de novo cadastro na mesma linha */}
      <div className="cadastro-topo">
        <div className="abas" role="tablist" aria-label="Tipo de cadastro">
          {ORDEM_ABAS.map((chave, i) => (
            <button
              key={chave}
              type="button"
              role="tab"
              id={'aba-' + chave}
              className="aba"
              aria-selected={aba === chave}
              aria-controls="painel-cadastro"
              tabIndex={aba === chave ? 0 : -1}
              onClick={() => trocarAba(chave)}
              onKeyDown={(e) => teclarAba(e, i)}
            >
              {ENTIDADES[chave].rotuloAba}
              {contagens.dados && <span className="aba__contador">{contagens.dados[chave]}</span>}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--primario" onClick={() => setFormAberto(true)}>
          <Icon nome="mais" />{cfg.novo}
        </button>
      </div>

      <section className="card cadastro-painel" id="painel-cadastro" role="tabpanel" aria-labelledby={'aba-' + aba} tabIndex={0}>
        <form className="cadastro-filtros" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="barra-filtros">
            <div className="campo-busca">
              <Icon nome="buscar" />
              <label className="sr-only" htmlFor="filtro-busca">Buscar por nome{aba === 'alunos' ? ' ou matrícula' : ''}</label>
              <input className="campo__input" type="search" id="filtro-busca" autoComplete="off"
                placeholder={aba === 'alunos' ? 'Buscar por nome ou matrícula' : 'Buscar por nome'}
                value={textoBusca} onChange={(e) => setTextoBusca(e.target.value)} />
            </div>
            {aba === 'alunos' && (
              <select className="campo__select" aria-label="Filtrar por turma" value={turmaId}
                onChange={(e) => { setTurmaId(e.target.value); setPagina(1); }}>
                <option value="">Turma: todas</option>
                {listaTurmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            )}
            <select className="campo__select" aria-label="Filtrar por situação" value={situacao}
              onChange={(e) => { setSituacao(e.target.value); setPagina(1); }}>
              <option value="todos">Situação: todas</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Desativados</option>
            </select>
          </div>
          <div className="filtros-ativos">
            {ativos.length > 0 && <span>Filtros ativos:</span>}
            {ativos.map((f) => (
              <span key={f.chave} className="chip">{f.rotulo}
                <button type="button" aria-label={'Remover filtro ' + f.rotulo} onClick={f.limpar}><Icon nome="fechar" /></button>
              </span>
            ))}
            {ativos.length > 0 && lista.dados && <span className="filtros-ativos__total">{plural(lista.dados.total, cfg.singular, cfg.rotuloAba.toLowerCase())}</span>}
          </div>
        </form>
        {conteudoLista}
      </section>

      {formAberto && (
        <FormularioNovo entidade={aba} turmas={listaTurmas} aoFechar={() => setFormAberto(false)}
          aoSalvar={(criado) => {
            setFormAberto(false);
            recarregarLista();
            /* Professor e responsável: já abre "Gerenciar" para liberar o acesso */
            if (criado && aba !== 'alunos') setGerenciando({ entidade: aba, id: criado.id });
          }} />
      )}

      {gerenciando && (
        <ModalGerenciar entidade={gerenciando.entidade} id={gerenciando.id} turmas={listaTurmas}
          aoFechar={() => setGerenciando(null)} aoMudar={recarregarLista} />
      )}
    </AreaAutenticada>
  );
}
