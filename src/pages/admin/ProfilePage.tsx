import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
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
  Save,
  MessageCircle,
  Target,
  Rocket
} from '../../utils/icons';
import { Palette, HelpCircle, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import PageHeader from '../../components/ui/PageHeader';
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher';

const ProfilePage: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
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
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        company: '', // Campo não existe no Profile, manter vazio
        phone: '' // Campo não existe no Profile, manter vazio
      });
    }
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    try {
      // Carregar estatísticas do usuário
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Total de campanhas
      const { count: campaigns } = await supabase
        .from('campanhas_disparo')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id);

      // Total de conexões
      const { count: connections } = await supabase
        .from('whatsapp_instances')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id);

      // Total de mensagens
      const { count: messages } = await supabase
        .from('conversas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id);

      setStats({
        totalCampaigns: campaigns || 0,
        totalConnections: connections || 0,
        totalMessages: messages || 0,
        successRate: 85 // Exemplo
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          // Remover campos que não existem no Profile
        })
        .eq('id', profile?.id);

      if (error) throw error;
      
      setIsEditing(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Links rápidos para funcionalidades não presentes no menu mobile
  const quickLinks = [
    {
      title: 'Conexões WhatsApp',
      description: 'Gerencie suas conexões do WhatsApp',
      icon: <Phone className="w-5 h-5" />,
      path: '/admin/conexoes',
      color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
    },
    {
      title: 'Conversas',
      description: 'Veja suas conversas e mensagens',
      icon: <MessageCircle className="w-5 h-5" />,
      path: '/admin/conversas',
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300'
    },
    {
      title: 'Histórico de Campanhas',
      description: 'Acompanhe o histórico de disparos',
      icon: <Clock className="w-5 h-5" />,
      path: '/admin/campanhas',
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300'
    },
    {
      title: 'Fluxos de Mensagens',
      description: 'Crie templates e fluxos automáticos',
      icon: <BarChart3 className="w-5 h-5" />,
      path: '/admin/fluxos',
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300'
    }
    // {
    //   title: 'Planos e Assinaturas',
    //   description: 'Gerencie sua assinatura',
    //   icon: <Crown className="w-5 h-5" />,
    //   path: '/admin/planos',
    //   color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300'
    // }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Perfil CaptaZap"
          subtitle="Gerencie sua conta e acesse todas as funcionalidades"
          icon={<User className="w-6 h-6" />}
        />

        <div className="px-4 py-6 space-y-6 md:space-y-6">
          {/* Card do Perfil */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 md:p-6 border border-border"
          >
            <div className="flex items-start justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    {profile?.full_name || 'Usuário'}
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1.5 md:p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2">Nome</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 md:px-3 md:py-2 border border-border rounded-lg bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2">Empresa</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full px-2.5 py-1.5 md:px-3 md:py-2 border border-border rounded-lg bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2">Telefone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 md:px-3 md:py-2 border border-border rounded-lg bg-background text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-xs md:text-sm"
                  >
                    <Save className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 inline" />
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-xs md:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="text-center">
                  <div className="text-lg md:text-2xl font-bold text-foreground">{stats.totalCampaigns}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Campanhas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg md:text-2xl font-bold text-foreground">{stats.totalConnections}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Conexões</div>
                </div>
                <div className="text-center">
                  <div className="text-lg md:text-2xl font-bold text-foreground">{stats.totalMessages}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Mensagens</div>
                </div>
                <div className="text-center">
                  <div className="text-lg md:text-2xl font-bold text-foreground">{stats.successRate}%</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Taxa Sucesso</div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Acesso Rápido */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-4 md:p-6 border border-border"
          >
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Acesso Rápido</h3>
            <div className="grid grid-cols-1 gap-2 md:gap-4 md:grid-cols-2">
              {quickLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.path}
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${link.color}`}>
                    <div className="w-4 h-4 md:w-5 md:h-5">
                      {link.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground group-hover:text-primary text-sm md:text-base truncate">
                      {link.title}
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{link.description}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Configurações */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-4 md:p-6 border border-border"
          >
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Configurações</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <Palette className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  <span className="text-sm md:text-base text-foreground">Tema</span>
                </div>
                <ThemeSwitcher />
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-2.5 md:p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">Sair da Conta</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 