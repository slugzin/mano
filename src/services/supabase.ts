import { supabase } from '../lib/supabase';
import { Lead, Empresa, Campanha, BaseDados, DashboardStats, LeadForm, EmpresaForm, CampanhaForm } from '../types';

// ====================================
// SERVIÇOS PARA DASHBOARD
// ====================================

export const dashboardService = {
  async getStats(): Promise<DashboardStats | null> {
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
  }
};

// ====================================
// SERVIÇOS PARA LEADS
// ====================================

export const leadsService = {
  async getAll(): Promise<Lead[]> {
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
  },

  async create(lead: LeadForm): Promise<Lead | null> {
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
  },

  async update(id: string, lead: Partial<LeadForm>): Promise<Lead | null> {
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
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar lead:', error);
      return false;
    }

    return true;
  },

  async getByStatus(status: string): Promise<Lead[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        empresa:empresas(*)
      `)
      .eq('user_id', user.user.id)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar leads por status:', error);
      return [];
    }

    return data || [];
  }
};

// ====================================
// SERVIÇOS PARA EMPRESAS
// ====================================

export const empresasService = {
  async getAll(): Promise<Empresa[]> {
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
  },

  async create(empresa: EmpresaForm): Promise<Empresa | null> {
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
  },

  async update(id: string, empresa: Partial<EmpresaForm>): Promise<Empresa | null> {
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
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('empresas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar empresa:', error);
      return false;
    }

    return true;
  },

  async getByStatus(status: string): Promise<Empresa[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar empresas por status:', error);
      return [];
    }

    return data || [];
  }
};

// ====================================
// SERVIÇOS PARA CAMPANHAS
// ====================================

export const campanhasService = {
  async getAll(): Promise<Campanha[]> {
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
  },

  async create(campanha: CampanhaForm): Promise<Campanha | null> {
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
  },

  async update(id: string, campanha: Partial<CampanhaForm>): Promise<Campanha | null> {
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
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('campanhas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar campanha:', error);
      return false;
    }

    return true;
  },

  async getByStatus(status: string): Promise<Campanha[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('campanhas')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar campanhas por status:', error);
      return [];
    }

    return data || [];
  }
};

// ====================================
// SERVIÇOS PARA BASES DE DADOS
// ====================================

export const basesDadosService = {
  async getAll(): Promise<BaseDados[]> {
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
  },

  async create(base: Partial<BaseDados>): Promise<BaseDados | null> {
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
  },

  async update(id: string, base: Partial<BaseDados>): Promise<BaseDados | null> {
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
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('bases_dados')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar base de dados:', error);
      return false;
    }

    return true;
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
  }
}; 