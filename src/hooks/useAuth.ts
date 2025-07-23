import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
      const loginTime = localStorage.getItem('admin_login_time');
      
      if (isLoggedIn && loginTime) {
        const now = Date.now();
        const loginTimestamp = parseInt(loginTime);
        const hoursSinceLogin = (now - loginTimestamp) / (1000 * 60 * 60);
        
        // Expirar login após 24 horas
        if (hoursSinceLogin < 24) {
          setIsAuthenticated(true);
        } else {
          // Login expirado, limpar localStorage
          logout();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      logout();
    }
    
    setIsLoading(false);
  };

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_login_time');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus
  };
}; 