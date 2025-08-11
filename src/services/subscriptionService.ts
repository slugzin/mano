import { supabase } from '../lib/supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: {
    whatsapp_connections: number;
    companies_per_month?: number;
    companies_per_day?: number;
    dispatches_per_month?: number;
    dispatches_per_day?: number;
    templates: number;
    flows: number;
    support: string;
    features?: string[];
    features_list?: string[];
  };
  limits: {
    max_whatsapp_connections?: number;
    max_companies_per_month?: number;
    max_companies_per_day?: number;
    max_dispatches_per_month?: number;
    max_dispatches_per_day?: number;
    max_templates?: number;
    max_flows?: number;
    max_team_members?: number;
    whatsapp_connections?: number;
    companies_per_month?: number;
    companies_per_day?: number;
    dispatches_per_month?: number;
    dispatches_per_day?: number;
    templates?: number;
    flows?: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_provider?: string;
  external_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export const subscriptionService = {
  // Buscar todos os planos ativos
  async getPlans(): Promise<{ success: boolean; data?: SubscriptionPlan[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) {
        console.error('Erro ao buscar planos:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      return { success: false, error: 'Erro interno' };
    }
  },

  // Buscar assinatura atual do usuário
  async getCurrentSubscription(): Promise<{ success: boolean; data?: UserSubscription; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar assinatura atual:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error('Erro ao buscar assinatura atual:', error);
      return { success: false, error: 'Erro interno' };
    }
  },

  // Criar nova assinatura (simulado)
  async createSubscription(planId: string): Promise<{ success: boolean; data?: UserSubscription; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Calcular datas do período
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const subscriptionData = {
        user_id: user.user.id,
        plan_id: planId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false
      };

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([subscriptionData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar assinatura:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      return { success: false, error: 'Erro interno' };
    }
  },

  // Cancelar assinatura
  async cancelSubscription(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          cancel_at_period_end: true,
          status: 'canceled'
        })
        .eq('user_id', user.user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Erro ao cancelar assinatura:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      return { success: false, error: 'Erro interno' };
    }
  },

  // Verificar limites do plano atual
  async checkPlanLimits(): Promise<{ 
    success: boolean; 
    data?: {
      whatsapp_connections: { current: number; limit: number };
      companies_per_month: { current: number; limit: number };
      dispatches_per_month: { current: number; limit: number };
      templates: { current: number; limit: number };
      flows: { current: number; limit: number };
    }; 
    error?: string 
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Buscar assinatura atual
      const subscriptionResult = await this.getCurrentSubscription();
      if (!subscriptionResult.success || !subscriptionResult.data) {
        // Usuário sem assinatura ativa - usar plano gratuito
        const plansResult = await this.getPlans();
        if (!plansResult.success || !plansResult.data) {
          return { success: false, error: 'Erro ao buscar planos' };
        }

        const freePlan = plansResult.data.find(plan => plan.price === 0);
        if (!freePlan) {
          return { success: false, error: 'Plano gratuito não encontrado' };
        }

        return {
          success: true,
          data: {
            whatsapp_connections: { current: 0, limit: freePlan.limits.max_whatsapp_connections },
            companies_per_month: { current: 0, limit: freePlan.limits.max_companies_per_month },
            dispatches_per_month: { current: 0, limit: freePlan.limits.max_dispatches_per_month },
            templates: { current: 0, limit: freePlan.limits.max_templates },
            flows: { current: 0, limit: freePlan.limits.max_flows }
          }
        };
      }

      // Buscar plano da assinatura
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', subscriptionResult.data.plan_id)
        .single();

      if (planError || !plan) {
        return { success: false, error: 'Plano não encontrado' };
      }

      // Buscar contadores atuais
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // WhatsApp connections
      const { count: whatsappConnections } = await supabase
        .from('whatsapp_instances')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id);

      // Companies this month
      const { count: companiesThisMonth } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id)
        .gte('created_at', startOfMonth.toISOString());

      // Dispatches this month
      const { count: dispatchesThisMonth } = await supabase
        .from('disparos_agendados')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id)
        .gte('created_at', startOfMonth.toISOString());

      // Templates
      const { count: templates } = await supabase
        .from('message_templates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id);

      // Flows
      const { count: flows } = await supabase
        .from('fluxos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id);

      return {
        success: true,
        data: {
          whatsapp_connections: { 
            current: whatsappConnections || 0, 
            limit: plan.limits.max_whatsapp_connections 
          },
          companies_per_month: { 
            current: companiesThisMonth || 0, 
            limit: plan.limits.max_companies_per_month 
          },
          dispatches_per_month: { 
            current: dispatchesThisMonth || 0, 
            limit: plan.limits.max_dispatches_per_month 
          },
          templates: { 
            current: templates || 0, 
            limit: plan.limits.max_templates 
          },
          flows: { 
            current: flows || 0, 
            limit: plan.limits.max_flows 
          }
        }
      };
    } catch (error) {
      console.error('Erro ao verificar limites do plano:', error);
      return { success: false, error: 'Erro interno' };
    }
  }
}; 