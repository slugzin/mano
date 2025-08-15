// Importa o helper 'serve' do Deno para criar o servidor da função
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// URL do endpoint da API da Evolution
const EVOLUTION_API_URL = 'https://evolution-api.n8nfluxohot.shop/instance/fetchInstances';

// Headers de CORS para permitir que seu site se comunique com esta função
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// A função principal que será executada a cada requisição
serve(async (req) => {
  // Lida com a requisição "preflight" (OPTIONS) do navegador, essencial para o CORS funcionar
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // 1. Faz a chamada GET para a API da Evolution.
    // Esta requisição específica não precisa de parâmetros ou body.
    const evolutionResponse = await fetch(EVOLUTION_API_URL, {
      method: 'GET'
    });

    // 2. Verifica se a requisição foi bem-sucedida
    if (!evolutionResponse.ok) {
      throw new Error(`Erro na API Evolution: ${evolutionResponse.status}`);
    }

    // 3. Retorna apenas uma mensagem de sucesso simples
    // Sem expor dados sensíveis do banco
    return new Response(JSON.stringify({
      success: true,
      message: 'Conexões atualizadas com sucesso',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    // Se ocorrer qualquer erro, retorna uma mensagem de erro genérica
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro ao atualizar conexões',
      message: 'Não foi possível atualizar as conexões no momento'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 