import React from 'react';
import { Grid, Users, Building, Phone, Mail, Download, Upload, Filter, Search, RefreshCw } from '../../utils/icons';

const BancoDadosPage: React.FC = () => {
  const bases: any[] = [
    // Dados serão carregados do banco de dados
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-500 text-white';
      case 'Inativo': return 'bg-muted text-muted-foreground';
      case 'Processando': return 'bg-yellow-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'bg-green-500';
    if (quality >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent rounded-xl">
                <Grid size={24} className="text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Banco de Dados</h1>
                <p className="text-muted-foreground">Gerencie suas bases de dados e contatos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                <Upload size={16} />
                Importar
              </button>
              <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
                <RefreshCw size={16} />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-muted-foreground text-xs">Total de Registros</h3>
                <p className="text-xl font-bold text-foreground">0</p>
              </div>
              <div className="p-2 bg-accent rounded-lg">
                <Grid size={16} className="text-accent-foreground" />
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-muted-foreground text-xs">Bases Ativas</h3>
                <p className="text-xl font-bold text-foreground">0</p>
              </div>
              <div className="p-2 bg-green-500 rounded-lg">
                <Users size={16} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-muted-foreground text-xs">Empresas Únicas</h3>
                <p className="text-xl font-bold text-foreground">0</p>
              </div>
              <div className="p-2 bg-purple-500 rounded-lg">
                <Building size={16} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-muted-foreground text-xs">Qualidade Média</h3>
                <p className="text-xl font-bold text-foreground">0%</p>
              </div>
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Mail size={16} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search size={20} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar bases..."
                className="bg-background border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-muted-foreground" />
              <select className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent">
                <option>Todas as Categorias</option>
                <option>Estética</option>
                <option>Alimentação</option>
                <option>Saúde</option>
                <option>Tecnologia</option>
              </select>
            </div>
            
            <select className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent">
              <option>Todos os Status</option>
              <option>Ativo</option>
              <option>Inativo</option>
              <option>Processando</option>
            </select>
          </div>
        </div>

        {/* Bases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {bases.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Grid size={32} className="text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">Nenhuma base de dados encontrada</h3>
                  <p className="text-muted-foreground">Importe ou crie sua primeira base de dados</p>
                </div>
                <button className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Importar Base
                </button>
              </div>
            </div>
          ) : (
            bases.map((base) => (
              <div key={base.id} className="bg-card border border-border rounded-lg p-4 hover:bg-accent/5 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                      <Grid size={20} className="text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-medium">{base.nome}</h3>
                      <p className="text-muted-foreground text-sm">{base.categoria}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(base.status)}`}>
                      {base.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Registros</span>
                    <span className="text-foreground font-medium">{base.registros.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Origem</span>
                    <span className="text-foreground font-medium">{base.origem}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Qualidade</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getQualityColor(base.qualidade)} rounded-full`}
                          style={{ width: `${base.qualidade}%` }}
                        />
                      </div>
                      <span className="text-foreground text-sm">{base.qualidade}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Atualizado</span>
                    <span className="text-muted-foreground text-sm">{base.atualizado}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <button className="flex-1 px-3 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-sm">
                    <Download size={14} className="mr-1" />
                    Exportar
                  </button>
                  <button className="flex-1 px-3 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm">
                    <Phone size={14} className="mr-1" />
                    Contatos
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BancoDadosPage; 