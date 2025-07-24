import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  Clock, 
  Phone, 
  BarChart3, 
  Edit3, 
  Mail, 
  Building, 
  Calendar,
  Crown,
  Shield,
  Bell,
  Globe,
  LogOut,
  ChevronRight,
  Save
} from '../../utils/icons';
import { Palette, HelpCircle, Camera } from 'lucide-react';
import { useUser } from '../../contexts/UserContextSimple';
import { supabase } from '../../lib/supabase';
import PageHeader from '../../components/ui/PageHeader';
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher';

// Importar componentes das outras páginas para reutilizar
import DisparosHistoricoPage from './DisparosHistoricoPage';
import ConexoesPage from './ConexoesPage';
import FluxosPage from './FluxosPage';

const ProfilePage: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'historico' | 'conexoes' | 'fluxos'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: ''
  });
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalConnections: 0,
    totalMessages: 0,
    successRate: 0
  });

  // Carregar dados do usuário e estatísticas
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        company: 'Minha Empresa', // Placeholder
        phone: user.phone || ''
      });
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      // Buscar estatísticas do usuário
      // Por enquanto, dados mockados
      setStats({
        totalCampaigns: 12,
        totalConnections: 3,
        totalMessages: 1248,
        successRate: 78
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Aqui seria a lógica para salvar no Supabase
      console.log('Salvando perfil:', editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_data');
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_login_time');
    window.location.href = '/';
  };

  const tabs = [
    { 
      id: 'profile', 
      label: 'Perfil', 
      icon: User,
      description: 'Informações da conta'
    },
    { 
      id: 'historico', 
      label: 'Histórico', 
      icon: Clock,
      description: 'Campanhas anteriores'
    },
    { 
      id: 'conexoes', 
      label: 'Conexões', 
      icon: Phone,
      description: 'WhatsApp conectado'
    },
    { 
      id: 'fluxos', 
      label: 'Fluxos', 
      icon: BarChart3,
      description: 'Automações ativas'
    }
  ];

  // Se não estiver na aba profile, renderizar o componente correspondente com botão de volta
  if (activeTab === 'historico') {
    return (
      <div className="min-h-screen bg-background">
        {/* Botão de Volta - Mobile */}
        <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border p-3">
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
            <span className="text-sm font-medium">Voltar ao Perfil</span>
          </button>
        </div>
        <DisparosHistoricoPage />
      </div>
    );
  }
  
  if (activeTab === 'conexoes') {
    return (
      <div className="min-h-screen bg-background">
        {/* Botão de Volta - Mobile */}
        <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border p-3">
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
            <span className="text-sm font-medium">Voltar ao Perfil</span>
          </button>
        </div>
        <ConexoesPage />
      </div>
    );
  }
  
  if (activeTab === 'fluxos') {
    return (
      <div className="min-h-screen bg-background">
        {/* Botão de Volta - Mobile */}
        <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border p-3">
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
            <span className="text-sm font-medium">Voltar ao Perfil</span>
          </button>
        </div>
        <FluxosPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header com nome do usuário */}
      <div className="md:hidden bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
            <User size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-foreground">{user?.name || 'Usuário'}</h1>
            <p className="text-xs text-muted-foreground">Gerenciar conta</p>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageHeader
          title="Perfil"
          subtitle="Gerencie sua conta e configurações"
          icon={<User size={24} />}
        />
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {/* Cards de Navegação - Estilo iFood Compacto */}
        <div className="mb-4">
          {/* Seções do Perfil em Cards */}
          <div className="space-y-2">
            {/* Card Histórico */}
            <button
              onClick={() => setActiveTab('historico')}
              className="w-full bg-card border border-border rounded-lg p-3 flex items-center gap-3 transition-all duration-200 hover:bg-accent/5 hover:border-accent/30"
            >
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-accent" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-foreground text-sm">Histórico</h3>
                <p className="text-xs text-muted-foreground">Meu histórico de campanhas</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-xs font-medium">
                  {stats.totalCampaigns}
                </div>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </button>

            {/* Card Conexões */}
            <button
              onClick={() => setActiveTab('conexoes')}
              className="w-full bg-card border border-border rounded-lg p-3 flex items-center gap-3 transition-all duration-200 hover:bg-accent/5 hover:border-accent/30"
            >
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Phone size={16} className="text-accent" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-foreground text-sm">Conexões</h3>
                <p className="text-xs text-muted-foreground">Minhas conexões WhatsApp</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-xs font-medium">
                  {stats.totalConnections}
                </div>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </button>

            {/* Card Fluxos */}
            <button
              onClick={() => setActiveTab('fluxos')}
              className="w-full bg-card border border-border rounded-lg p-3 flex items-center gap-3 transition-all duration-200 hover:bg-accent/5 hover:border-accent/30"
            >
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <BarChart3 size={16} className="text-accent" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-foreground text-sm">Fluxos</h3>
                <p className="text-xs text-muted-foreground">Meus fluxos de automação</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-xs font-medium">
                  NOVO!
                </div>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </button>

            {/* Card Ajuda & Suporte */}
            <button className="w-full bg-card border border-border rounded-lg p-3 flex items-center gap-3 transition-all duration-200 hover:bg-accent/5 hover:border-accent/30">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <HelpCircle size={16} className="text-accent" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-foreground text-sm">Ajuda & Suporte</h3>
                <p className="text-xs text-muted-foreground">Central de ajuda e tutoriais</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Profile Content - Compacto */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Profile Card - Compacto */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4">
              {/* Avatar Section - Compacto */}
              <div className="text-center mb-4">
                <div className="relative inline-block">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                    <User size={24} className="text-accent" />
                  </div>
                  <button className="absolute bottom-0 right-0 w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <Camera size={12} />
                  </button>
                </div>
                <h2 className="text-lg font-medium text-foreground mb-1">
                  {user?.name || 'Usuário'}
                </h2>
                <p className="text-xs text-muted-foreground mb-3">
                  {editForm.company}
                </p>
                
                {/* Status Badge - Compacto */}
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                  <Shield size={12} />
                  Conta Ativa
                </div>
              </div>

              {/* Quick Stats - Compacto */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <div className="text-sm font-bold text-foreground">{stats.totalCampaigns}</div>
                  <div className="text-xs text-muted-foreground">Campanhas</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <div className="text-sm font-bold text-foreground">{stats.successRate}%</div>
                  <div className="text-xs text-muted-foreground">Taxa Sucesso</div>
                </div>
              </div>

              {/* Quick Actions - Compacto */}
              <div className="space-y-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-accent/5 rounded-lg transition-colors"
                >
                  <Edit3 size={14} className="text-accent" />
                  <span className="text-xs font-medium">Editar Perfil</span>
                  <ChevronRight size={12} className="ml-auto text-muted-foreground" />
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                >
                  <LogOut size={14} />
                  <span className="text-xs font-medium">Sair da Conta</span>
                  <ChevronRight size={12} className="ml-auto" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Compacto */}
          <div className="lg:col-span-2 space-y-4">
            {/* Account Information - Compacto */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Informações da Conta</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-accent hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <Edit3 size={12} />
                    Editar
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Nome Completo</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Empresa</label>
                    <input
                      type="text"
                      value={editForm.company}
                      onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
                    >
                      <Save size={14} />
                      Salvar
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent/5 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-accent" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{editForm.name}</div>
                        <div className="text-xs text-muted-foreground">Nome completo</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-accent" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{editForm.email}</div>
                        <div className="text-xs text-muted-foreground">E-mail principal</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Building size={18} className="text-accent" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{editForm.company}</div>
                        <div className="text-xs text-muted-foreground">Empresa</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-accent" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{editForm.phone || 'Não informado'}</div>
                        <div className="text-xs text-muted-foreground">Telefone</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Settings - Compacto */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-base font-semibold text-foreground mb-4">Configurações</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette size={14} className="text-accent" />
                    <div>
                      <div className="text-xs font-medium text-foreground">Tema</div>
                      <div className="text-xs text-muted-foreground">Aparência da interface</div>
                    </div>
                  </div>
                  <ThemeSwitcher />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 