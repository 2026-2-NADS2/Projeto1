import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { DASHBOARD_POR_PERFIL, ROTAS } from '../../utils/rotas.js';

export default function RotaProtegida({ perfil, children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to={ROTAS.login + '?restrito=1'} replace />;
  if (perfil && usuario.perfil !== perfil) {
    return <Navigate to={DASHBOARD_POR_PERFIL[usuario.perfil]} replace state={{ negado: true }} />;
  }
  return children;
}
