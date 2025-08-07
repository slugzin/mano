import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Pegar o user_id do header de autorização
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Criar cliente Supabase
    const supabaseUrl = 'https://goqhudvrndtmxhbblrqa.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM'
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Buscar instâncias do usuário
    const { data: instances, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('status', 'connected')

    if (instancesError) {
      console.error('❌ Erro ao buscar instâncias:', instancesError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar instâncias do banco' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!instances || instances.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma instância conectada encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 Instâncias encontradas:', instances.map(inst => inst.instance_name))

    // Configuração do webhook
    const webhookConfig = {
      webhook: {
        enabled: true,
        url: "https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/webhook-mensagens",
        headers: {
          "autorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM",
          "Content-Type": "application/json"
        },
        byEvents: false,
        base64: false,
        events: [
          "MESSAGES_UPSERT"
        ]
      }
    }

    // Configurar webhook para cada instância
    const results = []
    
    for (const instance of instances) {
      const instanceName = instance.instance_name
      console.log('🔧 Configurando webhook para instância:', instanceName)

      // URL da API de atualização de webhook
      const webhookUrl = `https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/atualizar-webhook/${instanceName}`
      
      console.log('📡 Fazendo requisição para:', webhookUrl)

      try {
        // Fazer a requisição POST
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM'
          },
          body: JSON.stringify(webhookConfig)
        })

        // Pegar a resposta
        const responseText = await response.text()
        console.log('📥 Resposta para', instanceName, ':', responseText)
        console.log('📊 Status da resposta:', response.status)

        results.push({
          instance: instanceName,
          status: response.status,
          response: responseText
        })

      } catch (error) {
        console.error('💥 Erro ao configurar webhook para', instanceName, ':', error)
        results.push({
          instance: instanceName,
          status: 500,
          error: error.message
        })
      }
    }

    // Retornar resultados
    return new Response(
      JSON.stringify({
        message: 'Configuração de webhook concluída',
        results: results
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Erro ao configurar webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 