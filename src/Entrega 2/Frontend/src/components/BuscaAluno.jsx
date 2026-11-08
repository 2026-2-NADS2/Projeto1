import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { Avatar } from './Elementos.jsx';
import api from '../services/api.js';

/* Escolher um aluno pelo nome (usado para vincular responsável e aluno) */
export default function BuscaAluno({ id, rotulo = 'Aluno', selecionado, aoSelecionar, erro, obrigatorio = false }) {
  const [termo, setTermo] = useState('');
  const [resultado, setResultado] = useState({ itens: [], carregando: false });

  /* Espera 300 ms depois da digitação para buscar */
  useEffect(() => {
    const busca = termo.trim();
    if (busca.length < 2) { setResultado({ itens: [], carregando: false }); return undefined; }
    let ativo = true;
    setResultado((r) => ({ ...r, carregando: true }));
    const timer = setTimeout(() => {
      api.listarCadastros('alunos', { busca, situacao: 'ativos', pagina: 1 })
        .then((d) => { if (ativo) setResultado({ itens: d.itens, carregando: false }); })
        .catch(() => { if (ativo) setResultado({ itens: [], carregando: false }); });
    }, 300);
    return () => { ativo = false; clearTimeout(timer); };
  }, [termo]);

  if (selecionado) {
    return (
      <div className="campo campo--inteiro">
        <span className="campo__label">{rotulo}</span>
        <div className="busca-aluno__escolhido">
          <Avatar nome={selecionado.nome} />
          <span>{selecionado.nome}<small>{selecionado.turma || 'Sem turma'} · matrícula {selecionado.matricula}</small></span>
          <button type="button" className="btn btn--fantasma btn--sm" onClick={() => aoSelecionar(null)}>Trocar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={'campo campo--inteiro' + (erro ? ' campo--invalido' : '')}>
      <label className="campo__label" htmlFor={id}>
        {rotulo}{obrigatorio && <span className="obrigatorio" aria-hidden="true">*</span>}
      </label>
      <input id={id} className="campo__input" type="search" autoComplete="off" placeholder="Digite o nome do aluno"
        aria-describedby={id + '-erro'} aria-invalid={erro ? true : undefined}
        value={termo} onChange={(e) => setTermo(e.target.value)} />
      <span className="campo__erro" id={id + '-erro'}>{erro && <><Icon nome="erro" /><span>{erro}</span></>}</span>
      <div aria-live="polite">
        {resultado.carregando && <p className="legenda">Buscando…</p>}
        {!resultado.carregando && termo.trim().length >= 2 && !resultado.itens.length && <p className="legenda">Nenhum aluno ativo encontrado.</p>}
        {resultado.itens.length > 0 && (
          <ul className="busca-aluno__lista" aria-label="Alunos encontrados">
            {resultado.itens.map((a) => (
              <li key={a.id}>
                <button type="button" className="busca-aluno__item" onClick={() => { aoSelecionar(a); setTermo(''); }}>
                  <Avatar nome={a.nome} />
                  <span>{a.nome}<small>{a.turma || 'Sem turma'} · matrícula {a.matricula}</small></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
