import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface WebhookData {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    status: string;
    message: {
      conversation?: string;
      messageContextInfo?: any;
    };
    messageType: string;
    messageTimestamp: number;
    instanceId: string;
    source: string;
  };
  destination: string;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const webhookData: WebhookData = await req.json()
    
    console.log('Webhook recebido:', JSON.stringify(webhookData, null, 2))

    // Verificar se é evento de mensagem
    if (webhookData.event !== 'messages.upsert') {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Evento ignorado - não é messages.upsert' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { data } = webhookData
    const { key, pushName, status, message, messageType, messageTimestamp, instanceId } = data
    const { remoteJid, fromMe, id: messageId } = key

    // Extrair apenas o número do telefone do remoteJid (ex: 554198273444@s.whatsapp.net -> 554198273444)
    const telefoneRemoteJid = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '')
    
    console.log(`Processando mensagem: fromMe=${fromMe}, remoteJid=${remoteJid}, telefone=${telefoneRemoteJid}`)

    // Extrair a mensagem do conversation
    const conversationText = message.conversation || ''
    
    // Se não há texto na mensagem, ignorar
    if (!conversationText.trim()) {
      console.log('Mensagem sem texto - ignorando')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Mensagem sem texto - ignorada' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Verificar se o remoteJid existe na tabela disparos_agendados na coluna empresa_telefone
    // A coluna empresa_telefone pode ter formatos como: "55(41) 3082-6009@s.whatsapp.net"
    const { data: disparoAgendado, error: errorDisparo } = await supabase
      .from('disparos_agendados')
      .select('*')
      .eq('empresa_telefone', remoteJid)
      .single()

    if (errorDisparo && errorDisparo.code !== 'PGRST116') {
      console.error('Erro ao verificar disparo agendado:', errorDisparo)
      throw errorDisparo
    }

    // Buscar informações da empresa se encontrou disparo
    let nomeEmpresa = 'Empresa não identificada'
    let empresaId = null
    let user_id = null
    let empresaInfo: any = null

    if (disparoAgendado) {
      console.log('Disparo agendado encontrado:', disparoAgendado)
      nomeEmpresa = disparoAgendado.empresa_nome || 'Empresa não identificada'
      empresaId = disparoAgendado.empresa_id
      user_id = disparoAgendado.user_id

      // Buscar informações completas da empresa
      if (empresaId) {
        const { data: empresaData, error: empresaError } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', empresaId)
          .single()

        if (!empresaError && empresaData) {
          empresaInfo = empresaData
          console.log('Informações da empresa encontradas:', empresaInfo)
        }
      }
    } else {
      console.log(`RemoteJid ${remoteJid} não encontrado na tabela disparos_agendados`)
      
      // Se é uma mensagem enviada (fromMe = true), ainda vamos salvar
      if (fromMe) {
        console.log('Mensagem enviada não encontrada em disparos_agendados, mas será salva mesmo assim')
      } else {
        // Se é uma resposta recebida e não encontrou disparo, ignorar
        console.log('Resposta recebida sem disparo agendado - ignorando')
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'RemoteJid não encontrado em disparos_agendados - ignorado' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    }

    // Preparar dados para salvar na tabela conversas
    const conversaData: any = {
      telefone: telefoneRemoteJid, // Usar o telefone limpo para a tabela conversas
      nome_empresa: nomeEmpresa, // Usar o nome da empresa encontrado ou padrão
      mensagem: conversationText,
      from_me: fromMe,
      message_id: messageId,
      instance_name: webhookData.instance,
      instance_id: instanceId,
      message_timestamp: messageTimestamp,
      message_type: messageType,
      status: status
    }

    // Adicionar user_id se encontrou disparo
    if (user_id) {
      conversaData.user_id = user_id
    }

    // Adicionar informações da empresa se disponíveis
    if (empresaInfo) {
      conversaData.empresa_id = empresaInfo.id
      conversaData.empresa_website = empresaInfo.website
      conversaData.empresa_endereco = empresaInfo.endereco
      conversaData.empresa_categoria = empresaInfo.categoria
      conversaData.empresa_avaliacao = empresaInfo.avaliacao
      conversaData.empresa_total_avaliacoes = empresaInfo.total_avaliacoes
      conversaData.empresa_posicao = empresaInfo.posicao
      conversaData.empresa_links_agendamento = empresaInfo.links_agendamento
    }

    console.log('Salvando conversa:', conversaData)

    // Salvar na tabela conversas
    const { data: conversaSalva, error: errorConversa } = await supabase
      .from('conversas')
      .insert(conversaData)
      .select()
      .single()

    if (errorConversa) {
      console.error('Erro ao salvar conversa:', errorConversa)
      throw errorConversa
    }

    console.log('Conversa salva com sucesso:', conversaSalva)

    // Se fromMe for false, significa que recebemos uma resposta da empresa
    const tipoMensagem = fromMe ? 'Mensagem enviada' : 'Resposta recebida'

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${tipoMensagem} salva com sucesso`,
      data: {
        conversa_id: conversaSalva.id,
        telefone: telefoneRemoteJid,
        empresa: conversaData.nome_empresa,
        from_me: fromMe,
        encontrou_disparo: !!disparoAgendado
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 