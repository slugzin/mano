const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const results = {
      test1_places_get: null as any,
      test2_locations: null as any,
      errors: [] as string[]
    };

    // Teste 1: Places API (GET que funcionou)
    try {
      const testUrl1 = 'https://google.serper.dev/places?q=restaurante&gl=br&hl=pt-br&apiKey=a30632a100c0737cf6b57c0f2fd1d0755e392af3';
      const response1 = await fetch(testUrl1, { method: 'GET' });
      
      if (response1.ok) {
        const data1 = await response1.json();
        results.test1_places_get = { status: response1.status, count: data1.places?.length || 0 };
      } else {
        results.errors.push(`Places GET Error: ${response1.status}`);
      }
    } catch (error) {
      results.errors.push(`Places GET Exception: ${error.message}`);
    }

    // Teste 2: Locations API
    try {
      const testUrl2 = 'https://api.serper.dev/locations?q=Sao&limit=25';
      const response2 = await fetch(testUrl2, {
        method: 'GET',
        headers: {
          'X-API-KEY': 'a30632a100c0737cf6b57c0f2fd1d0755e392af3'
        }
      });
      
      if (response2.ok) {
        const data2 = await response2.json();
        results.test2_locations = { status: response2.status, count: data2.length || 0 };
      } else {
        const errorText = await response2.text();
        results.errors.push(`Locations Error: ${response2.status} - ${errorText}`);
      }
    } catch (error) {
      results.errors.push(`Locations Exception: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Teste das APIs concluído',
        results: results
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro no teste',
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