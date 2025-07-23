import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageCircle,
  Play,
  ChevronRight,
  Building,
  Phone,
  Globe,
  MapPin,
  X,
  Filter,
  ChevronDown,
  Check,
  Star,
  Search,
  BarChart3,
  Target,
  CheckCircle,
  Clock
} from '../../utils/icons';
import { templateService, MessageTemplate } from '../../services/templateService';
import { supabase } from '../../lib/supabase';
import { useFiltros } from '../../contexts/FiltrosContext';
import PageHeader from '../../components/ui/PageHeader';

interface KanbanSegment {
  id: string;
  title: string;
  count: number;
  description: string;
  status: string;
}

interface WhatsAppConnection {
  id: string;
  instance_name: string;
  instance_id: string;
  status: string;
}

interface FiltrosAvancados {
  // Contato
  apenasComWhatsApp: boolean;
  apenasComSite: boolean;
  apenasComTelefone: boolean;
  apenasComEndereco: boolean;
  
  // Avaliações
  avaliacaoMinima: number;
  avaliacaoMaxima: number;
  quantidadeAvaliacoesMin: number;
  quantidadeAvaliacoesMax: number;
  
  // Localização
  cidadesSelecionadas: string[];
  categoriasSelecionadas: string[];
  
  // Outros
  ordenacao: 'recentes' | 'avaliacao' | 'avaliacoes_count';
}

const DisparosPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { filtrosAtivos } = useFiltros();
  
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<string | null>(null);
  const [kanbanSegments, setKanbanSegments] = useState<KanbanSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<KanbanSegment | null>(null);
  const [empresasSegmento, setEmpresasSegmento] = useState<any[]>([]);
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros Avançados
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false);
  const [filtrosAvancados, setFiltrosAvancados] = useState<FiltrosAvancados>({
    apenasComWhatsApp: false,
    apenasComSite: false,
    apenasComTelefone: false,
    apenasComEndereco: false,
    avaliacaoMinima: 0,
    avaliacaoMaxima: 5,
    quantidadeAvaliacoesMin: 0,
    quantidadeAvaliacoesMax: 1000,
    cidadesSelecionadas: [],
    categoriasSelecionadas: [],
    ordenacao: 'recentes'
  });
  
  // Dados para filtros
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<string[]>([]);
  
  // Modal de configuração
  const [showDisparoConfig, setShowDisparoConfig] = useState(false);
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [delay, setDelay] = useState(30);
  const [isLaunching, setIsLaunching] = useState(false);
  const [empresaVindaDoKanban, setEmpresaVindaDoKanban] = useState<any>(null);
  const [showDispatchAnimation, setShowDispatchAnimation] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [dispatchStats, setDispatchStats] = useState<{
    campanhaId?: string;
    totalEmpresas: number;
    tasksAgendadas: number;
    delaySegundos: number;
    tempoEstimado: string;
  } | null>(null);

  // Efeito para controlar o scroll do container principal quando o modal está aberto
  useEffect(() => {
    const scrollableContent = document.querySelector('.page-content-scrollable');
    if (scrollableContent) {
      if (showDisparoConfig) {
        scrollableContent.classList.add('overflow-hidden');
      } else {
        scrollableContent.classList.remove('overflow-hidden');
      }
    }

    // Função de limpeza
    return () => {
      if (scrollableContent) {
        scrollableContent.classList.remove('overflow-hidden');
      }
    };
  }, [showDisparoConfig]);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();

    // Verificar se há empresa selecionada do kanban
    const locationState = location.state as any;
    if (locationState?.empresaSelecionada) {
      const empresa = locationState.empresaSelecionada;
      const modalidade = locationState.modalidadeSelecionada || 'todas';
      
      // Salvar empresa para mostrar visual feedback
      setEmpresaVindaDoKanban(empresa);
      
      // Configurar modalidade e empresa automaticamente
      setModalidadeSelecionada(modalidade);
      
      // Aguardar um pouco para os dados carregarem e então pré-selecionar a empresa
      setTimeout(() => {
        setSelecionadas([empresa.id]);
      }, 1000);
    }
  }, []);

  // Recarregar quando modalidade ou filtros mudarem
  useEffect(() => {
    if (modalidadeSelecionada) {
      loadKanbanData();
    }
  }, [modalidadeSelecionada, filtrosAtivos, filtrosAvancados]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Carregar modalidades
      const { data: empresasData } = await supabase
        .from('empresas')
        .select('pesquisa')
        .not('pesquisa', 'is', null);

      if (empresasData) {
        const modalidadesUnicas = [...new Set(empresasData.map(e => e.pesquisa))];
      setModalidades(modalidadesUnicas);
      }

      // Carregar cidades e categorias para filtros
      const { data: allEmpresas } = await supabase
        .from('empresas')
        .select('endereco, categoria');

      if (allEmpresas) {
        // Extrair cidades únicas
        const cidades = [...new Set(
          allEmpresas
            .filter(e => e.endereco)
            .map(e => {
              const partes = e.endereco.split(',');
              return partes[partes.length - 2]?.trim().split(' - ')[0];
            })
            .filter(Boolean)
        )].sort();

        // Extrair categorias únicas
        const categorias = [...new Set(
          allEmpresas
            .filter(e => e.categoria)
            .map(e => e.categoria)
        )].sort();

        setCidadesDisponiveis(cidades);
        setCategoriasDisponiveis(categorias);
      }

      // Carregar conexões WhatsApp
      const { data: connectionsData } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('status', 'connected');

      if (connectionsData) {
        setConnections(connectionsData);
      }

      // Carregar templates
      const templatesResult = await templateService.listTemplates();
      if (templatesResult.success && templatesResult.data) {
        setTemplates(templatesResult.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setIsLoading(false);
  };

  const aplicarFiltros = (empresas: any[]) => {
    let empresasFiltradas = [...empresas];

    // Filtros de contato
    if (filtrosAvancados.apenasComWhatsApp) {
        empresasFiltradas = empresasFiltradas.filter(e => e.telefone);
      }
    if (filtrosAvancados.apenasComSite) {
      empresasFiltradas = empresasFiltradas.filter(e => e.website);
    }
    if (filtrosAvancados.apenasComTelefone) {
      empresasFiltradas = empresasFiltradas.filter(e => e.telefone);
    }
    if (filtrosAvancados.apenasComEndereco) {
        empresasFiltradas = empresasFiltradas.filter(e => e.endereco);
      }

    // Filtros de avaliação
    if (filtrosAvancados.avaliacaoMaxima < 5) {
        empresasFiltradas = empresasFiltradas.filter(e => 
        e.avaliacao && e.avaliacao <= filtrosAvancados.avaliacaoMaxima
        );
      }
    if (filtrosAvancados.quantidadeAvaliacoesMin > 0) {
        empresasFiltradas = empresasFiltradas.filter(e => 
        e.total_avaliacoes && e.total_avaliacoes >= filtrosAvancados.quantidadeAvaliacoesMin
        );
      }
    if (filtrosAvancados.quantidadeAvaliacoesMax < 1000) {
      empresasFiltradas = empresasFiltradas.filter(e => 
        e.total_avaliacoes && e.total_avaliacoes <= filtrosAvancados.quantidadeAvaliacoesMax
      );
    }

    // Filtros de localização
    if (filtrosAvancados.cidadesSelecionadas.length > 0) {
      empresasFiltradas = empresasFiltradas.filter(e => {
        if (!e.endereco) return false;
        const cidade = e.endereco.split(',').slice(-2)[0]?.trim().split(' - ')[0];
        return filtrosAvancados.cidadesSelecionadas.includes(cidade);
      });
    }

    if (filtrosAvancados.categoriasSelecionadas.length > 0) {
      empresasFiltradas = empresasFiltradas.filter(e => 
        filtrosAvancados.categoriasSelecionadas.includes(e.categoria)
      );
      }

    // Ordenação
    switch (filtrosAvancados.ordenacao) {
      case 'avaliacao':
        empresasFiltradas.sort((a, b) => (b.avaliacao || 0) - (a.avaliacao || 0));
        break;
      case 'avaliacoes_count':
        empresasFiltradas.sort((a, b) => (b.total_avaliacoes || 0) - (a.total_avaliacoes || 0));
        break;
      default:
        empresasFiltradas.sort((a, b) => new Date(b.capturado_em).getTime() - new Date(a.capturado_em).getTime());
    }

    return empresasFiltradas;
  };

  const loadKanbanData = async () => {
    try {
      let query = supabase
        .from('empresas')
        .select('*')
        .order('capturado_em', { ascending: false });

      if (modalidadeSelecionada && modalidadeSelecionada !== 'todas') {
        query = query.eq('pesquisa', modalidadeSelecionada);
      }

      const { data: empresas } = await query;
      if (!empresas) return;

      // Aplicar filtros avançados
      const empresasFiltradas = aplicarFiltros(empresas);

      // Processar segmentos
      const segments: KanbanSegment[] = [
        {
          id: 'a_contatar',
          title: 'A Contatar',
          count: empresasFiltradas.filter(e => e.status === 'a_contatar').length,
          description: 'Novos leads prontos para primeiro contato',
          status: 'a_contatar'
        },
        {
          id: 'contato_realizado',
          title: 'Follow-up',
          count: empresasFiltradas.filter(e => e.status === 'contato_realizado').length,
          description: 'Leads que precisam de acompanhamento',
          status: 'contato_realizado'
        },
        {
          id: 'em_negociacao',
          title: 'Em Negociação',
          count: empresasFiltradas.filter(e => e.status === 'em_negociacao').length,
          description: 'Leads ativos em processo de negociação',
          status: 'em_negociacao'
        }
      ];

      setKanbanSegments(segments.filter(s => s.count > 0));
    } catch (error) {
      console.error('Erro ao carregar dados do kanban:', error);
    }
  };

  // Carregar empresas do segmento
  useEffect(() => {
    if (selectedSegment && modalidadeSelecionada) {
      loadEmpresasSegmento();
    }
  }, [selectedSegment, modalidadeSelecionada, filtrosAtivos, filtrosAvancados]);

  const loadEmpresasSegmento = async () => {
    try {
      let query = supabase
        .from('empresas')
        .select('*')
        .eq('status', selectedSegment!.status)
        .order('capturado_em', { ascending: false });

      if (modalidadeSelecionada && modalidadeSelecionada !== 'todas') {
        query = query.eq('pesquisa', modalidadeSelecionada);
      }

      const { data: empresas } = await query;
      if (empresas) {
        const empresasFiltradas = aplicarFiltros(empresas);
        setEmpresasSegmento(empresasFiltradas);
        // Pré-selecionar todas as empresas por padrão
        setSelecionadas(empresasFiltradas.map(e => e.id));
      }
    } catch (error) {
      console.error('Erro ao carregar empresas do segmento:', error);
    }
  };

  const toggleSelecionada = (id: number) => {
    setSelecionadas(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
    }
    });
  };

  const handleLaunch = async () => {
    if (!selectedConnection || !customMessage.trim()) return;
    
    setIsLaunching(true);
    
    // Fechar modal de configuração e mostrar animação
    setShowDisparoConfig(false);
    setShowDispatchAnimation(true);
    
    try {
      const { data, error } = await supabase.rpc('agendar_disparos', {
        p_empresa_ids: selecionadas,
        p_mensagem: customMessage,
        p_conexao_id: selectedConnection,
        p_tipo_midia: 'nenhum',
        p_midia_url: null,
        p_delay_segundos: delay,
        p_nome_campanha: nomeCampanha.trim() || null
      });

      if (error) throw error;

      if (data.success) {
        // Calcular tempo estimado
        const tempoTotalMinutos = Math.ceil((data.tasks_criadas * delay) / 60);
        const horas = Math.floor(tempoTotalMinutos / 60);
        const minutos = tempoTotalMinutos % 60;
        
        let tempoEstimado = '';
        if (horas > 0) {
          tempoEstimado = `${horas}h ${minutos}min`;
        } else {
          tempoEstimado = `${minutos} minutos`;
        }

        // Aguardar animação por 3 segundos
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Configurar dados da campanha
        setDispatchStats({
          campanhaId: data.campanha_id,
          totalEmpresas: selecionadas.length,
          tasksAgendadas: data.tasks_criadas,
          delaySegundos: delay,
          tempoEstimado: tempoEstimado
        });

        // Mostrar tela de sucesso
        setShowDispatchAnimation(false);
        setShowSuccessScreen(true);

        // Limpar estados
          setSelectedSegment(null);
          setSelectedConnection(null);
          setCustomMessage('');
          setNomeCampanha('');
        setSelecionadas([]);

      } else {
        throw new Error('Erro ao agendar disparos');
      }
    } catch (error: any) {
      setShowDispatchAnimation(false);
      alert('Erro: ' + error.message);
    }
      setIsLaunching(false);
  };

  const temFiltrosAtivos = () => {
    return filtrosAvancados.apenasComWhatsApp ||
           filtrosAvancados.apenasComSite ||
           filtrosAvancados.apenasComTelefone ||
           filtrosAvancados.apenasComEndereco ||
           filtrosAvancados.avaliacaoMaxima < 5 ||
           filtrosAvancados.quantidadeAvaliacoesMin > 0 ||
           filtrosAvancados.quantidadeAvaliacoesMax < 1000 ||
           filtrosAvancados.cidadesSelecionadas.length > 0 ||
           filtrosAvancados.ordenacao !== 'recentes';
  };

  const limparFiltros = () => {
    setFiltrosAvancados({
      apenasComWhatsApp: false,
      apenasComSite: false,
      apenasComTelefone: false,
      apenasComEndereco: false,
      avaliacaoMinima: 0,
      avaliacaoMaxima: 5,
      quantidadeAvaliacoesMin: 0,
      quantidadeAvaliacoesMax: 1000,
      cidadesSelecionadas: [],
      categoriasSelecionadas: [],
      ordenacao: 'recentes'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <MessageCircle size={64} className="text-accent" />
          </motion.div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Disparos"
          subtitle="Configure e envie mensagens em massa para suas empresas."
          icon={<MessageCircle size={32} className="text-primary" />}
        />

        {/* Banner de empresa vinda do Kanban */}
        {empresaVindaDoKanban && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-accent/10 border border-accent/20 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <Building size={20} className="text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground">
                  Disparo direcionado para: {empresaVindaDoKanban.titulo}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Esta empresa foi selecionada automaticamente do kanban
                </p>
              </div>
              <button
                onClick={() => setEmpresaVindaDoKanban(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {/* Filtros Avançados - Sempre visível quando modalidade selecionada */}
          {modalidadeSelecionada && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
            <button
              onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
                className="w-full flex items-center justify-between p-4 hover:bg-accent/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-accent rounded-lg">
                    <Filter size={14} className="text-accent-foreground" />
                      </div>
                  <div className="text-left">
                  <h3 className="text-sm font-medium text-foreground">Filtros Avançados</h3>
                    {temFiltrosAtivos() && (
                      <p className="text-xs text-accent font-medium">
                        {Object.values(filtrosAvancados).filter(v => v === true || (Array.isArray(v) && v.length > 0) || (typeof v === 'number' && v !== 0 && v !== 5 && v !== 1000) || (typeof v === 'string' && v !== 'recentes')).length} filtros ativos
                    </p>
                        )}
                      </div>
                    </div>
              <div className="flex items-center gap-2">
                  {temFiltrosAtivos() && (
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                  )}
                  <span className="text-xs text-accent hidden sm:block">
                  {showFiltrosAvancados ? 'Ocultar' : 'Mostrar'}
                </span>
                <ChevronDown 
                    size={16} 
                  className={`text-accent transition-transform duration-200 ${
                    showFiltrosAvancados ? 'rotate-180' : ''
                  }`}
                />
                  </div>
            </button>
                  
              <AnimatePresence>
                    {showFiltrosAvancados && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border p-4 space-y-6 bg-muted/20">
                      {/* Filtros de Contato - Mais Compacto */}
                <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                          Tipo de Contato
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'apenasComWhatsApp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600' },
                            { key: 'apenasComSite', label: 'Website', icon: Globe, color: 'text-blue-600' },
                            { key: 'apenasComTelefone', label: 'Telefone', icon: Phone, color: 'text-purple-600' },
                            { key: 'apenasComEndereco', label: 'Endereço', icon: MapPin, color: 'text-orange-600' }
                          ].map(({ key, label, icon: Icon, color }) => (
                    <button
                              key={key}
                              onClick={() => setFiltrosAvancados(prev => ({
                                ...prev,
                                [key]: !prev[key as keyof FiltrosAvancados]
                              }))}
                              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all font-medium text-xs ${
                                filtrosAvancados[key as keyof FiltrosAvancados]
                                  ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                                  : 'bg-background border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
                      }`}
                    >
                              <Icon 
                                size={14} 
                                className={filtrosAvancados[key as keyof FiltrosAvancados] ? 'text-accent-foreground' : color}
                              />
                              <span className="truncate">{label}</span>
                              {filtrosAvancados[key as keyof FiltrosAvancados] && <Check size={12} className="ml-auto" />}
                    </button>
                          ))}
                        </div>
                      </div>

                      {/* Filtros de Avaliação - Simplificado */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                          Avaliações
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-2 block">Avaliação Máxima (filtrar baixas)</label>
                            <select
                              value={filtrosAvancados.avaliacaoMaxima}
                              onChange={(e) => setFiltrosAvancados(prev => ({
                                ...prev,
                                avaliacaoMaxima: Number(e.target.value)
                              }))}
                              className="w-full px-4 py-3 text-sm bg-background border-2 border-border focus:border-accent rounded-xl focus:outline-none transition-colors"
                            >
                              <option value={5}>Todas as avaliações</option>
                              <option value={4.9}>⭐ Até 4.9 estrelas</option>
                              <option value={4.6}>⭐ Até 4.6 estrelas</option>
                              <option value={4.4}>⭐ Até 4.4 estrelas</option>
                              <option value={4.1}>⭐ Até 4.1 estrelas</option>
                              <option value={3.5}>⭐ Até 3.5 estrelas</option>
                              <option value={3.0}>⭐ Até 3.0 estrelas</option>
                            </select>
                      </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-2 block">Min. Reviews</label>
                              <input
                                type="number"
                                min="0"
                                max="1000"
                                value={filtrosAvancados.quantidadeAvaliacoesMin}
                                onChange={(e) => setFiltrosAvancados(prev => ({
                                  ...prev,
                                  quantidadeAvaliacoesMin: Number(e.target.value)
                                }))}
                                className="w-full px-3 py-2.5 text-sm bg-background border-2 border-border focus:border-accent rounded-xl focus:outline-none transition-colors"
                                placeholder="0"
                              />
                      </div>
                            
                            <div>
                              <label className="text-xs text-muted-foreground mb-2 block">Max. Reviews</label>
                              <input
                                type="number"
                                min="0"
                                max="1000"
                                value={filtrosAvancados.quantidadeAvaliacoesMax}
                                onChange={(e) => setFiltrosAvancados(prev => ({
                                  ...prev,
                                  quantidadeAvaliacoesMax: Number(e.target.value)
                                }))}
                                className="w-full px-3 py-2.5 text-sm bg-background border-2 border-border focus:border-accent rounded-xl focus:outline-none transition-colors"
                                placeholder="1000"
                              />
                            </div>
                          </div>
                  </div>
                </div>

                      {/* Filtros de Localização - Apenas Cidades */}
                <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                          Localização
                        </h4>
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">Cidades (máx. 8 visíveis)</label>
                          <div className="flex flex-wrap gap-2 max-h-24 overflow-hidden">
                            {cidadesDisponiveis.slice(0, 8).map(cidade => (
                    <button
                                key={cidade}
                                onClick={() => setFiltrosAvancados(prev => ({
                                  ...prev,
                                  cidadesSelecionadas: prev.cidadesSelecionadas.includes(cidade)
                                    ? prev.cidadesSelecionadas.filter(c => c !== cidade)
                                    : [...prev.cidadesSelecionadas, cidade]
                                }))}
                                className={`px-3 py-1.5 text-xs rounded-lg border-2 transition-all font-medium ${
                                  filtrosAvancados.cidadesSelecionadas.includes(cidade)
                                    ? 'bg-accent text-accent-foreground border-accent'
                                    : 'bg-background border-border text-muted-foreground hover:border-accent/50'
                                }`}
                              >
                                {cidade}
                                {filtrosAvancados.cidadesSelecionadas.includes(cidade) && (
                                  <Check size={10} className="ml-1 inline" />
                                )}
                    </button>
                            ))}
                          </div>
                  </div>
                        </div>

                      {/* Ordenação - Simplificada */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                          Ordenação
                        </h4>
                        <select
                          value={filtrosAvancados.ordenacao}
                          onChange={(e) => setFiltrosAvancados(prev => ({
                            ...prev,
                            ordenacao: e.target.value as 'recentes' | 'avaliacao' | 'avaliacoes_count'
                          }))}
                          className="w-full px-4 py-3 text-sm bg-background border-2 border-border focus:border-accent rounded-xl focus:outline-none transition-colors"
                        >
                          <option value="recentes">📅 Mais Recentes</option>
                          <option value="avaliacao">⭐ Melhor Avaliação</option>
                          <option value="avaliacoes_count">📊 Mais Avaliações</option>
                        </select>
                      </div>

                      {/* Ações - Mais Visível */}
                      {temFiltrosAtivos() && (
                        <div className="pt-4 border-t border-border flex justify-end">
                    <button
                            onClick={limparFiltros}
                            className="px-4 py-2 text-xs text-accent hover:text-accent-foreground hover:bg-accent rounded-lg transition-colors flex items-center gap-2 font-medium"
                    >
                            <X size={12} />
                            Limpar todos os filtros
                    </button>
                        </div>
                    )}
                </div>
                  </motion.div>
            )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Seleção de Modalidade */}
          {!modalidadeSelecionada ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                Selecione a modalidade
              </h2>
              
              {modalidades.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma empresa encontrada</h3>
                  <p className="text-muted-foreground mb-6">Busque empresas para poder criar campanhas de disparo</p>
              <button
                    onClick={() => navigate('/admin/leads')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-medium transition-colors shadow-sm"
                  >
                    <Target size={20} />
                    Buscar Empresas para Disparar
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setModalidadeSelecionada('todas')}
                    className="w-full bg-background hover:bg-accent/5 border border-border rounded-xl p-4 flex items-center gap-3 transition-colors"
              >
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Building size={20} className="text-accent" />
                    </div>
                <div className="flex-1 text-left">
                      <h3 className="text-sm font-medium text-foreground">Todas as Empresas</h3>
                      <p className="text-xs text-muted-foreground">Enviar para todas as modalidades</p>
                  </div>
              </button>

              {modalidades.map((modalidade) => (
                <button
                  key={modalidade}
                      onClick={() => setModalidadeSelecionada(modalidade)}
                      className="w-full bg-background hover:bg-accent/5 border border-border rounded-xl p-4 flex items-center gap-3 transition-colors"
                >
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Building size={20} className="text-accent" />
                    </div>
                  <div className="flex-1 text-left">
                        <h3 className="text-sm font-medium text-foreground">{modalidade}</h3>
                        <p className="text-xs text-muted-foreground">Empresas desta modalidade</p>
                  </div>
                </button>
                ))}
                </>
              )}
              </div>
          ) :
            <>
              {/* Navegação */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <button
                  onClick={() => {
                    setModalidadeSelecionada(null);
                    setSelectedSegment(null);
                    limparFiltros();
                  }}
                  className="hover:text-foreground transition-colors"
                >
                  Modalidades
                </button>
                <ChevronRight size={14} />
                <span className="text-foreground">
                  {modalidadeSelecionada === 'todas' ? 'Todas as Empresas' : modalidadeSelecionada}
                      </span>
                    </div>

              {/* Segmentos do Kanban */}
              {!selectedSegment ? (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    Selecione o segmento
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kanbanSegments.map((segment) => (
                  <button
                      key={segment.id}
                        onClick={() => setSelectedSegment(segment)}
                        className="bg-background hover:bg-accent/5 border border-border rounded-xl p-4 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Users size={16} className="text-accent" />
                      </div>
                          <span className="text-2xl font-bold text-accent">{segment.count}</span>
                              </div>
                    <h3 className="text-sm font-medium text-foreground">{segment.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{segment.description}</p>
                  </button>
                ))}
                            </div>
                </div>
              ) : (
                <>
                  {/* Navegação Detalhada */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <button
                      onClick={() => {
                        setModalidadeSelecionada(null);
                        setSelectedSegment(null);
                      }}
                      className="hover:text-foreground transition-colors"
                    >
                      Modalidades
                    </button>
                    <ChevronRight size={14} />
                    <button
                      onClick={() => setSelectedSegment(null)}
                      className="hover:text-foreground transition-colors"
                    >
                      {modalidadeSelecionada === 'todas' ? 'Todas as Empresas' : modalidadeSelecionada}
                    </button>
                    <ChevronRight size={14} />
                    <span className="text-foreground">{selectedSegment.title}</span>
                          </div>

                  {/* Lista de Empresas com Controles */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h2 className="text-lg font-semibold text-foreground">
                          Empresas - {selectedSegment.title} ({empresasSegmento.length})
                        </h2>
                        
                        <div className="flex items-center gap-2">
                  <button
                            onClick={() => setSelecionadas(empresasSegmento.map(e => e.id))}
                            disabled={selecionadas.length === empresasSegmento.length}
                            className="px-3 py-1.5 text-xs bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                          Selecionar todas
                  </button>
                  <button
                            onClick={() => setSelecionadas([])}
                            disabled={selecionadas.length === 0}
                            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                          Limpar seleção
                  </button>
                      </div>
                      </div>
                      
                      {/* Status da Seleção e Botão de Disparo */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-muted/20 rounded-xl border border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                          <span className="text-sm text-foreground font-medium">
                            {selecionadas.length === empresasSegmento.length && empresasSegmento.length > 0
                              ? `Todas as ${empresasSegmento.length} empresas selecionadas`
                              : selecionadas.length === 0
                              ? 'Nenhuma empresa selecionada'
                              : `${selecionadas.length} de ${empresasSegmento.length} empresas selecionadas`
                            }
                          </span>
                      </div>

                      {selecionadas.length > 0 && (
                          <button
                            onClick={() => setShowDisparoConfig(true)}
                            className="px-6 py-2.5 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                          >
                            <Play size={16} />
                            Iniciar Disparo ({selecionadas.length})
                          </button>
                                )}
                              </div>
                        </div>

                    {empresasSegmento.length === 0 ? (
                      <div className="text-center py-12">
                        <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma empresa encontrada</h3>
                        <p className="text-muted-foreground">
                          {temFiltrosAtivos() 
                            ? 'Tente ajustar os filtros para encontrar mais empresas.'
                            : 'Não há empresas neste segmento.'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {empresasSegmento.map((empresa) => (
                            <button 
                        key={empresa.id}
                        onClick={() => toggleSelecionada(empresa.id)}
                            className={`bg-background border-2 rounded-xl p-4 text-left transition-all ${
                              selecionadas.includes(empresa.id)
                                ? 'border-accent bg-accent/5'
                                : 'border-border hover:border-accent/40'
                            }`}
                      >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-foreground truncate">
                              {empresa.titulo}
                            </h3>
                                {empresa.categoria && (
                                  <p className="text-xs text-muted-foreground">{empresa.categoria}</p>
                                )}
                              </div>
                              {selecionadas.includes(empresa.id) && (
                                <div className="flex-shrink-0 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                  <Check size={12} className="text-accent-foreground" />
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              {empresa.avaliacao && (
                                <div className="flex items-center gap-1">
                                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                  <span className="text-xs text-muted-foreground">
                                    {empresa.avaliacao} ({empresa.total_avaliacoes || 0})
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 text-xs">
                                {empresa.telefone && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <MessageCircle size={12} />
                                    <span>WhatsApp</span>
                                  </div>
                            )}
                            {empresa.website && (
                                  <div className="flex items-center gap-1 text-blue-600">
                                <Globe size={12} />
                                    <span>Site</span>
                                  </div>
                                )}
                              </div>
                              
                              {empresa.endereco && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {empresa.endereco.split(',').slice(-2).join(',')}
                              </p>
                          )}
                      </div>
                  </button>
                    ))}
                </div>
                    )}
                  </div>
                </>
              )}
            </>
          }
        </div>

        {/* Modal de Configuração */}
        {showDisparoConfig && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDisparoConfig(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-background border border-border rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Configurar Disparo ({selecionadas.length} empresas)
                  </h2>
                  <button
                    onClick={() => setShowDisparoConfig(false)}
                    className="p-2 -mr-2 text-muted-foreground hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Seleção de WhatsApp */}
                <div className="">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Conexão WhatsApp
                  </label>
                  {connections.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                      <Phone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-sm font-medium text-foreground mb-2">Nenhuma conexão WhatsApp</h3>
                      <p className="text-xs text-muted-foreground mb-4">Configure uma conexão para enviar mensagens</p>
                      <button
                        onClick={() => {
                          setShowDisparoConfig(false);
                          navigate('/admin/conexoes');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-medium transition-colors text-sm"
                      >
                        <Phone size={16} />
                        Configurar Conexões
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {connections.map((connection) => (
                        <button
                          key={connection.id}
                          onClick={() => setSelectedConnection(connection.instance_name)}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            selectedConnection === connection.instance_name
                              ? 'border-accent bg-accent/5'
                              : 'border-border hover:border-accent/40'
                          }`}
                        >
                          <div className="font-medium text-sm text-foreground">
                            {connection.instance_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {connection.status}
                          </div>
                        </button>
                      ))}
                    </div>
          )}
        </div>

                {/* Seleção de Template */}
                <div className="">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Template de Mensagem
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setCustomMessage(template.content);
                        }}
                        className={`w-full p-3 border rounded-lg text-left transition-colors ${
                          selectedTemplate === template.id
                            ? 'border-accent bg-accent/5'
                            : 'border-border hover:border-accent/40'
                        }`}
                      >
                        <div className="font-medium text-sm text-foreground">
                          {template.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {template.content}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mensagem Personalizada */}
                <div className="">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      Nome da Campanha
                    </label>
                    <input
                      type="text"
                      value={nomeCampanha}
                      onChange={(e) => setNomeCampanha(e.target.value)}
                      placeholder="Ex: Prospecção Janeiro"
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      Delay (segundos)
                    </label>
                    <input
                      type="number"
                      value={delay}
                      onChange={(e) => setDelay(Number(e.target.value))}
                      min="1"
                      max="300"
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 p-6 border-t border-border">
                <button
                  onClick={() => setShowDisparoConfig(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLaunch}
                  disabled={!selectedConnection || !customMessage.trim() || isLaunching}
                  className="px-6 py-2 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLaunching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-accent-foreground/20 border-t-accent-foreground rounded-full animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Confirmar Disparo
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Animação de Disparo */}
        {showDispatchAnimation && (
          <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-8">
              {/* Ícone Principal Animado */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="w-32 h-32 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <MessageCircle size={64} className="text-accent" />
                  </motion.div>
                </div>
                
                {/* Ondas de Expansão */}
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 border-4 border-accent/30 rounded-full"
                />
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute inset-0 border-4 border-accent/20 rounded-full"
                />
              </motion.div>

              {/* Texto Principal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-foreground">
                  Realizando Disparos
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Seus disparos estão sendo agendados e processados. 
                  As mensagens serão enviadas com o delay configurado.
                </p>
              </motion.div>

              {/* Estatísticas Animadas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="grid grid-cols-3 gap-6 max-w-lg mx-auto"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.2, type: "spring" }}
                    className="text-2xl font-bold text-accent"
                  >
                    {selecionadas.length}
                  </motion.div>
                  <div className="text-xs text-muted-foreground">Empresas</div>
                </div>
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.4, type: "spring" }}
                    className="text-2xl font-bold text-accent"
                  >
                    {delay}s
                  </motion.div>
                  <div className="text-xs text-muted-foreground">Delay</div>
                </div>
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.6, type: "spring" }}
                    className="text-2xl font-bold text-accent"
                  >
                    <MessageCircle size={24} className="mx-auto" />
                  </motion.div>
                  <div className="text-xs text-muted-foreground">WhatsApp</div>
                </div>
              </motion.div>

              {/* Pontos de Loading */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="flex justify-center space-x-2"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [-10, 10, -10] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    className="w-2 h-2 bg-accent rounded-full"
                  />
                ))}
              </motion.div>
            </div>
          </div>
        )}

        {/* Tela de Sucesso */}
        {showSuccessScreen && dispatchStats && (
          <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-8 max-w-lg w-full text-center space-y-6"
            >
              {/* Ícone de Sucesso */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle size={40} className="text-emerald-500" />
              </motion.div>

              {/* Título */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  🎉 Disparos Iniciados!
                </h2>
                <p className="text-muted-foreground">
                  Sua campanha foi criada e os disparos estão sendo processados
                </p>
              </motion.div>

              {/* Estatísticas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-xl"
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-accent">{dispatchStats.tasksAgendadas}</div>
                  <div className="text-xs text-muted-foreground">Mensagens Agendadas</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-accent">{dispatchStats.tempoEstimado}</div>
                  <div className="text-xs text-muted-foreground">Tempo Estimado</div>
                </div>
              </motion.div>

              {/* Informações */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-3 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2 justify-center">
                  <Clock size={16} />
                  <span>Delay de {dispatchStats.delaySegundos} segundos entre mensagens</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <MessageCircle size={16} />
                  <span>Mensagens aparecerão na aba "Conversas"</span>
                </div>
              </motion.div>

              {/* Botões de Ação */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex gap-3"
              >
                <button
                  onClick={() => {
                    setShowSuccessScreen(false);
                    setDispatchStats(null);
                  }}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg transition-colors text-sm font-medium"
                >
                  Continuar
                </button>
                <button
                  onClick={() => {
                    setShowSuccessScreen(false);
                    setDispatchStats(null);
                    navigate('/admin/campanhas');
                  }}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 justify-center"
                >
                  <Clock size={16} />
                  Ver Histórico
                </button>
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisparosPage; 