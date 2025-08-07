import { supabase } from '../lib/supabase';

/**
 * Obtém o JWT token do usuário logado
 * @returns Promise<string | null> - O token JWT ou null se não estiver logado
 */
export const getJWTToken = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erro ao obter sessão:', error);
      return null;
    }
    
    if (session?.access_token) {
      console.log('✅ JWT token obtido com sucesso');
      return session.access_token;
    } else {
      console.log('⚠️ Nenhuma sessão válida encontrada');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao obter JWT token:', error);
    return null;
  }
};

/**
 * Obtém informações do usuário logado
 * @returns Promise<{user_id: string, email: string, role: string} | null>
 */
export const getUserInfo = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      return null;
    }
    
    return {
      user_id: session.user.id,
      email: session.user.email || '',
      role: session.user.role || 'authenticated'
    };
  } catch (error) {
    console.error('❌ Erro ao obter informações do usuário:', error);
    return null;
  }
};

/**
 * Verifica se o usuário está autenticado
 * @returns Promise<boolean>
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getJWTToken();
  return token !== null;
};

/**
 * Obtém headers de autenticação para requisições
 * @returns Promise<{Authorization: string} | null>
 */
export const getAuthHeaders = async () => {
  const token = await getJWTToken();
  
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  return null;
};

/**
 * Função para testar a autenticação e obter informações
 * @returns Promise<{success: boolean, data?: any, error?: string}>
 */
export const testAuthentication = async () => {
  try {
    const token = await getJWTToken();
    const userInfo = await getUserInfo();
    
    if (!token) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      };
    }
    
    return {
      success: true,
      data: {
        token: token.substring(0, 50) + '...', // Mostrar apenas parte do token
        user_info: userInfo
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Erro ao testar autenticação: ${error}`
    };
  }
}; 