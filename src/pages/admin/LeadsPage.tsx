import React, { useState, useEffect, useRef } from 'react';
import { Building, MapPin, Globe, ChevronDown, Search, Target, Phone, Save, MessageCircle, X, Play, CheckCircle } from '../../utils/icons';
import { captarEmpresas, buscarLocalizacoes, salvarEmpresas, type Empresa } from '../../services/edgeFunctions';
import FiltrosAtivosBanner from '../../components/ui/FiltrosAtivosBanner';
import PageHeader from '../../components/ui/PageHeader';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Location {
  name: string;
  canonicalName?: string;
  googleId?: number;
  countryCode: string;
  targetType?: string;
}

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipoEmpresa: '',
    pais: 'BR',
    localizacao: '',
    idioma: 'pt-br',
    quantidadeEmpresas: 10
  });

  const quantidadeOpcoes = [10, 20, 30, 50, 100, 500, 1000];
  
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [salvandoEmpresas, setSalvandoEmpresas] = useState(false);
  const [empresasSalvas, setEmpresasSalvas] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const locationInputRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchLocations = async (query: string) => {
    if (query.length < 1) {
      setLocations([]);
      setShowLocationDropdown(false);
      return;
    }
    
    try {
      setLoadingLocations(true);
      setShowLocationDropdown(true);
      
      const { data, error } = await supabase.functions.invoke('location', {
        body: { q: query }
      });

      if (error) {
        console.error('Erro ao buscar localizações:', error);
        setLocations([]);
      } else if (data && Array.isArray(data)) {
        setLocations(data);
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleLocationSearch = (value: string) => {
    setFormData({ ...formData, localizacao: value });
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (!value || value.length < 1) {
      setShowLocationDropdown(false);
      setLocations([]);
      return;
    }
    
    const newTimeout = setTimeout(() => {
      searchLocations(value);
    }, 300);
    
    setSearchTimeout(newTimeout);
  };

  const selectLocation = (location: Location) => {
    const selectedLocation = location.canonicalName || location.name;
    setFormData({ ...formData, localizacao: selectedLocation });
    setShowLocationDropdown(false);
    setLocations([]);
  };

  // Debug do estado do dropdown
  useEffect(() => {
    console.log('=== DEBUG DROPDOWN ===');
    console.log('showLocationDropdown:', showLocationDropdown);
    console.log('locationsCount:', locations.length);
    console.log('loadingLocations:', loadingLocations);
    console.log('inputValue:', formData.localizacao);
    console.log('locations array:', locations);
    console.log('Dropdown deveria aparecer?', showLocationDropdown && (loadingLocations || locations.length > 0 || formData.localizacao.length >= 1));
    console.log('=====================');
  }, [showLocationDropdown, locations, loadingLocations, formData.localizacao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.tipoEmpresa.trim()) {
      setErrorMessage('Por favor, informe o tipo de empresa');
      return;
    }

    // Garantir que a quantidade seja pelo menos 10
    const quantidadeFinal = Math.max(formData.quantidadeEmpresas || 10, 10);
    const dadosBusca = {
      ...formData,
      quantidadeEmpresas: quantidadeFinal
    };

    setLoading(true);
    setErrorMessage('');
    setEmpresasSalvas(false);
    
    try {
      const result = await captarEmpresas(dadosBusca);
      
      if (result.success && result.data) {
        setEmpresas(result.data.empresas);
        console.log('Empresas encontradas:', result.data.empresas);
      } else {
        setErrorMessage(result.error || 'Erro ao buscar empresas');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setErrorMessage('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarEmpresas = async () => {
    setSalvandoEmpresas(true);
    setErrorMessage('');
    
    try {
      const result = await salvarEmpresas({
        empresas,
        parametrosBusca: {
          tipoEmpresa: formData.tipoEmpresa,
          localizacao: formData.localizacao || '',
          pais: formData.pais,
          idioma: formData.idioma,
          quantidadeSolicitada: formData.quantidadeEmpresas
        }
      });
      
      if (result.success) {
        setEmpresasSalvas(true);
        console.log('Empresas salvas:', result.empresasSalvas);
        alert(`✅ ${result.message}`);
      } else {
        setErrorMessage(result.error || 'Erro ao salvar empresas');
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao salvar empresas:', error);
      setErrorMessage('Erro de conexão ao salvar.');
      alert('❌ Erro de conexão ao salvar empresas.');
    } finally {
      setSalvandoEmpresas(false);
    }
  };



  return (
    <div className="min-h-full bg-background p-2 md:p-6">
      <div className="page-content-wrapper">
        {/* Header Mobile */}
        <div className="md:hidden">
          <div className="flex items-center gap-3 p-3 border-b border-border bg-background">
            <Target className="text-primary" size={20} />
            <div>
              <h1 className="text-base font-medium text-foreground">Leads</h1>
              <p className="text-xs text-muted-foreground">Encontre seus leads</p>
            </div>
          </div>
        </div>

        {/* Header Desktop */}
        <div className="hidden md:block">
          <PageHeader
            title="Leads"
            subtitle="Encontre e gerencie seus leads potenciais."
            icon={<Target size={32} className="text-primary" />}
          />
        </div>

        {/* Formulário de Busca */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 mt-4">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-foreground">Buscar Leads</h2>
            <p className="text-xs text-muted-foreground mt-1">Configure os parâmetros da busca</p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Tipo de Empresa */}
            <div className="bg-background border border-border hover:border-accent/30 rounded-lg p-4 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Building size={16} className="text-accent" />
                <label className="text-xs font-medium text-muted-foreground">
                  Tipo de Empresa <span className="text-destructive">*</span>
                </label>
              </div>
              <input
                type="text"
                value={formData.tipoEmpresa}
                onChange={(e) => setFormData({ ...formData, tipoEmpresa: e.target.value })}
                placeholder="Ex: clínicas médicas, restaurantes..."
                className="w-full bg-card px-3 py-2 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            {/* Localização - Opcional */}
            <div ref={locationInputRef} className="relative bg-background border border-border hover:border-accent/30 rounded-lg p-4 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-accent" />
                <label className="text-xs font-medium text-muted-foreground">
                  Localização <span className="text-xs text-muted-foreground">(opcional)</span>
                </label>
              </div>
              <input
                type="text"
                value={formData.localizacao}
                onChange={(e) => handleLocationSearch(e.target.value)}
                placeholder="Digite a cidade"
                className="w-full bg-card px-3 py-2 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              
              {/* Lista de Sugestões */}
              {showLocationDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {loadingLocations ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent mx-auto mb-2"></div>
                      Buscando localizações...
                    </div>
                  ) : locations.length > 0 ? (
                    <div className="py-1">
                      {locations.map((location, index) => (
                        <button
                          key={location.googleId || index}
                          onClick={() => selectLocation(location)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-accent/10 focus:bg-accent/10 focus:outline-none transition-colors"
                        >
                          <span className="font-medium">{location.name}</span>
                          {location.canonicalName && (
                            <span className="block text-xs text-muted-foreground mt-0.5">
                              {location.canonicalName}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : formData.localizacao.length > 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      Nenhuma localização encontrada
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Quantidade */}
            <div className="bg-background border border-border hover:border-accent/30 rounded-lg p-4 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-accent" />
                <label className="text-xs font-medium text-muted-foreground">
                  Quantidade <span className="text-destructive">*</span>
                </label>
              </div>
              <select
                value={formData.quantidadeEmpresas}
                onChange={(e) => setFormData({ ...formData, quantidadeEmpresas: parseInt(e.target.value) || 10 })}
                className="w-full bg-card px-3 py-2 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
                required
              >
                {quantidadeOpcoes.map((quantidade) => (
                  <option key={quantidade} value={quantidade}>
                    {quantidade} empresas
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!formData.tipoEmpresa.trim()}
            className="w-full bg-accent text-accent-foreground h-12 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Target size={16} />
            Buscar Empresas
          </button>
        </div>

        {/* Resultados */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-sm font-medium text-foreground">Resultados</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {empresas.length > 0 
                  ? `${empresas.length} empresas encontradas`
                  : 'Nenhuma empresa encontrada ainda'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {empresas.length > 0 && (
                <>
                  <button
                    onClick={() => setShowDispatchModal(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Target size={14} />
                    <span className="hidden sm:inline">Captar Empresas</span>
                    <span className="sm:hidden">Captar</span>
                  </button>

                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                {/* Ícone animado */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="mb-4"
                >
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto">
                    <Target size={24} className="text-accent" />
                  </div>
                </motion.div>

                {/* Texto */}
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Buscando empresas...
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Analisando dados e encontrando leads ideais
                </p>

                {/* Loading dots */}
                <div className="flex justify-center space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                      className="w-2 h-2 rounded-full bg-accent"
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : empresas.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target size={24} className="text-accent" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">Configure sua busca</h3>
              <p className="text-xs text-muted-foreground">
                Preencha os campos acima e clique em Buscar Empresas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {empresas.map((empresa, index) => (
                <div
                  key={index}
                  className="bg-background border border-border hover:border-accent/30 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building size={16} className="text-accent" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {empresa.title}
                      </h3>
                      {empresa.address && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <MapPin size={12} />
                          <span className="truncate">{empresa.address}</span>
                        </p>
                      )}
                      {empresa.website && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Globe size={12} />
                          <a 
                            href={empresa.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-accent hover:underline truncate"
                          >
                            {empresa.website.replace(/^https?:\/\//, '')}
                          </a>
                        </p>
                      )}
                      {empresa.phoneNumber && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Phone size={12} />
                          <span className="truncate">{empresa.phoneNumber}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Confirmação para Disparar */}
        <AnimatePresence>
          {showDispatchModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              {/* Ocultar menu de abas no mobile quando modal está aberto */}
              <style>{`
                @media (max-width: 768px) {
                  nav.md\\:hidden {
                    display: none !important;
                  }
                }
              `}</style>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-background border border-border rounded-xl w-full max-w-md max-h-[81vh] overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                        <MessageCircle size={20} className="text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Captar Empresas
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {empresas.length} empresas encontradas
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDispatchModal(false)}
                      className="p-2 text-muted-foreground hover:bg-accent/10 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <Target size={20} className="sm:w-6 sm:h-6 text-green-500" />
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">
                      Empresas Captadas com Sucesso!
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Suas empresas serão salvas para você disparar mensagens e visualizar os resultados posteriormente.
                    </p>
                  </div>

                  {/* Resumo */}
                  <div className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-lg p-2 sm:p-3 border border-green-500/20">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-bold text-green-600">{empresas.length}</div>
                        <div className="text-xs text-muted-foreground">Empresas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-bold text-green-600">{formData.tipoEmpresa || 'Geral'}</div>
                        <div className="text-xs text-muted-foreground">Tipo</div>
                      </div>
                    </div>
                  </div>

                  {/* Próximos passos */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <h5 className="text-xs sm:text-sm font-medium text-foreground">Próximos passos:</h5>
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-green-600 font-medium">1</span>
                        </div>
                        <span>Captar e organizar suas empresas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-green-600 font-medium">2</span>
                        </div>
                        <span>Configurar mensagem e conexão WhatsApp</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-green-600 font-medium">3</span>
                        </div>
                        <span>Iniciar disparo e acompanhar resultados</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-4 border-t border-border bg-muted/5">
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={() => setShowDispatchModal(false)}
                      className="flex-1 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-lg transition-colors font-medium border border-border hover:border-border/60"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        // Captar empresas
                        setSalvandoEmpresas(true);
                        try {
                          const result = await salvarEmpresas({
                            empresas,
                            parametrosBusca: {
                              tipoEmpresa: formData.tipoEmpresa,
                              localizacao: formData.localizacao || '',
                              pais: formData.pais,
                              idioma: formData.idioma,
                              quantidadeSolicitada: formData.quantidadeEmpresas
                            }
                          });
                          
                          if (result.success) {
                            setEmpresasSalvas(true);
                            setShowDispatchModal(false);
                            // Redirecionar para disparos
                            navigate('/admin/disparos');
                          } else {
                            alert(`❌ ${result.error}`);
                          }
                        } catch (error) {
                          alert('❌ Erro ao captar empresas');
                        } finally {
                          setSalvandoEmpresas(false);
                        }
                      }}
                      disabled={salvandoEmpresas}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {salvandoEmpresas ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Captando...
                        </>
                      ) : (
                        <>
                          <Target size={16} />
                          Captar e Disparar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LeadsPage; 