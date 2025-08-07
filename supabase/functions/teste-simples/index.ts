import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Teste simples iniciado');
    
    // Retornar resposta imediata para teste
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Teste simples funcionando!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Erro no teste:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro no teste',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 