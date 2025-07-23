import React, { useState, useEffect, useRef } from 'react';
import { Building, MapPin, Globe, ChevronDown, Search, Target, Download, Phone, Save } from '../../utils/icons';
import { captarEmpresas, buscarLocalizacoes, salvarEmpresas, type Empresa } from '../../services/edgeFunctions';
import FiltrosAtivosBanner from '../../components/ui/FiltrosAtivosBanner';
import PageHeader from '../../components/ui/PageHeader';
import { supabase } from '../../lib/supabase';

interface Location {
  name: string;
  canonicalName?: string;
  googleId?: number;
  countryCode: string;
  targetType?: string;
}

const LeadsPage: React.FC = () => {
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

    setLoading(true);
    setErrorMessage('');
    setEmpresasSalvas(false);
    
    try {
      const result = await captarEmpresas(formData);
      
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

  const handleExportarCSV = () => {
    const csvContent = [
      ['Título', 'Endereço', 'Website', 'Telefone'],
      ...empresas.map(empresa => [
        empresa.title,
        empresa.address || '',
        empresa.website || '',
        empresa.phoneNumber || ''
      ])
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leads.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background p-2 md:p-6">
      <div className="page-content-wrapper">
        <PageHeader
          title="Leads"
          subtitle="Encontre e gerencie seus leads potenciais."
          icon={<Target size={32} className="text-primary" />}
        />

        {/* Formulário de Busca */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
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
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Tipo de Empresa <span className="text-destructive">*</span>
              </label>
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
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Localização <span className="text-xs text-muted-foreground">(opcional)</span>
              </label>
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
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Quantidade <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.quantidadeEmpresas}
                onChange={(e) => setFormData({ ...formData, quantidadeEmpresas: parseInt(e.target.value) })}
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
                    onClick={handleSalvarEmpresas}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Save size={14} />
                    Salvar no Banco
                  </button>
                  <button
                    onClick={handleExportarCSV}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-border hover:bg-accent/5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Download size={14} />
                    Exportar CSV
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mx-auto mb-3"></div>
                <p className="text-sm text-muted-foreground">Buscando empresas...</p>
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
      </div>
    </div>
  );
};

export default LeadsPage; 