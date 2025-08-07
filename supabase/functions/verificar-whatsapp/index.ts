// Importa o helper 'serve' do Deno para criar o servidor da função
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// URL base da API da Evolution
const EVOLUTION_API_BASE_URL = 'https://evolution-api.n8nfluxohot.shop/chat/whatsappNumbers/consulta';

// Headers de CORS para permitir que seu site se comunique com esta função
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// A função principal que será executada a cada requisição
serve(async (req) => {
  // Lida com a requisição "preflight" (OPTIONS) do navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // Verifica se é uma requisição POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Método não permitido. Use POST.'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Pega o corpo da requisição
    const { numeros } = await req.json();

    // Valida se os números foram fornecidos
    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
      return new Response(JSON.stringify({
        error: 'Array de números é obrigatório e não pode estar vazio'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Remove números duplicados
    const numerosUnicos = [...new Set(numeros)];
    
    console.log('Números recebidos:', numeros.length);
    console.log('Números únicos:', numerosUnicos.length);
    
    if (numerosUnicos.length === 0) {
      return new Response(JSON.stringify({
        error: 'Nenhum número válido encontrado após remoção de duplicatas'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Faz a chamada POST para a API da Evolution
    const evolutionResponse = await fetch(EVOLUTION_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ numbers: numerosUnicos })
    });

    // Verifica se a resposta foi bem-sucedida
    if (!evolutionResponse.ok) {
      const errorData = await evolutionResponse.json();
      console.error('Erro na Evolution API:', evolutionResponse.status, errorData);
      
      return new Response(JSON.stringify({
        error: 'Erro na Evolution API',
        status: evolutionResponse.status,
        details: errorData
      }), {
        status: evolutionResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Pega a resposta da Evolution API
    const responseData = await evolutionResponse.json();
    console.log('Resposta da Evolution API:', responseData);

    // Retorna a resposta da Evolution API de volta para o seu frontend
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    // Se ocorrer qualquer outro erro, retorna um erro genérico
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 