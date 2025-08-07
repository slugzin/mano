import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../ui/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen page="default" />;
  }

  // Se não está logado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se precisa ser admin e não é admin
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Se o usuário não está ativo
  if (profile && !profile.is_active) {
    return <Navigate to="/account-disabled" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 