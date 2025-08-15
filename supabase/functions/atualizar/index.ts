import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  console.log('🚀 atualizar function called');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📝 Parsing body...');
    const bodyText = await req.text();
    console.log('📄 Raw body:', bodyText);
    
    if (!bodyText) {
      console.log('❌ Empty body');
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
      console.log('❌ JSON parse error:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'JSON inválido',
        receivedBody: bodyText
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userEmail } = requestData;
    console.log('📧 User email:', userEmail);
    
    if (!userEmail) {
      console.log('❌ userEmail missing');
      return new Response(JSON.stringify({
        success: false,
        error: 'userEmail é obrigatório'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Buscar instâncias na Evolution API
    console.log('📡 Fetching Evolution API...');
    const evolutionResponse = await fetch('https://evolution-api.n8nfluxohot.shop/instance/fetchInstances');
    console.log('📱 Evolution status:', evolutionResponse.status);
    
    if (!evolutionResponse.ok) {
      console.log('❌ Evolution API failed');
      throw new Error(`Evolution API failed: ${evolutionResponse.status}`);
    }

    const evolutionData = await evolutionResponse.json();
    console.log('📊 Evolution data length:', evolutionData?.length);

    // 2. Filtrar instâncias do usuário (baseado no email)
    console.log('🔍 Filtering user instances...');
    const userInstances = evolutionData.filter(instance => {
      const emailMatch = instance.name === userEmail;
      const emailFormatted = userEmail.replace('@', '_').replace('.', '_');
      const emailFormattedMatch = instance.name.includes(emailFormatted);
      
      console.log(`Instance: ${instance.name}, Email: ${userEmail}, Match: ${emailMatch || emailFormattedMatch}`);
      
      return emailMatch || emailFormattedMatch;
    });

    console.log('👤 User instances found:', userInstances.length);

    if (userInstances.length === 0) {
      console.log('✅ No instances for user');
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma instância encontrada para este usuário'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Atualizar status no banco baseado no connectionStatus
    console.log('💾 Updating database...');
    let updatedCount = 0;
    
    for (const instance of userInstances) {
      // Mapear connectionStatus da Evolution para nosso status
      let newStatus = 'disconnected';
      if (instance.connectionStatus === 'open') {
        newStatus = 'connected';
      } else if (instance.connectionStatus === 'connecting') {
        newStatus = 'connecting';
      }

      console.log(`Updating ${instance.name}: ${instance.connectionStatus} → ${newStatus}`);

      // Atualizar no banco pelo instance_name
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instance.name);

      if (updateError) {
        console.log('❌ Update error:', updateError);
      } else {
        updatedCount++;
        console.log('✅ Updated successfully');
      }
    }

    console.log('🎉 Process completed');
    return new Response(JSON.stringify({
      success: true,
      message: 'Conexões atualizadas com sucesso',
      updated: updatedCount,
      found: userInstances.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro ao atualizar conexões',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});