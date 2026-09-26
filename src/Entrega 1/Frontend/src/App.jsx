import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import RotaProtegida from './components/layout/RotaProtegida.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Cadastros from './pages/admin/Cadastros.jsx';
import ProfessorDashboard from './pages/professor/ProfessorDashboard.jsx';
import ResponsavelDashboard from './pages/responsavel/ResponsavelDashboard.jsx';
import NaoEncontrada from './pages/NaoEncontrada.jsx';
import { ROTAS } from './utils/rotas.js';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path={ROTAS.home} element={<Home />} />
            <Route path={ROTAS.login} element={<Login />} />
            <Route path={ROTAS.adminDashboard} element={<RotaProtegida perfil="ADMINISTRADOR"><AdminDashboard /></RotaProtegida>} />
            <Route path={ROTAS.adminCadastros} element={<RotaProtegida perfil="ADMINISTRADOR"><Cadastros /></RotaProtegida>} />
            <Route path={ROTAS.professorDashboard} element={<RotaProtegida perfil="PROFESSOR"><ProfessorDashboard /></RotaProtegida>} />
            <Route path={ROTAS.responsavelDashboard} element={<RotaProtegida perfil="RESPONSAVEL"><ResponsavelDashboard /></RotaProtegida>} />
            <Route path="*" element={<NaoEncontrada />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
