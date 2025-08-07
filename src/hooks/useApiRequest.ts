import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UseApiRequestOptions {
  maxRetries?: number;
  retryDelay?: number;
  onAuthError?: () => void;
}

export const useApiRequest = (options: UseApiRequestOptions = {}) => {
  const { maxRetries = 2, retryDelay = 1000, onAuthError } = options;
  const { refreshAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeRequest = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      onSuccess?: (data: T) => void,
      onError?: (error: string) => void
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      let lastError: any;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await requestFn();
          
          if (onSuccess) {
            onSuccess(result);
          }
          
          setIsLoading(false);
          return result;
        } catch (err: any) {
          lastError = err;
          
          // Verificar se é erro de autenticação
          const isAuthError = 
            err?.message?.includes('JWT') || 
            err?.message?.includes('token') || 
            err?.message?.includes('unauthorized') ||
            err?.status === 401 ||
            err?.code === 'PGRST301' ||
            err?.code === 'PGRST302';

          if (isAuthError && attempt < maxRetries) {
            console.log(`🔄 Tentativa ${attempt + 1}: Erro de autenticação detectado, tentando renovar...`);
            
            try {
              // Tentar renovar a autenticação
              const refreshed = await refreshAuth();
              
              if (refreshed) {
                console.log('✅ Autenticação renovada, tentando novamente...');
                // Aguardar antes da próxima tentativa
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
              } else {
                console.log('❌ Falha ao renovar autenticação');
                if (onAuthError) {
                  onAuthError();
                }
                break;
              }
            } catch (refreshError) {
              console.error('❌ Erro ao renovar autenticação:', refreshError);
              if (onAuthError) {
                onAuthError();
              }
              break;
            }
          } else {
            // Se não é erro de autenticação ou já tentou o máximo de vezes
            const errorMessage = err?.message || 'Erro desconhecido';
            setError(errorMessage);
            
            if (onError) {
              onError(errorMessage);
            }
            
            setIsLoading(false);
            throw err;
          }
        }
      }

      // Se chegou aqui, todas as tentativas falharam
      const finalErrorMessage = lastError?.message || 'Erro após múltiplas tentativas';
      setError(finalErrorMessage);
      
      if (onError) {
        onError(finalErrorMessage);
      }
      
      setIsLoading(false);
      return null;
    },
    [maxRetries, retryDelay, refreshAuth, onAuthError]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    executeRequest,
    isLoading,
    error,
    clearError
  };
}; 