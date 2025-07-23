import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target,
  Users, 
  MessageCircle,
  TrendingUp,
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Calendar,
  Star,
  Phone,
  Mail,
  BarChart3,
  Grid,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  Zap,
  ChevronRight
} from '../../utils/icons';
import { buscarEstatisticasFunil, type EstatisticasFunil } from '../../services/edgeFunctions';
import { supabase } from '../../lib/supabase';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

interface UltimoDisparo {
  id: string;
  nome: string;
  total_empresas: number;
  total_enviados: number;
  total_erros: number;
  status: string;
  criado_em: string;
  conexao_id: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<EstatisticasFunil | null>(null);
  const [ultimosDisparos, setUltimosDisparos] = useState<UltimoDisparo[]>([]);
  const [totalDisparos, setTotalDisparos] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar estatísticas do funil
      const result = await buscarEstatisticasFunil();
      if (result.success && result.data) {
        setStats(result.data);
      }

      // Carregar últimos disparos
      const { data: disparos, error } = await supabase
        .from('campanhas_disparo')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Erro ao carregar disparos:', error);
      } else {
        setUltimosDisparos(disparos || []);
      }

      // Carregar total de disparos (soma de todas as empresas contactadas)
      const { data: totalData, error: totalError } = await supabase
        .from('campanhas_disparo')
        .select('total_empresas');

      if (totalError) {
        console.error('Erro ao carregar total de disparos:', totalError);
      } else {
        const total = totalData?.reduce((acc, curr) => acc + (curr.total_empresas || 0), 0) || 0;
        setTotalDisparos(total);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToKanban = (status?: string) => {
    navigate('/admin/empresas/lista', { 
      state: { 
        modalidadeSelecionada: 'todas',
        filtroStatus: status 
      } 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return 'text-blue-600 bg-blue-100';
      case 'concluida':
        return 'text-green-600 bg-green-100';
      case 'pausada':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelada':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return 'Em Andamento';
      case 'concluida':
        return 'Concluída';
      case 'pausada':
        return 'Pausada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-background p-2 md:p-6">
      <div className="page-content-wrapper">
        <PageHeader
          title="Dashboard"
          subtitle="Acompanhe suas métricas e acesse rapidamente as principais ações do seu CRM."
          icon={<Grid size={32} className="text-primary" />}
        />

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Empresas Buscadas */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Target size={20} className="text-emerald-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-emerald-500">{stats?.totalEmpresas || 0}</span>
                <span className="text-xs text-muted-foreground ml-2">empresas</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-foreground">Empresas Buscadas</h3>
            <p className="text-xs text-muted-foreground mt-1">Total de empresas encontradas</p>
          </div>

          {/* Taxa de Resposta */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 size={20} className="text-blue-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-blue-500">0.0%</span>
                <span className="text-xs text-muted-foreground ml-2">taxa</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-foreground">Taxa de Resposta</h3>
            <p className="text-xs text-muted-foreground mt-1">Média de respostas recebidas</p>
          </div>

          {/* Negócios Ganhos */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Star size={20} className="text-purple-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-purple-500">1</span>
                <span className="text-xs text-muted-foreground ml-2">negócios</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-foreground">Negócios Ganhos</h3>
            <p className="text-xs text-muted-foreground mt-1">Conversões realizadas</p>
          </div>

          {/* Total de Disparos */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <MessageCircle size={20} className="text-orange-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-orange-500">{totalDisparos}</span>
                <span className="text-xs text-muted-foreground ml-2">disparos</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-foreground">Total de Disparos</h3>
            <p className="text-xs text-muted-foreground mt-1">Mensagens enviadas</p>
          </div>
        </div>

        {/* Últimos Disparos */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Últimos Disparos</h2>
            <button
              onClick={() => navigate('/admin/campanhas')}
              className="text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
            >
              Ver todos
              <ChevronRight size={14} />
            </button>
          </div>
          
          {ultimosDisparos.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-sm font-medium text-foreground mb-1">Nenhum disparo realizado</h3>
              <p className="text-xs text-muted-foreground">Comece criando sua primeira campanha</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ultimosDisparos.map((disparo) => (
                <button
                  key={disparo.id}
                  onClick={() => navigate('/admin/campanhas')}
                  className="w-full bg-card hover:bg-accent/5 border border-border hover:border-accent/50 rounded-xl p-4 transition-all duration-200 group text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                          <MessageCircle size={16} className="text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-foreground truncate">
                            {disparo.nome || 'Campanha sem nome'}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(disparo.criado_em)} • {disparo.conexao_id}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 ml-11">
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {disparo.total_empresas} empresas
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <CheckCircle size={12} className="text-green-600" />
                          <span className="text-xs text-green-600">
                            {disparo.total_enviados} enviados
                          </span>
                        </div>
                        
                        {disparo.total_erros > 0 && (
                          <div className="flex items-center gap-1">
                            <AlertCircle size={12} className="text-red-600" />
                            <span className="text-xs text-red-600">
                              {disparo.total_erros} erros
                            </span>
                          </div>
                        )}
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(disparo.status)}`}>
                          {getStatusLabel(disparo.status)}
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Buscar Leads */}
            <button
              onClick={() => navigate('/admin/leads')}
              className="bg-card hover:bg-accent/5 border border-border hover:border-accent/50 rounded-xl p-4 flex items-center gap-4 transition-all duration-200 group text-left"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                <Target size={24} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Buscar Novos Leads</p>
                <p className="text-xs text-muted-foreground mt-1">Use os filtros para encontrar empresas com o perfil ideal</p>
              </div>
            </button>

            {/* Iniciar Campanha */}
            <button
              onClick={() => navigate('/admin/disparos')}
              className="bg-card hover:bg-accent/5 border border-border hover:border-accent/50 rounded-xl p-4 flex items-center gap-4 transition-all duration-200 group text-left"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                <MessageCircle size={24} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Iniciar Campanha</p>
                <p className="text-xs text-muted-foreground mt-1">Envie mensagens personalizadas para seus leads</p>
              </div>
            </button>

            {/* Gerenciar Conexões */}
            <button
              onClick={() => navigate('/admin/conexoes')}
              className="bg-card hover:bg-accent/5 border border-border hover:border-accent/50 rounded-xl p-4 flex items-center gap-4 transition-all duration-200 group text-left"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                <Phone size={24} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Gerenciar Conexões</p>
                <p className="text-xs text-muted-foreground mt-1">Configure suas contas do WhatsApp</p>
              </div>
            </button>

            {/* Ver Relatórios */}
            <button
              onClick={() => navigate('/admin/fluxos')}
              className="bg-card hover:bg-accent/5 border border-border hover:border-accent/50 rounded-xl p-4 flex items-center gap-4 transition-all duration-200 group text-left"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                <BarChart3 size={24} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Ver Relatórios</p>
                <p className="text-xs text-muted-foreground mt-1">Acompanhe o desempenho das suas campanhas</p>
              </div>
            </button>
          </div>
        </div>

        {/* Atividade Recente */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Atividade Recente</h2>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Clock size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;