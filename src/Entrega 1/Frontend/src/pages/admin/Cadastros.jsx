import { useEffect, useState } from 'react';
import AreaAutenticada from '../../components/layout/AreaAutenticada.jsx';
import Icon from '../../components/Icon.jsx';
import Modal from '../../components/Modal.jsx';
import Paginacao from '../../components/Paginacao.jsx';
import { CampoSelect, CampoTexto } from '../../components/Campo.jsx';
import { Avatar, Situacao } from '../../components/Elementos.jsx';
import { Carregando, ErroCarregamento, Vazio } from '../../components/Estados.jsx';
import useApi from '../../hooks/useApi.js';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { ROTAS } from '../../utils/rotas.js';
import { formatarData } from '../../utils/formatadores.js';
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

/* Configuração de cada aba */
const ENTIDADES = {
  alunos: {
    rotuloAba: 'Alunos',
    novo: 'Novo aluno',
    vazio: 'Nenhum aluno cadastrado',
    colunas: ['Aluno', 'Matrícula', 'Turma', 'Situação'],
    celulas: (a) => (
      <>
        <td className="td-principal">
          <div className="celula-pessoa"><Avatar nome={a.nome} /><span>{a.nome}<small>Nascimento: {formatarData(a.data_nascimento)}</small></span></div>
        </td>
        <td data-label="Matrícula">{a.matricula}</td>
        <td data-label="Turma">{a.turma || <span className="texto-secundario">Sem turma no ano letivo</span>}</td>
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
    novo: 'Novo professor',
    vazio: 'Nenhum professor cadastrado',
    colunas: ['Professor', 'Registro funcional', 'Disciplinas', 'Situação'],
    celulas: (p) => (
      <>
        <td className="td-principal">
          <div className="celula-pessoa"><Avatar nome={p.nome} /><span>{p.nome}<small>{p.email}</small></span></div>
        </td>
        <td data-label="Registro funcional">{p.registro_funcional}</td>
        <td data-label="Disciplinas">{p.disciplinas.length ? p.disciplinas.join(', ') : <span className="texto-secundario">Sem vínculo</span>}</td>
        <td data-label="Situação"><Situacao ativo={p.ativo} /></td>
      </>
    ),
    valoresIniciais: { nome: '', email: '', registro_funcional: '' },
    regras: {
      nome: regrasNome('professor'),
      email: [obrigatorio('Informe o e-mail do professor.'), email()],
      registro_funcional: [obrigatorio('Informe o registro funcional.'), padrao(/^[A-Za-z0-9-]{3,20}$/, 'Use de 3 a 20 letras, números ou hífen (ex.: RF-10231).')]
    },
    aviso: 'O professor acessa a 4U com o e-mail informado e cria a própria senha no primeiro acesso.'
  },
  responsaveis: {
    rotuloAba: 'Responsáveis',
    novo: 'Novo responsável',
    vazio: 'Nenhum responsável cadastrado',
    colunas: ['Responsável', 'Telefone', 'Alunos vinculados', 'Situação'],
    celulas: (r) => (
      <>
        <td className="td-principal">
          <div className="celula-pessoa"><Avatar nome={r.nome} /><span>{r.nome}<small>{r.email}</small></span></div>
        </td>
        <td data-label="Telefone">{r.telefone}</td>
        <td data-label="Alunos vinculados">{r.alunos.length ? r.alunos.join(', ') : <span className="texto-secundario">Nenhum</span>}</td>
        <td data-label="Situação"><Situacao ativo={r.ativo} /></td>
      </>
    ),
    valoresIniciais: { nome: '', email: '', telefone: '' },
    regras: {
      nome: regrasNome('responsável'),
      email: [obrigatorio('Informe o e-mail do responsável.'), email()],
      telefone: [obrigatorio('Informe um telefone para contato.'), telefone()]
    },
    aviso: 'O responsável acessa a 4U com o e-mail informado e cria a própria senha no primeiro acesso.'
  }
};

const ORDEM_ABAS = ['alunos', 'professores', 'responsaveis'];

/* Campos do formulário */
function CamposFormulario({ entidade, valores, erros, alterar, turmas }) {
  const comuns = (
    <CampoTexto id="f-nome" rotulo="Nome completo" obrigatorio inteiro maxLength={150} autoComplete="off"
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
        <CampoTexto id="f-registro" rotulo="Registro funcional" obrigatorio maxLength={20} ajuda="Ex.: RF-10231"
          value={valores.registro_funcional} erro={erros.registro_funcional}
          onChange={(e) => alterar('registro_funcional', e.target.value)} />
      ) : (
        <CampoTexto id="f-telefone" rotulo="Telefone" obrigatorio type="tel" inputMode="tel" placeholder="(11) 91234-5678"
          value={valores.telefone} erro={erros.telefone} onChange={(e) => alterar('telefone', mascaraTelefone(e.target.value))} />
      )}
    </>
  );
}

/* Formulário de novo cadastro */
function FormularioNovo({ entidade, turmas, aoFechar }) {
  const cfg = ENTIDADES[entidade];
  const { mostrar } = useToast();
  const [valores, setValores] = useState(cfg.valoresIniciais);
  const [erros, setErros] = useState({});
  const [tentouEnviar, setTentouEnviar] = useState(false);

  function alterar(campo, valor) {
    const novos = { ...valores, [campo]: valor };
    setValores(novos);
    if (tentouEnviar) setErros(validar(novos, cfg.regras));
  }

  function enviar(e) {
    e.preventDefault();
    setTentouEnviar(true);
    const encontrados = validar(valores, cfg.regras);
    setErros(encontrados);
    if (Object.keys(encontrados).length) {
      
      /* Foco no primeiro erro */
      const form = e.currentTarget;
      setTimeout(() => {
        const alvo = form.querySelector('[aria-invalid="true"]');
        if (alvo) alvo.focus();
      }, 0);
      return;
    }
    /* Dados conferidos, sem salvar */
    aoFechar();
    mostrar({ tipo: 'sucesso', titulo: 'Dados conferidos', mensagem: 'Todos os campos foram preenchidos corretamente.' });
  }

  return (
    <Modal
      titulo={cfg.novo}
      descricao="Campos marcados com * são obrigatórios."
      aoFechar={aoFechar}
      rodape={(
        <>
          <button type="button" className="btn btn--fantasma" onClick={aoFechar}>Cancelar</button>
          <button type="submit" form="form-cadastro" className="btn btn--primario"><Icon nome="check" />Cadastrar</button>
        </>
      )}
    >
      <div className="alerta alerta--info" style={{ marginBottom: 16 }}>
        <Icon nome="info" /><p>{cfg.aviso}</p>
      </div>
      <form id="form-cadastro" className="form-grid" noValidate onSubmit={enviar}>
        <CamposFormulario entidade={entidade} valores={valores} erros={erros} alterar={alterar} turmas={turmas} />
      </form>
    </Modal>
  );
}

export default function Cadastros() {
  const [aba, setAba] = useState('alunos');
  const [pagina, setPagina] = useState(1);
  const [formAberto, setFormAberto] = useState(false);
  const [textoBusca, setTextoBusca] = useState('');  /* Texto digitado */
  const [busca, setBusca] = useState('');  /* Termo da consulta */
  const [situacao, setSituacao] = useState('todos');
  const cfg = ENTIDADES[aba];

  const contagens = useApi(api.contagensCadastros);
  const turmas = useApi(api.listarTurmas);
  const lista = useApi(
    () => api.listarCadastros(aba, { busca, situacao, pagina }),
    [aba, busca, situacao, pagina]
  );

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
  }

  function limparFiltros() {
    setTextoBusca('');
    setBusca('');
    setSituacao('todos');
    setPagina(1);
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

  let conteudoLista;
  if (lista.carregando) conteudoLista = <Carregando linhas={5} blocos />;
  else if (lista.erro) conteudoLista = <ErroCarregamento erro={lista.erro} aoTentarNovamente={lista.recarregar} />;
  else if (!lista.dados.itens.length && (busca || situacao !== 'todos')) {
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
                {cfg.colunas.map((c) => <th key={c} scope="col">{c}</th>)}
                <th scope="col" className="col-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.dados.itens.map((item) => (
                <tr key={item.id}>
                  {cfg.celulas(item)}
                  <td className="col-acoes">
                    <button type="button" className="btn btn--secundario btn--sm" aria-label={'Editar ' + item.nome}>
                      <Icon nome="editar" />Editar
                    </button>
                    <button type="button" className="btn btn--fantasma btn--sm" aria-label={(item.ativo ? 'Inativar ' : 'Ativar ') + item.nome}>
                      <Icon nome={item.ativo ? 'desligar' : 'ativar'} />{item.ativo ? 'Inativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paginacao dados={lista.dados} aoMudar={setPagina} />
      </>
    );
  }

  return (
    <AreaAutenticada paginaAtiva={ROTAS.adminCadastros}>
      <div className="conteudo__cabecalho">
        <div>
          <h1>Cadastros</h1>
          <p>Gerencie alunos, professores e responsáveis da escola.</p>
        </div>
        <button type="button" className="btn btn--primario" onClick={() => setFormAberto(true)}>
          <Icon nome="mais" />{cfg.novo}
        </button>
      </div>

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

      <section className="card cadastro-painel" id="painel-cadastro" role="tabpanel" aria-labelledby={'aba-' + aba} tabIndex={0}>
        <form className="cadastro-filtros" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="campo">
            <label className="campo__label" htmlFor="filtro-busca">Buscar por nome</label>
            <input className="campo__input" type="search" id="filtro-busca" placeholder="Digite o início do nome ou sobrenome" autoComplete="off"
              value={textoBusca} onChange={(e) => setTextoBusca(e.target.value)} />
          </div>
          <div className="campo">
            <label className="campo__label" htmlFor="filtro-situacao">Situação</label>
            <select className="campo__select" id="filtro-situacao" value={situacao}
              onChange={(e) => { setSituacao(e.target.value); setPagina(1); }}>
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>
        </form>
        {conteudoLista}
      </section>

      {formAberto && (
        <FormularioNovo entidade={aba} turmas={turmas.dados || []} aoFechar={() => setFormAberto(false)} />
      )}
    </AreaAutenticada>
  );
}
