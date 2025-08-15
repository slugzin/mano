import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageCircle, 
  X, 
  ArrowUpRight as Send, 
  Search, 
  Menu as MoreVertical, 
  Phone,
  Video,
  Plus as Paperclip,
  User as Smile,
  Check,
  CheckCircle as CheckCheck,
  Clock,
  Building,
  User,
  ChevronLeft,
  Filter,
  Calendar,
  ExternalLink,
  AlertCircle,
  Star
} from '../../utils/icons';
import { buscarConversas, buscarConversasPorTelefone, obterEstatisticasConversas, type Conversa, type EstatisticasConversas } from '../../services/conversasService';
import { supabase } from '../../lib/supabase';
import PageHeader from '../../components/ui/PageHeader';
import LoadingScreen from '../../components/ui/LoadingScreen';

interface ConversaAgrupada {
  telefone: string;
  nome_empresa: string;
  ultima_mensagem: string;
  ultima_atividade: string;
  mensagens_nao_lidas: number;
  instance_name: string;
  total_mensagens: number;
  avatar_color: string;
  website?: string;
  endereco?: string;
  categoria?: string;
  avaliacao?: string;
  total_avaliacoes?: number;
  posicao?: number;
  empresa_id?: number;
  links_agendamento?: string;
}

type FiltroDia = 'hoje' | 'ontem' | 'semana' | 'mes' | 'todos';

const ConversasPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversasAgrupadas, setConversasAgrupadas] = useState<ConversaAgrupada[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<ConversaAgrupada | null>(null);
  const [mensagensConversa, setMensagensConversa] = useState<Conversa[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'nao_lidas' | 'respondidas'>('todas');
  const [filtroDia, setFiltroDia] = useState<FiltroDia>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<EstatisticasConversas | null>(null);
  const [showEmpresaDetails, setShowEmpresaDetails] = useState(false);

  // Cores para avatars
  const avatarColors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
  ];

  useEffect(() => {
    loadConversas();
    loadStats();
    
    // Verificar se há parâmetro de telefone na URL e aplicar filtro
    const searchParams = new URLSearchParams(location.search);
    const telefoneParam = searchParams.get('telefone');
    if (telefoneParam) {
      setSearchTerm(telefoneParam);
      // Limpar o parâmetro da URL após aplicar o filtro
      navigate(location.pathname, { replace: true });
    }
  }, []);

  // Cleanup: reabilitar scroll quando componente for desmontado
  useEffect(() => {
    return () => {
      document.body.classList.remove('modal-open');
      // Mostrar barra de navegação mobile novamente apenas no mobile
      if (window.innerWidth <= 768) {
        const bottomNav = document.querySelector('nav.md\\:hidden');
        if (bottomNav) {
          (bottomNav as HTMLElement).style.display = '';
        }
      }
      // iOS específico: restaurar posição e remover posição fixa
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const scrollY = document.body.getAttribute('data-scroll-y');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.removeAttribute('data-scroll-y');
        
        // Restaurar posição de scroll
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY));
        }
      }
    };
  }, []);

  // iOS: Detectar mudanças de viewport para lidar com teclado virtual
  useEffect(() => {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && showModal) {
      const handleViewportChange = () => {
        // Forçar repaint para evitar travamentos
        document.body.style.transform = 'translateZ(0)';
        setTimeout(() => {
          document.body.style.transform = '';
        }, 100);
      };

      const handleFocusIn = () => {
        // Ajustar viewport quando input recebe foco
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
        }
      };

      const handleFocusOut = () => {
        // Restaurar viewport quando input perde foco
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1');
        }
      };

      document.addEventListener('focusin', handleFocusIn);
      document.addEventListener('focusout', handleFocusOut);
      window.addEventListener('resize', handleViewportChange);

      return () => {
        document.removeEventListener('focusin', handleFocusIn);
        document.removeEventListener('focusout', handleFocusOut);
        window.removeEventListener('resize', handleViewportChange);
      };
    }
  }, [showModal]);

  const loadStats = async () => {
    try {
      const statsData = await obterEstatisticasConversas();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadConversas = async () => {
    try {
      setIsLoading(true);
      const result = await buscarConversas(1, 100);
      
      if (result.success && result.data) {
        // Agrupar conversas por telefone
        const conversasPorTelefone = new Map<string, ConversaAgrupada>();
        
        result.data.forEach((conversa) => {
          const telefone = conversa.telefone;
          
          if (!conversasPorTelefone.has(telefone)) {
            // Gerar cor do avatar baseada no nome da empresa
            const colorIndex = conversa.nome_empresa.length % avatarColors.length;
            
            conversasPorTelefone.set(telefone, {
              telefone,
              nome_empresa: conversa.nome_empresa,
              ultima_mensagem: conversa.mensagem,
              ultima_atividade: conversa.criado_em,
              mensagens_nao_lidas: 0, // Implementar lógica de mensagens não lidas
              instance_name: conversa.instance_name,
              total_mensagens: 1,
              avatar_color: avatarColors[colorIndex],
              // Usar informações da empresa diretamente da conversa
              website: conversa.empresa_website || '',
              endereco: conversa.empresa_endereco || '',
              categoria: conversa.empresa_categoria || '',
              avaliacao: conversa.empresa_avaliacao ? conversa.empresa_avaliacao.toFixed(1) : '',
              total_avaliacoes: conversa.empresa_total_avaliacoes || 0,
              posicao: conversa.empresa_posicao || 0,
              empresa_id: conversa.empresa_id || 0,
              links_agendamento: conversa.empresa_links_agendamento || ''
            });
          } else {
            const conversaExistente = conversasPorTelefone.get(telefone)!;
            conversaExistente.total_mensagens++;
            
            // Atualizar última mensagem se for mais recente
            if (new Date(conversa.criado_em) > new Date(conversaExistente.ultima_atividade)) {
              conversaExistente.ultima_mensagem = conversa.mensagem;
              conversaExistente.ultima_atividade = conversa.criado_em;
              
              // Atualizar informações da empresa se não estavam preenchidas
              if (!conversaExistente.website && conversa.empresa_website) {
                conversaExistente.website = conversa.empresa_website;
                conversaExistente.endereco = conversa.empresa_endereco || '';
                conversaExistente.categoria = conversa.empresa_categoria || '';
                conversaExistente.avaliacao = conversa.empresa_avaliacao ? conversa.empresa_avaliacao.toFixed(1) : '';
                conversaExistente.total_avaliacoes = conversa.empresa_total_avaliacoes || 0;
                conversaExistente.posicao = conversa.empresa_posicao || 0;
                conversaExistente.empresa_id = conversa.empresa_id || 0;
                conversaExistente.links_agendamento = conversa.empresa_links_agendamento || '';
              }
            }
          }
        });
        
        setConversasAgrupadas(Array.from(conversasPorTelefone.values()));
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMensagensConversa = async (telefone: string) => {
    try {
      const result = await buscarConversasPorTelefone(telefone);
      if (result.success) {
        setMensagensConversa(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens da conversa:', error);
    }
  };

  const openConversa = async (conversa: ConversaAgrupada) => {
    try {
      // Desabilitar scroll do body
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      
      // Esconder barra de navegação mobile
      if (window.innerWidth <= 768) {
        const bottomNav = document.querySelector('nav.md\\:hidden');
        if (bottomNav) {
          (bottomNav as HTMLElement).style.display = 'none';
        }
      }
      
      // iOS específico: salvar posição de scroll e aplicar posição fixa
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const scrollY = window.scrollY;
        document.body.setAttribute('data-scroll-y', scrollY.toString());
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
      }
      
      setConversaSelecionada(conversa);
      setShowModal(true);
      
      // Carregar mensagens da conversa
      await loadMensagensConversa(conversa.telefone);
      
    } catch (error) {
      console.error('Erro ao abrir conversa:', error);
    }
  };

  // Função removida - agora usamos as informações diretamente da tabela conversas

  const closeModal = () => {
    // Reabilitar scroll do body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    
    // Mostrar barra de navegação mobile novamente
    if (window.innerWidth <= 768) {
      const bottomNav = document.querySelector('nav.md\\:hidden');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
      }
    }
    
    // iOS específico: restaurar posição e remover posição fixa
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      const scrollY = document.body.getAttribute('data-scroll-y');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.removeAttribute('data-scroll-y');
      
      // Restaurar posição de scroll
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
    }
    
    setShowModal(false);
    setConversaSelecionada(null);
    setMensagensConversa([]);
    setNovaMensagem('');
    setShowEmpresaDetails(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const abreviarNomeEmpresa = (nome: string, maxLength: number = 25, isMobile: boolean = false) => {
    if (nome.length <= maxLength) return nome;
    
    const words = nome.split(' ');
    if (words.length === 1) {
      return nome.substring(0, maxLength - 3) + '...';
    }
    
    let result = '';
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (result.length + word.length + 1 <= maxLength) {
        result += (result ? ' ' : '') + word;
      } else {
        break;
      }
    }
    
    return result + '...';
  };

  const getStatusIcon = (status: string, fromMe: boolean) => {
    if (!fromMe) return null;
    
    switch (status) {
      case 'SENT':
        return <Check size={12} className="text-muted-foreground" />;
      case 'DELIVERED':
        return <CheckCheck size={12} className="text-blue-500" />;
      case 'READ':
        return <CheckCheck size={12} className="text-green-500" />;
      case 'SERVER_ACK':
        return <Check size={12} className="text-muted-foreground" />;
      default:
        return <Clock size={12} className="text-muted-foreground" />;
    }
  };

  const isConversaInDateRange = (conversa: ConversaAgrupada, filtro: FiltroDia): boolean => {
    const dataConversa = new Date(conversa.ultima_atividade);
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    ontem.setHours(0, 0, 0, 0);
    
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);
    semanaAtras.setHours(0, 0, 0, 0);
    
    const mesAtras = new Date();
    mesAtras.setDate(mesAtras.getDate() - 30);
    mesAtras.setHours(0, 0, 0, 0);
    
    switch (filtro) {
      case 'hoje':
        return dataConversa >= ontem && dataConversa <= hoje;
      case 'ontem':
        const diaAnterior = new Date(ontem);
        diaAnterior.setDate(diaAnterior.getDate() - 1);
        return dataConversa >= diaAnterior && dataConversa < ontem;
      case 'semana':
        return dataConversa >= semanaAtras;
      case 'mes':
        return dataConversa >= mesAtras;
      default:
        return true;
    }
  };

  const getFiltroDiaLabel = (filtro: FiltroDia): string => {
    switch (filtro) {
      case 'hoje': return 'Hoje';
      case 'ontem': return 'Ontem';
      case 'semana': return '7 dias';
      case 'mes': return '30 dias';
      default: return 'Todos';
    }
  };

  const handleVisitWebsite = (website: string) => {
    if (website) {
      let url = website;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
    }
  };

  const handleVisitLink = (conversa: ConversaAgrupada) => {
    const url = conversa.website || conversa.links_agendamento;
    if (url) {
      let finalUrl = url;
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
      window.open(finalUrl, '_blank');
    }
  };

  const getLinkInfo = (conversa: ConversaAgrupada) => {
    if (conversa.website) {
      return {
        url: conversa.website,
        title: conversa.website,
        subtitle: 'Website oficial',
        hasLink: true
      };
    } else if (conversa.links_agendamento) {
      return {
        url: conversa.links_agendamento,
        title: 'Link de Agendamento',
        subtitle: 'Agende um horário',
        hasLink: true
      };
    }
    return {
      url: '',
      title: 'Site não disponível',
      subtitle: 'Esta empresa não possui website',
      hasLink: false
    };
  };

  const handleShowEmpresaDetails = () => {
    setShowEmpresaDetails(!showEmpresaDetails);
  };

  // Filtrar conversas
  const conversasFiltradas = conversasAgrupadas.filter(conversa => {
    const matchesSearch = conversa.nome_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversa.telefone.includes(searchTerm);
    const matchesDateRange = isConversaInDateRange(conversa, filtroDia);
    
    let matchesStatus = true;
    if (filtroStatus === 'nao_lidas') {
      matchesStatus = conversa.mensagens_nao_lidas > 0;
    } else if (filtroStatus === 'respondidas') {
      matchesStatus = conversa.mensagens_nao_lidas === 0;
    }
    
    return matchesSearch && matchesDateRange && matchesStatus;
  });

  if (isLoading) {
    return <LoadingScreen page="conversas" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header Desktop */}
        <div className="hidden md:block">
          <PageHeader
            title="Conversas"
            subtitle="Gerencie suas conversas do WhatsApp com as empresas."
            icon={<MessageCircle size={32} className="text-primary" />}
          />
        </div>

        {/* Header Mobile */}
        <div className="md:hidden">
          <div className="flex items-center gap-3 p-3 border-b border-border bg-background">
            <MessageCircle className="text-primary" size={20} />
            <div>
              <h1 className="text-base font-medium text-foreground">Conversas</h1>
              <p className="text-xs text-muted-foreground">Gerencie suas conversas</p>
            </div>
          </div>
        </div>

        {/* Stats Cards - Desktop */}
        <div className="hidden md:block mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-4 hover:border-accent/40 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-2xl font-semibold text-gray-900 dark:text-foreground">{stats?.totalConversas || 0}</span>
                  <span className="text-xs text-gray-600 dark:text-muted-foreground ml-2">total</span>
                </div>
                <div className="w-10 h-10 bg-accent/15 dark:bg-accent/10 rounded-lg flex items-center justify-center">
                  <MessageCircle size={20} className="text-accent" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">Total Conversas</h3>
              <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">Mensagens trocadas</p>
            </div>

            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-4 hover:border-accent/40 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-2xl font-semibold text-gray-900 dark:text-foreground">{stats?.totalEmpresas || 0}</span>
                  <span className="text-xs text-gray-600 dark:text-muted-foreground ml-2">empresas</span>
                </div>
                <div className="w-10 h-10 bg-accent/15 dark:bg-accent/10 rounded-lg flex items-center justify-center">
                  <Building size={20} className="text-accent" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">Empresas Ativas</h3>
              <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">Com conversas</p>
            </div>

            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-4 hover:border-accent/40 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-2xl font-semibold text-gray-900 dark:text-foreground">{stats?.mensagensEnviadas || 0}</span>
                  <span className="text-xs text-gray-600 dark:text-muted-foreground ml-2">enviadas</span>
                </div>
                <div className="w-10 h-10 bg-accent/15 dark:bg-accent/10 rounded-lg flex items-center justify-center">
                  <Send size={20} className="text-accent" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">Mensagens Enviadas</h3>
              <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">Por você</p>
            </div>

            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-4 hover:border-accent/40 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-2xl font-semibold text-gray-900 dark:text-foreground">{stats?.taxaResposta || 0}%</span>
                  <span className="text-xs text-gray-600 dark:text-muted-foreground ml-2">taxa</span>
                </div>
                <div className="w-10 h-10 bg-accent/15 dark:bg-accent/10 rounded-lg flex items-center justify-center">
                  <MessageCircle size={20} className="text-accent" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">Taxa de Resposta</h3>
              <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">Empresas que responderam</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-3 md:p-4 border-b border-border bg-background mb-4">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-accent text-sm md:text-base transition-colors"
              />
            </div>

            {/* Status Filters Row */}
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => setFiltroStatus('todas')}
                className={`flex-1 px-2 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filtroStatus === 'todas'
                    ? 'bg-accent text-accent-foreground shadow-md border-2 border-accent/20'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent/5 border-2 border-border hover:border-accent/30'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltroStatus('nao_lidas')}
                className={`flex-1 px-2 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filtroStatus === 'nao_lidas'
                    ? 'bg-accent text-accent-foreground shadow-md border-2 border-accent/20'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent/5 border-2 border-border hover:border-accent/30'
                }`}
              >
                Não lidas
              </button>
              <button
                onClick={() => setFiltroStatus('respondidas')}
                className={`flex-1 px-2 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filtroStatus === 'respondidas'
                    ? 'bg-accent text-accent-foreground shadow-md border-2 border-accent/20'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent/5 border-2 border-border hover:border-accent/30'
                }`}
              >
                Respondidas
              </button>
            </div>

            {/* Date Filters Row */}
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => { setFiltroDia('hoje'); setShowFilters(false); }}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filtroDia === 'hoje'
                    ? 'bg-accent text-accent-foreground shadow-md border-2 border-accent/20'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent/5 border-2 border-border hover:border-accent/30'
                }`}
              >
                <Calendar size={12} className="flex-shrink-0 sm:hidden" />
                <Calendar size={14} className="flex-shrink-0 hidden sm:block" />
                <span>Hoje</span>
              </button>
              <button
                onClick={() => { setFiltroDia('ontem'); setShowFilters(false); }}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filtroDia === 'ontem'
                    ? 'bg-accent text-accent-foreground shadow-md border-2 border-accent/20'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent/5 border-2 border-border hover:border-accent/30'
                }`}
              >
                <Calendar size={12} className="flex-shrink-0 sm:hidden" />
                <Calendar size={14} className="flex-shrink-0 hidden sm:block" />
                <span>Ontem</span>
              </button>
              <button
                onClick={() => { setFiltroDia('semana'); setShowFilters(false); }}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filtroDia === 'semana'
                    ? 'bg-accent text-accent-foreground shadow-md border-2 border-accent/20'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent/5 border-2 border-border hover:border-accent/30'
                }`}
              >
                <Calendar size={12} className="flex-shrink-0 sm:hidden" />
                <Calendar size={14} className="flex-shrink-0 hidden sm:block" />
                <span>7 dias</span>
              </button>
              <button
                onClick={() => { setFiltroDia('todos'); setShowFilters(false); }}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filtroDia === 'todos'
                    ? 'bg-accent text-accent-foreground shadow-md border-2 border-accent/20'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent/5 border-2 border-border hover:border-accent/30'
                }`}
              >
                <Calendar size={12} className="flex-shrink-0 sm:hidden" />
                <Calendar size={14} className="flex-shrink-0 hidden sm:block" />
                <span>Todos</span>
              </button>
            </div>


          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="p-3 md:p-4">
          {conversasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma conversa encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece uma conversa com uma empresa.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {conversasFiltradas.map((conversa, index) => (
                <motion.div
                  key={conversa.telefone}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white border border-[#075e54]/20 rounded-xl p-3 hover:bg-[#dcf8c6]/30 hover:border-[#075e54]/40 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => openConversa(conversa)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${conversa.avatar_color} rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0`}>
                      {getInitials(conversa.nome_empresa)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-[#075e54] text-sm truncate">
                          {abreviarNomeEmpresa(conversa.nome_empresa, 25)}
                        </h3>
                        <span className="text-xs text-[#075e54]/60 flex-shrink-0">
                          {formatTime(conversa.ultima_atividade)}
                        </span>
                      </div>
                      <p className="text-xs text-[#075e54]/80 line-clamp-1 mb-1">
                        {conversa.ultima_mensagem}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#075e54]/60">
                          {conversa.total_mensagens} msg
                        </span>
                        {conversa.mensagens_nao_lidas > 0 && (
                          <span className="bg-[#075e54] text-white text-xs px-1.5 py-0.5 rounded-full">
                            {conversa.mensagens_nao_lidas}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Conversa */}
        <AnimatePresence>
          {showModal && conversaSelecionada && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 overflow-hidden"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background border border-border rounded-xl w-full max-w-[380px] sm:max-w-md md:max-w-2xl lg:max-w-4xl h-[75vh] sm:h-[65vh] md:h-[60vh] flex flex-col conversa-modal"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header do Modal - WhatsApp Style */}
                <div className="flex items-center justify-between p-3 border-b border-border bg-[#075e54] text-white rounded-t-xl">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={closeModal}
                      className="md:hidden p-1.5 hover:bg-white/10 rounded-full flex-shrink-0"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className={`w-9 h-9 ${conversaSelecionada.avatar_color} rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0`}>
                      {getInitials(conversaSelecionada.nome_empresa)}
                    </div>
                    <div className="flex-1 min-w-0 mr-2">
                      <h3 className="font-medium text-sm truncate">
                        {abreviarNomeEmpresa(conversaSelecionada.nome_empresa, 35, true)}
                      </h3>
                      <div className="flex items-center gap-1 text-xs opacity-90">
                        <Phone size={10} className="flex-shrink-0" />
                        <span className="truncate text-xs">{conversaSelecionada.telefone}</span>
                      </div>
                    </div>
                  </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Botão para ver informações da empresa */}
                    <button 
                      onClick={handleShowEmpresaDetails}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-medium transition-all duration-200 info-button-hover info-button-glow ${
                        showEmpresaDetails 
                          ? 'bg-white/20 text-white' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      title="Ver informações da empresa"
                    >
                      <Building size={14} className="info-button-bounce" />
                      <span className="text-xs">
                        {showEmpresaDetails ? 'Ocultar' : 'Empresa'}
                      </span>
                    </button>
                  </div>
                </div>

                                 {/* Detalhes da empresa (expandível) */}
                 <AnimatePresence>
                                   {/* Indicador de informações disponíveis - Sistema Style */}
                {!showEmpresaDetails && (conversaSelecionada.website || conversaSelecionada.links_agendamento || conversaSelecionada.categoria || conversaSelecionada.endereco) && (
                  <button 
                    onClick={handleShowEmpresaDetails}
                    className="w-full px-4 py-3 bg-accent/10 border-b border-accent/20 hover:bg-accent/20 transition-all duration-200 info-button-hover info-button-glow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center flex-shrink-0 info-button-bounce">
                        <Building size={16} className="text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-foreground">
                          <span className="hidden sm:inline">Informações da empresa disponíveis • Toque "Empresa" para ver detalhes</span>
                          <span className="sm:hidden text-xs">Toque para ver informações</span>
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {showEmpresaDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-border bg-background"
                  >
                                              <div className="p-3 space-y-3">
                         {/* Header compacto */}
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                               <Building size={16} className="text-accent-foreground" />
                             </div>
                             <div>
                               <h3 className="text-sm font-medium text-foreground">Informações da Empresa</h3>
                             </div>
                           </div>
                         </div>

                         {/* Nome da empresa */}
                         <div className="bg-background border border-border rounded-lg p-2.5">
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                             <div className="min-w-0 flex-1">
                               <p className="text-xs text-muted-foreground font-medium">Nome da Empresa</p>
                               <p className="text-sm text-foreground font-medium">{conversaSelecionada.nome_empresa}</p>
                             </div>
                           </div>
                         </div>

                                                   {/* Badges em linha única */}
                          {(conversaSelecionada.posicao || conversaSelecionada.avaliacao) && (
                            <div className="flex flex-wrap gap-2">
                              {conversaSelecionada.posicao && (
                                <div className="bg-background px-2 py-1 rounded-md border border-border">
                                  <span className="text-xs text-foreground font-medium">Posição #{conversaSelecionada.posicao} no Google</span>
                                </div>
                              )}
                              {conversaSelecionada.avaliacao && (
                                <div className="flex items-center gap-1 bg-background px-2 py-1 rounded-md border border-border">
                                  <Star size={12} className="text-foreground fill-current" />
                                  <span className="text-xs text-foreground font-medium">
                                    {conversaSelecionada.avaliacao} ({conversaSelecionada.total_avaliacoes} avaliações)
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                         
                         {/* Card do Website/Agendamento - Sistema Style */}
                         {(() => {
                           const linkInfo = getLinkInfo(conversaSelecionada);
                           return linkInfo.hasLink ? (
                             <button 
                               onClick={() => handleVisitLink(conversaSelecionada)}
                               className="w-full text-left p-3 bg-background hover:bg-accent/5 border border-border rounded-lg transition-colors group"
                             >
                               <div className="flex items-center gap-2">
                                 <ExternalLink size={16} className="text-foreground flex-shrink-0" />
                                 <div className="min-w-0 flex-1">
                                   <p className="text-sm text-foreground font-medium truncate">
                                     {linkInfo.title}
                                   </p>
                                   <p className="text-xs text-muted-foreground">{linkInfo.subtitle}</p>
                                 </div>
                               </div>
                             </button>
                           ) : (
                             <div className="w-full p-3 bg-muted/50 border border-border rounded-lg">
                               <div className="flex items-center gap-2">
                                 <ExternalLink size={16} className="text-muted-foreground flex-shrink-0" />
                                 <div>
                                   <p className="text-sm text-muted-foreground">{linkInfo.title}</p>
                                   <p className="text-xs text-muted-foreground/70">{linkInfo.subtitle}</p>
                                 </div>
                               </div>
                             </div>
                           );
                         })()}
                         
                         {/* Informações da Empresa - Sistema Style */}
                         {(conversaSelecionada.categoria || conversaSelecionada.endereco) && (
                           <div className="space-y-2">
                             {conversaSelecionada.categoria && (
                               <div className="bg-background border border-border rounded-lg p-2.5">
                                 <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                                   <div className="min-w-0 flex-1">
                                     <p className="text-xs text-muted-foreground font-medium">Categoria</p>
                                     <p className="text-sm text-foreground font-medium">{conversaSelecionada.categoria}</p>
                                   </div>
                                 </div>
                               </div>
                             )}
                             
                             {conversaSelecionada.endereco && (
                               <div className="bg-background border border-border rounded-lg p-2.5">
                                 <div className="flex items-start gap-2">
                                   <div className="w-2 h-2 bg-accent rounded-full mt-1.5 flex-shrink-0"></div>
                                   <div className="flex-1 min-w-0">
                                     <p className="text-xs text-muted-foreground font-medium">Localização</p>
                                     <p className="text-sm text-foreground font-medium leading-tight" style={{
                                       display: '-webkit-box',
                                       WebkitLineClamp: 2,
                                       WebkitBoxOrient: 'vertical',
                                       overflow: 'hidden'
                                     }}>{conversaSelecionada.endereco}</p>
                                   </div>
                                 </div>
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

                {/* Mensagens - Scroll Apenas do Modal */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-muted/20">
                  {mensagensConversa.map((mensagem) => (
                    <div
                      key={mensagem.id}
                      className={`flex ${mensagem.from_me ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[240px] sm:max-w-[280px] md:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          mensagem.from_me
                            ? 'bg-[#dcf8c6] text-[#075e54] rounded-br-md'
                            : 'bg-white text-[#075e54] border border-gray-200 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{mensagem.mensagem}</p>
                        <div className="flex items-center justify-end gap-1 mt-2 text-[#075e54]/60">
                          <span className="text-xs">
                            {new Date(mensagem.criado_em).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {getStatusIcon(mensagem.status, mensagem.from_me)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input de Nova Mensagem - WhatsApp Style */}
                <div className="p-3 md:p-4 border-t border-border bg-background rounded-b-xl">
                  <div className="flex items-center gap-3">
                    <button className="p-2 hover:bg-muted rounded-full transition-colors">
                      <Paperclip size={18} className="text-muted-foreground" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={novaMensagem}
                        onChange={(e) => setNovaMensagem(e.target.value)}
                        placeholder="Digite uma mensagem..."
                        className="w-full px-4 py-2.5 bg-muted border border-border rounded-full focus:outline-none focus:border-[#075e54] pr-12 text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && novaMensagem.trim()) {
                            // Aqui você implementaria o envio da mensagem
                            console.log('Enviar mensagem:', novaMensagem);
                            setNovaMensagem('');
                          }
                        }}
                      />
                      <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-background rounded-full transition-colors">
                        <Smile size={18} className="text-muted-foreground" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        if (novaMensagem.trim()) {
                          // Implementar envio de mensagem
                          console.log('Enviar mensagem:', novaMensagem);
                          setNovaMensagem('');
                        }
                      }}
                      className="p-2.5 bg-[#075e54] text-white rounded-full hover:bg-[#075e54]/90 transition-colors shadow-sm"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConversasPage; 