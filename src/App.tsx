import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './context/AdminContext';
import { UserProviderSimple } from './contexts/UserContextSimple';
import { ThemeProvider } from './context/ThemeContext';
import { FiltrosProvider } from './contexts/FiltrosContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SessionMonitor from './components/auth/SessionMonitor';
import HomePage from './pages/HomePage';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import SettingsPage from './pages/admin/SettingsPage';
import LeadsPage from './pages/admin/LeadsPage';
import EmpresasPage from './pages/admin/EmpresasPage';
import ConexoesPage from './pages/admin/ConexoesPage';
import DisparosPage from './pages/admin/DisparosPage';
import BancoDadosPage from './pages/admin/BancoDadosPage';
import LoginPage from './pages/LoginPage';
import DisparosHistoricoPage from './pages/admin/DisparosHistoricoPage';
import ConversasPage from './pages/admin/ConversasPage';
import ProfilePage from './pages/admin/ProfilePage';
import FluxosPage from './pages/admin/FluxosPage';
import DebugPage from './pages/DebugPage'; // Importar DebugPage

function App() {
  return (
    <AuthProvider>
      <SessionMonitor>
        <ThemeProvider>
          <UserProviderSimple>
            <AdminProvider>
              <FiltrosProvider>
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
                      <Route path="conversas" element={<ConversasPage />} />
                      <Route path="perfil" element={<ProfilePage />} />
                      <Route path="fluxos" element={<FluxosPage />} />
                    </Route>
                    
                    {/* Rota catch-all para redirecionar para home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Router>
              </FiltrosProvider>
            </AdminProvider>
          </UserProviderSimple>
        </ThemeProvider>
      </SessionMonitor>
    </AuthProvider>
  );
}

export default App;