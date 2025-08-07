import { supabase } from '../lib/supabase';
import { Lead, Empresa, Campanha, BaseDados, DashboardStats, LeadForm, EmpresaForm, CampanhaForm } from '../types';

// Interceptor para requisições com retry automático
const withAuthRetry = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // Verificar se é erro de autenticação
      if (error?.message?.includes('JWT') || 
          error?.message?.includes('token') || 
          error?.message?.includes('unauthorized') ||
          error?.status === 401) {
        
        console.log(`🔄 Tentativa ${attempt + 1}: Erro de autenticação detectado, tentando renovar sessão...`);
        
        if (attempt < maxRetries) {
          try {
            // Tentar renovar a sessão
            const { data: { session }, error: refreshError } = await supabase.auth.getSession();
            
            if (refreshError) {
              console.error('❌ Erro ao renovar sessão:', refreshError);
              // Se não conseguir renovar, fazer logout
              await supabase.auth.signOut();
              throw new Error('Sessão expirada. Por favor, faça login novamente.');
            }
            
            if (session) {
              console.log('✅ Sessão renovada, tentando novamente...');
              // Aguardar um pouco antes da próxima tentativa
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            } else {
              console.log('⚠️ Nenhuma sessão válida encontrada');
              await supabase.auth.signOut();
              throw new Error('Sessão expirada. Por favor, faça login novamente.');
            }
          } catch (refreshError) {
            console.error('❌ Erro ao renovar sessão:', refreshError);
            await supabase.auth.signOut();
            throw new Error('Sessão expirada. Por favor, faça login novamente.');
          }
        }
      }
      
      // Se não é erro de autenticação ou já tentou o máximo de vezes
      throw error;
    }
  }
  
  throw lastError;
};

// ====================================
// SERVIÇOS PARA DASHBOARD
// ====================================

export const dashboardService = {
  async getStats(): Promise<DashboardStats | null> {
    return withAuthRetry(async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
        return null;
      }

      return data;
    });
  }
};

// ====================================
// SERVIÇOS PARA LEADS
// ====================================

export const leadsService = {
  async getAll(): Promise<Lead[]> {
    return withAuthRetry(async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          empresa:empresas(*)
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar leads:', error);
        return [];
      }

      return data || [];
    });
  },

  async create(lead: LeadForm): Promise<Lead | null> {
    return withAuthRetry(async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...lead, user_id: user.user.id }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar lead:', error);
        return null;
      }

      return data;
    });
  },

  async update(id: string, lead: Partial<Lead>): Promise<Lead | null> {
    return withAuthRetry(async () => {
      const { data, error } = await supabase
        .from('leads')
        .update(lead)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar lead:', error);
        return null;
      }

      return data;
    });
  },

  async delete(id: string): Promise<boolean> {
    return withAuthRetry(async () => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar lead:', error);
        return false;
      }

      return true;
    });
  }
};

// ====================================
// SERVIÇOS PARA EMPRESAS
// ====================================

export const empresasService = {
  async getAll(): Promise<Empresa[]> {
    return withAuthRetry(async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar empresas:', error);
        return [];
      }

      return data || [];
    });
  },

  async create(empresa: EmpresaForm): Promise<Empresa | null> {
    return withAuthRetry(async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('empresas')
        .insert([{ ...empresa, user_id: user.user.id }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar empresa:', error);
        return null;
      }

      return data;
    });
  },

  async update(id: string, empresa: Partial<Empresa>): Promise<Empresa | null> {
    return withAuthRetry(async () => {
      const { data, error } = await supabase
        .from('empresas')
        .update(empresa)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar empresa:', error);
        return null;
      }

      return data;
    });
  },

  async delete(id: string): Promise<boolean> {
    return withAuthRetry(async () => {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar empresa:', error);
        return false;
      }

      return true;
    });
  }
};

// ====================================
// SERVIÇOS PARA CAMPANHAS
// ====================================

export const campanhasService = {
  async getAll(): Promise<Campanha[]> {
    return withAuthRetry(async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar campanhas:', error);
        return [];
      }

      return data || [];
    });
  },

  async create(campanha: CampanhaForm): Promise<Campanha | null> {
    return withAuthRetry(async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('campanhas')
        .insert([{ ...campanha, user_id: user.user.id }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar campanha:', error);
        return null;
      }

      return data;
    });
  },

  async update(id: string, campanha: Partial<Campanha>): Promise<Campanha | null> {
    return withAuthRetry(async () => {
      const { data, error } = await supabase
        .from('campanhas')
        .update(campanha)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar campanha:', error);
        return null;
      }

      return data;
    });
  },

  async delete(id: string): Promise<boolean> {
    return withAuthRetry(async () => {
      const { error } = await supabase
        .from('campanhas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar campanha:', error);
        return false;
      }

      return true;
    });
  }
};

// ====================================
// SERVIÇOS PARA BASES DE DADOS
// ====================================

export const basesDadosService = {
  async getAll(): Promise<BaseDados[]> {
    return withAuthRetry(async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('bases_dados')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar bases de dados:', error);
        return [];
      }

      return data || [];
    });
  },

  async create(base: Partial<BaseDados>): Promise<BaseDados | null> {
    return withAuthRetry(async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('bases_dados')
        .insert([{ ...base, user_id: user.user.id }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar base de dados:', error);
        return null;
      }

      return data;
    });
  },

  async update(id: string, base: Partial<BaseDados>): Promise<BaseDados | null> {
    return withAuthRetry(async () => {
      const { data, error } = await supabase
        .from('bases_dados')
        .update(base)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar base de dados:', error);
        return null;
      }

      return data;
    });
  },

  async delete(id: string): Promise<boolean> {
    return withAuthRetry(async () => {
      const { error } = await supabase
        .from('bases_dados')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar base de dados:', error);
        return false;
      }

      return true;
    });
  }
};

// ====================================
// SERVIÇOS PARA AUTENTICAÇÃO
// ====================================

export const authService = {
  async signUp(email: string, password: string, nome?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: nome
        }
      }
    });

    if (error) {
      console.error('Erro no cadastro:', error);
      return { user: null, error };
    }

    return { user: data.user, error: null };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Erro no login:', error);
      return { user: null, error };
    }

    return { user: data.user, error: null };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Erro ao fazer logout:', error);
    }

    return { error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getProfile() {
    return withAuthRetry(async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      return data;
    });
  }
}; 