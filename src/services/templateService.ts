import { supabase } from '../lib/supabase';

export interface MessageTemplate {
  id: number;
  name: string;
  content: string;
  preview: string;
  created_at: string;
  updated_at: string;
}

export const templateService = {
  // Listar todos os templates
  async listTemplates(): Promise<{ success: boolean; data?: MessageTemplate[]; error?: string }> {
    try {
      console.log('📝 Buscando templates...');
      
      // Pegar o usuário atual
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Usuário não autenticado' };
      }
      
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', user.user.id) // Filtrar apenas templates do usuário atual
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar templates:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Templates carregados:', data?.length || 0);
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao listar templates:', error);
      return { success: false, error: 'Erro interno' };
    }
  },

  // Criar novo template
  async createTemplate(template: { name: string; content: string; preview: string }): Promise<{ success: boolean; data?: MessageTemplate; error?: string }> {
    try {
      console.log('📝 Criando template:', template.name);
      
      // Pegar o usuário atual
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Usuário não autenticado' };
      }
      
      const { data, error } = await supabase
        .from('message_templates')
        .insert({ ...template, user_id: user.user.id })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar template:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Template criado:', data);
      
      // INCREMENTAR USO DO PLANO GRATUITO
      try {
        console.log('Incrementando uso de templates: +1');
        const { data: incrementData, error: incrementError } = await supabase.rpc('increment_daily_usage', {
          p_user_id: user.user.id,
          p_usage_type: 'templates',
          p_quantity: 1
        });
        
        if (incrementError) {
          console.error('Erro ao incrementar uso diário de templates:', incrementError);
        } else {
          console.log('Uso diário de templates incrementado com sucesso');
        }
      } catch (incrementError) {
        console.error('Erro ao atualizar uso diário de templates:', incrementError);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar template:', error);
      return { success: false, error: 'Erro interno' };
    }
  },

  // Atualizar template
  async updateTemplate(id: number, template: { name: string; content: string; preview: string }): Promise<{ success: boolean; data?: MessageTemplate; error?: string }> {
    try {
      console.log('📝 Atualizando template:', id);
      
      const { data, error } = await supabase
        .from('message_templates')
        .update(template)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar template:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Template atualizado:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      return { success: false, error: 'Erro interno' };
    }
  },

  // Deletar template
  async deleteTemplate(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 Deletando template:', id);
      
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar template:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Template deletado:', id);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      return { success: false, error: 'Erro interno' };
    }
  }
}; 