import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SERPER_API_URL = 'https://api.serper.dev/locations';
const API_LIMIT = 25;

// Cabeçalhos CORS para permitir que a função seja chamada a partir de um navegador
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Trata as requisições de preflight do CORS para permitir o método POST com Content-Type
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // Extrai a query "q" do corpo da requisição
    const { q } = await req.json();

    // Retorna um erro se a query "q" não for fornecida no corpo
    if (!q || q.length < 1) {
      return new Response(JSON.stringify({
        success: true,
        data: [],
        message: 'Digite algo para buscar localizações'
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('Buscando localização para:', q);

    // Constrói a URL de destino para a API da Serper
    const targetUrl = `${SERPER_API_URL}?q=${encodeURIComponent(q)}&limit=${API_LIMIT}`;

    // Faz a requisição GET para a API da serper.dev COM a API key
    const apiResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'X-API-KEY': 'a30632a100c0737cf6b57c0f2fd1d0755e392af3'
      }
    });

    if (!apiResponse.ok) {
      throw new Error(`API Error: ${apiResponse.status}`);
    }

    // Obtém os dados da resposta
    const data = await apiResponse.json();
    console.log('Dados recebidos da API:', data);

    // Processar os dados retornados da API
    const locations: any[] = [];
    
    if (Array.isArray(data) && data.length > 0) {
      data.forEach((location: any) => {
        locations.push({
          name: location.name,
          canonicalName: location.canonicalName,
          googleId: location.googleId,
          countryCode: location.countryCode,
          targetType: location.targetType
        });
      });
    }

    // Limitar a 10 resultados
    const limitedLocations = locations.slice(0, 10);

    const resposta = {
      success: true,
      data: limitedLocations,
      query: q,
      total: limitedLocations.length
    };

    // Retorna os dados processados
    return new Response(JSON.stringify(resposta), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Erro na Edge Function location:', error);
    
    // Retorna uma resposta de erro genérica em caso de falha
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro ao buscar localizações',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 