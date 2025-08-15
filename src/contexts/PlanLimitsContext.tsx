import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PlanLimits {
  // Limites do plano
  maxEmpresas: number;
  maxDisparos: number;
  maxConexoes: number;
  maxTemplates: number;
  
  // Uso atual
  empresasUsadas: number;
  disparosUsados: number;
  conexoesUsadas: number;
  templatesUsados: number;
  
  // Limites diários
  empresasDiarias: number;
  disparosDiarios: number;
  
  // Estado do plano
  planType: 'free' | 'premium';
  resetDate: string; // Data do próximo reset diário
}

interface PlanLimitsContextType {
  limits: PlanLimits;
  refreshLimits: () => Promise<void>;
  canPerformAction: (action: 'buscar_empresas' | 'fazer_disparo' | 'criar_conexao' | 'criar_template', quantity?: number) => Promise<boolean>;
  getRemainingLimit: (type: 'empresas' | 'disparos' | 'conexoes' | 'templates') => number;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  upgradeReason: string;
  setUpgradeReason: (reason: string) => void;
}

const PlanLimitsContext = createContext<PlanLimitsContextType | undefined>(undefined);

// Limites padrão para plano gratuito
const FREE_PLAN_LIMITS = {
  maxEmpresas: 20,
  maxDisparos: 15,
  maxConexoes: 1,
  maxTemplates: 1,
  empresasDiarias: 15,
  disparosDiarios: 10,
};

export const PlanLimitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<PlanLimits>({
    maxEmpresas: FREE_PLAN_LIMITS.maxEmpresas,
    maxDisparos: FREE_PLAN_LIMITS.maxDisparos,
    maxConexoes: FREE_PLAN_LIMITS.maxConexoes,
    maxTemplates: FREE_PLAN_LIMITS.maxTemplates,
    empresasUsadas: 0,
    disparosUsados: 0,
    conexoesUsadas: 0,
    templatesUsados: 0,
    empresasDiarias: FREE_PLAN_LIMITS.empresasDiarias,
    disparosDiarios: FREE_PLAN_LIMITS.disparosDiarios,
    planType: 'free',
    resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  const refreshLimits = async () => {
    if (!user?.id) return;

    try {
      // Buscar estatísticas do usuário usando função do banco
      const { data, error } = await supabase.rpc('get_user_usage_stats', {
        p_user_id: user.id
      });

      if (error) {
        console.warn('Erro na função get_user_usage_stats, usando contagem manual:', error);
        throw error;
      }
      
      // Se a função retornou um erro dentro do JSON
      if (data?.error) {
        console.warn('Erro interno na função get_user_usage_stats:', data.error);
        throw new Error(data.error);
      }

      if (data) {
        setLimits({
          maxEmpresas: data.max_empresas || 20,
          maxDisparos: data.max_disparos || 15,
          maxConexoes: data.max_conexoes || 1,
          maxTemplates: data.max_templates || 1,
          empresasUsadas: data.empresas_usadas || 0,
          disparosUsados: data.disparos_usados || 0,
          conexoesUsadas: data.conexoes_usadas || 0,
          templatesUsados: data.templates_usados || 0,
          empresasDiarias: data.empresas_diarias || 15,
          disparosDiarios: data.disparos_diarios || 10,
          planType: data.plan_type || 'free',
          resetDate: data.reset_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

    } catch (error) {
      console.error('Erro ao atualizar limites, usando fallback manual:', error);
      
      // Fallback: contar manualmente do banco se a função não funcionar
      try {
        const today = new Date().toISOString().split('T')[0];

        // Contar dados manualmente
        const [empresasResult, disparosResult, conexoesResult, templatesResult] = await Promise.allSettled([
          supabase.from('empresas').select('id', { count: 'exact' }).eq('user_id', user.id).gte('capturado_em', today),
          supabase.from('campanhas_disparo').select('id', { count: 'exact' }).eq('user_id', user.id).gte('criado_em', today),
          supabase.from('whatsapp_instances').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('message_templates').select('id', { count: 'exact' }).eq('user_id', user.id)
        ]);

        const empresasUsadas = empresasResult.status === 'fulfilled' ? (empresasResult.value.count || 0) : 0;
        const disparosUsados = disparosResult.status === 'fulfilled' ? (disparosResult.value.count || 0) : 0;
        const conexoesUsadas = conexoesResult.status === 'fulfilled' ? (conexoesResult.value.count || 0) : 0;
        const templatesUsados = templatesResult.status === 'fulfilled' ? (templatesResult.value.count || 0) : 0;

        setLimits(prev => ({
          ...prev,
          empresasUsadas,
          disparosUsados,
          conexoesUsadas,
          templatesUsados,
        }));
        
        console.log('Limites atualizados com contagem manual:', { empresasUsadas, disparosUsados, conexoesUsadas, templatesUsados });
      } catch (fallbackError) {
        console.error('Erro no fallback manual:', fallbackError);
      }
    }
  };

  const canPerformAction = async (action: string, quantity: number = 1): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('check_user_limits', {
        p_user_id: user.id,
        p_action_type: action,
        p_quantity: quantity
      });

      if (error) {
        console.warn('Erro na função check_user_limits, usando fallback:', error);
        throw error;
      }
      
      // Se a função retornou um erro dentro do JSON
      if (data?.error) {
        console.warn('Erro interno na função check_user_limits:', data.error);
        throw new Error(data.error);
      }
      
      return data?.can_perform || false;
    } catch (error) {
      console.error('Erro ao verificar limites, usando verificação local:', error);
      
      // Fallback para verificação local quando a função do banco não funciona
      console.warn('Usando verificação local de limites para:', action);
      
      switch (action) {
        case 'buscar_empresas':
          return (limits.empresasUsadas + quantity) <= limits.maxEmpresas;
        case 'fazer_disparo':
          return (limits.disparosUsados + quantity) <= limits.maxDisparos;
        case 'criar_conexao':
          // Verificar se o usuário tem instâncias ativas antes de aplicar limite
          try {
            if (user?.id) {
              const { data: existingInstances } = await supabase
                .from('whatsapp_instances')
                .select('id')
                .eq('user_id', user.id);
              
              // Se não tem instâncias, permitir criar (sem limite)
              if (!existingInstances || existingInstances.length === 0) {
                console.log('Usuário não tem instâncias ativas, permitindo criar conexão sem limite');
                return true;
              }
            }
            
            // Se tem instâncias ou erro, aplicar limite normal
            return (limits.conexoesUsadas + quantity) <= limits.maxConexoes;
          } catch (error) {
            console.error('Erro ao verificar instâncias existentes:', error);
            // Em caso de erro, aplicar limite normal
            return (limits.conexoesUsadas + quantity) <= limits.maxConexoes;
          }
        case 'criar_template':
          return (limits.templatesUsados + quantity) <= limits.maxTemplates;
        default:
          return true;
      }
    }
  };

  const getRemainingLimit = (type: string): number => {
    switch (type) {
      case 'empresas':
        return Math.max(0, limits.maxEmpresas - limits.empresasUsadas);
      case 'disparos':
        return Math.max(0, limits.maxDisparos - limits.disparosUsados);
      case 'conexoes':
        // Para conexões, sempre retornar pelo menos 1 se não houver instâncias
        // A verificação real será feita em canPerformAction
        return Math.max(1, limits.maxConexoes - limits.conexoesUsadas);
      case 'templates':
        return Math.max(0, limits.maxTemplates - limits.templatesUsados);
      default:
        return 0;
    }
  };

  useEffect(() => {
    if (user?.id) {
      refreshLimits();
      // Atualizar a cada 5 minutos
      const interval = setInterval(refreshLimits, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  return (
    <PlanLimitsContext.Provider value={{
      limits,
      refreshLimits,
      canPerformAction,
      getRemainingLimit,
      showUpgradeModal,
      setShowUpgradeModal,
      upgradeReason,
      setUpgradeReason,
    }}>
      {children}
    </PlanLimitsContext.Provider>
  );
};

export const usePlanLimits = () => {
  const context = useContext(PlanLimitsContext);
  if (context === undefined) {
    throw new Error('usePlanLimits deve ser usado dentro de um PlanLimitsProvider');
  }
  return context;
}; 