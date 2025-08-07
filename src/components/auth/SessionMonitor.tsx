import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface SessionMonitorProps {
  children: React.ReactNode;
}

const SessionMonitor: React.FC<SessionMonitorProps> = ({ children }) => {
  const { user, session, refreshSession } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!user || !session) {
      // Limpar intervalo se não há usuário ou sessão
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      retryCountRef.current = 0;
      return;
    }

    // Função para verificar e renovar a sessão
    const checkAndRefreshSession = async () => {
      try {
        console.log('🔍 Verificando sessão...');
        
        // Verificar se a sessão ainda é válida
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          retryCountRef.current++;
          
          if (retryCountRef.current >= maxRetries) {
            console.log('⚠️ Máximo de tentativas atingido, fazendo logout...');
            await supabase.auth.signOut();
            retryCountRef.current = 0;
          }
          return;
        }

        if (!currentSession) {
          console.log('⚠️ Sessão não encontrada, redirecionando para login...');
          await supabase.auth.signOut();
          retryCountRef.current = 0;
          return;
        }

        // Reset do contador de tentativas se tudo está OK
        retryCountRef.current = 0;

        // Verificar se o token está próximo de expirar (10 minutos antes)
        const expiresAt = currentSession.expires_at;
        if (expiresAt) {
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = expiresAt - now;
          
          console.log(`⏰ Tempo até expiração: ${timeUntilExpiry} segundos`);
          
          // Se faltam menos de 10 minutos para expirar, tentar renovar
          if (timeUntilExpiry < 600) {
            console.log('🔄 Token próximo de expirar, tentando renovar...');
            try {
              await refreshSession();
              console.log('✅ Sessão renovada com sucesso');
            } catch (refreshError) {
              console.error('❌ Erro ao renovar sessão:', refreshError);
              retryCountRef.current++;
            }
          } else {
            console.log('✅ Sessão ainda válida');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        retryCountRef.current++;
        
        if (retryCountRef.current >= maxRetries) {
          console.log('⚠️ Máximo de tentativas atingido, fazendo logout...');
          await supabase.auth.signOut();
          retryCountRef.current = 0;
        }
      }
    };

    // Verificar a cada 3 minutos (reduzido de 2 para 3)
    intervalRef.current = setInterval(checkAndRefreshSession, 3 * 60 * 1000);
    
    // Verificar imediatamente na primeira vez
    checkAndRefreshSession();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, session, refreshSession]);

  // Monitorar mudanças de foco da janela para verificar sessão
  useEffect(() => {
    const handleFocus = async () => {
      if (user && session) {
        console.log('🖥️ Janela focada, verificando sessão...');
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error || !currentSession) {
            console.log('⚠️ Sessão inválida ao focar janela, redirecionando...');
            await supabase.auth.signOut();
          } else {
            console.log('✅ Sessão válida ao focar janela');
          }
        } catch (error) {
          console.error('❌ Erro ao verificar sessão ao focar:', error);
        }
      }
    };

    // Monitorar também quando a janela volta do background
    const handleVisibilityChange = async () => {
      if (!document.hidden && user && session) {
        console.log('👁️ Página visível, verificando sessão...');
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error || !currentSession) {
            console.log('⚠️ Sessão inválida ao tornar página visível, redirecionando...');
            await supabase.auth.signOut();
          } else {
            console.log('✅ Sessão válida ao tornar página visível');
          }
        } catch (error) {
          console.error('❌ Erro ao verificar sessão ao tornar visível:', error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, session]);

  // Monitorar conexão de rede
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada');
      if (user && session) {
        // Verificar sessão quando a conexão volta
        setTimeout(async () => {
          try {
            const { data: { session: currentSession }, error } = await supabase.auth.getSession();
            if (error || !currentSession) {
              console.log('⚠️ Sessão inválida após restauração de conexão');
              await supabase.auth.signOut();
            } else {
              console.log('✅ Sessão válida após restauração de conexão');
            }
          } catch (error) {
            console.error('❌ Erro ao verificar sessão após restauração:', error);
          }
        }, 2000); // Aguardar 2 segundos para a conexão estabilizar
      }
    };

    const handleOffline = () => {
      console.log('📴 Conexão perdida');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, session]);

  return <>{children}</>;
};

export default SessionMonitor; 