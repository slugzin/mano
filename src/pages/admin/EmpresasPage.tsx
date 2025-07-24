import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  MapPin,
  Globe,
  Phone,
  ChevronRight,
  Check,
  X,
  Filter,
  Users,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronDown,
  Star,
  Target
} from '../../utils/icons';
import { supabase } from '../../lib/supabase';
import { type EmpresaBanco } from '../../services/edgeFunctions';
import { KanbanBoard } from '../../components/kanban/KanbanBoard';
import FiltrosAtivosBanner from '../../components/ui/FiltrosAtivosBanner';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import LoadingScreen from '../../components/ui/LoadingScreen';

// Cores compatíveis com dark theme usando CSS variables
const statusColors = {
  'a_contatar': {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20 dark:border-emerald-500/30',
    icon: Users
  },
  'contato_realizado': {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20 dark:border-blue-500/30',
    icon: MessageCircle
  },
  'em_negociacao': {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20 dark:border-purple-500/30',
    icon: Clock
  },
  'ganhos': {
    bg: 'bg-green-500/10 dark:bg-green-500/20',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/20 dark:border-green-500/30',
    icon: CheckCircle
  },
  'perdidos': {
    bg: 'bg-red-500/10 dark:bg-red-500/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/20 dark:border-red-500/30',
    icon: X
  }
};

const statusLabels = {
  'a_contatar': 'A Contatar',
  'contato_realizado': 'Contato Realizado',
  'em_negociacao': 'Em Negociação',
  'ganhos': 'Ganhos',
  'perdidos': 'Perdidos'
};

// Filtros avançados interface
interface FiltrosAvancados {
  status: string[];
  apenasComWebsite: boolean;
  apenasComWhatsApp: boolean;
  apenasComTelefone: boolean;
  apenasComEndereco: boolean;
  avaliacaoMinima: number;
  cidadesSelecionadas: string[];
  categoriasSelecionadas: string[];
}

// Funções utilitárias
const isWhatsApp = (telefone: string | undefined): boolean => {
  if (!telefone) return false;
  const cleanPhone = telefone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 13;
};

const getStatusIcon = (status: keyof typeof statusColors) => {
  const StatusIcon = statusColors[status].icon;
  return <StatusIcon size={16} className={statusColors[status].text} />;
};

const extractCityFromAddress = (endereco: string | undefined): string | null => {
  if (!endereco) return null;
  const match = endereco.match(/,\s*([^,]+)\s*-\s*[A-Z]{2}/);
  return match ? match[1].trim() : null;
};

const EmpresasPage: React.FC = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<EmpresaBanco[]>([]);
  const [empresasFiltradas, setEmpresasFiltradas] = useState<EmpresaBanco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<EmpresaBanco | null>(null);
  
  // Filtros básicos
  const [filtros, setFiltros] = useState({
    busca: '',
  });

  // Filtros avançados
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false);
  const [filtrosAvancados, setFiltrosAvancados] = useState<FiltrosAvancados>({
    status: [],
    apenasComWebsite: false,
    apenasComWhatsApp: false,
    apenasComTelefone: false,
    apenasComEndereco: false,
    avaliacaoMinima: 0,
    cidadesSelecionadas: [],
    categoriasSelecionadas: []
  });

  // Dados para filtros
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<string[]>([]);

  // Calcular estatísticas das empresas filtradas
  const totalComWebsite = empresasFiltradas.filter(e => e.website).length;
  const totalComWhatsApp = empresasFiltradas.filter(e => isWhatsApp(e.telefone)).length;
  const cidades = [...new Set(
    empresasFiltradas
      .map(e => extractCityFromAddress(e.endereco))
      .filter((cidade): cidade is string => cidade !== null)
  )];

  useEffect(() => {
    loadEmpresas();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [empresas, filtros, filtrosAvancados]);

  const loadEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('capturado_em', { ascending: false });

      if (error) throw error;
      
      const empresasData = data || [];
      setEmpresas(empresasData);

      // Extrair cidades e categorias únicas para filtros
      const cidades = [...new Set(
        empresasData
          .map(e => extractCityFromAddress(e.endereco))
          .filter((cidade): cidade is string => cidade !== null)
      )].sort();

      const categorias = [...new Set(
        empresasData
          .map(e => e.categoria)
          .filter((categoria): categoria is string => categoria !== undefined && categoria !== null)
      )].sort();

      setCidadesDisponiveis(cidades);
      setCategoriasDisponiveis(categorias);

    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...empresas];

    // Filtro de busca
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      resultado = resultado.filter(e => 
        e.titulo?.toLowerCase().includes(termo) ||
        e.endereco?.toLowerCase().includes(termo) ||
        (e.categoria && e.categoria.toLowerCase().includes(termo))
      );
    }

    // Filtros avançados
    if (filtrosAvancados.status.length > 0) {
      resultado = resultado.filter(e => e.status && filtrosAvancados.status.includes(e.status));
    }

    if (filtrosAvancados.apenasComWebsite) {
      resultado = resultado.filter(e => e.website);
    }

    if (filtrosAvancados.apenasComWhatsApp) {
      resultado = resultado.filter(e => isWhatsApp(e.telefone));
    }

    if (filtrosAvancados.apenasComTelefone) {
      resultado = resultado.filter(e => e.telefone);
    }

    if (filtrosAvancados.apenasComEndereco) {
      resultado = resultado.filter(e => e.endereco);
    }

    if (filtrosAvancados.avaliacaoMinima > 0) {
      resultado = resultado.filter(e => e.avaliacao && e.avaliacao <= filtrosAvancados.avaliacaoMinima);
    }

    if (filtrosAvancados.cidadesSelecionadas.length > 0) {
      resultado = resultado.filter(e => {
        const cidade = extractCityFromAddress(e.endereco);
        return cidade && filtrosAvancados.cidadesSelecionadas.includes(cidade);
      });
    }

    if (filtrosAvancados.categoriasSelecionadas.length > 0) {
      resultado = resultado.filter(e => 
        e.categoria !== undefined && e.categoria !== null && filtrosAvancados.categoriasSelecionadas.includes(e.categoria)
      );
    }

    setEmpresasFiltradas(resultado);
  };

  const updateEmpresaStatus = async (empresaId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ status: newStatus })
        .eq('id', empresaId);

      if (error) throw error;

      // Atualizar estado local
      setEmpresas(prev => prev.map(emp => 
        emp.id === empresaId ? { ...emp, status: newStatus as EmpresaBanco['status'] } : emp
      ));
      setEmpresaSelecionada(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const toggleStatusFilter = (status: string) => {
    setFiltrosAvancados(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const toggleCidadeFilter = (cidade: string) => {
    setFiltrosAvancados(prev => ({
      ...prev,
      cidadesSelecionadas: prev.cidadesSelecionadas.includes(cidade)
        ? prev.cidadesSelecionadas.filter(c => c !== cidade)
        : [...prev.cidadesSelecionadas, cidade]
    }));
  };

  const toggleCategoriaFilter = (categoria: string) => {
    setFiltrosAvancados(prev => ({
      ...prev,
      categoriasSelecionadas: prev.categoriasSelecionadas.includes(categoria)
        ? prev.categoriasSelecionadas.filter(c => c !== categoria)
        : [...prev.categoriasSelecionadas, categoria]
    }));
  };

  const limparFiltros = () => {
    setFiltrosAvancados({
      status: [],
      apenasComWebsite: false,
      apenasComWhatsApp: false,
      apenasComTelefone: false,
      apenasComEndereco: false,
      avaliacaoMinima: 0,
      cidadesSelecionadas: [],
      categoriasSelecionadas: []
    });
    setFiltros({ busca: '' });
  };

  const temFiltrosAtivos = () => {
    return filtrosAvancados.status.length > 0 ||
           filtrosAvancados.apenasComWebsite ||
           filtrosAvancados.apenasComWhatsApp ||
           filtrosAvancados.apenasComTelefone ||
           filtrosAvancados.apenasComEndereco ||
           filtrosAvancados.avaliacaoMinima > 0 ||
           filtrosAvancados.cidadesSelecionadas.length > 0 ||
           filtrosAvancados.categoriasSelecionadas.length > 0 ||
           filtros.busca.length > 0;
  };

  if (isLoading) {
    return <LoadingScreen page="empresas" />;
  }

  return (
    <div className="min-h-full bg-background p-2 md:p-6">
      <div className="page-content-wrapper">
        {/* Header Mobile */}
        <div className="md:hidden">
          <div className="flex items-center gap-3 p-3 border-b border-border bg-background">
            <Building className="text-primary" size={20} />
            <div>
              <h1 className="text-base font-medium text-foreground">Empresas</h1>
              <p className="text-xs text-muted-foreground">Gerencie suas empresas</p>
            </div>
          </div>

          {/* Stats Mobile - Estilizado */}
          <div className="p-3 border-b border-border bg-gradient-to-br from-background to-muted/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total de Empresas</p>
                <p className="text-2xl font-bold text-foreground bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  {empresasFiltradas.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Building size={20} className="text-accent" />
              </div>
            </div>
            
            {/* Filtros Rápidos */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground font-medium mb-2">Filtrar por Status</p>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setFiltrosAvancados(prev => ({ ...prev, status: [] }))}
                  className={`px-1 py-1 rounded-full text-xs font-medium transition-all ${
                    filtrosAvancados.status.length === 0
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todas ({empresasFiltradas.length})
                </button>
                <button
                  onClick={() => setFiltrosAvancados(prev => ({ ...prev, status: ['a_contatar'] }))}
                  className={`px-1 py-1 rounded-full text-xs font-medium transition-all ${
                    filtrosAvancados.status.includes('a_contatar')
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  A Contatar ({empresasFiltradas.filter(e => e.status === 'a_contatar').length})
                </button>
                <button
                  onClick={() => setFiltrosAvancados(prev => ({ ...prev, status: ['contato_realizado'] }))}
                  className={`px-1 py-1 rounded-full text-xs font-medium transition-all ${
                    filtrosAvancados.status.includes('contato_realizado')
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Realizados ({empresasFiltradas.filter(e => e.status === 'contato_realizado').length})
                </button>
                <button
                  onClick={() => setFiltrosAvancados(prev => ({ ...prev, status: ['em_negociacao'] }))}
                  className={`px-1 py-1 rounded-full text-xs font-medium transition-all ${
                    filtrosAvancados.status.includes('em_negociacao')
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Negociação ({empresasFiltradas.filter(e => e.status === 'em_negociacao').length})
                </button>
                <button
                  onClick={() => setFiltrosAvancados(prev => ({ ...prev, status: ['ganhos'] }))}
                  className={`px-1 py-1 rounded-full text-xs font-medium transition-all ${
                    filtrosAvancados.status.includes('ganhos')
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Ganhos ({empresasFiltradas.filter(e => e.status === 'ganhos').length})
                </button>
                <button
                  onClick={() => setFiltrosAvancados(prev => ({ ...prev, status: ['perdidos'] }))}
                  className={`px-1 py-1 rounded-full text-xs font-medium transition-all ${
                    filtrosAvancados.status.includes('perdidos')
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Perdidos ({empresasFiltradas.filter(e => e.status === 'perdidos').length})
                </button>
              </div>
            </div>

            {/* Cards de Status Estilizados */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`${statusColors.a_contatar.bg} ${statusColors.a_contatar.border} border rounded-xl p-1.5 shadow-sm`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-full ${statusColors.a_contatar.text.replace('text-', 'bg-')}`}></div>
                  <p className={`text-xs font-semibold ${statusColors.a_contatar.text}`}>A Contatar</p>
                </div>
                <p className="text-base font-bold text-foreground">
                  {empresasFiltradas.filter(e => e.status === 'a_contatar').length}
                </p>
              </div>
              <div className={`${statusColors.contato_realizado.bg} ${statusColors.contato_realizado.border} border rounded-xl p-1.5 shadow-sm`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-full ${statusColors.contato_realizado.text.replace('text-', 'bg-')}`}></div>
                  <p className={`text-xs font-semibold ${statusColors.contato_realizado.text}`}>Realizados</p>
                </div>
                <p className="text-base font-bold text-foreground">
                  {empresasFiltradas.filter(e => e.status === 'contato_realizado').length}
                </p>
              </div>
            </div>
          </div>

          {/* Busca Simples */}
          <div className="p-3 border-b border-border bg-muted/10">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar empresas..."
                value={filtros.busca}
                onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                className="w-full bg-background border-2 border-border focus:border-accent rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors placeholder:text-muted-foreground"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Lista de Empresas */}
          <div className="px-3 space-y-1.5 pb-4">
            {empresasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma empresa encontrada</h3>
                <p className="text-muted-foreground mb-6">
                  {temFiltrosAtivos() 
                    ? 'Tente ajustar os filtros para encontrar mais empresas.'
                    : 'Não há empresas cadastradas ainda.'
                  }
                </p>
                {!temFiltrosAtivos() && (
                  <button
                    onClick={() => navigate('/admin/leads')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-medium transition-colors shadow-sm text-sm"
                  >
                    <Target size={16} />
                    Buscar Empresas
                  </button>
                )}
              </div>
            ) : (
              empresasFiltradas.map((empresa) => (
                <button
                  key={empresa.id}
                  onClick={() => setEmpresaSelecionada(empresa)}
                  className="w-full bg-card hover:bg-accent/5 border border-border rounded-lg md:rounded-xl p-3 md:p-4 text-left transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className={`w-10 h-10 md:w-8 md:h-8 ${statusColors[empresa.status as keyof typeof statusColors].bg} ${statusColors[empresa.status as keyof typeof statusColors].border} border rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {React.createElement(statusColors[empresa.status as keyof typeof statusColors].icon, {
                        size: 18,
                        className: statusColors[empresa.status as keyof typeof statusColors].text
                      })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                        {empresa.titulo}
                      </h3>
                      <p className={`text-xs ${statusColors[empresa.status as keyof typeof statusColors].text} mt-1`}>
                        {statusLabels[empresa.status as keyof typeof statusLabels]}
                      </p>
                      
                      {/* Badges de informações */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {empresa.avaliacao && (
                          <div className="flex items-center gap-1">
                            <Star size={11} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-muted-foreground">{empresa.avaliacao}</span>
                          </div>
                        )}
                        {isWhatsApp(empresa.telefone) && (
                          <div className="flex items-center gap-1 text-green-600">
                            <MessageCircle size={11} />
                            <span className="text-xs">WhatsApp</span>
                          </div>
                        )}
                        {empresa.website && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Globe size={11} />
                            <span className="text-xs">Site</span>
                          </div>
                        )}
                      </div>
                      
                      {empresa.endereco && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                          {empresa.endereco}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={14} className="md:w-4 md:h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Modal de Status (Mobile) */}
        {empresaSelecionada && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden flex items-center justify-center p-2"
            onClick={() => setEmpresaSelecionada(null)}
          >
            <div 
              className="bg-background border border-border p-3 space-y-4 rounded-xl w-full max-w-md animate-in fade-in duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    {empresaSelecionada.titulo}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecione o novo status
                  </p>
                </div>
                <button
                  onClick={() => setEmpresaSelecionada(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                {Object.entries(statusColors).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => {
                      updateEmpresaStatus(empresaSelecionada.id, status);
                      setEmpresaSelecionada(null);
                    }}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg transition-colors border
                      ${empresaSelecionada.status === status 
                        ? `${config.bg} ${config.border} ${config.text}` 
                        : 'hover:bg-accent/5 border-border'
                      }
                    `}
                  >
                    <div className={`w-8 h-8 ${config.bg} ${config.border} border rounded-lg flex items-center justify-center`}>
                      {React.createElement(config.icon, { size: 16, className: config.text })}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${empresaSelecionada.status === status ? config.text : 'text-foreground'}`}> 
                        {statusLabels[status as keyof typeof statusLabels]}
                      </p>
                    </div>
                    {empresaSelecionada.status === status && (
                      <Check size={16} className={config.text} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Layout Desktop */}
        <div className="hidden md:block">
          <PageHeader
            title="Empresas"
            subtitle="Gerencie e acompanhe o status das empresas."
            icon={<Building size={32} className="text-primary" />}
          />
          
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Building size={20} className="text-emerald-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-emerald-500">{empresasFiltradas.length}</span>
                  <span className="text-xs text-muted-foreground ml-2">total</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground">Total de Empresas</h3>
              <p className="text-xs text-muted-foreground mt-1">Empresas cadastradas</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Globe size={20} className="text-blue-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-blue-500">{totalComWebsite}</span>
                  <span className="text-xs text-muted-foreground ml-2">sites</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground">Com Website</h3>
              <p className="text-xs text-muted-foreground mt-1">Empresas com site</p>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Phone size={20} className="text-green-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-green-500">{totalComWhatsApp}</span>
                  <span className="text-xs text-muted-foreground ml-2">contatos</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground">Com WhatsApp</h3>
              <p className="text-xs text-muted-foreground mt-1">Empresas com WhatsApp</p>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <MapPin size={20} className="text-purple-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-purple-500">{cidades.length}</span>
                  <span className="text-xs text-muted-foreground ml-2">cidades</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground">Cidades</h3>
              <p className="text-xs text-muted-foreground mt-1">Regiões atendidas</p>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="bg-card border border-border rounded-xl p-3 md:p-4">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-accent/30 scrollbar-track-transparent">
              <div className="min-w-[900px]">
                <KanbanBoard empresas={empresasFiltradas} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmpresasPage;