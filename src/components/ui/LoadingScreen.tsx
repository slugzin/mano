import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  MessageCircle, 
  Phone, 
  Building, 
  BarChart3, 
  Grid,
  Settings,
  Calendar,
  Activity
} from '../../utils/icons';

interface LoadingScreenProps {
  page: 'dashboard' | 'leads' | 'disparos' | 'conexoes' | 'conversas' | 'campanhas' | 'empresas' | 'fluxos' | 'settings' | 'banco-dados' | 'historico' | 'default';
  isMobile?: boolean;
}

const loadingConfigs = {
  dashboard: {
    icon: Grid,
    title: "Dashboard"
  },
  leads: {
    icon: Target,
    title: "Leads"
  },
  disparos: {
    icon: MessageCircle,
    title: "Disparos"
  },
  conexoes: {
    icon: Phone,
    title: "Conexões"
  },
  conversas: {
    icon: MessageCircle,
    title: "Conversas"
  },
  campanhas: {
    icon: BarChart3,
    title: "Campanhas"
  },
  empresas: {
    icon: Building,
    title: "Empresas"
  },
  fluxos: {
    icon: Activity,
    title: "Fluxos"
  },
  settings: {
    icon: Settings,
    title: "Configurações"
  },
  'banco-dados': {
    icon: BarChart3,
    title: "Banco de Dados"
  },
  historico: {
    icon: Calendar,
    title: "Histórico"
  },
  default: {
    icon: Grid,
    title: "Carregando"
  }
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ page }) => {
  const config = loadingConfigs[page] || loadingConfigs.default;
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {/* Ícone principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto">
            <IconComponent size={24} className="text-accent" />
          </div>
        </motion.div>

        {/* Título */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg font-medium text-foreground mb-3"
        >
          {config.title}
        </motion.h2>

        {/* Loading dots simples */}
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
  );
};

export default LoadingScreen; 