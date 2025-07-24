import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Filter
} from '../../utils/icons';
import { buscarConversas, buscarConversasPorTelefone, obterEstatisticasConversas, type Conversa, type EstatisticasConversas } from '../../services/conversasService';
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
}

const ConversasPage: React.FC = () => {
  const [conversasAgrupadas, setConversasAgrupadas] = useState<ConversaAgrupada[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<ConversaAgrupada | null>(null);
  const [mensagensConversa, setMensagensConversa] = useState<Conversa[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'nao_lidas' | 'respondidas'>('todas');
  const [stats, setStats] = useState<EstatisticasConversas | null>(null);

  // Cores para avatars
  const avatarColors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
  ];

  useEffect(() => {
    loadConversas();
    loadStats();
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
        }, 10);
      };

      const handleFocusIn = () => {
        // Quando input recebe foco (teclado aparece)
        setTimeout(handleViewportChange, 100);
      };

      const handleFocusOut = () => {
        // Quando input perde foco (teclado desaparece)
        setTimeout(handleViewportChange, 300);
      };

      // Adicionar listeners
      window.addEventListener('resize', handleViewportChange);
      document.addEventListener('focusin', handleFocusIn);
      document.addEventListener('focusout', handleFocusOut);

      return () => {
        window.removeEventListener('resize', handleViewportChange);
        document.removeEventListener('focusin', handleFocusIn);
        document.removeEventListener('focusout', handleFocusOut);
      };
    }
  }, [showModal]);

  const loadStats = async () => {
    const estatisticas = await obterEstatisticasConversas();
    setStats(estatisticas);
  };

  const loadConversas = async () => {
    setIsLoading(true);
    try {
      const result = await buscarConversas(1, 100);
      if (result.success) {
        // Agrupar conversas por telefone
        const conversasMap = new Map<string, ConversaAgrupada>();
        
        result.data.forEach((conversa, index) => {
          const key = conversa.telefone;
          if (!conversasMap.has(key)) {
            conversasMap.set(key, {
              telefone: conversa.telefone,
              nome_empresa: conversa.nome_empresa,
              ultima_mensagem: conversa.mensagem,
              ultima_atividade: conversa.criado_em,
              mensagens_nao_lidas: conversa.from_me ? 0 : 1,
              instance_name: conversa.instance_name,
              total_mensagens: 1,
              avatar_color: avatarColors[index % avatarColors.length]
            });
          } else {
            const existing = conversasMap.get(key)!;
            existing.total_mensagens++;
            if (!conversa.from_me && conversa.criado_em > existing.ultima_atividade) {
              existing.mensagens_nao_lidas++;
            }
            if (conversa.criado_em > existing.ultima_atividade) {
              existing.ultima_mensagem = conversa.mensagem;
              existing.ultima_atividade = conversa.criado_em;
            }
          }
        });

        const conversasArray = Array.from(conversasMap.values())
          .sort((a, b) => new Date(b.ultima_atividade).getTime() - new Date(a.ultima_atividade).getTime());
        
        setConversasAgrupadas(conversasArray);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
    setIsLoading(false);
  };

  const loadMensagensConversa = async (telefone: string) => {
    const result = await buscarConversasPorTelefone(telefone);
    if (result.success) {
      setMensagensConversa(result.data);
    }
  };

  const openConversa = async (conversa: ConversaAgrupada) => {
    setConversaSelecionada(conversa);
    setShowModal(true);
    
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
      // iOS específico: salvar posição atual e aplicar posição fixa
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        // Salvar posição para restaurar depois
        document.body.setAttribute('data-scroll-y', scrollY.toString());
      }
    }
    
    await loadMensagensConversa(conversa.telefone);
    
    // Marcar como lida
    setConversasAgrupadas(prev => 
      prev.map(c => 
        c.telefone === conversa.telefone 
          ? { ...c, mensagens_nao_lidas: 0 }
          : c
      )
    );
  };

  const closeModal = () => {
    setShowModal(false);
    setConversaSelecionada(null);
    setMensagensConversa([]);
    setNovaMensagem('');
    
    // Reabilitar scroll do body
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
      
      // Restaurar posição de scroll após um pequeno delay para evitar travamento
      if (scrollY) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(scrollY));
        }, 10);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const abreviarNomeEmpresa = (nome: string, maxLength: number = 25, isMobile: boolean = false) => {
    // Para mobile, usar um limite menor
    const limit = isMobile ? 18 : maxLength;
    
    if (nome.length <= limit) return nome;
    
    // Tentar abreviar palavras comuns
    const palavrasComuns = {
      'Restaurante': 'Rest.',
      'Clínica': 'Clín.',
      'Clinica': 'Clín.',
      'Empresa': 'Emp.',
      'Comercial': 'Com.',
      'Serviços': 'Serv.',
      'Servicos': 'Serv.',
      'Consultoria': 'Cons.',
      'Tecnologia': 'Tech',
      'Informática': 'Info',
      'Informatica': 'Info',
      'Sociedade': 'Soc.',
      'Limitada': 'Ltda',
      'LTDA': 'Ltda',
      'Associados': 'Assoc.',
      'Associacao': 'Assoc.',
      'Associação': 'Assoc.',
      'Industria': 'Ind.',
      'Indústria': 'Ind.',
      'Comercio': 'Com.',
      'Comércio': 'Com.',
      'Administracao': 'Adm.',
      'Administração': 'Adm.',
      'Participacoes': 'Part.',
      'Participações': 'Part.'
    };
    
    let nomeAbreviado = nome;
    Object.entries(palavrasComuns).forEach(([palavra, abrev]) => {
      const regex = new RegExp(`\\b${palavra}\\b`, 'gi');
      nomeAbreviado = nomeAbreviado.replace(regex, abrev);
    });
    
    // Se ainda estiver muito longo, cortar e adicionar "..."
    if (nomeAbreviado.length > limit) {
      return nomeAbreviado.substring(0, limit - 3) + '...';
    }
    
    return nomeAbreviado;
  };

  const getStatusIcon = (status: string, fromMe: boolean) => {
    if (fromMe) {
      switch (status) {
        case 'SERVER_ACK':
          return <Check size={16} className="text-muted-foreground" />;
        case 'DELIVERY_ACK':
          return <CheckCheck size={16} className="text-blue-500" />;
        case 'READ':
          return <CheckCheck size={16} className="text-blue-500" />;
        default:
          return <Clock size={16} className="text-muted-foreground" />;
      }
    }
    return null;
  };

  const conversasFiltradas = conversasAgrupadas.filter(conversa => {
    const matchSearch = conversa.nome_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       conversa.telefone.includes(searchTerm);
    
    const matchStatus = filtroStatus === 'todas' || 
                       (filtroStatus === 'nao_lidas' && conversa.mensagens_nao_lidas > 0) ||
                       (filtroStatus === 'respondidas' && conversa.mensagens_nao_lidas === 0);
    
    return matchSearch && matchStatus;
  });

  if (isLoading) {
    return <LoadingScreen page="conversas" />;
  }

  return (
    <div className="min-h-full bg-background p-2 md:p-6">
      <div className="page-content-wrapper">
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
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <MessageCircle size={20} className="text-blue-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-blue-500">{stats?.totalConversas || 0}</span>
                  <span className="text-xs text-muted-foreground ml-2">total</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground">Total Conversas</h3>
              <p className="text-xs text-muted-foreground mt-1">Mensagens trocadas</p>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Building size={20} className="text-green-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-green-500">{stats?.totalEmpresas || 0}</span>
                  <span className="text-xs text-muted-foreground ml-2">empresas</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground">Empresas Ativas</h3>
              <p className="text-xs text-muted-foreground mt-1">Com conversas</p>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Send size={20} className="text-purple-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-purple-500">{stats?.mensagensEnviadas || 0}</span>
                  <span className="text-xs text-muted-foreground ml-2">enviadas</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground">Mensagens Enviadas</h3>
              <p className="text-xs text-muted-foreground mt-1">Por você</p>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <MessageCircle size={20} className="text-orange-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-orange-500">{stats?.taxaResposta || 0}%</span>
                  <span className="text-xs text-muted-foreground ml-2">taxa</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground">Taxa de Resposta</h3>
              <p className="text-xs text-muted-foreground mt-1">Empresas que responderam</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-3 md:p-4 border-b border-border bg-background mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 bg-muted border border-border rounded-lg focus:outline-none focus:border-accent text-sm md:text-base"
              />
            </div>
            <div className="flex gap-1 md:gap-2">
              <button
                onClick={() => setFiltroStatus('todas')}
                className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                  filtroStatus === 'todas'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltroStatus('nao_lidas')}
                className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                  filtroStatus === 'nao_lidas'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Não lidas
              </button>
              <button
                onClick={() => setFiltroStatus('respondidas')}
                className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                  filtroStatus === 'respondidas'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Respondidas
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1">
          {conversasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageCircle size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma conversa encontrada</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm ? 'Tente buscar por outro termo' : 'As conversas aparecerão aqui quando você receber mensagens'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversasFiltradas.map((conversa) => (
                <motion.button
                  key={conversa.telefone}
                  onClick={() => openConversa(conversa)}
                  className="w-full bg-card hover:bg-accent/5 border border-border rounded-lg md:rounded-xl p-3 md:p-4 transition-all duration-200 text-left"
                  whileHover={{ backgroundColor: 'rgba(var(--accent), 0.05)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    {/* Avatar */}
                    <div className={`relative w-10 h-10 md:w-12 md:h-12 ${conversa.avatar_color} rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base`}>
                      {getInitials(conversa.nome_empresa)}
                      {conversa.mensagens_nao_lidas > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">
                            {conversa.mensagens_nao_lidas > 9 ? '9+' : conversa.mensagens_nao_lidas}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm md:text-base font-medium truncate ${conversa.mensagens_nao_lidas > 0 ? 'text-foreground' : 'text-foreground'}`}>
                          {abreviarNomeEmpresa(conversa.nome_empresa, 25, true)}
                        </h3>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {formatTime(conversa.ultima_atividade)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs md:text-sm truncate ${conversa.mensagens_nao_lidas > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {conversa.ultima_mensagem}
                        </p>
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full hidden sm:block">
                            {conversa.instance_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Conversa - Compacto e Centralizado */}
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
                className="bg-background border border-border rounded-xl w-full max-w-[368px] sm:max-w-md md:max-w-2xl lg:max-w-4xl h-[68vh] sm:h-[56vh] md:h-[52vh] flex flex-col conversa-modal"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header do Modal - Ultra Compacto */}
                <div className="flex items-center justify-between p-2 md:p-4 border-b border-border bg-accent text-accent-foreground rounded-t-xl">
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <button
                      onClick={closeModal}
                      className="md:hidden p-1.5 hover:bg-accent-foreground/10 rounded-full flex-shrink-0"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className={`w-8 h-8 md:w-10 md:h-10 ${conversaSelecionada.avatar_color} rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base flex-shrink-0`}>
                      {getInitials(conversaSelecionada.nome_empresa)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base truncate">
                        {abreviarNomeEmpresa(conversaSelecionada.nome_empresa, 30, true)}
                      </h3>
                      <p className="text-xs opacity-80 truncate">{conversaSelecionada.telefone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                    <button className="p-1.5 md:p-2 hover:bg-accent-foreground/10 rounded-full">
                      <Phone size={18} className="md:w-5 md:h-5" />
                    </button>
                    <button className="p-1.5 md:p-2 hover:bg-accent-foreground/10 rounded-full">
                      <Video size={18} className="md:w-5 md:h-5" />
                    </button>
                    <button
                      onClick={closeModal}
                      className="hidden md:block p-2 hover:bg-accent-foreground/10 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Mensagens - Scroll Apenas do Modal */}
                <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-4 bg-muted/20">
                  {mensagensConversa.map((mensagem) => (
                    <div
                      key={mensagem.id}
                      className={`flex ${mensagem.from_me ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[200px] sm:max-w-[240px] md:max-w-xs lg:max-w-md px-2 md:px-4 py-1 md:py-2 rounded-2xl ${
                          mensagem.from_me
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-background border border-border'
                        }`}
                      >
                        <p className="text-xs">{mensagem.mensagem}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          mensagem.from_me ? 'text-accent-foreground/70' : 'text-muted-foreground'
                        }`}>
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

                {/* Input de Nova Mensagem - Ultra Compacto */}
                <div className="p-2 md:p-4 border-t border-border bg-background rounded-b-xl">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 md:p-2 hover:bg-muted rounded-full">
                      <Paperclip size={18} className="text-muted-foreground md:w-5 md:h-5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={novaMensagem}
                        onChange={(e) => setNovaMensagem(e.target.value)}
                        placeholder="Digite uma mensagem..."
                        className="w-full px-2 md:px-4 py-1 md:py-2 bg-muted border border-border rounded-full focus:outline-none focus:border-accent pr-8 md:pr-12 text-xs"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && novaMensagem.trim()) {
                            // Aqui você implementaria o envio da mensagem
                            console.log('Enviar mensagem:', novaMensagem);
                            setNovaMensagem('');
                          }
                        }}
                      />
                      <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-background rounded-full">
                        <Smile size={16} className="text-muted-foreground md:w-4 md:h-4" />
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
                      className="p-1.5 md:p-2 bg-accent text-accent-foreground rounded-full hover:bg-accent/90 transition-colors"
                    >
                      <Send size={18} className="md:w-5 md:h-5" />
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