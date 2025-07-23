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
  criado_em: string;
  atualizado_em: string;
}

interface EmpresaCampanha {
  id: string;
  campanha_id: string;
  empresa_id: string;
  empresa_nome: string;
  status: string;
  erro_mensagem?: string;
  enviado_em?: string;
  criado_em: string;
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
  const [loading, setLoading] = useState(true);
  const [loadingEmpresas, setLoadingEmpresas] = useState<string | null>(null);
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
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    }
    setLoading(false);
  };

  const fetchEmpresasCampanha = async (campanhaId: string) => {
    if (empresasCampanha[campanhaId]) return; // Já carregadas

    setLoadingEmpresas(campanhaId);
    try {
        const { data, error } = await supabase
        .from('campanhas_empresas')
        .select('*')
        .eq('campanha_id', campanhaId)
        .order('criado_em', { ascending: true });

      if (error) throw error;
      setEmpresasCampanha(prev => ({
        ...prev,
        [campanhaId]: data || []
      }));
    } catch (error) {
      console.error('Erro ao carregar empresas da campanha:', error);
    }
    setLoadingEmpresas(null);
  };

  const toggleCampanha = (campanhaId: string) => {
    if (campanhaExpandida === campanhaId) {
      setCampanhaExpandida(null);
    } else {
      setCampanhaExpandida(campanhaId);
      fetchEmpresasCampanha(campanhaId);
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

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader 
          title="Histórico de Disparos" 
          subtitle="Acompanhe todas as campanhas realizadas"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Layout Desktop */}
      <div className="hidden md:block p-6 max-w-7xl mx-auto">
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
            {campanhas.map((campanha) => (
              <motion.div
                key={campanha.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
              >
                {/* Header da Campanha */}
                <div 
                  className="p-6 cursor-pointer hover:bg-muted/5 transition-colors"
                  onClick={() => toggleCampanha(campanha.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Info Principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground truncate">
                          {campanha.nome}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[campanha.status as keyof typeof STATUS_COLORS]}`}>
                          {STATUS_LABELS[campanha.status as keyof typeof STATUS_LABELS]}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(campanha.criado_em).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {campanha.total_empresas} empresas
                        </div>
                        {campanha.avaliacao_media && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {campanha.avaliacao_media.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Métricas e Controles */}
                    <div className="flex items-center gap-4">
                      {/* Progresso */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-green-600">{campanha.total_enviados}</div>
                            <div className="text-xs text-muted-foreground">Enviados</div>
                          </div>
                          {campanha.total_erros > 0 && (
                            <div className="text-center">
                              <div className="text-xl font-bold text-red-600">{campanha.total_erros}</div>
                              <div className="text-xs text-muted-foreground">Erros</div>
                            </div>
                          )}
                        </div>
                        
                        {/* Barra de Progresso */}
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.round((campanha.total_enviados / campanha.total_empresas) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((campanha.total_enviados / campanha.total_empresas) * 100)}% concluído
                        </div>
                      </div>

                      {/* Botão Expandir */}
                      <button className="p-2 hover:bg-muted/10 rounded-lg transition-colors">
                        {campanhaExpandida === campanha.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
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
                      <div className="border-t border-border p-6 bg-muted/5">
                        {/* Informações Detalhadas */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Detalhes da Campanha</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Conexão:</span>
                                  <span className="text-foreground font-medium">{campanha.conexao_id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Modalidade:</span>
                                  <span className="text-foreground">{campanha.modalidade_pesquisa || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Status Empresas:</span>
                                  <span className="text-foreground">{campanha.status_empresas || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Tipo de Mídia:</span>
                                  <span className="text-foreground">{campanha.tipo_midia || 'Texto'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Cidades */}
                            {campanha.cidades_encontradas && campanha.cidades_encontradas.length > 0 && (
                              <div>
                                <h4 className="font-medium text-foreground mb-2">Cidades</h4>
                                <div className="flex flex-wrap gap-1">
                                  {campanha.cidades_encontradas.slice(0, 5).map((cidade) => (
                                    <span key={cidade} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      {cidade}
                                    </span>
                                  ))}
                                  {campanha.cidades_encontradas.length > 5 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                      +{campanha.cidades_encontradas.length - 5} mais
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            {/* Categorias */}
                            {campanha.categorias_encontradas && campanha.categorias_encontradas.length > 0 && (
                              <div>
                                <h4 className="font-medium text-foreground mb-2">Categorias</h4>
                                <div className="flex flex-wrap gap-1">
                                  {campanha.categorias_encontradas.slice(0, 4).map((categoria) => (
                                    <span key={categoria} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                      {categoria}
                                    </span>
                                  ))}
                                  {campanha.categorias_encontradas.length > 4 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                      +{campanha.categorias_encontradas.length - 4} mais
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Estatísticas */}
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Estatísticas</h4>
                              <div className="space-y-2 text-sm">
                                {campanha.avaliacao_media && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Avaliação Média:</span>
                                    <span className="text-foreground font-medium">{campanha.avaliacao_media.toFixed(1)}⭐</span>
                                  </div>
                                )}
                                {campanha.total_avaliacoes_soma && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Avaliações:</span>
                                    <span className="text-foreground">{campanha.total_avaliacoes_soma}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Taxa de Sucesso:</span>
                                  <span className="text-foreground font-medium">
                                    {Math.round((campanha.total_enviados / campanha.total_empresas) * 100)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mensagem */}
                        {campanha.mensagem && (
                          <div className="mb-6">
                            <h4 className="font-medium text-foreground mb-2">Mensagem Enviada</h4>
                            <div className="bg-card border border-border rounded-lg p-4">
                              <p className="text-sm text-foreground whitespace-pre-wrap">{campanha.mensagem}</p>
                            </div>
                          </div>
                        )}

                        {/* Lista de Empresas */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-foreground">
                              Empresas Contactadas ({campanha.total_empresas})
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
                                      {empresa.status === 'enviado' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                      {empresa.status === 'erro' && <XCircle className="h-4 w-4 text-red-500" />}
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Status: <span className={`font-medium ${
                                        empresa.status === 'enviado' ? 'text-green-600' : 
                                        empresa.status === 'erro' ? 'text-red-600' : 
                                        'text-yellow-600'
                                      }`}>
                                        {empresa.status === 'pendente' ? 'Pendente' : 
                                         empresa.status === 'enviado' ? 'Enviado' : 'Erro'}
                                      </span>
                                    </p>
                                    
                                    <p className="text-xs text-muted-foreground">
                                      Agendado: {new Date(empresa.criado_em).toLocaleString('pt-BR')}
                                    </p>
                                    
                                    {empresa.enviado_em && (
                                      <p className="text-xs text-green-600">
                                        Enviado: {new Date(empresa.enviado_em).toLocaleString('pt-BR')}
                                      </p>
                                    )}
                                    
                                    {empresa.erro_mensagem && (
                                      <p className="text-xs text-red-600">
                                        Erro: {empresa.erro_mensagem}
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
        <div className="flex items-center gap-3 p-4 border-b border-border bg-background sticky top-0 z-10">
          <Clock className="text-primary" size={24} />
          <div>
            <h1 className="text-lg font-medium text-foreground">Histórico</h1>
            <p className="text-xs text-muted-foreground">Campanhas realizadas</p>
          </div>
        </div>

        {/* Conteúdo Mobile */}
        <div className="p-4">
                     {campanhas.length === 0 ? (
             <div className="text-center py-12">
               <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
               <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma campanha</h3>
               <p className="text-sm text-muted-foreground mb-6">Crie disparos na aba correspondente</p>
               <button
                 onClick={() => navigate('/admin/leads')}
                 className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-medium transition-colors shadow-sm text-sm"
               >
                 <Target size={18} />
                 Buscar Empresas para Disparar
               </button>
             </div>
          ) : (
            <div className="space-y-3">
              {campanhas.map((campanha) => (
                <motion.div
                  key={campanha.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  {/* Header Mobile da Campanha */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/5 transition-colors"
                    onClick={() => toggleCampanha(campanha.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={20} className="text-accent" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground truncate mb-1">
                          {campanha.nome}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[campanha.status as keyof typeof STATUS_COLORS]}`}>
                            {STATUS_LABELS[campanha.status as keyof typeof STATUS_LABELS]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(campanha.criado_em).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <Users size={12} className="text-muted-foreground" />
                              <span className="text-muted-foreground">{campanha.total_empresas}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle size={12} className="text-green-600" />
                              <span className="text-green-600">{campanha.total_enviados}</span>
                            </div>
                            {campanha.total_erros > 0 && (
                              <div className="flex items-center gap-1">
                                <XCircle size={12} className="text-red-600" />
                                <span className="text-red-600">{campanha.total_erros}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-accent">
                              {Math.round((campanha.total_enviados / campanha.total_empresas) * 100)}%
                            </span>
                            {campanhaExpandida === campanha.id ? (
                              <ChevronUp size={16} className="text-muted-foreground" />
                            ) : (
                              <ChevronDown size={16} className="text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        {/* Barra de Progresso Mobile */}
                        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                          <div 
                            className="bg-accent h-1.5 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.round((campanha.total_enviados / campanha.total_empresas) * 100)}%` 
                            }}
                          ></div>
                        </div>
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
                        <div className="border-t border-border p-4 bg-muted/5 space-y-4">
                          {/* Informações Compactas */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground block">Conexão</span>
                              <span className="text-foreground font-medium">{campanha.conexao_id}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Modalidade</span>
                              <span className="text-foreground">{campanha.modalidade_pesquisa || 'N/A'}</span>
                            </div>
                            {campanha.avaliacao_media && (
                              <div>
                                <span className="text-muted-foreground block">Avaliação Média</span>
                                <span className="text-foreground font-medium">{campanha.avaliacao_media.toFixed(1)}⭐</span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground block">Taxa de Sucesso</span>
                              <span className="text-accent font-medium">
                                {Math.round((campanha.total_enviados / campanha.total_empresas) * 100)}%
                              </span>
                            </div>
                          </div>

                          {/* Mensagem Mobile */}
                          {campanha.mensagem && (
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground mb-2">MENSAGEM</h4>
                              <div className="bg-background border border-border rounded-lg p-3">
                                <p className="text-xs text-foreground">{campanha.mensagem}</p>
                              </div>
                            </div>
                          )}

                          {/* Cidades e Categorias Mobile */}
                          <div className="space-y-3">
                            {campanha.cidades_encontradas && campanha.cidades_encontradas.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">CIDADES</h4>
                                <div className="flex flex-wrap gap-1">
                                  {campanha.cidades_encontradas.slice(0, 3).map((cidade) => (
                                    <span key={cidade} className="px-2 py-1 bg-blue-500/10 text-blue-600 text-xs rounded-full">
                                      {cidade}
                                    </span>
                                  ))}
                                  {campanha.cidades_encontradas.length > 3 && (
                                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                                      +{campanha.cidades_encontradas.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {campanha.categorias_encontradas && campanha.categorias_encontradas.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">CATEGORIAS</h4>
                                <div className="flex flex-wrap gap-1">
                                  {campanha.categorias_encontradas.slice(0, 2).map((categoria) => (
                                    <span key={categoria} className="px-2 py-1 bg-purple-500/10 text-purple-600 text-xs rounded-full">
                                      {categoria}
                                    </span>
                                  ))}
                                  {campanha.categorias_encontradas.length > 2 && (
                                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                                      +{campanha.categorias_encontradas.length - 2}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Empresas Mobile */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-medium text-muted-foreground">
                                EMPRESAS ({campanha.total_empresas})
                              </h4>
                              <button
                                onClick={() => fetchEmpresasCampanha(campanha.id)}
                                className="text-accent text-xs font-medium"
                              >
                                {empresasCampanha[campanha.id] ? 'Atualizar' : 'Ver'}
                              </button>
                            </div>

                            {loadingEmpresas === campanha.id ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                              </div>
                            ) : empresasCampanha[campanha.id] ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {empresasCampanha[campanha.id]?.slice(0, 5).map((empresa) => (
                                  <div key={empresa.id} className="bg-background rounded-lg p-3 border border-border">
                                    <div className="flex items-center justify-between mb-1">
                                      <h5 className="text-xs font-medium text-foreground truncate pr-2">
                                        {empresa.empresa_nome}
                                      </h5>
                                      <div className="flex-shrink-0">
                                        {empresa.status === 'pendente' && <Clock className="h-3 w-3 text-yellow-500" />}
                                        {empresa.status === 'enviado' && <CheckCircle className="h-3 w-3 text-green-500" />}
                                        {empresa.status === 'erro' && <XCircle className="h-3 w-3 text-red-500" />}
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {empresa.status === 'pendente' ? 'Pendente' : 
                                       empresa.status === 'enviado' ? 'Enviado' : 'Erro'}
                                      {empresa.enviado_em && ` • ${new Date(empresa.enviado_em).toLocaleDateString('pt-BR')}`}
                                    </p>
                                  </div>
                                ))}
                                {empresasCampanha[campanha.id] && empresasCampanha[campanha.id].length > 5 && (
                                  <div className="text-center py-2">
                                    <span className="text-xs text-muted-foreground">
                                      +{empresasCampanha[campanha.id].length - 5} empresas restantes
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-3 text-xs text-muted-foreground">
                                Toque em "Ver" para carregar empresas
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
  );
};

export default DisparosHistoricoPage; 