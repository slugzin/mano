import React from 'react';
import { MessageCircle, Users, TrendingUp, Calendar, Play, Pause, CheckCircle, Filter, Search } from '../../utils/icons';

const CampanhasPage: React.FC = () => {
  const campanhas: any[] = [
    // Dados serão carregados do banco de dados
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativa': return 'from-green-500 to-emerald-500';
      case 'Pausada': return 'from-yellow-500 to-orange-500';
      case 'Concluída': return 'from-blue-500 to-cyan-500';
      case 'Rascunho': return 'from-gray-500 to-gray-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ativa': return <Play size={16} />;
      case 'Pausada': return <Pause size={16} />;
      case 'Concluída': return <CheckCircle size={16} />;
      default: return <Play size={16} />;
    }
  };

  return (
    <div className="p-6 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent rounded-xl">
                <MessageCircle size={24} className="text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Campanhas</h1>
                <p className="text-muted-foreground">Gerencie suas campanhas de WhatsApp</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-all duration-300">
                Nova Campanha
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card backdrop-blur-sm border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm text-muted-foreground">Campanhas Ativas</h3>
                <p className="text-lg sm:text-xl font-bold text-foreground">0</p>
              </div>
              <div className="p-2 bg-green-500 rounded-lg">
                <Play size={16} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-card backdrop-blur-sm border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm text-muted-foreground">Mensagens Enviadas</h3>
                <p className="text-lg sm:text-xl font-bold text-foreground">0</p>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg">
                <MessageCircle size={16} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-card backdrop-blur-sm border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm text-muted-foreground">Taxa de Resposta</h3>
                <p className="text-lg sm:text-xl font-bold text-foreground">0%</p>
              </div>
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp size={16} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-card backdrop-blur-sm border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-muted-foreground text-xs">Leads Gerados</h3>
                <p className="text-xl font-bold text-foreground">0</p>
              </div>
              <div className="p-2 bg-accent rounded-lg">
                <Users size={16} className="text-accent-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card backdrop-blur-sm border border-border rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search size={20} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar campanhas..."
                className="bg-background border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-muted-foreground" />
              <select className="bg-background border border-border rounded-lg px-4 py-2 text-foreground">
                <option>Todos os Status</option>
                <option>Ativa</option>
                <option>Pausada</option>
                <option>Concluída</option>
                <option>Rascunho</option>
              </select>
            </div>
            
            <select className="bg-background border border-border rounded-lg px-4 py-2 text-foreground">
              <option>Todos os Tipos</option>
              <option>WhatsApp</option>
              <option>Email</option>
              <option>SMS</option>
            </select>
          </div>
        </div>

        {/* Campanhas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {campanhas.length === 0 ? (
            <div className="col-span-full text-center py-8 sm:py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center">
                  <MessageCircle size={24} className="text-muted-foreground sm:hidden" />
                  <MessageCircle size={32} className="text-muted-foreground hidden sm:block" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-muted-foreground mb-2">Nenhuma campanha encontrada</h3>
                  <p className="text-sm text-muted-foreground">Crie sua primeira campanha para começar</p>
                </div>
                <button className="px-4 sm:px-6 py-2 sm:py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-all duration-300 text-sm sm:text-base">
                  Nova Campanha
                </button>
              </div>
            </div>
          ) : (
            // Lista de campanhas aqui
            <div>Campanhas existentes</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampanhasPage; 