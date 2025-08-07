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
    // Pegar o nome da instância da URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const instanceName = pathParts[pathParts.length - 1]
    
    if (!instanceName) {
      return new Response(
        JSON.stringify({ error: 'Nome da instância não fornecido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔧 Configurando webhook para instância:', instanceName)

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

    // URL da API de atualização de webhook
    const webhookUrl = `https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/atualizar-webhook/${instanceName}`
    
    console.log('📡 Fazendo requisição para:', webhookUrl)
    console.log('📦 Body da requisição:', JSON.stringify(webhookConfig, null, 2))

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
    console.log('📥 Resposta recebida:', responseText)
    console.log('📊 Status da resposta:', response.status)

    // Retornar a resposta original
    return new Response(
      responseText,
      { 
        status: response.status,
        headers: { 
          ...corsHeaders, 
          'Content-Type': response.headers.get('Content-Type') || 'application/json' 
        } 
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