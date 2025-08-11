import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: any }>;
  initializeUserData: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para atualizar a sessão
  const refreshSession = async () => {
    try {
      console.log('🔄 Tentando atualizar sessão...');
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Erro ao atualizar sessão:', error);
        return;
      }

      if (newSession) {
        console.log('✅ Sessão atualizada com sucesso');
        setSession(newSession);
        setUser(newSession.user);
        await createProfileFromUser(newSession.user);
      } else {
        console.log('⚠️ Nenhuma sessão encontrada');
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar sessão:', error);
    }
  };

  // Função para criar perfil a partir do usuário (sem depender da tabela profiles)
  const createProfileFromUser = async (user: User) => {
    try {
      console.log('👤 Criando perfil a partir do usuário...');
      
      const userProfile: Profile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        role: user.user_metadata?.role || 'user',
        is_active: true,
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      };
      
      setProfile(userProfile);
      console.log('✅ Perfil criado com sucesso:', userProfile);
      
    } catch (error) {
      console.error('❌ Erro ao criar perfil:', error);
      // Criar perfil básico mesmo com erro
      const basicProfile: Profile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: '',
        role: 'user',
        is_active: true,
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      };
      setProfile(basicProfile);
    }
  };

  useEffect(() => {
    // Pegar sessão inicial
    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando autenticação...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão inicial:', error);
          setLoading(false);
          return;
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          console.log('👤 Usuário encontrado na sessão inicial');
          await createProfileFromUser(initialSession.user);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Erro na inicialização da autenticação:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Mudança de estado de autenticação:', event);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Usuário autenticado:', session.user.email);
          await createProfileFromUser(session.user);
        } else {
          console.log('👤 Usuário desautenticado');
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentando fazer login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        return { error };
      }

      if (data.user) {
        console.log('✅ Login realizado com sucesso');
        // Salvar no localStorage que está logado
        localStorage.setItem('admin_logged_in', 'true');
        localStorage.setItem('admin_login_time', Date.now().toString());
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Erro geral no login:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('📝 Tentando fazer cadastro...', { email, fullName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            name: fullName
          }
        }
      });

      console.log('📝 Resultado do signup:', { data, error });

      if (error) {
        console.error('❌ Erro no cadastro:', error);
        
        // Tratar erros específicos do Supabase
        let errorMessage = error.message;
        
        if (error.message.includes('Database error saving new user')) {
          errorMessage = 'Erro interno do servidor. Tente novamente em alguns instantes.';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado. Faça login ou recupere sua senha.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido. Verifique o formato do email.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        }
        
        return { error: { ...error, message: errorMessage } };
      }

      if (data.user) {
        console.log('✅ Cadastro realizado com sucesso:', data.user);
        
        // Se o usuário foi criado mas não confirmado, ainda é sucesso
        if (!data.user.email_confirmed_at) {
          console.log('📧 Email de confirmação enviado para:', email);
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('❌ Erro geral no cadastro:', error);
      return { 
        error: { 
          message: error.message || 'Erro inesperado ao criar conta. Tente novamente.',
          __isRetryable: true
        } 
      };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Erro no logout:', error);
      } else {
        console.log('✅ Logout realizado com sucesso');
        // Limpar localStorage
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_login_time');
      }
    } catch (error) {
      console.error('❌ Erro geral no logout:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('🔑 Enviando email de reset de senha...');
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        console.error('❌ Erro ao enviar email de reset:', error);
        return { error };
      }
      
      console.log('✅ Email de reset enviado com sucesso');
      return { error: null };
    } catch (error) {
      console.error('❌ Erro geral no reset de senha:', error);
      return { error };
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      console.log('📧 Reenviando email de confirmação...');
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      
      if (error) {
        console.error('❌ Erro ao reenviar email:', error);
        return { error };
      }
      
      console.log('✅ Email de confirmação reenviado com sucesso');
      return { error: null };
    } catch (error) {
      console.error('❌ Erro geral no reenvio:', error);
      return { error };
    }
  };

  const initializeUserData = async () => {
    try {
      if (!user) {
        console.log('⚠️ Nenhum usuário para inicializar dados');
        return { error: 'Nenhum usuário' };
      }

      console.log('🚀 Inicializando dados do usuário...');
      // Como não podemos usar a tabela profiles, vamos apenas logar
      console.log('✅ Dados do usuário inicializados (perfil criado em memória)');
      
      return { error: null };
    } catch (error) {
      console.error('❌ Erro geral na inicialização de dados:', error);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      console.log('📝 Atualizando perfil...');
      
      if (!profile) {
        console.error('❌ Nenhum perfil para atualizar');
        return { error: 'Nenhum perfil' };
      }

      // Atualizar apenas em memória (sem depender da tabela profiles)
      const updatedProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };
      setProfile(updatedProfile);
      
      console.log('✅ Perfil atualizado com sucesso (em memória)');
      return { error: null };
    } catch (error) {
      console.error('❌ Erro geral na atualização do perfil:', error);
      return { error };
    }
  };

  const refreshAuth = async () => {
    try {
      console.log('🔄 Refreshing auth state...');
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Erro ao atualizar sessão:', error);
        return false;
      }

      if (newSession) {
        console.log('✅ Sessão atualizada com sucesso');
        setSession(newSession);
        setUser(newSession.user);
        await createProfileFromUser(newSession.user);
        return true;
      } else {
        console.log('⚠️ Nenhuma sessão encontrada');
        setSession(null);
        setUser(null);
        setProfile(null);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar sessão:', error);
      return false;
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmationEmail,
    initializeUserData,
    updateProfile,
    refreshSession,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 