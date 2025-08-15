import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  console.log('🚀 logout function called');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    console.log('📄 Raw body:', bodyText);
    
    if (!bodyText) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Body vazio'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let requestData;
    try {
      requestData = JSON.parse(bodyText);
    } catch (parseError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'JSON inválido'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userEmail } = requestData;
    
    if (!userEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: 'userEmail é obrigatório'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📧 User email:', userEmail);

    // Fazer logout na Evolution API
    const logoutUrl = `https://evolution-api.n8nfluxohot.shop/instance/logout/${encodeURIComponent(userEmail)}`;
    console.log('🔓 Logout URL:', logoutUrl);

    const response = await fetch(logoutUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📱 Response status:', response.status);

    return new Response(JSON.stringify({
      success: true,
      message: 'Logout realizado com sucesso',
      userEmail: userEmail,
      status: response.status
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});