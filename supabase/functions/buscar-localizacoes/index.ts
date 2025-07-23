// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

interface RequestBody {
  q: string;
  limit?: number;
}

interface LocationResponse {
  name: string;
  countryCode: string;
  region: string;
}

// Função principal export default
export default async function handler(req: Request): Promise<Response> {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Aceitar tanto GET quanto POST
    let query = '';
    let limit = 25;

    if (req.method === 'GET') {
      // Para GET, pegar da URL
      const url = new URL(req.url);
      query = url.searchParams.get('q') || '';
      limit = parseInt(url.searchParams.get('limit') || '25');
    } else if (req.method === 'POST') {
      // Para POST, pegar do body
      const { q, limit: bodyLimit }: RequestBody = await req.json();
      query = q;
      limit = bodyLimit || 25;
    }

    // Validação
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ 
          success: true,
          data: [],
          message: 'Query muito curto. Digite pelo menos 2 caracteres.' 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    console.log('Buscando localização:', { query, limit });

    // Construir URL da API Serper
    const apiUrl = `https://api.serper.dev/locations?q=${encodeURIComponent(query)}&limit=${limit}`;
    
    console.log('URL da API:', apiUrl);

    // Fazer requisição para API do Serper com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    let locations: any[] = [];

    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "X-API-KEY": "a30632a100c0737cf6b57c0f2fd1d0755e392af3"
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Erro da API:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      locations = await response.json();
      console.log('Localizações encontradas:', locations.length);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout: API demorou mais de 10 segundos para responder');
      }
      throw fetchError;
    }

    // Formatar resposta
    const resposta = {
      success: true,
      data: locations,
      query: query,
      total: locations.length
    };

    return new Response(
      JSON.stringify(resposta),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Erro na Edge Function de localização:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro ao buscar localizações',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
} 