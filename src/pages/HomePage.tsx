import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, Target, Zap, Users, MapPin, Globe, Search, ChevronRight, Play, CheckCircle, X, ChevronDown } from '../utils/icons';

interface Location {
  name: string;
  countryCode: string;
  region: string;
}

const CaptarEmpresasModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    estabelecimento: '',
    pais: 'BR',
    cidade: ''
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setLocations([]);
      return;
    }
    
    try {
      setLoadingLocations(true);
      // Por enquanto vamos simular dados até implementarmos via Supabase Edge Function
      const mockLocations = [
        { name: `${query} - Centro`, countryCode: 'BR', region: 'Brasil' },
        { name: `${query} - Zona Sul`, countryCode: 'BR', region: 'Brasil' },
        { name: `${query} - Zona Norte`, countryCode: 'BR', region: 'Brasil' },
      ];
      setTimeout(() => {
        setLocations(mockLocations);
        setLoadingLocations(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      setLocations([]);
      setLoadingLocations(false);
    }
  };

  const handleLocationSearch = (value: string) => {
    setLocationQuery(value);
    setFormData({ ...formData, cidade: value });
    setShowLocationDropdown(true);
    searchLocations(value);
  };

  const selectLocation = (location: Location) => {
    setLocationQuery(location.name);
    setFormData({ ...formData, cidade: location.name });
    setShowLocationDropdown(false);
    setLocations([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Dados para busca:', formData);
    // Aqui poderia redirecionar para o dashboard ou página de login
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-gray-900 via-gray-900 to-black border border-gray-700/50 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="relative p-8 pb-4">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800/50"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Building size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Descubra Seus Prospects
              </h2>
              <p className="text-gray-400 mt-1">Configure sua busca personalizada</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-8">
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-white">
              Que tipo de empresa você busca?
            </label>
            <p className="text-gray-400 text-sm mb-4">
              Seja específico sobre o segmento que deseja atingir
            </p>
            <div className="relative group">
              <input
                type="text"
                value={formData.estabelecimento}
                onChange={(e) => setFormData({ ...formData, estabelecimento: e.target.value })}
                placeholder="Ex: Clínicas médicas, Restaurantes, Barbearias, Lojas de roupas..."
                className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-gray-800/70 transition-all duration-300 text-lg"
                required
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-lg font-semibold text-white">País</label>
            <div className="relative group">
              <select
                value={formData.pais}
                onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:bg-gray-800/70 transition-all duration-300 text-lg appearance-none cursor-pointer"
                required
              >
                <option value="BR">🇧🇷 Brasil</option>
                <option value="US">🇺🇸 Estados Unidos</option>
                <option value="PT">🇵🇹 Portugal</option>
                <option value="ES">🇪🇸 Espanha</option>
              </select>
              <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-lg font-semibold text-white">Localização</label>
            <p className="text-gray-400 text-sm mb-4">Cidade específica (opcional)</p>
            <div className="relative group">
              <div className="relative">
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  placeholder="Digite uma cidade..."
                  className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-gray-800/70 transition-all duration-300 text-lg"
                  onFocus={() => setShowLocationDropdown(locationQuery.length >= 2)}
                />
                <MapPin size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {showLocationDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-2xl z-10 max-h-60 overflow-y-auto">
                  {loadingLocations ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Buscando cidades...</p>
                    </div>
                  ) : locations.length > 0 ? (
                    locations.map((location, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectLocation(location)}
                        className="w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 transition-colors border-b border-gray-700/30 last:border-b-0 flex items-center gap-3"
                      >
                        <MapPin size={16} className="text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{location.name}</p>
                          <p className="text-gray-400 text-sm">{location.region}</p>
                        </div>
                      </button>
                    ))
                  ) : locationQuery.length >= 2 ? (
                    <div className="p-4 text-center text-gray-400">
                      Nenhuma cidade encontrada
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700/70 transition-all duration-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formData.estabelecimento}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            >
              Descobrir Empresas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const [showCaptarModal, setShowCaptarModal] = useState(false);

  const features = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Segmentação Precisa",
      description: "Encontre exatamente o tipo de empresa que precisa do seu produto ou serviço"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Localização Específica",
      description: "Busque empresas na sua região ou expanda para outras cidades e países"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Resultados Instantâneos",
      description: "Obtenha listas completas com dados de contato em segundos"
    }
  ];

  const examples = [
    {
      title: "SaaS para Restaurantes",
      description: "Busque restaurantes em São Paulo para oferecer seu sistema de delivery",
      segment: "Restaurantes",
      location: "São Paulo, SP"
    },
    {
      title: "Serviços para Barbearias",
      description: "Encontre barbearias na sua região para oferecer produtos de beleza",
      segment: "Barbearias",
      location: "Curitiba, PR"
    },
    {
      title: "Software para Clínicas",
      description: "Localize clínicas médicas para apresentar seu sistema de gestão",
      segment: "Clínicas",
      location: "Rio de Janeiro, RJ"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Defina seu Segmento",
      description: "Escolha o tipo de empresa que você quer prospectar"
    },
    {
      number: "02", 
      title: "Escolha a Localização",
      description: "Selecione a região onde quer buscar seus prospects"
    },
    {
      number: "03",
      title: "Inicie a Busca",
      description: "Nossa IA encontra e organiza os dados para você"
    },
    {
      number: "04",
      title: "Faça Contato",
      description: "Use os dados para iniciar sua prospecção ativa"
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
          <div className="relative max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                  <Building size={32} className="text-white" />
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Quem é seu
                </span>
                <br />
                <span className="text-white">cliente ideal?</span>
              </h1>
              
              <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
                Descubra e conecte-se com empresas que realmente precisam do que você oferece. 
                Deixe nossa inteligência encontrar seus prospects perfeitos enquanto você foca no que importa: <strong className="text-white">crescer</strong>.
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-12">
                <button 
                  onClick={() => setShowCaptarModal(true)}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 font-semibold text-lg"
                >
                  <div className="flex items-center gap-3">
                    <Target size={24} />
                    Descobrir Agora
                    <ChevronRight size={20} />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </button>
                
                <Link to="/admin" className="flex items-center gap-2 px-6 py-4 text-gray-300 hover:text-white transition-colors group">
                  <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center group-hover:bg-gray-700/50 transition-colors">
                    <Play size={20} />
                  </div>
                  <span className="font-medium">Ver Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Por que usar nossa plataforma?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Transforme sua prospecção em um processo automatizado e eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-gray-600/50 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Examples Section */}
        <div className="bg-gray-800/20 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Casos de Uso Reais
              </h2>
              <p className="text-xl text-gray-400">
                Veja como outros profissionais usam nossa plataforma
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {examples.map((example, index) => (
                <div key={index} className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all duration-300">
                  <h3 className="text-xl font-bold text-white mb-3">{example.title}</h3>
                  <p className="text-gray-400 mb-4">{example.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Target size={16} className="text-blue-400" />
                      <span className="text-gray-300">Segmento: {example.segment}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-purple-400" />
                      <span className="text-gray-300">Local: {example.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-400">
              Em 4 passos simples você tem sua lista de prospects
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform -translate-x-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Pronto para Acelerar suas Vendas?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Comece hoje mesmo a prospectar de forma inteligente e eficiente
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => setShowCaptarModal(true)}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 font-semibold text-lg"
              >
                                  <div className="flex items-center gap-3">
                    <Target size={24} />
                    Descobrir Agora
                  </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </button>
              
              <Link 
                to="/login" 
                className="px-8 py-4 bg-transparent border-2 border-blue-500 text-blue-400 font-semibold rounded-2xl hover:bg-blue-500 hover:text-white transition-all duration-300"
              >
                Fazer Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CaptarEmpresasModal 
        isOpen={showCaptarModal} 
        onClose={() => setShowCaptarModal(false)} 
      />
    </>
  );
};

export default HomePage;