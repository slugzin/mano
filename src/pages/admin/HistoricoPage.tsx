import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DisparosHistoricoPage from './DisparosHistoricoPage';
import { 
  Clock, 
  MessageSquare, 
  Target,
  FileText,
  GitBranch
} from 'lucide-react';

const HistoricoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campanhas'>('campanhas');
  const navigate = useNavigate();

  const tabs = [
    {
      id: 'campanhas' as const,
      label: 'Campanhas',
      icon: Target,
      description: 'Todas as campanhas'
    }
  ];

  const renderContent = () => {
    return <DisparosHistoricoPage />;
  };

  return (
    <div className="min-h-full bg-background">
      {/* Header Mobile */}
      <div className="md:hidden">
        <div className="flex items-center gap-3 p-3 border-b border-border bg-background">
          <Clock className="text-primary" size={20} />
          <div>
            <h1 className="text-base font-medium text-foreground">Histórico</h1>
            <p className="text-xs text-muted-foreground">Acompanhe suas campanhas</p>
          </div>
        </div>
      </div>

      {/* Header Desktop */}
      <div className="hidden md:block">
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <Clock className="text-primary" size={24} />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Histórico</h1>
            <p className="text-muted-foreground">Acompanhe todas as suas campanhas e mensagens</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'text-primary border-primary bg-primary/5'
                    : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default HistoricoPage; 