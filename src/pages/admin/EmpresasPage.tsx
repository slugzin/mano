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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Building size={64} className="text-accent" />
          </motion.div>
          <p className="text-muted-foreground text-lg">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="page-content-wrapper">
        {/* Header Mobile */}
        <div className="md:hidden">
          {/* Título */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Building className="text-primary" size={24} />
            <h1 className="text-lg font-medium text-foreground">Empresas</h1>
          </div>

          {/* Stats Mobile - Corrigidas para dark theme */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de Empresas</p>
                <p className="text-2xl font-bold text-foreground">{empresasFiltradas.length}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className={`${statusColors.a_contatar.bg} ${statusColors.a_contatar.border} border rounded-lg p-2`}>
                <p className={`text-xs font-medium ${statusColors.a_contatar.text}`}>A Contatar</p>
                <p className="text-sm font-bold text-foreground mt-1">
                  {empresasFiltradas.filter(e => e.status === 'a_contatar').length}
                </p>
              </div>
              <div className={`${statusColors.contato_realizado.bg} ${statusColors.contato_realizado.border} border rounded-lg p-2`}>
                <p className={`text-xs font-medium ${statusColors.contato_realizado.text}`}>Realizados</p>
                <p className="text-sm font-bold text-foreground mt-1">
                  {empresasFiltradas.filter(e => e.status === 'contato_realizado').length}
                </p>
              </div>
              <div className={`${statusColors.em_negociacao.bg} ${statusColors.em_negociacao.border} border rounded-lg p-2`}>
                <p className={`text-xs font-medium ${statusColors.em_negociacao.text}`}>Negociação</p>
                <p className="text-sm font-bold text-foreground mt-1">
                  {empresasFiltradas.filter(e => e.status === 'em_negociacao').length}
                </p>
              </div>
            </div>
          </div>

          {/* Filtros Avançados Mobile */}
          <div className="border-b border-border">
            <button
              onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-accent rounded-lg">
                  <Filter size={14} className="text-accent-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-medium text-foreground">Filtros</h3>
                  {temFiltrosAtivos() && (
                    <p className="text-xs text-accent font-medium">
                      {[
                        filtrosAvancados.status.length > 0 && `${filtrosAvancados.status.length} status`,
                        filtrosAvancados.apenasComWhatsApp && 'WhatsApp',
                        filtrosAvancados.apenasComWebsite && 'Website',
                        filtros.busca && 'Busca'
                      ].filter(Boolean).join(' • ')}
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
                  <div className="p-4 space-y-6 border-t border-border bg-muted/20">
                    {/* Busca - Compacta */}
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar empresas..."
                          value={filtros.busca}
                          onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                          className="w-full bg-background border-2 border-border focus:border-accent rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors placeholder:text-muted-foreground"
                        />
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Status - Grid Compacto */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-3 block uppercase tracking-wide">Status das Empresas</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(statusLabels).slice(0, 4).map(([status, label]) => (
                          <button
                            key={status}
                            onClick={() => toggleStatusFilter(status)}
                            className={`flex items-center gap-2 p-3 rounded-xl text-xs transition-all border-2 font-medium ${
                              filtrosAvancados.status.includes(status)
                                ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                                : 'bg-background border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
                            }`}
                          >
                            {React.createElement(statusColors[status as keyof typeof statusColors].icon, { 
                              size: 14,
                              className: filtrosAvancados.status.includes(status) ? 'text-accent-foreground' : ''
                            })}
                            <span className="truncate">{label.split(' ')[0]}</span>
                            {filtrosAvancados.status.includes(status) && <Check size={12} className="ml-auto" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Informações de Contato - Mais Visual */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-3 block uppercase tracking-wide">Tipo de Contato</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'apenasComWhatsApp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600' },
                          { key: 'apenasComWebsite', label: 'Website', icon: Globe, color: 'text-blue-600' },
                          { key: 'apenasComTelefone', label: 'Telefone', icon: Phone, color: 'text-purple-600' },
                          { key: 'apenasComEndereco', label: 'Endereço', icon: MapPin, color: 'text-orange-600' }
                        ].map(({ key, label, icon: Icon, color }) => (
                          <button
                            key={key}
                            onClick={() => setFiltrosAvancados(prev => ({
                              ...prev,
                              [key]: !prev[key as keyof FiltrosAvancados]
                            }))}
                            className={`flex items-center gap-2 p-3 rounded-xl text-xs transition-all border-2 font-medium ${
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

                    {/* Avaliação - Compacta */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-3 block uppercase tracking-wide">Avaliação Máxima (filtrar baixas)</label>
                      <select
                        value={filtrosAvancados.avaliacaoMinima}
                        onChange={(e) => setFiltrosAvancados(prev => ({
                          ...prev,
                          avaliacaoMinima: Number(e.target.value)
                        }))}
                        className="w-full px-4 py-3 text-sm bg-background border-2 border-border focus:border-accent rounded-xl focus:outline-none transition-colors"
                      >
                        <option value={0}>Todas as avaliações</option>
                        <option value={4.9}>⭐ Até 4.9 estrelas</option>
                        <option value={4.6}>⭐ Até 4.6 estrelas</option>
                        <option value={4.4}>⭐ Até 4.4 estrelas</option>
                        <option value={4.1}>⭐ Até 4.1 estrelas</option>
                        <option value={3.5}>⭐ Até 3.5 estrelas</option>
                        <option value={3.0}>⭐ Até 3.0 estrelas</option>
                        <option value={2.0}>⭐ Até 2.0 estrelas</option>
                        <option value={1.0}>⭐ Até 1.0 estrelas</option>
                      </select>
                    </div>

                    {/* Ações - Mais Visível */}
                    {temFiltrosAtivos() && (
                      <div className="pt-4 border-t border-border flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-accent">{empresasFiltradas.length}</span> empresas encontradas
                        </div>
                        <button
                          onClick={limparFiltros}
                          className="px-4 py-2 text-xs text-accent hover:text-accent-foreground hover:bg-accent rounded-lg transition-colors flex items-center gap-2 font-medium"
                        >
                          <X size={12} />
                          Limpar
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lista de Empresas */}
          <div className="px-4 space-y-2 pb-4">
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-medium transition-colors shadow-sm text-sm"
                  >
                    <Target size={18} />
                    Buscar Empresas
                  </button>
                )}
              </div>
            ) : (
              empresasFiltradas.map((empresa) => (
                <button
                  key={empresa.id}
                  onClick={() => setEmpresaSelecionada(empresa)}
                  className="w-full bg-card hover:bg-accent/5 border border-border rounded-lg p-4 text-left transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${statusColors[empresa.status as keyof typeof statusColors].bg} ${statusColors[empresa.status as keyof typeof statusColors].border} border rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {React.createElement(statusColors[empresa.status as keyof typeof statusColors].icon, {
                        size: 16,
                        className: statusColors[empresa.status as keyof typeof statusColors].text
                      })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-foreground">
                        {empresa.titulo}
                      </h3>
                      <p className={`text-xs ${statusColors[empresa.status as keyof typeof statusColors].text} mt-1`}>
                        {statusLabels[empresa.status as keyof typeof statusLabels]}
                      </p>
                      
                      {/* Badges de informações */}
                      <div className="flex items-center gap-2 mt-2">
                        {empresa.avaliacao && (
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-muted-foreground">{empresa.avaliacao}</span>
                          </div>
                        )}
                        {isWhatsApp(empresa.telefone) && (
                          <div className="flex items-center gap-1 text-green-600">
                            <MessageCircle size={12} />
                            <span className="text-xs">WhatsApp</span>
                          </div>
                        )}
                        {empresa.website && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Globe size={12} />
                            <span className="text-xs">Site</span>
                          </div>
                        )}
                      </div>
                      
                      {empresa.endereco && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {empresa.endereco}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Modal de Status (Mobile) */}
        {empresaSelecionada && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setEmpresaSelecionada(null)}
          >
            <div 
              className="fixed inset-x-0 bottom-0 bg-background border-t border-border p-4 space-y-4 animate-in slide-in-from-bottom duration-300"
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
                      w-full flex items-center gap-3 p-4 rounded-lg transition-colors border
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
        <div className="hidden md:block p-6">
          <PageHeader
            title="Empresas"
            subtitle="Gerencie e acompanhe o status das empresas."
            icon={<Building size={32} className="text-primary" />}
          />
          
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-6">
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
          <div className="bg-card border border-border rounded-xl p-4">
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