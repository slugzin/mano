import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    
    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', event);
        if (session && session.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          // Limpar qualquer cache local quando logout
          localStorage.removeItem('admin_logged_in');
          localStorage.removeItem('admin_login_time');
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Verificando status de autenticação...');
      
      // APENAS verificar sessão JWT do Supabase - SEM fallback localStorage
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        setIsAuthenticated(false);
        return;
      }

      if (session && session.user) {
        // Verificar se o token não expirou
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at > now) {
          console.log('✅ Sessão JWT válida encontrada');
          setIsAuthenticated(true);
        } else {
          console.log('⏰ Token JWT expirado');
          await supabase.auth.signOut();
          setIsAuthenticated(false);
        }
      } else {
        console.log('❌ Nenhuma sessão válida encontrada');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        console.log('✅ Login realizado com sucesso');
        setIsAuthenticated(true);
        return { success: true, error: null };
      }

      return { success: false, error: 'Falha na autenticação' };
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      
      // Limpar localStorage completamente
      localStorage.removeItem('admin_logged_in');
      localStorage.removeItem('admin_login_time');
      
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus
  };
}; 