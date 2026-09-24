import { createContext, useCallback, useContext, useState } from 'react';
import Icon from '../components/Icon.jsx';

const ToastContext = createContext(null);
const ICONES = { sucesso: 'check', erro: 'erro', info: 'info' };
let proximoId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remover = useCallback((id) => setToasts((lista) => lista.filter((t) => t.id !== id)), []);

  const mostrar = useCallback((toast) => {
    const id = proximoId++;
    setToasts((lista) => [...lista, { tipo: 'info', ...toast, id }]);
    setTimeout(() => remover(id), toast.duracao || 5500);
  }, [remover]);

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={'toast toast--' + t.tipo}>
            <Icon nome={ICONES[t.tipo]} />
            <div className="toast__texto">
              {t.titulo && <strong>{t.titulo}</strong>}
              {t.mensagem}
            </div>
            <button type="button" className="btn btn--icone" aria-label="Fechar mensagem" onClick={() => remover(t.id)}>
              <Icon nome="fechar" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
