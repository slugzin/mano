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
  async createInstance(userEmail: string, displayName?: string): Promise<CreateInstanceResponse> {
    try {
      console.log('Criando instância WhatsApp com email único:', userEmail);
      
      // Primeiro, criar a instância usando a função evolution
      const { data: evolutionData, error: evolutionError } = await supabase.functions.invoke('evolution', {
        body: {
          instanceName: userEmail, // Enviar email como instanceName
          token: "",
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        }
      });

      if (evolutionError) {
        console.error('Erro ao criar instância:', evolutionError);
        return {
          success: false,
          error: evolutionError.message || 'Erro ao criar instância WhatsApp'
        };
      }

      console.log('Resposta da API Evolution:', evolutionData);

      // Processar resposta da API
      const instance = evolutionData.instance;
      const hash = evolutionData.hash;
      const settings = evolutionData.settings;

      // Pegar o usuário atual
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      // Usar o nome personalizado fornecido ou o email como fallback
      const finalDisplayName = displayName || userEmail;

      // Salvar no banco de dados - Note que agora iniciamos com status 'disconnected'
      const { error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_name: evolutionData.instanceName || instance.instanceName, // Nome técnico da Evolution API
          display_name: finalDisplayName, // Nome personalizado para exibição
          instance_id: instance.instanceId,
          integration: instance.integration,
          hash: hash,
          status: 'disconnected', // Começa desconectado
          settings: settings,
          webhook_config: evolutionData.webhook || {},
          websocket_config: evolutionData.websocket || {},
          rabbitmq_config: evolutionData.rabbitmq || {},
          sqs_config: evolutionData.sqs || {},
          user_id: user.user.id // Adicionar user_id
        });

      if (dbError) {
        console.error('❌ Erro ao salvar no banco:', dbError);
      } else {
        console.log('✅ Instância salva no banco com sucesso!');
        
        // INCREMENTAR USO DO PLANO GRATUITO
        try {
          console.log('Incrementando uso de conexões: +1');
          const { error: incrementError } = await supabase.rpc('increment_daily_usage', {
            p_user_id: user.user.id,
            p_usage_type: 'conexoes',
            p_quantity: 1
          });
          
          if (incrementError) {
            console.error('Erro ao incrementar uso diário de conexões:', incrementError);
          } else {
            console.log('Uso diário de conexões incrementado com sucesso');
          }
        } catch (incrementError) {
          console.error('Erro ao atualizar uso diário de conexões:', incrementError);
        }
      }

      // Agora gerar o QR code usando a função qrcode
      const instanceNameToUse = evolutionData.instanceName || instance.instanceName;
      console.log('🔄 Gerando QR code para a instância:', instanceNameToUse);
      
      try {
        // Fazer requisição direta para a função qrcode
        const encodedName = encodeURIComponent(instanceNameToUse);
        const qrcodeUrl = `https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/qrcode?instanceName=${encodedName}`;
        
        console.log('📱 Fazendo requisição para:', qrcodeUrl);
        
        const qrResponse = await fetch(qrcodeUrl, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM',
            'Content-Type': 'application/json'
          }
        });

        if (!qrResponse.ok) {
          throw new Error(`Erro na requisição qrcode: ${qrResponse.status}`);
        }

        const qrData = await qrResponse.json();
        console.log('📱 Resposta da função qrcode:', qrData);
        
        // Extrair o QR code da resposta
        let qrCode = null;
        if (qrData.qrcode && qrData.qrcode.base64) {
          qrCode = qrData.qrcode.base64;
        } else if (qrData.qrcode && qrData.qrcode.code) {
          qrCode = qrData.qrcode.code;
        } else if (qrData.base64) {
          qrCode = qrData.base64;
        } else if (qrData.code) {
          qrCode = qrData.code;
        }
        
        if (qrCode) {
          console.log('✅ QR code extraído com sucesso');
          
          return {
            success: true,
            data: {
              instanceId: instance.instanceId,
              name: evolutionData.instanceName || instance.instanceName, // Usar o instanceName retornado pela API
              hash: hash,
              status: 'disconnected',
              qrCode: qrCode
            }
          };
        } else {
          console.warn('⚠️ QR code não foi encontrado na resposta, mas instância foi criada');
          console.log('📱 Estrutura da resposta qrcode:', JSON.stringify(qrData, null, 2));
          
          return {
            success: true,
            data: {
              instanceId: instance.instanceId,
              name: evolutionData.instanceName || instance.instanceName, // Usar o instanceName retornado pela API
              hash: hash,
              status: 'disconnected'
            }
          };
        }
      } catch (qrError) {
        console.error('❌ Erro ao gerar QR code:', qrError);
        
        // Retornar sucesso mesmo sem QR code, pois a instância foi criada
        return {
          success: true,
          data: {
            instanceId: instance.instanceId,
            name: instance.instanceName,
            hash: hash,
            status: 'disconnected'
          }
        };
      }
      
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
      console.log('📱 Estrutura da resposta:', JSON.stringify(data, null, 2));
      console.log('📱 QR Code encontrado:', data.qrcode || data.qrCode || data.qr_code || 'NÃO ENCONTRADO');

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

      // Pegar o usuário atual
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', user.user.id) // Filtrar apenas instâncias do usuário atual
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
        name: inst.display_name || inst.instance_name, // Usar display_name se disponível, senão usar instance_name
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

  // Deletar instância WhatsApp
  async deleteInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Deletando instância WhatsApp:', instanceId);
      
      // Primeiro, buscar o nome da instância no banco
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      const { data: instanceData, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('instance_id', instanceId)
        .eq('user_id', user.user.id)
        .single();

      if (fetchError || !instanceData) {
        console.error('Erro ao buscar instância:', fetchError);
        return {
          success: false,
          error: 'Instância não encontrada'
        };
      }

      // Deletar da Evolution API (fazer logout primeiro, depois delete)
      const userEmail = instanceData.instance_name;
      
      try {
        // Passo 1: Logout
        console.log('🔓 Fazendo logout da Evolution API:', userEmail);
        const { error: logoutError } = await supabase.functions.invoke('logout', {
          body: {
            userEmail: userEmail
          }
        });

        if (logoutError) {
          console.warn('⚠️ Erro no logout (continuando com delete):', logoutError);
        } else {
          console.log('✅ Logout realizado com sucesso!');
        }

        // Passo 2: Delete
        console.log('🗑️ Deletando da Evolution API:', userEmail);
        const { error: deleteError } = await supabase.functions.invoke('deleteInstance', {
          body: {
            userEmail: userEmail
          }
        });

        if (deleteError) {
          console.warn('⚠️ Erro ao deletar da Evolution API (continuando com banco):', deleteError);
        } else {
          console.log('✅ Deletado da Evolution API com sucesso!');
        }
      } catch (evolutionError) {
        console.warn('⚠️ Erro ao processar Evolution API (continuando com banco):', evolutionError);
      }

      // Remover do banco de dados
      const { error: dbError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('instance_id', instanceId);

      if (dbError) {
        console.error('❌ Erro ao remover do banco:', dbError);
        return {
          success: false,
          error: 'Erro ao remover instância do banco de dados'
        };
      }

      console.log('✅ Instância removida completamente com sucesso!');
      return { success: true };
      
    } catch (error) {
      console.error('💥 Erro ao deletar instância:', error);
      return {
        success: false,
        error: 'Erro inesperado ao deletar instância'
      };
    }
  },

  // Atualizar nome de exibição da instância
  async updateDisplayName(instanceId: string, displayName: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 Atualizando nome de exibição para:', instanceId, '→', displayName);
      
      // Pegar o usuário atual
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ display_name: displayName })
        .eq('instance_id', instanceId)
        .eq('user_id', user.user.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar nome:', updateError);
        return {
          success: false,
          error: 'Erro ao atualizar nome da instância'
        };
      }

      console.log('✅ Nome atualizado com sucesso!');
      return { success: true };
      
    } catch (error) {
      console.error('💥 Erro ao atualizar nome:', error);
      return {
        success: false,
        error: 'Erro inesperado ao atualizar nome'
      };
    }
  },

  // Gerar novo QR Code para instância existente
  async generateNewQrCode(instanceId: string): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    try {
      console.log('Gerando novo QR Code para instância:', instanceId);
      
      // Primeiro, buscar o nome da instância no banco
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }
      
      const { data: instanceData, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('instance_id', instanceId)
        .eq('user_id', user.user.id)
        .single();
      
      if (fetchError || !instanceData) {
        console.error('Erro ao buscar instância:', fetchError);
        return {
          success: false,
          error: 'Instância não encontrada'
        };
      }
      
      // Agora usar a função qrcode correta diretamente
      const encodedName = encodeURIComponent(instanceData.instance_name);
      const qrcodeUrl = `https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/qrcode?instanceName=${encodedName}`;
      
      console.log('📱 Gerando novo QR code para:', instanceData.instance_name);
      console.log('📱 URL da requisição:', qrcodeUrl);
      
      const qrResponse = await fetch(qrcodeUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM',
          'Content-Type': 'application/json'
        }
      });

      if (!qrResponse.ok) {
        throw new Error(`Erro na requisição qrcode: ${qrResponse.status}`);
      }

      const qrData = await qrResponse.json();
      console.log('📱 Resposta da função qrcode:', qrData);
      
      // Extrair o QR code da resposta
      let qrCode = null;
      if (qrData.qrcode && qrData.qrcode.base64) {
        qrCode = qrData.qrcode.base64;
      } else if (qrData.qrcode && qrData.qrcode.code) {
        qrCode = qrData.qrcode.code;
      } else if (qrData.base64) {
        qrCode = qrData.base64;
      } else if (qrData.code) {
        qrCode = qrData.code;
      }
      
      if (qrCode) {
        console.log('✅ Novo QR Code gerado com sucesso!');
        return {
          success: true,
          qrCode: qrCode
        };
      } else {
        console.warn('⚠️ QR Code não foi encontrado na resposta');
        console.log('📱 Estrutura da resposta qrcode:', JSON.stringify(qrData, null, 2));
        return {
          success: false,
          error: 'QR Code não foi encontrado na resposta'
        };
      }
      
    } catch (error) {
      console.error('Erro ao gerar novo QR Code:', error);
      return {
        success: false,
        error: 'Erro inesperado ao gerar novo QR Code'
      };
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

      // Pegar o usuário atual
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Buscar instâncias existentes no banco
      const { data: existingInstances, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('instance_id')
        .eq('user_id', user.user.id); // Filtrar apenas instâncias do usuário atual

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
              integration: instance.integration || 'WHATSAPP-BAILEYS',
              user_id: user.user.id // Adicionar user_id
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