import { supabase } from '../lib/supabase';

// Interfaces para o serviço WhatsApp
export interface WhatsAppInstance {
  id: string;
  name: string;
  phone?: string;
  status: 'connected' | 'disconnected' | 'connecting';
  createdAt: string;
  lastActivity?: string;
  qrCode?: string;
  webhook_url?: string;
  token?: string;
  hash?: string;
  instanceId?: string;
  profilePicUrl?: string;
  profileName?: string;
  ownerJid?: string;
  lastSync?: string;
}

export interface CreateInstanceResponse {
  success: boolean;
  data?: {
    instanceId: string;
    name: string;
    hash: string;
    qrCode?: string;
    status: string;
  };
  error?: string;
}

// Serviço WhatsApp
export const whatsappService = {
  // Criar nova instância WhatsApp
  async createInstance(name: string): Promise<CreateInstanceResponse> {
    try {
      console.log('Criando instância WhatsApp:', name);
      
      const { data, error } = await supabase.functions.invoke('evolution', {
        body: {
          instanceName: name,
          token: "",
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        }
      });

      if (error) {
        console.error('Erro ao criar instância:', error);
        return {
          success: false,
          error: error.message || 'Erro ao criar instância WhatsApp'
        };
      }

      console.log('Resposta da API Evolution:', data);

      // Processar resposta da API
      const instance = data.instance;
      const hash = data.hash;
      const settings = data.settings;

      // Salvar no banco de dados - Note que agora iniciamos com status 'disconnected'
      const { error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_name: instance.instanceName,
          instance_id: instance.instanceId,
          integration: instance.integration,
          hash: hash,
          status: 'disconnected', // Começa desconectado
          settings: settings,
          webhook_config: data.webhook || {},
          websocket_config: data.websocket || {},
          rabbitmq_config: data.rabbitmq || {},
          sqs_config: data.sqs || {}
        });

      if (dbError) {
        console.error('❌ Erro ao salvar no banco:', dbError);
      } else {
        console.log('✅ Instância salva no banco com sucesso!');
      }

      return {
        success: true,
        data: {
          instanceId: instance.instanceId,
          name: instance.instanceName,
          hash: hash,
          status: 'disconnected'
        }
      };
      
    } catch (error) {
      console.error('Erro na requisição de criar instância:', error);
      return {
        success: false,
        error: 'Erro de conexão. Tente novamente.'
      };
    }
  },

  // Conectar instância e gerar QR Code
  async connectInstance(instanceName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔄 Conectando instância:', instanceName);
      
      // Codificar o nome da instância para URL (substitui espaços por %20)
      const encodedName = encodeURIComponent(instanceName);
      
      // URL da função edge com o query parameter
      const url = `https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/qrcode?instanceName=${encodedName}`;
      
      // Fazer a requisição diretamente
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data = await response.json();
      console.log('📱 Resposta da API:', data);

      // Atualiza o status no banco para 'connecting'
      await this.updateInstanceStatus(instanceName, 'connecting');

      // Retorna os dados exatamente como vieram da API
      return { 
        success: true, 
        data
      };
    } catch (error) {
      console.error('💥 Erro ao conectar instância:', error);
      return { success: false, error: 'Erro ao conectar instância' };
    }
  },

  // Listar instâncias do banco de dados
  async listInstances(): Promise<{ success: boolean; data?: WhatsAppInstance[]; error?: string }> {
    try {
      console.log('🔍 Buscando instâncias...');

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro SQL:', error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        console.log('📭 Nenhuma instância encontrada');
        return { success: true, data: [] };
      }

      const instances = data.map(inst => ({
        id: inst.instance_id,
        name: inst.instance_name,
        status: inst.status as 'connected' | 'disconnected' | 'connecting',
        createdAt: new Date(inst.created_at).toLocaleDateString('pt-BR') + ' às ' + new Date(inst.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        lastActivity: inst.status === 'connected' ? 'Agora' : 'Nunca',
        qrCode: inst.qr_code_data,
        hash: inst.hash,
        instanceId: inst.instance_id,
        profilePicUrl: inst.profile_pic_url,
        profileName: inst.profile_name,
        ownerJid: inst.owner_jid,
        lastSync: inst.last_sync ? new Date(inst.last_sync).toLocaleString('pt-BR') : undefined
      }));

      return { success: true, data: instances };
    } catch (error) {
      console.error('💥 Erro ao listar instâncias:', error);
      return { success: false, error: 'Erro interno' };
    }
  },

  // Atualizar status da instância
  async updateInstanceStatus(instanceId: string, status: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ status })
        .eq('instance_id', instanceId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return { success: false, error: 'Erro interno' };
    }
  },

  // Buscar instância por ID
  async getInstanceById(instanceId: string): Promise<{ success: boolean; data?: WhatsAppInstance; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_id', instanceId)
        .single();

      if (error) {
        console.error('Erro ao buscar instância:', error);
        return { success: false, error: error.message };
      }

      const instance: WhatsAppInstance = {
        id: data.instance_id,
        name: data.instance_name,
        status: data.status as 'connected' | 'disconnected' | 'connecting',
        createdAt: new Date(data.created_at).toLocaleDateString('pt-BR') + ' às ' + new Date(data.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        lastActivity: data.status === 'connected' ? 'Agora' : 'Nunca',
        qrCode: data.qr_code_data,
        hash: data.hash,
        instanceId: data.instance_id
      };

      return { success: true, data: instance };
    } catch (error) {
      console.error('Erro ao buscar instância:', error);
      return { success: false, error: 'Erro interno' };
    }
  },

  // Deletar instância
  async deleteInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('instance_id', instanceId);

      if (error) {
        console.error('Erro ao deletar instância:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      return { success: false, error: 'Erro interno' };
    }
  },

  // Sincronizar status das instâncias com a Evolution API
  async syncInstancesStatus(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      console.log('🔄 Sincronizando status das instâncias com Evolution API...');
      
      const response = await fetch('https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/atualizar', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data = await response.json();
      console.log('📱 Status das instâncias recebido:', data);

      // Buscar instâncias existentes no banco
      const { data: existingInstances, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('instance_id');

      if (fetchError) {
        console.error('Erro ao buscar instâncias existentes:', fetchError);
        return { success: false, error: 'Erro ao buscar instâncias existentes' };
      }

      const existingIds = existingInstances?.map(inst => inst.instance_id) || [];

      // Processar cada instância da Evolution API
      for (const instance of data) {
        const status = instance.connectionStatus === 'open' ? 'connected' : 'disconnected';
        const now = new Date().toISOString();
        
        if (existingIds.includes(instance.id)) {
          // Atualizar instância existente
          // Teste simples primeiro - apenas status
          const { error } = await supabase
            .from('whatsapp_instances')
            .update({ 
              status
            })
            .eq('instance_id', instance.id);

          if (error) {
            console.error(`Erro ao atualizar instância ${instance.name}:`, error);
          } else {
            console.log(`✅ Instância ${instance.name} atualizada para status: ${status}`);
          }
        } else {
          // Criar nova instância
          const { error } = await supabase
            .from('whatsapp_instances')
            .insert({
              instance_name: instance.name,
              instance_id: instance.id,
              status,
              profile_pic_url: instance.profilePicUrl,
              profile_name: instance.profileName,
              owner_jid: instance.ownerJid,
              last_sync: now,
              integration: instance.integration || 'WHATSAPP-BAILEYS'
            });

          if (error) {
            console.error(`Erro ao criar instância ${instance.name}:`, error);
          } else {
            console.log(`✅ Nova instância ${instance.name} criada com status: ${status}`);
          }
        }
      }

      return { 
        success: true, 
        data 
      };
    } catch (error) {
      console.error('💥 Erro ao sincronizar status:', error);
      return { success: false, error: 'Erro ao sincronizar status das instâncias' };
    }
  }
}; 