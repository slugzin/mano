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
  AlertCircle,
  CheckCircle,
  Eye,
  Zap,
  ChevronRight,
  LayoutDashboard
} from '../../utils/icons';
import { buscarEstatisticasFunil, type EstatisticasFunil } from '../../services/edgeFunctions';
import { supabase } from '../../lib/supabase';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import LoadingScreen from '../../components/ui/LoadingScreen';


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
  const [taxaResposta, setTaxaResposta] = useState(0);
  const [negociosGanhos, setNegociosGanhos] = useState(0);
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

      // Carregar negócios ganhos (empresas com status 'ganhos')
      const { data: empresasGanhos, error: empresasGanhosError } = await supabase
        .from('empresas')
        .select('id')
        .eq('status', 'ganhos');

      if (empresasGanhosError) {
        console.error('Erro ao carregar negócios ganhos:', empresasGanhosError);
      } else {
        setNegociosGanhos(empresasGanhos?.length || 0);
      }

      // Carregar campanhas de disparo
      const { data: campanhas, error: campanhasError } = await supabase
        .from('campanhas_disparo')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(5);

      if (campanhasError) {
        console.error('Erro ao carregar campanhas:', campanhasError);
      } else if (campanhas) {
        // Para cada campanha, buscar dados reais da tabela disparos_agendados
        const ultimosDisparosComMetricas = await Promise.all(
          campanhas.map(async (campanha) => {
            const { data: disparosAgendados, error: disparosError } = await supabase
              .from('disparos_agendados')
              .select('status')
              .eq('conexao_id', campanha.conexao_id);

            if (disparosError) {
              console.error('Erro ao carregar disparos agendados:', disparosError);
              return {
                ...campanha,
                total_enviados: 0,
                total_erros: 0,
                total_empresas: 0
              };
            }

            const total = disparosAgendados?.length || 0;
            const enviados = disparosAgendados?.filter(d => d.status === 'enviado').length || 0;
            const erros = disparosAgendados?.filter(d => d.status === 'erro').length || 0;

            return {
              ...campanha,
              total_enviados: enviados,
              total_erros: erros,
              total_empresas: total
            };
          })
        );

        setUltimosDisparos(ultimosDisparosComMetricas);
      }

      // Carregar total de disparos reais (apenas os enviados)
      const { data: totalDisparosData, error: totalDisparosError } = await supabase
        .from('disparos_agendados')
        .select('status')
        .eq('status', 'enviado');

      if (totalDisparosError) {
        console.error('Erro ao carregar total de disparos:', totalDisparosError);
      } else {
        const total = totalDisparosData?.length || 0;
        setTotalDisparos(total);
      }

      // Calcular taxa de resposta baseada nas conversas
      const { data: conversasData, error: conversasError } = await supabase
        .from('conversas')
        .select('from_me, telefone');

      if (conversasError) {
        console.error('Erro ao carregar conversas:', conversasError);
      } else {
        // Contar mensagens enviadas (from_me = true) e respostas recebidas (from_me = false)
        const mensagensEnviadas = conversasData?.filter(c => c.from_me === true).length || 0;
        const respostasRecebidas = conversasData?.filter(c => c.from_me === false).length || 0;
        
        // Calcular taxa de resposta (respostas / mensagens enviadas * 100)
        const taxa = mensagensEnviadas > 0 ? (respostasRecebidas / mensagensEnviadas) * 100 : 0;
        setTaxaResposta(Math.round(taxa * 10) / 10); // Arredondar para 1 casa decimal
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
    return <LoadingScreen page="dashboard" />;
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-full bg-background p-2 md:p-6">
      <div className="page-content-wrapper">
        {/* Header Mobile */}
        <div className="md:hidden">
          <div className="flex items-center gap-3 p-3 border-b border-border bg-background">
            <Grid className="text-primary" size={20} />
            <div>
              <h1 className="text-base font-medium text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">Acompanhe suas métricas</p>
            </div>
          </div>
        </div>

        {/* Header Desktop */}
        <div className="hidden md:block">
          <PageHeader
            title="Dashboard"
            subtitle="Bem-vindo ao CaptaZap - Sua central de prospecção"
            icon={<LayoutDashboard className="w-6 h-6" />}
          />
        </div>

        {/* KPIs Principais - Design Minimalista */}
        <div className="grid grid-cols-2 gap-2 md:gap-4 mb-4 md:mb-6 w-full mt-4">
          {/* Empresas Buscadas */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-lg md:rounded-xl p-3 md:p-4 hover:border-purple-300 dark:hover:border-purple-700/70 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-lg md:text-2xl font-bold text-foreground">{stats?.totalEmpresas || 0}</span>
                <span className="text-xs md:text-sm text-muted-foreground ml-1">empresas</span>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500/20 dark:bg-purple-400/20 rounded-lg flex items-center justify-center">
                <Target size={16} className="text-purple-600 dark:text-purple-400 md:text-[20px]" />
              </div>
            </div>
            <h3 className="text-xs md:text-sm font-medium text-foreground">Empresas Buscadas</h3>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Total de empresas encontradas</p>
          </div>

          {/* Taxa de Resposta */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-lg md:rounded-xl p-3 md:p-4 hover:border-purple-300 dark:hover:border-purple-700/70 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-lg md:text-2xl font-bold text-foreground">{taxaResposta}%</span>
                <span className="text-xs md:text-sm text-muted-foreground ml-1">taxa</span>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500/20 dark:bg-purple-400/20 rounded-lg flex items-center justify-center">
                <BarChart3 size={16} className="text-purple-600 dark:text-purple-400 md:text-[20px]" />
              </div>
            </div>
            <h3 className="text-xs md:text-sm font-medium text-foreground">Taxa de Resposta</h3>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Média de respostas recebidas</p>
          </div>

          {/* Negócios Ganhos */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-lg md:rounded-xl p-3 md:p-4 hover:border-purple-300 dark:hover:border-purple-700/70 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-lg md:text-2xl font-bold text-foreground">{negociosGanhos}</span>
                <span className="text-xs md:text-sm text-muted-foreground ml-1">negócios</span>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500/20 dark:bg-purple-400/20 rounded-lg flex items-center justify-center">
                <Star size={16} className="text-purple-600 dark:text-purple-400 md:text-[20px]" />
              </div>
            </div>
            <h3 className="text-xs md:text-sm font-medium text-foreground">Negócios Ganhos</h3>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Conversões realizadas</p>
          </div>

          {/* Total de Disparos */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-lg md:rounded-xl p-3 md:p-4 hover:border-purple-300 dark:hover:border-purple-700/70 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-lg md:text-2xl font-bold text-foreground">{totalDisparos}</span>
                <span className="text-xs md:text-sm text-muted-foreground ml-1">disparos</span>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500/20 dark:bg-purple-400/20 rounded-lg flex items-center justify-center">
                <MessageCircle size={16} className="text-purple-600 dark:text-purple-400 md:text-[20px]" />
              </div>
            </div>
            <h3 className="text-xs md:text-sm font-medium text-foreground">Total de Disparos</h3>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Mensagens enviadas</p>
          </div>
        </div>

        {/* Card do Plano Gratuito */}


        {/* Ações Rápidas - Mobile Primeiro */}
        <div className="mb-4 md:mb-6">
          <div className="border-t border-border pt-6 mb-4">
            <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Ações Rápidas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {/* Buscar Leads */}
            <button
              onClick={() => navigate('/admin/leads')}
              className="bg-card hover:bg-accent/5 border border-border hover:border-accent/50 rounded-lg md:rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-all duration-200 group text-left"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-accent/10 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                <Target size={18} className="md:w-6 md:h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Buscar Novos Leads</p>
                <p className="text-xs text-muted-foreground mt-1">Use os filtros para encontrar empresas com o perfil ideal</p>
              </div>
            </button>

            {/* Iniciar Campanha */}
            <button
              onClick={() => navigate('/admin/disparos')}
              className="bg-card hover:bg-accent/5 border border-border hover:border-accent/50 rounded-lg md:rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-all duration-200 group text-left"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-accent/10 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                <MessageCircle size={18} className="md:w-6 md:h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Iniciar Campanha</p>
                <p className="text-xs text-muted-foreground mt-1">Envie mensagens personalizadas para seus leads</p>
              </div>
            </button>

            {/* Gerenciar Conexões */}
            <button
              onClick={() => navigate('/admin/conexoes')}
              className="bg-card hover:bg-accent/5 border border-border hover:border-accent/50 rounded-lg md:rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-all duration-200 group text-left"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-accent/10 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                <Phone size={18} className="md:w-6 md:h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Gerenciar Conexões</p>
                <p className="text-xs text-muted-foreground mt-1">Configure suas contas do WhatsApp</p>
              </div>
            </button>

            {/* Ver Histórico */}
            <button
              onClick={() => navigate('/admin/historico')}
              className="bg-card hover:bg-accent/5 border border-border hover:border-accent/50 rounded-lg md:rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-all duration-200 group text-left"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-accent/10 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                <Activity size={18} className="md:w-6 md:h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Ver Histórico</p>
                <p className="text-xs text-muted-foreground mt-1">Acompanhe o histórico completo das suas campanhas</p>
              </div>
            </button>
          </div>
        </div>

        {/* Últimos Disparos - Mobile Segundo */}
        <div className="mb-4 md:mb-6">
          <div className="border-t border-border pt-6 mb-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">Últimos Disparos</h2>
              <button
                onClick={() => navigate('/admin/campanhas')}
                className="text-xs md:text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
              >
                Ver todos
                <ChevronRight size={12} className="md:w-3.5 md:h-3.5" />
              </button>
            </div>
          </div>
          
          {ultimosDisparos.length === 0 ? (
            <div className="bg-card border border-border rounded-lg md:rounded-xl p-4 md:p-6 text-center">
              <MessageCircle className="mx-auto h-8 w-8 md:h-12 md:w-12 text-muted-foreground mb-2 md:mb-3" />
              <h3 className="text-sm font-medium text-foreground mb-1">Nenhum disparo realizado</h3>
              <p className="text-xs text-muted-foreground">Comece criando sua primeira campanha</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {ultimosDisparos.map((disparo) => (
                <button
                  key={disparo.id}
                  onClick={() => navigate('/admin/campanhas')}
                  className="bg-card hover:bg-accent/5 border border-border hover:border-accent/50 rounded-lg md:rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-all duration-200 group text-left"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-accent/10 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                    <MessageCircle size={18} className="md:w-6 md:h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate mb-1">{disparo.nome}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{formatDate(disparo.criado_em)}</p>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-muted/30 rounded-lg px-1.5 py-0.5">
                        <Users size={11} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {disparo.total_empresas}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 rounded-lg px-1.5 py-0.5">
                        <CheckCircle size={11} className="text-green-600" />
                        <span className="text-xs font-medium text-green-600">
                          {disparo.total_enviados}
                        </span>
                      </div>
                      
                      {disparo.total_erros > 0 && (
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 rounded-lg px-1.5 py-0.5">
                          <AlertCircle size={11} className="text-red-600" />
                          <span className="text-xs font-medium text-red-600">
                            {disparo.total_erros}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className={`mt-2 px-2 py-0.5 rounded-lg text-xs font-medium inline-block ${getStatusColor(disparo.status)}`}>
                      {getStatusLabel(disparo.status)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default DashboardPage;