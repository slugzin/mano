import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './context/AdminContext';
import { UserProviderSimple } from './contexts/UserContextSimple';
import { ThemeProvider } from './context/ThemeContext';
import { FiltrosProvider } from './contexts/FiltrosContext';
import { AuthProvider } from './contexts/AuthContext';
import { PlanLimitsProvider, usePlanLimits } from './contexts/PlanLimitsContext';
import UpgradeModal from './components/ui/UpgradeModal';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SessionMonitor from './components/auth/SessionMonitor';
import HomePage from './pages/HomePage';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import SettingsPage from './pages/admin/SettingsPage';
import LeadsPage from './pages/admin/LeadsPage';
import EmpresasPage from './pages/admin/EmpresasPage';
import DisparosPage from './pages/admin/DisparosPage';
import ConversasPage from './pages/admin/ConversasPage';
import DisparosHistoricoPage from './pages/admin/DisparosHistoricoPage';
import HistoricoPage from './pages/admin/HistoricoPage';
import CampanhasPage from './pages/admin/CampanhasPage';
import ConexoesPage from './pages/admin/ConexoesPage';
import NewSettingsPage from './pages/admin/NewSettingsPage';
import BancoDadosPage from './pages/admin/BancoDadosPage';
import ProfilePage from './pages/admin/ProfilePage';
import FluxosPage from './pages/admin/FluxosPage';
import PlanosPage from './pages/admin/PlanosPage';
import DebugPage from './pages/DebugPage';
import LoginPage from './pages/LoginPage';

// Componente interno para usar o hook usePlanLimits
const AppContent: React.FC = () => {
  const { showUpgradeModal, setShowUpgradeModal, upgradeReason, getRemainingLimit } = usePlanLimits();

  return (
    <>
      <Router>
        <Routes>
          {/* Página inicial */}
          <Route path="/" element={<HomePage />} />
          
          {/* Página de login */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Página de debug - pública para facilitar acesso */}
          <Route path="/debug" element={<DebugPage />} />
          
          {/* Admin Routes - Protegidas */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="disparos" element={<DisparosPage />} />
            <Route path="empresas" element={<EmpresasPage />} />
            <Route path="conexoes" element={<ConexoesPage />} />
            <Route path="campanhas" element={<DisparosHistoricoPage />} />
            <Route path="historico" element={<HistoricoPage />} />
            <Route path="conversas" element={<ConversasPage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="fluxos" element={<FluxosPage />} />
            <Route path="planos" element={<PlanosPage />} />
          </Route>
          
          {/* Rota catch-all para redirecionar para home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      {/* Modal de Upgrade */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
        remaining={{
          empresas: getRemainingLimit('empresas'),
          disparos: getRemainingLimit('disparos')
        }}
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <SessionMonitor>
        <ThemeProvider>
          <UserProviderSimple>
            <AdminProvider>
              <FiltrosProvider>
                <PlanLimitsProvider>
                  <AppContent />
                </PlanLimitsProvider>
              </FiltrosProvider>
            </AdminProvider>
          </UserProviderSimple>
        </ThemeProvider>
      </SessionMonitor>
    </AuthProvider>
  );
}

export default App;