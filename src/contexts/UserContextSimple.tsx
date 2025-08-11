import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
}

interface UserContextType {
  user: User | null;
  isSubscribed: boolean;
  loading: boolean;
  signUp: (userData: { name: string; email: string; phone: string; cpf: string }) => Promise<{ success: boolean; error?: string }>;
  checkSubscription: () => void;
  // Propriedades para compatibilidade
  isFirstTime: boolean;
  canAccessContent: () => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser deve ser usado dentro de UserProvider');
  }
  return context;
};

const getDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

export const UserProviderSimple: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar usuário do localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user_data');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        console.log('👤 Usuário carregado do localStorage:', userData);
      } catch (error) {
        console.error('❌ Erro ao carregar usuário:', error);
        localStorage.removeItem('user_data');
      }
    }
    setLoading(false);
  }, []);

  // Verificar assinatura sempre que o usuário mudar
  const checkSubscription = async () => {
    // Por enquanto, considerar todos os usuários como assinados
    // para evitar erro da tabela user_subscriptions que não existe
    setIsSubscribed(true);
  };

  // Verificar assinatura quando usuário carrega
  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  const signUp = async (userData: { name: string; email: string; phone: string; cpf: string }) => {
    try {
      setLoading(true);
      
      const deviceId = getDeviceId();
      
      // Tentar função principal primeiro
      let { data, error } = await supabase.rpc('create_or_get_user', {
        p_name: userData.name,
        p_email: userData.email,
        p_phone: userData.phone,
        p_device_id: deviceId,
        p_cpf: userData.cpf
      });

      // Se der erro, tentar função alternativa
      if (error) {
        console.warn('⚠️ [SIMPLE] Erro na função principal, tentando alternativa:', error);
        
        const fallbackResult = await supabase.rpc('simple_create_user', {
          p_name: userData.name,
          p_email: userData.email,
          p_phone: userData.phone,
          p_device_id: deviceId,
          p_cpf: userData.cpf
        });
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        console.error('❌ [SIMPLE] Erro no Supabase:', error);
        
        // Criar usuário localmente como último recurso
        const localUser = {
          id: crypto.randomUUID(),
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          cpf: userData.cpf,
          device_id: deviceId,
          created_at: new Date().toISOString()
        };
        
        setUser(localUser);
        localStorage.setItem('user_data', JSON.stringify(localUser));
        console.log('⚠️ [SIMPLE] Usuário criado localmente:', localUser);
        
        return { success: true, warning: 'Usuário criado localmente. Alguns recursos podem ser limitados.' };
      }

      if (data?.success) {
        const newUser = data.user;
        setUser(newUser);
        localStorage.setItem('user_data', JSON.stringify(newUser));
        console.log('✅ [SIMPLE] Usuário criado:', newUser);
        return { success: true };
      } else {
        console.error('❌ [SIMPLE] Resposta inválida:', data);
        return { success: false, error: data?.error || 'Erro inesperado no cadastro' };
      }
      
    } catch (error) {
      console.error('❌ [SIMPLE] Erro geral no cadastro:', error);
      return { success: false, error: 'Erro de conexão' };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isSubscribed,
    loading,
    signUp,
    checkSubscription,
    isFirstTime: !user,
    canAccessContent: () => Boolean(user)
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 