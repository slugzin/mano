import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import PageHeader from '../../components/ui/PageHeader';
import { 
  Calendar, 
  MessageSquare, 
  Users, 
  Star, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Eye,
  TrendingUp,
  Building,
  Phone,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../../components/ui/LoadingScreen';

interface CampanhaDisparo {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  status: string;
  total_empresas: number;
  total_enviados: number;
  total_erros: number;
  mensagem: string;
  tipo_midia: string;
  midia_url: string;
  conexao_id: string;
  empresas_detalhes: any[];
  empresas_resumo: string;
  modalidade_pesquisa: string;
  status_empresas: string;
  avaliacao_media: number;
  total_avaliacoes_soma: number;
  categorias_encontradas: string[];
  cidades_encontradas: string[];
  tipo_campanha: string;
  criado_em: string;
  atualizado_em: string;
}

interface EmpresaCampanha {
  id: string;
  empresa_id: string;
  empresa_nome: string;
  empresa_telefone: string;
  empresa_website?: string;
  empresa_endereco?: string;
  mensagem: string;
  tipo_midia: string;
  midia_url?: string;
  status: string;
  agendado_para: string;
  criado_em: string;
  conexao_id: string;
  created_at: string;
  updated_at: string;
  // Dados adicionais da empresa
  avaliacao?: number;
  categoria?: string;
  total_avaliacoes?: number;
  posicao?: number;
}

const STATUS_COLORS = {
  em_andamento: 'bg-blue-100 text-blue-800 border-blue-200',
  concluida: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-red-100 text-red-800 border-red-200',
  pausada: 'bg-yellow-100 text-yellow-800 border-yellow-200'
};

const STATUS_LABELS = {
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  pausada: 'Pausada'
};

const DisparosHistoricoPage: React.FC = () => {
  const [campanhas, setCampanhas] = useState<CampanhaDisparo[]>([]);
  const [empresasCampanha, setEmpresasCampanha] = useState<Record<string, EmpresaCampanha[]>>({});
  const [campanhaExpandida, setCampanhaExpandida] = useState<string | null>(null);
  const [empresasVisiveis, setEmpresasVisiveis] = useState<Record<string, number>>({});
  const [metricasReais, setMetricasReais] = useState<Record<string, { total: number; enviados: number; processando: number; pendentes: number; erros: number }>>({});
  const [loading, setLoading] = useState(true);
  const [loadingEmpresas, setLoadingEmpresas] = useState<string | null>(null);
  const [fluxoMensagens, setFluxoMensagens] = useState<Record<string, any[]>>({});
  const [fluxoNomes, setFluxoNomes] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampanhas();
  }, []);

  const fetchCampanhas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campanhas_disparo')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setCampanhas(data || []);

      // Carregar métricas reais para cada campanha
      if (data) {
        const metricas: Record<string, { total: number; enviados: number; processando: number; pendentes: number; erros: number }> = {};
        
        for (const campanha of data) {
          const metrica = await getDisparosMetrics(campanha.conexao_id, campanha);
          metricas[campanha.id] = metrica;
        }
        
        setMetricasReais(metricas);
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    }
    setLoading(false);
  };

  const fetchFluxoMensagens = async (campanhaId: string) => {
    if (fluxoMensagens[campanhaId]) return; // Já carregadas

    try {
      const campanha = campanhas.find(c => c.id === campanhaId);
      if (!campanha || campanha.tipo_campanha !== 'fluxo') return;

      // Buscar disparos desta campanha para extrair as mensagens únicas
      const { data, error } = await supabase
        .from('disparos_agendados')
        .select('mensagem, ordem, fase, fluxo_id')
        .eq('conexao_id', campanha.conexao_id)
        .order('ordem', { ascending: true });

      if (error) throw error;

      // Buscar nome do fluxo se houver fluxo_id
      let nomeFluxo = 'Fluxo Personalizado';
      if (data && data.length > 0 && data[0].fluxo_id) {
        const { data: fluxoData } = await supabase
          .from('fluxos')
          .select('nome')
          .eq('id', data[0].fluxo_id)
          .single();
        
        if (fluxoData) {
          nomeFluxo = fluxoData.nome;
        }
      }

      setFluxoNomes(prev => ({
        ...prev,
        [campanhaId]: nomeFluxo
      }));

      if (error) throw error;

      // Agrupar mensagens por ordem
      const mensagensUnicas = data?.reduce((acc: any[], disparo: any) => {
        const existing = acc.find(m => m.mensagem === disparo.mensagem);
        if (!existing) {
          acc.push({
            mensagem: disparo.mensagem,
            ordem: disparo.ordem,
            fase: disparo.fase
          });
        }
        return acc;
      }, []);

      setFluxoMensagens(prev => ({
        ...prev,
        [campanhaId]: mensagensUnicas || []
      }));
    } catch (error) {
      console.error('Erro ao carregar mensagens do fluxo:', error);
    }
  };

  const fetchEmpresasCampanha = async (campanhaId: string) => {
    if (empresasCampanha[campanhaId]) return; // Já carregadas

    setLoadingEmpresas(campanhaId);
    try {
      // Buscar a campanha para obter as empresas contactadas
      const campanha = campanhas.find(c => c.id === campanhaId);
      if (!campanha || !campanha.empresas_detalhes) {
        setEmpresasCampanha(prev => ({
          ...prev,
          [campanhaId]: []
        }));
        return;
      }

      // Extrair IDs das empresas contactadas da campanha
      const empresasContactadas = campanha.empresas_detalhes;
      const telefonesContactados = empresasContactadas.map((empresa: any) => empresa.telefone);

      // Buscar apenas as empresas que foram realmente contactadas
      const { data, error } = await supabase
        .from('disparos_agendados')
        .select('*')
        .eq('conexao_id', campanha.conexao_id)
        .order('criado_em', { ascending: true });

      if (error) throw error;

      // Combinar dados da campanha com status real dos disparos
      const empresasComStatus = empresasContactadas.map((empresaContactada: any) => {
        // Buscar disparo por empresa_id (mais confiável) ou telefone
        const disparoReal = data?.find(d => 
          d.empresa_id === empresaContactada.id || 
          d.empresa_telefone === empresaContactada.telefone ||
          d.empresa_telefone === empresaContactada.telefone?.replace(/[^\d+]/g, '') // Remove formatação
        );
        
        return {
          id: disparoReal?.id || `temp_${empresaContactada.id}`,
          empresa_id: empresaContactada.id.toString(),
          empresa_nome: empresaContactada.nome || empresaContactada.titulo,
          empresa_telefone: empresaContactada.telefone,
          empresa_website: empresaContactada.website,
          empresa_endereco: empresaContactada.endereco,
          mensagem: campanha.mensagem,
          tipo_midia: campanha.tipo_midia || 'texto',
          midia_url: campanha.midia_url,
          status: disparoReal?.status || 'pendente',
          agendado_para: disparoReal?.agendado_para || campanha.criado_em,
          criado_em: disparoReal?.criado_em || campanha.criado_em,
          conexao_id: campanha.conexao_id,
          created_at: disparoReal?.created_at || campanha.criado_em,
          updated_at: disparoReal?.updated_at || campanha.atualizado_em,
          // Dados adicionais da empresa
          avaliacao: empresaContactada.avaliacao,
          categoria: empresaContactada.categoria,
          total_avaliacoes: empresaContactada.total_avaliacoes,
          posicao: empresaContactada.posicao
        };
      });

      setEmpresasCampanha(prev => ({
        ...prev,
        [campanhaId]: empresasComStatus
      }));
      
      // Recalcular métricas da campanha após carregar empresas
      const metricasAtualizadas = await getDisparosMetrics(campanha.conexao_id, campanha);
      setMetricasReais(prev => ({
        ...prev,
        [campanhaId]: metricasAtualizadas
      }));

      // Verificar se o status da campanha precisa ser atualizado
      const statusAtual = campanha.status;
      const statusCalculado = getCampanhaStatus({ ...campanha, id: campanhaId });
      
      if (statusAtual !== statusCalculado) {
        await atualizarStatusCampanha(campanhaId, statusCalculado);
        
        // Atualizar o status na lista local
        setCampanhas(prev => prev.map(c => 
          c.id === campanhaId 
            ? { ...c, status: statusCalculado }
            : c
        ));
      }
    } catch (error) {
      console.error('Erro ao carregar empresas da campanha:', error);
    }
    setLoadingEmpresas(null);
  };

  const toggleCampanha = async (campanhaId: string) => {
    if (campanhaExpandida === campanhaId) {
      setCampanhaExpandida(null);
    } else {
      setCampanhaExpandida(campanhaId);
      fetchEmpresasCampanha(campanhaId);
      
      // Se for fluxo, carregar mensagens do fluxo
      const campanha = campanhas.find(c => c.id === campanhaId);
      if (campanha?.tipo_campanha === 'fluxo') {
        fetchFluxoMensagens(campanhaId);
      }
      
      // Recalcular métricas da campanha
      if (campanha) {
        const metricasAtualizadas = await getDisparosMetrics(campanha.conexao_id, campanha);
        setMetricasReais(prev => ({
          ...prev,
          [campanhaId]: metricasAtualizadas
        }));

        // Verificar se o status da campanha precisa ser atualizado
        const statusAtual = campanha.status;
        const statusCalculado = getCampanhaStatus({ ...campanha, id: campanhaId });
        
        if (statusAtual !== statusCalculado) {
          await atualizarStatusCampanha(campanhaId, statusCalculado);
          
          // Atualizar o status na lista local
          setCampanhas(prev => prev.map(c => 
            c.id === campanhaId 
              ? { ...c, status: statusCalculado }
              : c
          ));
        }
      }
      
      // Inicializar com 3 empresas visíveis
      setEmpresasVisiveis(prev => ({ ...prev, [campanhaId]: 3 }));
    }
  };

  const verMaisEmpresas = (campanhaId: string) => {
    const atual = empresasVisiveis[campanhaId] || 5;
    const total = empresasCampanha[campanhaId]?.length || 0;
    const proximo = Math.min(atual + 10, total);
    setEmpresasVisiveis(prev => ({ ...prev, [campanhaId]: proximo }));
  };

  // Função para redirecionar para conversas
  const redirectToConversas = (empresa: EmpresaCampanha) => {
    // Só redireciona se o status for 'enviado' ou 'concluido'
    if (empresa.status === 'enviado' || empresa.status === 'concluido') {
      // Extrair apenas os números do telefone para busca
      const telefoneNumeros = empresa.empresa_telefone.replace(/[^\d]/g, '');
      navigate(`/admin/conversas?telefone=${telefoneNumeros}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSuccessRate = (campanha: CampanhaDisparo) => {
    if (campanha.total_empresas === 0) return 0;
    return Math.round((campanha.total_enviados / campanha.total_empresas) * 100);
  };

  const getCampanhaStatus = (campanha: CampanhaDisparo) => {
    const metricas = metricasReais[campanha.id];
    if (!metricas) return campanha.status;

    const totalEmpresas = campanha.empresas_detalhes?.length || 0;
    const enviados = metricas.enviados || 0;
    const processando = metricas.processando || 0;
    const erros = metricas.erros || 0;

    // Se todas as empresas foram processadas (enviadas + erros)
    if (enviados + erros >= totalEmpresas) {
      return 'concluida';
    }
    
    // Se há pelo menos uma mensagem enviada ou processando
    if (enviados > 0 || processando > 0) {
      return 'em_andamento';
    }
    
    // Se ainda não começou
    return 'pendente';
  };

  const atualizarStatusCampanha = async (campanhaId: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('campanhas_disparo')
        .update({ 
          status: novoStatus,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', campanhaId);

      if (error) {
        console.error('Erro ao atualizar status da campanha:', error);
      }
    } catch (error) {
      console.error('Erro ao atualizar status da campanha:', error);
    }
  };

  const getDisparosMetrics = async (conexaoId: string, campanha?: CampanhaDisparo) => {
    try {
      if (!campanha || !campanha.empresas_detalhes) {
        return { total: 0, enviados: 0, processando: 0, pendentes: 0, erros: 0 };
      }

      // Buscar todos os disparos desta campanha (conexao_id)
      const { data, error } = await supabase
        .from('disparos_agendados')
        .select('status, empresa_id')
        .eq('conexao_id', conexaoId);

      if (error) throw error;

      // Filtrar apenas disparos das empresas que estão na campanha
      const empresasIds = campanha.empresas_detalhes.map((empresa: any) => empresa.id);
      const disparosFiltrados = data?.filter(d => empresasIds.includes(d.empresa_id)) || [];

      const total = disparosFiltrados.length;
      const enviados = disparosFiltrados.filter(d => d.status === 'enviado').length;
      const processando = disparosFiltrados.filter(d => d.status === 'processando').length;
      const pendentes = disparosFiltrados.filter(d => d.status === 'pendente').length;
      const erros = disparosFiltrados.filter(d => d.status === 'erro').length;

      return { total, enviados, processando, pendentes, erros };
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      return { total: 0, enviados: 0, processando: 0, pendentes: 0, erros: 0 };
    }
  };

  if (loading) {
    return <LoadingScreen page="historico" />;
  }

  return (
    <div className="min-h-full bg-background p-2 md:p-6">
      <div className="page-content-wrapper">
        {/* Layout Desktop */}
        <div className="hidden md:block">
          <PageHeader 
            title="Histórico de Disparos" 
            subtitle="Acompanhe todas as campanhas realizadas"
          />

          {campanhas.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma campanha encontrada</h3>
              <p className="text-muted-foreground mb-6">Crie sua primeira campanha na aba Disparos</p>
              <button
                onClick={() => navigate('/admin/leads')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-medium transition-colors shadow-sm"
              >
                <Target size={20} />
                Buscar Empresas para Disparar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campanhas.map((campanha, index) => (
                <motion.div
                  key={campanha.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05
                  }}
                  className="bg-card rounded-lg border border-border hover:border-purple-200 transition-colors overflow-hidden"
                >
                  {/* Linha decorativa roxa */}
                  <div className="h-1 bg-purple-500"></div>
                  
                  {/* Header da Campanha */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => toggleCampanha(campanha.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Info Principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-medium text-foreground truncate">
                              {campanha.nome}
                            </h3>
                            {campanha.tipo_campanha === 'fluxo' && fluxoNomes[campanha.id] && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {fluxoNomes[campanha.id]}
                              </p>
                            )}
                          </div>
                          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                            {campanha.tipo_campanha === 'template' ? 'Template' : 'Fluxo'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(campanha.criado_em).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {campanha.empresas_detalhes?.length || 0} empresas contactadas
                          </div>
                          {campanha.avaliacao_media && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              {campanha.avaliacao_media.toFixed(1)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Métricas e Controles - Design Minimalista */}
                      <div className="flex items-center justify-between">
                        {/* Métricas Simples */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{metricasReais[campanha.id]?.enviados || 0} enviados</span>
                          <span>•</span>
                          <span>{campanha.empresas_detalhes?.length || 0} empresas</span>
                          <span>•</span>
                          <span className="text-purple-600 font-medium">
                            {campanha.empresas_detalhes?.length ? Math.round((metricasReais[campanha.id]?.enviados || 0) / campanha.empresas_detalhes.length * 100) : 0}% concluído
                          </span>
                        </div>

                        {/* Botão Expandir Simples */}
                        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                          {campanhaExpandida === campanha.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes Expandidos - Desktop */}
                  <AnimatePresence>
                    {campanhaExpandida === campanha.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border p-4 bg-muted/5">
                          {/* Layout Simplificado - Informações Essenciais */}
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                            {/* Conexão */}
                            <div className="bg-background border border-border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Phone className="h-4 w-4 text-green-600" />
                                <span className="text-xs font-medium text-muted-foreground">Conexão</span>
                              </div>
                              <p className="text-sm font-medium text-foreground">{campanha.conexao_id}</p>
                            </div>

                            {/* Categorias */}
                            {campanha.categorias_encontradas && campanha.categorias_encontradas.length > 0 && (
                              <div className="bg-background border border-border rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Building className="h-4 w-4 text-purple-600" />
                                  <span className="text-xs font-medium text-muted-foreground">Categorias</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {campanha.categorias_encontradas.slice(0, 2).map((categoria) => (
                                    <span key={categoria} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
                                      {categoria}
                                    </span>
                                  ))}
                                  {campanha.categorias_encontradas.length > 2 && (
                                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full border border-border">
                                      +{campanha.categorias_encontradas.length - 2}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Taxa de Sucesso */}
                            <div className="bg-background border border-border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-xs font-medium text-muted-foreground">Taxa de Sucesso</span>
                              </div>
                              <p className="text-lg font-bold text-green-600">
                                {campanha.total_empresas > 0 
                                  ? ((campanha.total_enviados / campanha.total_empresas) * 100).toFixed(1) 
                                  : 0}%
                              </p>
                            </div>

                            {/* Empresas Contactadas */}
                            <div className="bg-background border border-border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Target className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-medium text-muted-foreground">Empresas</span>
                              </div>
                              <p className="text-lg font-bold text-blue-600">
                                {campanha.empresas_detalhes?.length || 0}
                              </p>
                            </div>
                          </div>

                          {/* Mensagem Enviada - Versão Compacta */}
                          {campanha.mensagem && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                {campanha.tipo_campanha === 'fluxo' ? 'Sequência de Mensagens' : 'Mensagem Enviada'}
                              </h4>
                              
                              {campanha.tipo_campanha === 'fluxo' && fluxoMensagens[campanha.id] ? (
                                <div className="bg-background border border-border rounded-lg p-3 max-h-40 overflow-y-auto">
                                  <div className="space-y-2">
                                    {fluxoMensagens[campanha.id].slice(0, 3).map((mensagem, index) => (
                                      <div key={index} className="text-sm">
                                        <span className="font-medium text-purple-600">#{mensagem.ordem}</span>
                                        <span className="text-muted-foreground ml-2">{mensagem.mensagem.substring(0, 100)}...</span>
                                      </div>
                                    ))}
                                    {fluxoMensagens[campanha.id].length > 3 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{fluxoMensagens[campanha.id].length - 3} mensagens no fluxo
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-background border border-border rounded-lg p-3">
                                  <p className="text-sm text-foreground line-clamp-3">{campanha.mensagem}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Lista de Empresas Contactadas */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-foreground">
                                Empresas Contactadas ({campanha.empresas_detalhes?.length || 0})
                              </h4>
                              <button
                                onClick={() => fetchEmpresasCampanha(campanha.id)}
                                className="text-accent hover:text-accent/80 text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                {empresasCampanha[campanha.id] ? 'Atualizar' : 'Carregar empresas'}
                              </button>
                            </div>

                            {loadingEmpresas === campanha.id ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                              </div>
                            ) : empresasCampanha[campanha.id] ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {empresasCampanha[campanha.id]?.map((empresa) => (
                                  <div key={empresa.id} className="bg-card rounded-lg p-3 border border-border">
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="font-medium text-sm text-foreground truncate pr-2">
                                        {empresa.empresa_nome}
                                      </h5>
                                      <div className="flex-shrink-0">
                                        {empresa.status === 'pendente' && <Clock className="h-4 w-4 text-yellow-500" />}
                                        {empresa.status === 'processando' && <Clock className="h-4 w-4 text-blue-500" />}
                                        {empresa.status === 'enviado' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                        {empresa.status === 'erro' && <XCircle className="h-4 w-4 text-red-500" />}
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      {/* Status */}
                                      <p className="text-xs text-muted-foreground">
                                        Status: <span className={`font-medium ${
                                          empresa.status === 'enviado' ? 'text-green-600' : 
                                          empresa.status === 'processando' ? 'text-blue-600' : 
                                          empresa.status === 'erro' ? 'text-red-600' : 
                                          'text-yellow-600'
                                        }`}>
                                          {empresa.status === 'pendente' ? 'Pendente' : 
                                           empresa.status === 'processando' ? 'Processando' : 
                                           empresa.status === 'enviado' ? 'Enviado' : 'Erro'}
                                        </span>
                                      </p>
                                      
                                      {/* Avaliação */}
                                      {empresa.avaliacao && (
                                        <p className="text-xs text-muted-foreground">
                                          Avaliação: <span className="font-medium text-foreground">
                                            {empresa.avaliacao.toFixed(1)}⭐ ({empresa.total_avaliacoes || 0})
                                          </span>
                                        </p>
                                      )}
                                      
                                      {/* Categoria */}
                                      {empresa.categoria && (
                                        <p className="text-xs text-muted-foreground">
                                          Categoria: <span className="font-medium text-foreground">{empresa.categoria}</span>
                                        </p>
                                      )}
                                      
                                      {/* Telefone */}
                                      <p className="text-xs text-muted-foreground">
                                        Tel: <span className="font-medium text-foreground">{empresa.empresa_telefone}</span>
                                      </p>
                                      

                                      
                                      {/* Datas */}
                                      <p className="text-xs text-muted-foreground">
                                        Agendado: {new Date(empresa.criado_em).toLocaleString('pt-BR')}
                                      </p>
                                      
                                      {empresa.status === 'enviado' && (
                                        <p className="text-xs text-green-600">
                                          Enviado: {new Date(empresa.updated_at).toLocaleString('pt-BR')}
                                        </p>
                                      )}
                                      
                                      {empresa.status === 'erro' && (
                                        <p className="text-xs text-red-600">
                                          Erro: Falha no envio
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                Clique em "Carregar empresas" para ver os detalhes
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Layout Mobile */}
        <div className="md:hidden">
          {/* Header Mobile */}
          <div className="flex items-center gap-3 p-3 border-b border-border bg-background">
            <Clock className="text-primary" size={20} />
            <div>
              <h1 className="text-base font-medium text-foreground">Histórico</h1>
              <p className="text-xs text-muted-foreground">Campanhas realizadas</p>
            </div>
          </div>

          {/* Conteúdo Mobile */}
          <div className="p-3">
                       {campanhas.length === 0 ? (
               <div className="text-center py-8">
                 <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                 <h3 className="text-base font-medium text-foreground mb-1">Nenhuma campanha</h3>
                 <p className="text-xs text-muted-foreground mb-4">Crie disparos na aba correspondente</p>
                 <button
                   onClick={() => navigate('/admin/leads')}
                   className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-medium transition-colors shadow-sm text-xs"
                 >
                   <Target size={14} />
                   Buscar Empresas
                 </button>
               </div>
            ) : (
              <div className="space-y-3">
                {campanhas.map((campanha, index) => (
                  <motion.div
                    key={campanha.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.2, 
                      delay: index * 0.03
                    }}
                    className="bg-card rounded-lg border border-border overflow-hidden"
                  >
                    {/* Linha decorativa roxa mobile */}
                    <div className="h-0.5 bg-purple-500"></div>
                    {/* Header Mobile da Campanha */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/5 transition-colors"
                      onClick={() => toggleCampanha(campanha.id)}
                    >
                      {/* Primeira linha: Nome da Campanha (Completo) */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MessageSquare size={16} className="text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground leading-tight mb-1">
                            {campanha.nome}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {new Date(campanha.criado_em).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      {/* Segunda linha: Métricas Simples - Mobile */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{metricasReais[campanha.id]?.enviados || 0} enviados</span>
                          <span>•</span>
                          <span>{metricasReais[campanha.id]?.total || 0} empresas</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-purple-600 font-medium">
                            {metricasReais[campanha.id]?.total ? Math.round((metricasReais[campanha.id].enviados / metricasReais[campanha.id].total) * 100) : 0}%
                          </span>
                          <button className="p-1 text-muted-foreground">
                            {campanhaExpandida === campanha.id ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>
                        </div>
                      </div>


                    </div>

                    {/* Detalhes Expandidos - Mobile */}
                    <AnimatePresence>
                      {campanhaExpandida === campanha.id && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border p-2.5 bg-muted/5 space-y-2.5">
                            {/* Status e Tipo da Campanha */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${STATUS_COLORS[getCampanhaStatus(campanha) as keyof typeof STATUS_COLORS]}`}>
                                {STATUS_LABELS[getCampanhaStatus(campanha) as keyof typeof STATUS_LABELS]}
                              </span>
                              <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                                campanha.tipo_campanha === 'template' 
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' 
                                  : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                              }`}>
                                {campanha.tipo_campanha === 'template' ? 'Template' : 'Fluxo'}
                              </span>
                            </div>

                            {/* Informações Compactas */}
                            <div className="grid grid-cols-2 gap-1.5 text-xs">
                              <div className="bg-background rounded-lg p-1.5">
                                <span className="text-muted-foreground block text-[8px]">Conexão</span>
                                <span className="text-foreground font-medium text-[10px]">{campanha.conexao_id}</span>
                              </div>
                              <div className="bg-background rounded-lg p-1.5">
                                <span className="text-muted-foreground block text-[8px]">Modalidade</span>
                                <span className="text-foreground text-[10px]">{campanha.modalidade_pesquisa || 'N/A'}</span>
                              </div>
                              {campanha.avaliacao_media && (
                                <div className="bg-background rounded-lg p-1.5">
                                  <span className="text-muted-foreground block text-[8px]">Avaliação</span>
                                  <span className="text-foreground font-medium text-[10px]">{campanha.avaliacao_media.toFixed(1)}⭐</span>
                                </div>
                              )}
                              <div className="bg-background rounded-lg p-1.5">
                                <span className="text-muted-foreground block text-[8px]">Taxa Sucesso</span>
                                <span className="text-accent font-medium text-[10px]">
                                  {campanha.empresas_detalhes?.length ? 
                                    Math.round((metricasReais[campanha.id]?.enviados || 0) / campanha.empresas_detalhes.length * 100) : 0}%
                                </span>
                              </div>
                            </div>

                            {/* Mensagem Mobile */}
                            {campanha.mensagem && (
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                                  {campanha.tipo_campanha === 'fluxo' ? 'SEQUÊNCIA DE MENSAGENS' : 'MENSAGEM'}
                                </h4>
                                
                                {campanha.tipo_campanha === 'fluxo' && fluxoMensagens[campanha.id] ? (
                                  <div className="space-y-2">
                                    {fluxoMensagens[campanha.id].map((mensagem, index) => (
                                      <div key={index} className="bg-background border border-border rounded-lg p-2">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="flex items-center justify-center w-5 h-5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                                            {mensagem.ordem}
                                          </div>
                                          <span className="text-[10px] text-muted-foreground font-medium">
                                            {mensagem.fase} • Ordem {mensagem.ordem}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-foreground ml-7 line-clamp-2">
                                          {mensagem.mensagem}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="bg-background border border-border rounded-lg p-1.5">
                                    <p className="text-xs text-foreground line-clamp-2">{campanha.mensagem}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Cidades e Categorias Mobile */}
                            <div className="space-y-1.5">
                              {campanha.cidades_encontradas && campanha.cidades_encontradas.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-medium text-muted-foreground mb-1">CIDADES</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {campanha.cidades_encontradas.slice(0, 2).map((cidade) => (
                                      <span key={cidade} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 text-[10px] rounded-full">
                                        {cidade}
                                      </span>
                                    ))}
                                    {campanha.cidades_encontradas.length > 2 && (
                                      <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-full">
                                        +{campanha.cidades_encontradas.length - 2}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {campanha.categorias_encontradas && campanha.categorias_encontradas.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-medium text-muted-foreground mb-1">CATEGORIAS</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {campanha.categorias_encontradas.slice(0, 2).map((categoria) => (
                                      <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-600 text-[10px] rounded-full">
                                        {categoria}
                                      </span>
                                    ))}
                                    {campanha.categorias_encontradas.length > 2 && (
                                      <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-full">
                                        +{campanha.categorias_encontradas.length - 2}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Empresas Mobile */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-medium text-muted-foreground">
                                  EMPRESAS ({metricasReais[campanha.id]?.total || 0})
                                </h4>
                                <button
                                  onClick={() => fetchEmpresasCampanha(campanha.id)}
                                  className="text-accent text-xs font-medium bg-accent/10 px-2 py-1 rounded-lg"
                                >
                                  {empresasCampanha[campanha.id] ? 'Atualizar' : 'Ver mais'}
                                </button>
                              </div>

                              {loadingEmpresas === campanha.id ? (
                                <div className="flex items-center justify-center py-3">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                                </div>
                              ) : empresasCampanha[campanha.id] ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {empresasCampanha[campanha.id]?.slice(0, empresasVisiveis[campanha.id] || 5).map((empresa) => (
                                    <div 
                                      key={empresa.id} 
                                      className={`bg-background rounded-lg p-2 border border-border transition-colors ${
                                        empresa.status === 'enviado' || empresa.status === 'concluido' 
                                          ? 'cursor-pointer hover:bg-accent/5 hover:border-accent/40' 
                                          : ''
                                      }`}
                                      onClick={() => redirectToConversas(empresa)}
                                      title={
                                        empresa.status === 'enviado' || empresa.status === 'concluido' 
                                          ? 'Clique para ver a conversa' 
                                          : ''
                                      }
                                    >
                                      {/* Header do Card */}
                                      <div className="flex items-start justify-between mb-2">
                                        <h5 className="text-xs font-medium text-foreground truncate pr-2 flex-1">
                                          {empresa.empresa_nome}
                                        </h5>
                                        <div className="flex-shrink-0">
                                          {empresa.status === 'pendente' && <Clock className="h-3 w-3 text-yellow-500" />}
                                          {empresa.status === 'processando' && <Clock className="h-3 w-3 text-blue-500" />}
                                          {empresa.status === 'enviado' && <CheckCircle className="h-3 w-3 text-green-500" />}
                                          {empresa.status === 'erro' && <XCircle className="h-3 w-3 text-red-500" />}
                                        </div>
                                      </div>
                                      
                                      {/* Status */}
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                          empresa.status === 'enviado' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 
                                          empresa.status === 'processando' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 
                                          empresa.status === 'erro' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 
                                          'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20'
                                        }`}>
                                          {empresa.status === 'pendente' ? 'Pendente' : 
                                           empresa.status === 'processando' ? 'Processando' : 
                                           empresa.status === 'enviado' ? 'Enviado' : 'Erro'}
                                        </span>
                                        {empresa.status === 'enviado' && (
                                          <span className="text-[10px] text-muted-foreground">
                                            {new Date(empresa.updated_at).toLocaleDateString('pt-BR')}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Detalhes da Empresa */}
                                      <div className="space-y-1">
                                        {/* Avaliação */}
                                        {empresa.avaliacao && (
                                          <div className="flex items-center gap-1">
                                            <Star className="h-3 w-3 text-yellow-500" />
                                            <span className="text-[10px] text-muted-foreground">
                                              {empresa.avaliacao.toFixed(1)}⭐ ({empresa.total_avaliacoes || 0})
                                            </span>
                                          </div>
                                        )}
                                        
                                        {/* Categoria */}
                                        {empresa.categoria && (
                                          <div className="flex items-center gap-1">
                                            <Building className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground">
                                              {empresa.categoria}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {/* Telefone */}
                                        <div className="flex items-center gap-1">
                                          <Phone className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-[10px] text-muted-foreground">
                                            {empresa.empresa_telefone}
                                          </span>
                                        </div>
                                        
                                        {/* Data Agendada */}
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-[10px] text-muted-foreground">
                                            Agendado: {new Date(empresa.criado_em).toLocaleString('pt-BR')}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {empresasCampanha[campanha.id] && (empresasVisiveis[campanha.id] || 5) < empresasCampanha[campanha.id].length && (
                                    <button
                                      onClick={() => verMaisEmpresas(campanha.id)}
                                      className="w-full text-center py-2 text-accent text-xs font-medium bg-accent/5 rounded-lg border border-accent/20 hover:bg-accent/10 transition-colors"
                                    >
                                      Ver mais {empresasCampanha[campanha.id].length - (empresasVisiveis[campanha.id] || 5)} empresas
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-3 text-xs text-muted-foreground bg-background rounded-lg border border-border">
                                  Toque em "Ver mais" para carregar empresas
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisparosHistoricoPage; 