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
  Target,
  Calendar,
  Rocket,
  Trash2
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

const getStatusDescription = (status: string): string => {
  switch (status) {
    case 'a_contatar':
      return 'Empresa ainda não foi contatada';
    case 'contato_realizado':
      return 'Primeiro contato já foi feito';
    case 'em_negociacao':
      return 'Em processo de negociação';
    case 'ganhos':
      return 'Negócio fechado com sucesso';
    case 'perdidos':
      return 'Negócio não foi fechado';
    default:
      return '';
  }
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
  const [empresaDetalhes, setEmpresaDetalhes] = useState<EmpresaBanco | null>(null);
  const [empresaParaExcluir, setEmpresaParaExcluir] = useState<EmpresaBanco | null>(null);
  const [isExcluindo, setIsExcluindo] = useState(false);
  
  // Filtros básicos
  const [filtros, setFiltros] = useState({
    busca: '',
  });

  // Filtros avançados
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false);
  const [avaliacaoPersonalizada, setAvaliacaoPersonalizada] = useState<string>('');
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
  const totalComWhatsApp = empresasFiltradas.filter(e => e.tem_whatsapp).length;
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
        e.empresa_nome?.toLowerCase().includes(termo) ||
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
      resultado = resultado.filter(e => e.tem_whatsapp);
    }

    if (filtrosAvancados.apenasComTelefone) {
      resultado = resultado.filter(e => e.telefone);
    }

    if (filtrosAvancados.apenasComEndereco) {
      resultado = resultado.filter(e => e.endereco);
    }

    if (filtrosAvancados.avaliacaoMinima > 0) {
      resultado = resultado.filter(e => e.avaliacao && e.avaliacao >= filtrosAvancados.avaliacaoMinima);
    }

    // Filtro de avaliação personalizada
    if (avaliacaoPersonalizada) {
      const valor = parseFloat(avaliacaoPersonalizada);
      if (!isNaN(valor)) {
        resultado = resultado.filter(e => e.avaliacao && e.avaliacao >= valor);
      }
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

  const excluirEmpresa = async (empresaId: number) => {
    if (!empresaParaExcluir) return;
    
    setIsExcluindo(true);
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', empresaId);

      if (error) {
        console.error('Erro ao excluir empresa:', error);
        alert('Erro ao excluir empresa. Tente novamente.');
        return;
      }

      // Fechar modal e recarregar empresas
      setEmpresaParaExcluir(null);
      await loadEmpresas();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      alert('Erro ao excluir empresa. Tente novamente.');
    } finally {
      setIsExcluindo(false);
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
    setAvaliacaoPersonalizada('');
  };

  const temFiltrosAtivos = () => {
    return filtrosAvancados.status.length > 0 ||
           filtrosAvancados.apenasComWebsite ||
           filtrosAvancados.apenasComWhatsApp ||
           filtrosAvancados.apenasComTelefone ||
           filtrosAvancados.apenasComEndereco ||
           filtrosAvancados.avaliacaoMinima > 0 ||
           avaliacaoPersonalizada.length > 0 ||
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
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {temFiltrosAtivos() ? 'Resultados Filtrados' : 'Total de Empresas'}
                </p>
                <p className="text-2xl font-bold text-foreground bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  {empresasFiltradas.length}
                  {temFiltrosAtivos() && empresasFiltradas.length !== empresas.length && (
                    <span className="text-sm text-muted-foreground ml-1">
                      / {empresas.length}
                    </span>
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Building size={20} className="text-accent" />
              </div>
            </div>
            
            {/* Filtros Colapsáveis */}
            <div className="mb-4">
              <button
                onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
                className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium">Filtros</span>
                  {temFiltrosAtivos() && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="text-xs text-accent font-medium">Ativos</span>
                    </div>
                  )}
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-muted-foreground transition-transform ${showFiltrosAvancados ? 'rotate-180' : ''}`}
                />
              </button>

              {showFiltrosAvancados && (
                <div className="mt-3 space-y-4 p-4 bg-muted/20 rounded-lg">
                  {/* Filtros de Status */}
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setFiltrosAvancados(prev => ({ ...prev, status: [] }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          filtrosAvancados.status.length === 0
                            ? 'bg-accent text-accent-foreground shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Todas ({empresas.length})
                      </button>
                      <button
                        onClick={() => setFiltrosAvancados(prev => ({ ...prev, status: ['a_contatar'] }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          filtrosAvancados.status.includes('a_contatar')
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        A Contatar ({empresas.filter(e => e.status === 'a_contatar').length})
                      </button>
                      <button
                        onClick={() => setFiltrosAvancados(prev => ({ ...prev, status: ['contato_realizado'] }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          filtrosAvancados.status.includes('contato_realizado')
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Realizados ({empresas.filter(e => e.status === 'contato_realizado').length})
                      </button>
                      <button
                        onClick={() => setFiltrosAvancados(prev => ({ ...prev, status: ['em_negociacao'] }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          filtrosAvancados.status.includes('em_negociacao')
                            ? 'bg-purple-500 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Negociação ({empresas.filter(e => e.status === 'em_negociacao').length})
                      </button>
                      <button
                        onClick={() => setFiltrosAvancados(prev => ({ ...prev, status: ['ganhos'] }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          filtrosAvancados.status.includes('ganhos')
                            ? 'bg-green-500 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Ganhos ({empresas.filter(e => e.status === 'ganhos').length})
                      </button>
                      <button
                        onClick={() => setFiltrosAvancados(prev => ({ ...prev, status: ['perdidos'] }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          filtrosAvancados.status.includes('perdidos')
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Perdidos ({empresas.filter(e => e.status === 'perdidos').length})
                      </button>
                    </div>
                  </div>

                  {/* Filtros Adicionais */}
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">Filtros Adicionais</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setFiltrosAvancados(prev => ({ 
                          ...prev, 
                          apenasComWhatsApp: !prev.apenasComWhatsApp 
                        }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          filtrosAvancados.apenasComWhatsApp
                            ? 'bg-green-500 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="mr-1">📱</span> WhatsApp ({empresas.filter(e => e.tem_whatsapp).length})
                      </button>
                      <button
                        onClick={() => setFiltrosAvancados(prev => ({ 
                          ...prev, 
                          apenasComWebsite: !prev.apenasComWebsite 
                        }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          filtrosAvancados.apenasComWebsite
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="mr-1">🌐</span> Site ({empresas.filter(e => e.website).length})
                      </button>
                    </div>
                  </div>

                  {/* Avaliação Mínima */}
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">Avaliação Mínima</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setAvaliacaoPersonalizada(avaliacaoPersonalizada === '4.8' ? '' : '4.8')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          avaliacaoPersonalizada === '4.8'
                            ? 'bg-yellow-500 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="mr-1">⭐</span> 4.8+ ({empresas.filter(e => e.avaliacao && e.avaliacao >= 4.8).length})
                      </button>
                      <button
                        onClick={() => setAvaliacaoPersonalizada(avaliacaoPersonalizada === '4.5' ? '' : '4.5')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          avaliacaoPersonalizada === '4.5'
                            ? 'bg-yellow-500 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="mr-1">⭐</span> 4.5+ ({empresas.filter(e => e.avaliacao && e.avaliacao >= 4.5).length})
                      </button>
                      <button
                        onClick={() => setAvaliacaoPersonalizada(avaliacaoPersonalizada === '4.0' ? '' : '4.0')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          avaliacaoPersonalizada === '4.0'
                            ? 'bg-yellow-500 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="mr-1">⭐</span> 4.0+ ({empresas.filter(e => e.avaliacao && e.avaliacao >= 4.0).length})
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mostra empresas com avaliação igual ou superior
                    </p>
                  </div>

                  {/* Botão Limpar Todos */}
                  {temFiltrosAtivos() && (
                    <div className="pt-2 border-t border-border">
                      <button
                        onClick={limparFiltros}
                        className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Limpar todos os filtros
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {filtrosAvancados.status.length > 0 
                    ? `Nenhuma empresa no status "${statusLabels[filtrosAvancados.status[0] as keyof typeof statusLabels]}"`
                    : 'Nenhuma empresa encontrada'
                  }
                </h3>
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
                  onClick={() => setEmpresaDetalhes(empresa)}
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
                        {empresa.empresa_nome}
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
                        {empresa.tem_whatsapp && (
                          <div className="flex items-center gap-1 text-green-600">
                            <span className="text-xs">📱</span>
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

        {/* Modal de Informações da Empresa - Design Minimalista Padronizado */}
        {empresaDetalhes && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-background border border-border rounded-xl w-full max-w-sm md:max-w-md max-h-[95vh] md:max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-3 md:p-4 border-b border-border bg-muted/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                      <Building size={14} className="text-accent md:w-4 md:h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs md:text-sm font-medium text-foreground">Informações da Empresa</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmpresaDetalhes(null)}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <X size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-3 md:p-4 space-y-3 md:space-y-4 max-h-[75vh] md:max-h-[60vh] overflow-y-auto">
                {/* Nome da empresa */}
                <div className="bg-muted/20 border border-border rounded-lg p-2 md:p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent rounded-full flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Nome da Empresa</p>
                      <p className="text-xs md:text-sm text-foreground font-medium leading-tight">{empresaDetalhes.empresa_nome}</p>
                    </div>
                  </div>
                </div>

                {/* Badges de avaliação e posição */}
                {(empresaDetalhes.posicao || empresaDetalhes.avaliacao) && (
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {empresaDetalhes.posicao && (
                      <div className="bg-muted/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md border border-border">
                        <span className="text-[10px] md:text-xs text-foreground font-medium">Posição #{empresaDetalhes.posicao}</span>
                      </div>
                    )}
                    {empresaDetalhes.avaliacao && (
                      <div className="flex items-center gap-1 bg-muted/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md border border-border">
                        <Star size={10} className="text-yellow-400 fill-yellow-400 md:w-3 md:h-3" />
                        <span className="text-[10px] md:text-xs text-foreground font-medium">
                          {empresaDetalhes.avaliacao} ({empresaDetalhes.total_avaliacoes || 0})
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Website */}
                {empresaDetalhes.website ? (
                  <button 
                    onClick={() => window.open(empresaDetalhes.website?.startsWith('http') ? empresaDetalhes.website : `https://${empresaDetalhes.website}`, '_blank')}
                    className="w-full text-left p-2 md:p-3 bg-muted/20 hover:bg-accent/5 border border-border rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-accent flex-shrink-0 md:w-4 md:h-4" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm text-foreground font-medium truncate">
                          Visitar Website
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">{empresaDetalhes.website}</p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="w-full p-2 md:p-3 bg-muted/20 border border-border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-muted-foreground flex-shrink-0 md:w-4 md:h-4" />
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Website não disponível</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground/70">Empresa sem site cadastrado</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações adicionais - Grid organizado para desktop */}
                <div className="space-y-2 md:space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {empresaDetalhes.categoria && (
                      <div className="bg-muted/20 border border-border rounded-lg p-2 md:p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent rounded-full flex-shrink-0"></div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Categoria</p>
                            <p className="text-xs md:text-sm text-foreground font-medium leading-tight">{empresaDetalhes.categoria}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {empresaDetalhes.telefone && (
                      <div className="bg-muted/20 border border-border rounded-lg p-2 md:p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 ${empresaDetalhes.tem_whatsapp ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{empresaDetalhes.tem_whatsapp ? 'WhatsApp' : 'Telefone'}</p>
                            <p className="text-xs md:text-sm text-foreground font-medium leading-tight">{empresaDetalhes.telefone}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {empresaDetalhes.endereco && (
                    <div className="bg-muted/20 border border-border rounded-lg p-2 md:p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent rounded-full mt-1 md:mt-1.5 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Localização</p>
                          <p className="text-xs md:text-sm text-foreground font-medium leading-tight md:leading-relaxed">{empresaDetalhes.endereco}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="bg-muted/20 border border-border rounded-lg p-2 md:p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Status</p>
                        <p className="text-xs md:text-sm text-foreground font-medium leading-tight">
                          {empresaDetalhes.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Não definido'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="pt-3 md:pt-4 space-y-2 md:space-y-3">
                  {/* Botão Disparar (apenas se tem WhatsApp) */}
                  {empresaDetalhes.tem_whatsapp && (
                    <button
                      onClick={() => {
                        setEmpresaDetalhes(null);
                        // Navegar para disparos com empresa pré-selecionada
                        navigate('/admin/disparos', { 
                          state: { 
                            empresaPreSelecionada: empresaDetalhes 
                          } 
                        });
                      }}
                      className="w-full p-2 md:p-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg transition-colors font-medium flex items-center gap-2 justify-center border-2 border-purple-500 hover:border-purple-600"
                    >
                      <Rocket size={14} className="md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm">Disparar para esta Empresa</span>
                    </button>
                  )}

                  {/* Botão Alterar Status - Apenas Mobile */}
                  <div className="md:hidden">
                    <button
                      onClick={() => {
                        setEmpresaDetalhes(null);
                        setEmpresaSelecionada(empresaDetalhes);
                      }}
                      className="w-full p-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors font-medium flex items-center gap-2 justify-center border-2 border-purple-500 hover:border-purple-600"
                    >
                      <CheckCircle size={14} />
                      <span className="text-xs">Alterar Status</span>
                    </button>
                  </div>
                  
                  {/* Botão Excluir Empresa */}
                  <button
                    onClick={() => {
                      setEmpresaDetalhes(null);
                      setEmpresaParaExcluir(empresaDetalhes);
                    }}
                    className="w-full p-2 md:p-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors font-medium flex items-center gap-2 justify-center border-2 border-purple-500 hover:border-purple-600"
                  >
                    <Trash2 size={14} className="md:w-4 md:h-4" />
                    <span className="text-xs md:text-sm">Excluir Empresa</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Status (Mobile) */}
        {empresaSelecionada && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex md:hidden items-center justify-center p-4"
            onClick={() => setEmpresaSelecionada(null)}
          >
            <div 
              className="bg-background border border-border rounded-2xl w-full max-w-sm animate-in fade-in duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-4 border-b border-border">
                <div>
                  <h3 className="text-base font-medium text-foreground">
                    Alterar Status
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {empresaSelecionada.empresa_nome}
                  </p>
                </div>
                <button
                  onClick={() => setEmpresaSelecionada(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Opções de Status */}
              <div className="p-4 space-y-2">
                {Object.entries(statusColors).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => {
                      updateEmpresaStatus(empresaSelecionada.id, status);
                      setEmpresaSelecionada(null);
                    }}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 border
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getStatusDescription(status)}
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
          
          {/* KPIs - minimalistas com acento roxo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-4 hover:border-accent/50 hover:shadow-sm transition-all duration-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground mb-1">Total de Empresas</p>
                  <span className="text-2xl font-semibold text-gray-900 dark:text-foreground">{empresasFiltradas.length}</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/15 dark:bg-accent/10 flex items-center justify-center">
                  <Building size={18} className="text-accent" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-4 hover:border-accent/50 hover:shadow-sm transition-all duration-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground mb-1">Com Website</p>
                  <span className="text-2xl font-semibold text-gray-900 dark:text-foreground">{totalComWebsite}</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/15 dark:bg-accent/10 flex items-center justify-center">
                  <Globe size={18} className="text-accent" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-4 hover:border-accent/50 hover:shadow-sm transition-all duration-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground mb-1">Com WhatsApp</p>
                  <span className="text-2xl font-semibold text-gray-900 dark:text-foreground">{totalComWhatsApp}</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/15 dark:bg-accent/10 flex items-center justify-center">
                  <Phone size={18} className="text-accent" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-4 hover:border-accent/50 hover:shadow-sm transition-all duration-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground mb-1">Cidades</p>
                  <span className="text-2xl font-semibold text-gray-900 dark:text-foreground">{cidades.length}</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/15 dark:bg-accent/10 flex items-center justify-center">
                  <MapPin size={18} className="text-accent" />
                </div>
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="bg-card border border-border rounded-xl p-3 md:p-4">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-accent/30 scrollbar-track-transparent">
              <div className="min-w-[900px]">
                <KanbanBoard 
                  empresas={empresasFiltradas} 
                  onAbrirDetalhes={setEmpresaDetalhes}
                />
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Modal de Confirmação de Exclusão */}
      {empresaParaExcluir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Excluir Empresa
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tem certeza que deseja excluir a empresa <strong className="text-gray-900 dark:text-white">{empresaParaExcluir.empresa_nome}</strong>? 
                Esta ação irá remover permanentemente todos os dados da empresa.
              </p>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => setEmpresaParaExcluir(null)}
                  disabled={isExcluindo}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => excluirEmpresa(empresaParaExcluir.id)}
                  disabled={isExcluindo}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isExcluindo ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Excluir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpresasPage;