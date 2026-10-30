import { useEffect, useId, useRef } from 'react';
import Icon from './Icon.jsx';

const SELETOR_FOCAVEL = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ titulo, descricao, aoFechar, rodape, pequeno = false, children }) {
  const id = useId();
  const caixaRef = useRef(null);

  useEffect(() => {
    const origemFoco = document.activeElement;
    const caixa = caixaRef.current;
    const primeiro = caixa.querySelector('.modal__corpo input, .modal__corpo select') || caixa.querySelector(SELETOR_FOCAVEL);
    if (primeiro) primeiro.focus();
    document.body.classList.add('sem-rolagem');

    function aoTeclar(e) {
      if (e.key === 'Escape') { e.preventDefault(); aoFechar(); return; }
      if (e.key !== 'Tab') return;
      const focaveis = Array.from(caixa.querySelectorAll(SELETOR_FOCAVEL));
      if (!focaveis.length) return;
      const inicio = focaveis[0];
      const fim = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === inicio) { e.preventDefault(); fim.focus(); }
      else if (!e.shiftKey && document.activeElement === fim) { e.preventDefault(); inicio.focus(); }
    }
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.classList.remove('sem-rolagem');
      if (origemFoco && origemFoco.focus) origemFoco.focus();
    };
  }, []);

  return (
    <div className="modal" onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div
        ref={caixaRef}
        className={'modal__caixa' + (pequeno ? ' modal__caixa--pequena' : '')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id + '-titulo'}
        aria-describedby={descricao ? id + '-desc' : undefined}
      >
        <div className="modal__cabecalho">
          <div>
            <h2 id={id + '-titulo'}>{titulo}</h2>
            {descricao && <p id={id + '-desc'} className="legenda">{descricao}</p>}
          </div>
          <button type="button" className="btn btn--icone" aria-label="Fechar janela" onClick={aoFechar}>
            <Icon nome="fechar" />
          </button>
        </div>
        <div className="modal__corpo">{children}</div>
        {rodape && <div className="modal__rodape">{rodape}</div>}
      </div>
    </div>
  );
}

/* Janela de confirmação */
export function ModalConfirmacao({ titulo, mensagem, textoConfirmar = 'Confirmar', aoConfirmar, aoFechar }) {
  return (
    <Modal
      titulo={titulo}
      pequeno
      aoFechar={aoFechar}
      rodape={(
        <>
          <button type="button" className="btn btn--fantasma" onClick={aoFechar}>Cancelar</button>
          <button type="button" className="btn btn--primario" onClick={aoConfirmar}>{textoConfirmar}</button>
        </>
      )}
    >
      <p>{mensagem}</p>
    </Modal>
  );
}
