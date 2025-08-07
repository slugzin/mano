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
import { substituirVariaveis } from '../../utils/variables';
import { supabase } from '../../lib/supabase';
import { useFiltros } from '../../contexts/FiltrosContext';
import PageHeader from '../../components/ui/PageHeader';
import LoadingScreen from '../../components/ui/LoadingScreen';

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

interface Fluxo {
  id: string;
  nome: string;
  descricao?: string;
  criado_em: string;
  ativo: boolean;
}

interface FraseWhatsApp {
  id: string;
  fase: string;
  tipo: string;
  texto: string;
  criada_em: string;
  delay_seconds: number;
  delay_min_seconds: number;
  delay_max_seconds: number;
  formato: string;
  conteudo: string;
  ordem: number;
  ativo: boolean;
  fluxo_id: string;
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
  const [empresaDetalhes, setEmpresaDetalhes] = useState<any>(null);
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
  
  // Modal de configuração - Wizard por etapas
  const [showDisparoConfig, setShowDisparoConfig] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Conexão, 2: Mensagem
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [fluxos, setFluxos] = useState<Fluxo[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedFluxo, setSelectedFluxo] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [messageType, setMessageType] = useState<'template' | 'fluxo' | 'custom'>('custom');
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

  // Efeito para controlar o scroll e barra de navegação quando o modal está aberto
  useEffect(() => {
    if (showDisparoConfig) {
      // Desabilitar scroll do body no mobile e iOS
      if (window.innerWidth <= 768 || /iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.body.classList.add('modal-open');
        // Ocultar barra de navegação mobile apenas no mobile
        if (window.innerWidth <= 768) {
          const bottomNav = document.querySelector('nav.md\\:hidden');
          if (bottomNav) {
            (bottomNav as HTMLElement).style.display = 'none';
          }
        }
        // iOS específico: forçar posição fixa
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          document.body.style.position = 'fixed';
          document.body.style.top = '0';
          document.body.style.left = '0';
          document.body.style.right = '0';
          document.body.style.bottom = '0';
        }
      }
    } else {
      // Reabilitar scroll do body
      document.body.classList.remove('modal-open');
      // Mostrar barra de navegação mobile novamente apenas no mobile
      if (window.innerWidth <= 768) {
        const bottomNav = document.querySelector('nav.md\\:hidden');
        if (bottomNav) {
          (bottomNav as HTMLElement).style.display = '';
        }
      }
      // iOS específico: remover posição fixa
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.bottom = '';
      }
    }

    // Função de limpeza
    return () => {
      document.body.classList.remove('modal-open');
      // Mostrar barra de navegação mobile novamente apenas no mobile
      if (window.innerWidth <= 768) {
        const bottomNav = document.querySelector('nav.md\\:hidden');
        if (bottomNav) {
          (bottomNav as HTMLElement).style.display = '';
        }
      }
      // iOS específico: remover posição fixa
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.bottom = '';
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

    // Cleanup: garantir que a barra de navegação e scroll sejam restaurados ao desmontar
    return () => {
      document.body.classList.remove('modal-open');
      if (window.innerWidth <= 768) {
        const bottomNav = document.querySelector('nav.md\\:hidden');
        if (bottomNav) {
          (bottomNav as HTMLElement).style.display = '';
        }
      }
      // iOS específico: remover posição fixa
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.bottom = '';
      }
    };
  }, []);

  // Recarregar quando modalidade ou filtros mudarem
  useEffect(() => {
    if (modalidadeSelecionada) {
      loadKanbanData();
    }
  }, [modalidadeSelecionada, filtrosAtivos, filtrosAvancados]);

  // Atualizar mensagem quando template for selecionado
  useEffect(() => {
    if (messageType === 'template' && selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setCustomMessage(template.content);
      }
    }
  }, [selectedTemplate, templates, messageType]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Carregar modalidades ordenadas por data mais recente (apenas empresas com WhatsApp)
      const { data: empresasData } = await supabase
        .from('empresas')
        .select('pesquisa, capturado_em')
        .eq('tem_whatsapp', true) // Filtrar apenas empresas com WhatsApp
        .not('pesquisa', 'is', null)
        .order('capturado_em', { ascending: false });

      if (empresasData) {
        // Criar mapa de modalidade -> data mais recente
        const modalidadeDates = new Map<string, Date>();
        empresasData.forEach(e => {
          const data = new Date(e.capturado_em);
          if (!modalidadeDates.has(e.pesquisa) || data > modalidadeDates.get(e.pesquisa)!) {
            modalidadeDates.set(e.pesquisa, data);
          }
        });
        
        // Ordenar modalidades por data mais recente
        const modalidadesOrdenadas = [...modalidadeDates.keys()].sort((a, b) => 
          modalidadeDates.get(b)!.getTime() - modalidadeDates.get(a)!.getTime()
        );
        
        setModalidades(modalidadesOrdenadas);
      }

      // Carregar cidades e categorias para filtros (apenas empresas com WhatsApp)
      const { data: allEmpresas } = await supabase
        .from('empresas')
        .select('endereco, categoria')
        .eq('tem_whatsapp', true); // Filtrar apenas empresas com WhatsApp

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

      // Carregar conexões WhatsApp do usuário atual
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: connectionsData } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('status', 'connected')
          .eq('user_id', user.user.id); // Filtrar apenas conexões do usuário atual

        if (connectionsData) {
          setConnections(connectionsData);
        }
      }

      // Carregar templates
      const templatesResult = await templateService.listTemplates();
      if (templatesResult.success && templatesResult.data) {
        setTemplates(templatesResult.data);
      }

      // Carregar fluxos
      const { data: fluxosData } = await supabase
        .from('fluxos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (fluxosData) {
        setFluxos(fluxosData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setIsLoading(false);
  };

  const aplicarFiltros = (empresas: any[]) => {
    let empresasFiltradas = [...empresas];

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

    // Ordenação padrão por data mais recente
    empresasFiltradas.sort((a, b) => new Date(b.capturado_em).getTime() - new Date(a.capturado_em).getTime());

    return empresasFiltradas;
  };

  const loadKanbanData = async () => {
    try {
      let query = supabase
        .from('empresas')
        .select('*')
        .eq('tem_whatsapp', true) // Filtrar apenas empresas com WhatsApp
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
        .eq('tem_whatsapp', true) // Filtrar apenas empresas com WhatsApp
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

  // Função para gerar nome da campanha automaticamente
  const generateCampaignName = async (modalidade: string): Promise<string> => {
    try {
      // Buscar campanhas existentes com o mesmo padrão
      const { data: existingCampaigns, error } = await supabase
        .from('campanhas_disparo')
        .select('nome')
        .ilike('nome', `Campanha ${modalidade} %`);

      if (error) {
        console.error('Erro ao buscar campanhas:', error);
        return `Campanha ${modalidade} 1`;
      }

      // Encontrar o próximo número disponível
      const numbers = existingCampaigns
        ?.map(campaign => {
          const match = campaign.nome.match(new RegExp(`Campanha ${modalidade} (\\d+)`));
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => num > 0) || [];

      const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
      return `Campanha ${modalidade} ${nextNumber}`;
    } catch (error) {
      console.error('Erro ao gerar nome da campanha:', error);
      return `Campanha ${modalidade} 1`;
    }
  };

  // Funções do wizard
  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedConnection(null);
    setSelectedTemplate(null);
    setSelectedFluxo(null);
    setCustomMessage('');
    setMessageType('custom');
    setDelay(30);
  };

  const canProceedToStep2 = () => {
    return selectedConnection !== null;
  };

  const canFinishWizard = () => {
    if (messageType === 'custom') {
      return customMessage.trim().length > 0;
    } else if (messageType === 'template') {
      return selectedTemplate !== null;
    } else if (messageType === 'fluxo') {
      return selectedFluxo !== null;
    }
    return false;
  };

  const handleLaunch = async () => {
    if (!selectedConnection) return;
    
    // Validar se há mensagem ou fluxo selecionado
    if (messageType === 'custom' && !customMessage.trim()) return;
    if (messageType === 'template' && !selectedTemplate) return;
    if (messageType === 'fluxo' && !selectedFluxo) return;
    
    setIsLaunching(true);
    
    // Fechar modal de configuração e mostrar animação
    setShowDisparoConfig(false);
    setShowDispatchAnimation(true);
    
    try {
      // Gerar nome da campanha automaticamente
      const nomeCampanha = await generateCampaignName(modalidadeSelecionada || 'Geral');
      
      if (messageType === 'fluxo') {
        // Buscar frases do fluxo selecionado
        const { data: frasesData, error: frasesError } = await supabase
          .from('frases_whatsapp')
          .select('*')
          .eq('fluxo_id', selectedFluxo)
          .eq('ativo', true)
          .order('ordem');

        if (frasesError) throw frasesError;
        if (!frasesData || frasesData.length === 0) {
          throw new Error('Nenhuma frase encontrada no fluxo selecionado');
        }

        // Buscar dados das empresas para substituir variáveis
        const { data: empresasData, error: empresasError } = await supabase
          .from('empresas')
          .select('id, empresa_nome, telefone, website, endereco, categoria, avaliacao, total_avaliacoes, latitude, longitude, posicao, cid, pesquisa, status, capturado_em')
          .in('id', selecionadas);

        if (empresasError) throw empresasError;
        if (!empresasData) {
          throw new Error('Erro ao buscar dados das empresas');
        }

        // Criar disparos para cada empresa com todas as frases do fluxo
        let totalTasks = 0;
        for (const empresa of empresasData) {
          for (const frase of frasesData) {
            // Substituir variáveis na mensagem
            const mensagemPersonalizada = substituirVariaveis(frase.texto, empresa);
            
            // Calcular delay baseado na frase ou usar delay padrão
            const delayFrase = frase.delay_seconds > 0 ? frase.delay_seconds : delay;
            
            // Formatar telefone para WhatsApp
            let telefoneFormatado = empresa.telefone;
            if (telefoneFormatado) {
              // Remover espaços, parênteses e traços
              telefoneFormatado = telefoneFormatado.replace(/[\(\)\s\-]/g, '');
              // Remover caracteres não numéricos exceto +
              telefoneFormatado = telefoneFormatado.replace(/[^0-9\+]/g, '');
              // Adicionar código do país se não existir
              if (!telefoneFormatado.startsWith('55')) {
                telefoneFormatado = '55' + telefoneFormatado;
              }
              // Adicionar sufixo do WhatsApp
              telefoneFormatado = telefoneFormatado + '@s.whatsapp.net';
            }

            // Inserir disparo agendado
            const { error: insertError } = await supabase
              .from('disparos_agendados')
              .insert({
                empresa_id: empresa.id,
                empresa_nome: empresa.empresa_nome || `Empresa ${empresa.id}`,
                empresa_telefone: telefoneFormatado,
                empresa_website: empresa.website,
                empresa_endereco: empresa.endereco,
                mensagem: mensagemPersonalizada,
                tipo_midia: 'nenhum',
                midia_url: null,
                status: 'pendente',
                agendado_para: new Date().toISOString(),
                conexao_id: selectedConnection,
                ordem: frase.ordem,
                fase: frase.fase
              });

            if (insertError) throw insertError;
            totalTasks++;
          }
        }

        // Calcular tempo estimado
        const tempoTotalMinutos = Math.ceil((totalTasks * delay) / 60);
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
        
        // Criar campanha para fluxos
        const { data: campanhaData, error: campanhaError } = await supabase.rpc('agendar_disparos', {
          p_empresa_ids: selecionadas,
          p_mensagem: `Fluxo: ${frasesData.length} mensagens`,
          p_conexao_id: selectedConnection,
          p_tipo_midia: 'nenhum',
          p_midia_url: null,
          p_delay_segundos: delay,
          p_nome_campanha: nomeCampanha,
          p_ordem: 1,
          p_fase: 'fase_1',
          p_tipo_campanha: 'fluxo'
        });

        if (campanhaError) throw campanhaError;

        // Configurar dados da campanha
        setDispatchStats({
          campanhaId: campanhaData?.campanha_id,
          totalEmpresas: selecionadas.length,
          tasksAgendadas: totalTasks,
          delaySegundos: delay,
          tempoEstimado: tempoEstimado
        });

      } else {
        // Disparo com mensagem única (template ou custom)
        const mensagemFinal = messageType === 'template' && selectedTemplate 
          ? templates.find(t => t.id === selectedTemplate)?.content || customMessage
          : customMessage;

        const { data, error } = await supabase.rpc('agendar_disparos', {
          p_empresa_ids: selecionadas,
          p_mensagem: mensagemFinal,
          p_conexao_id: selectedConnection,
          p_tipo_midia: 'nenhum',
          p_midia_url: null,
          p_delay_segundos: delay,
          p_nome_campanha: nomeCampanha,
          p_ordem: 1,
          p_fase: 'fase_1',
          p_tipo_campanha: messageType
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
        } else {
          throw new Error('Erro ao agendar disparos');
        }
      }

      // Mostrar tela de sucesso
      setShowDispatchAnimation(false);
      setShowSuccessScreen(true);

      // Limpar estados
      setSelectedSegment(null);
      setSelectedConnection(null);
      setSelectedTemplate(null);
      setSelectedFluxo(null);
      setCustomMessage('');
      setMessageType('custom');
      setSelecionadas([]);

    } catch (error: any) {
      setShowDispatchAnimation(false);
      alert('Erro: ' + error.message);
    }
    setIsLaunching(false);
  };

  const temFiltrosAtivos = () => {
    return filtrosAvancados.avaliacaoMaxima < 5 ||
           filtrosAvancados.quantidadeAvaliacoesMin > 0 ||
           filtrosAvancados.quantidadeAvaliacoesMax < 1000 ||
           filtrosAvancados.cidadesSelecionadas.length > 0;
  };

  const limparFiltros = () => {
    setFiltrosAvancados(prev => ({
      ...prev,
      avaliacaoMaxima: 5,
      quantidadeAvaliacoesMin: 0,
      quantidadeAvaliacoesMax: 1000,
      cidadesSelecionadas: []
    }));
  };

  if (isLoading) {
    return <LoadingScreen page="disparos" />;
  }

  return (
    <div className="bg-background p-4 sm:p-6 min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header Mobile */}
        <div className="md:hidden">
          <div className="flex items-center gap-3 p-3 border-b border-border bg-background">
            <MessageCircle className="text-primary" size={20} />
            <div>
              <h1 className="text-base font-medium text-foreground">Disparos</h1>
              <p className="text-xs text-muted-foreground">Configure e envie mensagens</p>
            </div>
          </div>
        </div>

        {/* Header Desktop */}
        <div className="hidden md:block">
          <PageHeader
            title="Disparos"
            subtitle="Configure e envie mensagens em massa para suas empresas."
            icon={<MessageCircle size={32} className="text-primary" />}
          />
        </div>

        {/* Aviso sobre WhatsApp */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 sm:p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📱</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-600">
                Apenas empresas com WhatsApp
              </h3>
              <p className="text-xs text-muted-foreground">
                Esta página mostra apenas empresas que possuem WhatsApp ativo
              </p>
            </div>
          </div>
        </motion.div>

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
                  Disparo direcionado para: {empresaVindaDoKanban.empresa_nome}
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
          {/* Filtros Avançados - Simplificado para Mobile */}
          {modalidadeSelecionada && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
                className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 bg-accent rounded-lg">
                    <Filter size={14} className="text-accent-foreground" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-foreground">Filtros</h3>
                                          {temFiltrosAtivos() && (
                        <p className="text-xs text-accent font-medium">
                          {[
                            filtrosAvancados.avaliacaoMaxima < 5,
                            filtrosAvancados.quantidadeAvaliacoesMin > 0,
                            filtrosAvancados.quantidadeAvaliacoesMax < 1000,
                            filtrosAvancados.cidadesSelecionadas.length > 0
                          ].filter(Boolean).length} ativos
                        </p>
                      )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {temFiltrosAtivos() && (
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                  )}
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
                    <div className="border-t border-border p-3 sm:p-4 space-y-4 bg-muted/20">
                      {/* Filtros de Avaliação - Simplificado */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                          ⭐ Avaliações
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Avaliação máxima</label>
                            <select
                              value={filtrosAvancados.avaliacaoMaxima}
                              onChange={(e) => setFiltrosAvancados(prev => ({
                                ...prev,
                                avaliacaoMaxima: Number(e.target.value)
                              }))}
                              className="w-full px-3 py-2 text-sm bg-background border-2 border-border focus:border-accent rounded-lg focus:outline-none transition-colors"
                            >
                              <option value={5}>Todas as avaliações</option>
                              <option value={4.9}>Até 4.9 ⭐</option>
                              <option value={4.6}>Até 4.6 ⭐</option>
                              <option value={4.4}>Até 4.4 ⭐</option>
                              <option value={4.1}>Até 4.1 ⭐</option>
                              <option value={3.5}>Até 3.5 ⭐</option>
                              <option value={3.0}>Até 3.0 ⭐</option>
                            </select>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Min. reviews</label>
                              <input
                                type="number"
                                min="0"
                                max="1000"
                                value={filtrosAvancados.quantidadeAvaliacoesMin}
                                onChange={(e) => setFiltrosAvancados(prev => ({
                                  ...prev,
                                  quantidadeAvaliacoesMin: Number(e.target.value)
                                }))}
                                className="w-full px-3 py-2 text-sm bg-background border-2 border-border focus:border-accent rounded-lg focus:outline-none transition-colors"
                                placeholder="0"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Max. reviews</label>
                              <input
                                type="number"
                                min="0"
                                max="1000"
                                value={filtrosAvancados.quantidadeAvaliacoesMax}
                                onChange={(e) => setFiltrosAvancados(prev => ({
                                  ...prev,
                                  quantidadeAvaliacoesMax: Number(e.target.value)
                                }))}
                                className="w-full px-3 py-2 text-sm bg-background border-2 border-border focus:border-accent rounded-lg focus:outline-none transition-colors"
                                placeholder="1000"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Filtros de Localização - Simplificado */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                          📍 Localização
                        </h4>
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">Cidades</label>
                          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                            {cidadesDisponiveis.slice(0, 6).map(cidade => (
                              <button
                                key={cidade}
                                onClick={() => setFiltrosAvancados(prev => ({
                                  ...prev,
                                  cidadesSelecionadas: prev.cidadesSelecionadas.includes(cidade)
                                    ? prev.cidadesSelecionadas.filter(c => c !== cidade)
                                    : [...prev.cidadesSelecionadas, cidade]
                                }))}
                                className={`px-2 py-1 text-xs rounded-lg border transition-all font-medium ${
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

                      {/* Ações */}
                      {temFiltrosAtivos() && (
                        <div className="pt-3 border-t border-border flex justify-end">
                          <button
                            onClick={limparFiltros}
                            className="px-3 py-1.5 text-xs text-accent hover:text-accent-foreground hover:bg-accent rounded-lg transition-colors flex items-center gap-1 font-medium"
                          >
                            <X size={12} />
                            Limpar filtros
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
            <div className="space-y-6 pt-8 pb-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Selecione a modalidade
                </h2>
              </div>
              
              {modalidades.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma empresa encontrada</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Busque empresas para poder criar campanhas de disparo</p>
                  <button
                    onClick={() => navigate('/admin/leads')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-medium transition-colors"
                  >
                    <Target size={16} />
                    Buscar Empresas
                  </button>
                </div>
              ) : (
                <div className="max-w-lg mx-auto space-y-4 px-4 sm:px-0">
                  {/* Modalidades Específicas */}
                  {modalidades.map((modalidade, index) => (
                    <button
                      key={modalidade}
                      onClick={() => setModalidadeSelecionada(modalidade)}
                      className="w-full bg-background hover:bg-accent/5 border border-border hover:border-accent/30 rounded-xl p-4 flex items-center gap-3 transition-all duration-200 hover:scale-[1.01] group"
                    >
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                        <Building size={20} className="text-accent" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">{modalidade}</h3>
                        <p className="text-xs text-muted-foreground">Empresas desta modalidade</p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />
                    </button>
                  ))}

                  {/* Separador Visual */}
                  {modalidades.length > 0 && (
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/50"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-background px-3 text-xs text-muted-foreground">ou</span>
                      </div>
                    </div>
                  )}

                  {/* Todas as Empresas */}
                  <button
                    onClick={() => setModalidadeSelecionada('todas')}
                    className="w-full bg-gradient-to-r from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 border border-accent/20 hover:border-accent/40 rounded-xl p-4 flex items-center gap-3 transition-all duration-200 hover:scale-[1.01] group"
                  >
                    <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors">
                      <Building size={20} className="text-accent" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">Todas as Empresas</h3>
                      <p className="text-xs text-muted-foreground">Enviar para todas as modalidades</p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Navegação Simplificada - Sem Redundância */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <button
                  onClick={() => {
                    setModalidadeSelecionada(null);
                    setSelectedSegment(null);
                    limparFiltros();
                  }}
                  className="hover:text-foreground transition-colors"
                >
                  ← Voltar
                </button>
                <span className="text-foreground font-medium">
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
                  {/* Navegação Detalhada Simplificada */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <button
                      onClick={() => {
                        setModalidadeSelecionada(null);
                        setSelectedSegment(null);
                      }}
                      className="hover:text-foreground transition-colors"
                    >
                      ← Voltar
                    </button>
                    <span className="text-foreground font-medium">{selectedSegment.title}</span>
                  </div>

                  {/* Lista de Empresas com Controles */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h2 className="text-lg font-semibold text-foreground">
                          Empresas - {selectedSegment.title} ({empresasSegmento.length})
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Mostrando apenas empresas com WhatsApp ativo para disparo
                        </p>
                        
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
                            onClick={() => {
                  resetWizard();
                  setShowDisparoConfig(true);
                }}
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
                        <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma empresa com WhatsApp encontrada</h3>
                        <p className="text-muted-foreground">
                          {temFiltrosAtivos() 
                            ? 'Tente ajustar os filtros para encontrar mais empresas.'
                            : 'Não há empresas com WhatsApp ativo neste segmento. Verifique se as empresas foram verificadas.'
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
                                  {empresa.empresa_nome}
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
          )}
        </div>

        {/* Modal de Configuração - Wizard por Etapas */}
        {showDisparoConfig && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setShowDisparoConfig(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-background border border-border rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header com Progress - Compacto Mobile */}
              <div className="p-3 sm:p-6 border-b border-border">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-10 sm:h-10 bg-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Play size={12} className="sm:w-5 sm:h-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-lg font-semibold text-foreground">
                        Configurar Disparo
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {selecionadas.length} empresas
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDisparoConfig(false)}
                    className="p-1.5 sm:p-2 text-muted-foreground hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <X size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Progress Bar - Compacto */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                  {[1, 2].map((step) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                        step <= currentStep 
                          ? 'bg-accent text-accent-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step}
                      </div>
                      {step < 2 && (
                        <div className={`flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 rounded-full transition-all ${
                          step < currentStep ? 'bg-accent' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step Labels - Compacto */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className={currentStep >= 1 ? 'text-accent font-medium' : ''}>Conexão</span>
                  <span className={currentStep >= 2 ? 'text-accent font-medium' : ''}>Mensagem</span>
                </div>
              </div>

              {/* Conteúdo por Etapas */}
              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                {/* Etapa 1: Seleção de Conexão */}
                {currentStep === 1 && (
                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Phone size={20} className="sm:w-6 sm:h-6 text-green-500" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                        Selecione a Conexão WhatsApp
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Escolha o dispositivo para envio
                      </p>
                    </div>

                    {connections.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                        <Phone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-sm font-medium text-foreground mb-2">Nenhuma conexão encontrada</h3>
                        <p className="text-xs text-muted-foreground mb-4">Configure uma conexão WhatsApp primeiro</p>
                        <button
                          onClick={() => {
                            setShowDisparoConfig(false);
                            navigate('/admin/conexoes');
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-medium transition-colors text-sm"
                        >
                          <Phone size={16} />
                          Configurar Conexão
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {connections.map((connection) => (
                          <button
                            key={connection.id}
                            onClick={() => setSelectedConnection(connection.instance_name)}
                            className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                              selectedConnection === connection.instance_name
                                ? 'border-accent bg-accent/10 shadow-md'
                                : 'border-border hover:border-accent/40 hover:bg-accent/5 shadow-sm hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full transition-all duration-200 ${
                                selectedConnection === connection.instance_name 
                                  ? 'bg-accent shadow-sm' 
                                  : 'bg-muted'
                              }`}></div>
                              <div className="flex-1">
                                <div className="font-medium text-sm text-foreground">
                                  {connection.instance_name}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    connection.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                                  }`}></div>
                                  {connection.status === 'connected' ? 'Conectado' : 'Desconectado'}
                                </div>
                              </div>
                              {selectedConnection === connection.instance_name && (
                                <CheckCircle size={20} className="text-accent" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Etapa 2: Mensagem */}
                {currentStep === 2 && (
                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <MessageCircle size={20} className="sm:w-6 sm:h-6 text-blue-500" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                        Configure sua Mensagem
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Escreva a mensagem para as empresas
                      </p>
                    </div>

                    {/* Tipo de Mensagem */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                        Tipo de Mensagem
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMessageType('custom');
                            setSelectedTemplate(null);
                            setSelectedFluxo(null);
                          }}
                          className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                            messageType === 'custom'
                              ? 'bg-accent text-accent-foreground border-accent'
                              : 'bg-background text-foreground border-border hover:border-accent/60'
                          }`}
                        >
                          Mensagem
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMessageType('template');
                            setSelectedFluxo(null);
                          }}
                          className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                            messageType === 'template'
                              ? 'bg-accent text-accent-foreground border-accent'
                              : 'bg-background text-foreground border-border hover:border-accent/60'
                          }`}
                        >
                          Template
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMessageType('fluxo');
                            setSelectedTemplate(null);
                          }}
                          className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                            messageType === 'fluxo'
                              ? 'bg-accent text-accent-foreground border-accent'
                              : 'bg-background text-foreground border-border hover:border-accent/60'
                          }`}
                        >
                          Fluxo
                        </button>
                      </div>
                    </div>

                    {/* Template Selector */}
                    {messageType === 'template' && (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                          Selecionar Template
                        </label>
                        <div className="relative">
                          <select
                            value={selectedTemplate || ''}
                            onChange={(e) => {
                              const templateId = e.target.value;
                              if (templateId) {
                                const template = templates.find(t => t.id === Number(templateId));
                                if (template) {
                                  setSelectedTemplate(template.id);
                                  setCustomMessage(template.content);
                                }
                              } else {
                                setSelectedTemplate(null);
                                setCustomMessage('');
                              }
                            }}
                            className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-foreground hover:border-accent/60 focus:border-accent focus:outline-none transition-all duration-200 pr-8 sm:pr-10 cursor-pointer"
                          >
                            <option value="">Selecionar template...</option>
                            {templates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="sm:w-4 sm:h-4 absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                        
                        {/* Botão para ir para página de templates */}
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowDisparoConfig(false);
                              navigate('/admin/fluxos');
                            }}
                            className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                          >
                            <span>📝</span>
                            <span>Gerenciar Templates</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Fluxo Selector */}
                    {messageType === 'fluxo' && (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                          Selecionar Fluxo
                        </label>
                        <div className="relative">
                          <select
                            value={selectedFluxo || ''}
                            onChange={(e) => {
                              setSelectedFluxo(e.target.value || null);
                            }}
                            className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-foreground hover:border-accent/60 focus:border-accent focus:outline-none transition-all duration-200 pr-8 sm:pr-10 cursor-pointer"
                          >
                            <option value="">Selecionar fluxo...</option>
                            {fluxos.map((fluxo) => (
                              <option key={fluxo.id} value={fluxo.id}>
                                {fluxo.nome}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="sm:w-4 sm:h-4 absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                        
                        {/* Botão para ir para página de fluxos */}
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowDisparoConfig(false);
                              navigate('/admin/fluxos');
                            }}
                            className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                          >
                            <span>⚡</span>
                            <span>Gerenciar Fluxos</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Message Input - Compacto */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                        {messageType === 'custom' ? 'Mensagem' : 'Conteúdo'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <textarea
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder={
                            messageType === 'custom' 
                              ? "Digite sua mensagem..." 
                              : messageType === 'template' 
                                ? "Selecione um template acima..." 
                                : "Selecione um fluxo acima..."
                          }
                          disabled={messageType !== 'custom'}
                          className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none transition-all duration-200 ${
                            messageType !== 'custom' ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                          rows={3}
                          style={{ minHeight: '80px' }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {customMessage.length} chars
                          </span>
                          {messageType === 'custom' && !customMessage.trim() && (
                            <span className="text-xs text-red-500 font-medium">Obrigatório</span>
                          )}
                        </div>
                        
                        {/* Botão Salvar Template - Intuitivo */}
                        {messageType === 'custom' && customMessage.trim() && (
                          <button
                            onClick={async () => {
                              const templateName = prompt('Nome do template:');
                              if (templateName && templateName.trim()) {
                                try {
                                  const result = await templateService.createTemplate({
                                    name: templateName.trim(),
                                    content: customMessage.trim(),
                                    preview: customMessage.trim().substring(0, 100) + (customMessage.trim().length > 100 ? '...' : '')
                                  });
                                  if (result.success) {
                                    const templatesResult = await templateService.listTemplates();
                                    if (templatesResult.success && templatesResult.data) {
                                      setTemplates(templatesResult.data);
                                    }
                                    alert('Template salvo!');
                                  } else {
                                    alert('Erro: ' + result.error);
                                  }
                                } catch (error) {
                                  alert('Erro ao salvar');
                                }
                              }
                            }}
                            className="px-2.5 py-1.5 text-xs bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg transition-colors font-medium flex items-center gap-1.5 border border-blue-500/20"
                          >
                            <span className="text-sm">📝</span>
                            <span>Salvar Template</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delay entre Mensagens */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                        Delay entre mensagens (segundos) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={delay}
                          onChange={(e) => setDelay(Math.max(1, parseInt(e.target.value) || 30))}
                          min="1"
                          max="300"
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                          placeholder="30"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tempo de espera entre cada mensagem (recomendado: 30-60s)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Navegação */}
              <div className="flex gap-2 sm:gap-3 p-3 sm:p-6 border-t border-border bg-muted/5">
                <button
                  onClick={() => setShowDisparoConfig(false)}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-lg transition-all duration-200 font-medium border border-border hover:border-border/60"
                >
                  Cancelar
                </button>
                
                <div className="flex-1" />
                
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-all duration-200 font-medium"
                  >
                    Voltar
                  </button>
                )}
                
                {currentStep < 2 ? (
                  <button
                    onClick={nextStep}
                    disabled={currentStep === 1 && !canProceedToStep2()}
                    className="px-4 py-2 sm:px-6 sm:py-2.5 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                    <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleLaunch}
                    disabled={!canFinishWizard() || isLaunching}
                    className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:from-accent/90 hover:to-accent/80 rounded-lg transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLaunching ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-accent-foreground/20 border-t-accent-foreground rounded-full animate-spin" />
                        <span className="hidden sm:inline">Aguarde...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Iniciar Disparo</span>
                        <span className="sm:hidden">Iniciar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Animação de Disparo - Compacta para Mobile */}
        {showDispatchAnimation && (
          <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-2">
            <div className="text-center space-y-4 sm:space-y-6 max-w-sm w-full">
              {/* Ícone Principal Animado */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <MessageCircle size={32} className="sm:w-12 sm:h-12 md:w-16 md:h-16 text-accent" />
                  </motion.div>
                </div>
                
                {/* Ondas de Expansão */}
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 border-2 sm:border-4 border-accent/30 rounded-full"
                />
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute inset-0 border-2 sm:border-4 border-accent/20 rounded-full"
                />
              </motion.div>

              {/* Texto Principal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2 sm:space-y-3"
              >
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                  🎉 Disparos Iniciados!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground px-2">
                  Sua campanha foi criada e os disparos estão sendo processados
                </p>
              </motion.div>

              {/* Estatísticas Animadas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-xs sm:max-w-md mx-auto"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.2, type: "spring" }}
                    className="text-lg sm:text-xl md:text-2xl font-bold text-accent"
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
                    className="text-lg sm:text-xl md:text-2xl font-bold text-accent"
                  >
                    {delay}s
                  </motion.div>
                  <div className="text-xs text-muted-foreground">Delay</div>
                  {/* Pontos de Loading no meio */}
                  <div className="flex justify-center space-x-1 mt-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [-3, 3, -3] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                        className="w-1 h-1 bg-accent rounded-full"
                      />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.6, type: "spring" }}
                    className="text-lg sm:text-xl md:text-2xl font-bold text-accent flex items-center justify-center"
                  >
                    <Phone size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  </motion.div>
                  <div className="text-xs text-muted-foreground">WhatsApp</div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Tela de Sucesso - Compacta para Mobile */}
        {showSuccessScreen && dispatchStats && (
          <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md md:max-w-lg w-full text-center space-y-3 sm:space-y-4 md:space-y-6"
            >
              {/* Ícone de Sucesso */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle size={24} className="sm:w-10 sm:h-10 text-emerald-500" />
              </motion.div>

              {/* Título */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                  🎉 Disparos Iniciados!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground px-2">
                  Sua campanha foi criada e os disparos estão sendo processados
                </p>
              </motion.div>

              {/* Estatísticas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/20 rounded-lg sm:rounded-xl"
              >
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-accent">{dispatchStats.tasksAgendadas}</div>
                  <div className="text-xs text-muted-foreground">Mensagens Agendadas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-accent">{dispatchStats.tempoEstimado}</div>
                  <div className="text-xs text-muted-foreground">Tempo Estimado</div>
                </div>
              </motion.div>

              {/* Informações */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                  <Clock size={12} className="sm:w-4 sm:h-4" />
                  <span className="leading-tight">Delay de {delay}s entre mensagens</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                  <MessageCircle size={12} className="sm:w-4 sm:h-4" />
                  <span className="leading-tight">Mensagens aparecerão na aba "Conversas"</span>
                </div>
              </motion.div>

              {/* Botões de Ação */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex gap-2 sm:gap-3"
              >
                <button
                  onClick={() => {
                    setShowSuccessScreen(false);
                    setDispatchStats(null);
                  }}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                >
                  Continuar
                </button>
                <button
                  onClick={() => {
                    setShowSuccessScreen(false);
                    setDispatchStats(null);
                    navigate('/admin/campanhas');
                  }}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 justify-center"
                >
                  <BarChart3 size={12} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Ver Histórico</span>
                  <span className="sm:hidden">Histórico</span>
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