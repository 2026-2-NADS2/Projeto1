import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { encerrarSessao, iniciarSessao, obterSessao, renovarSessao } from '../services/sessao.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => obterSessao().sessao);

  const entrar = useCallback((usuario) => setSessao(iniciarSessao(usuario)), []);
  const sair = useCallback(() => { encerrarSessao(); setSessao(null); }, []);

  useEffect(() => {
    if (!sessao) return undefined;
    let timer;
    const aoAgir = () => { clearTimeout(timer); timer = setTimeout(renovarSessao, 1000); };
    window.addEventListener('click', aoAgir);
    window.addEventListener('keydown', aoAgir);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', aoAgir);
      window.removeEventListener('keydown', aoAgir);
    };
  }, [sessao]);

  return (
    <AuthContext.Provider value={{ sessao, usuario: sessao ? sessao.usuario : null, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
