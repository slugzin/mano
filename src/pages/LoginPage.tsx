import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/admin');
  }, [navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="text-muted-foreground text-lg">Redirecionando...</span>
    </div>
  );
};

export default LoginPage;