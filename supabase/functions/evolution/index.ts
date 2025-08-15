// Importa o helper 'serve' do Deno para criar o servidor da função
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// URL da API externa que vamos chamar
const EVOLUTION_API_URL = 'https://evolution-api.n8nfluxohot.shop/instance/create';

// Headers de CORS para permitir que seu site (rodando no navegador) se comunique com esta função
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// A função principal que será executada a cada requisição
serve(async (req) => {
  // O navegador envia uma requisição "preflight" (OPTIONS) para verificar as permissões de CORS antes de enviar a requisição POST.
  // Precisamos responder 'ok' para ela.
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // 1. Extrair os dados enviados pelo frontend. Esperamos um JSON com a chave "instanceName".
    const { instanceName } = await req.json();
    
    // 2. Validar se o 'instanceName' foi realmente enviado. Se não, retorna um erro.
    if (!instanceName) {
      return new Response(JSON.stringify({
        error: 'O campo instanceName é obrigatório.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // 3. Validar formato do email (instanceName é o email do usuário)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(instanceName)) {
      return new Response(JSON.stringify({
        error: 'Formato de email inválido.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // 4. Criar um instanceName único baseado no email com versionamento
    // Remove caracteres especiais e espaços, mantendo apenas letras, números e pontos
    let baseInstanceName = instanceName
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '')
      .replace(/\./g, '_');

    // 5. Tentar criar instâncias com versionamento até encontrar um nome livre
    let finalInstanceName = baseInstanceName;
    let version = 1;
    let evolutionResponse;
    let responseData;

    while (version <= 10) { // Máximo 10 tentativas para evitar loop infinito
      const apiBody = {
        instanceName: finalInstanceName,
        token: '',
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      };

      console.log(`🔄 Tentativa ${version}: Criando instância com nome:`, finalInstanceName);

      // 6. Fazer a chamada para a API da Evolution usando o método POST.
      evolutionResponse = await fetch(EVOLUTION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiBody)
      });

      responseData = await evolutionResponse.json();

      // Se foi bem-sucedida, parar o loop
      if (evolutionResponse.ok) {
        console.log('✅ Instância criada com sucesso:', finalInstanceName);
        break;
      }

      // Se deu erro de nome duplicado, tentar próxima versão
      if (responseData?.error && responseData.error.includes('already exists')) {
        version++;
        finalInstanceName = `${baseInstanceName}${version}`;
        console.log(`⚠️ Nome já existe, tentando:`, finalInstanceName);
      } else {
        // Se foi outro tipo de erro, parar e retornar o erro
        console.error('❌ Erro inesperado da Evolution API:', responseData);
        break;
      }
    }

    // Verificar se conseguiu criar após todas as tentativas
    if (!evolutionResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: responseData?.error || 'Erro ao criar instância após múltiplas tentativas',
        attempts: version
      }), {
        status: evolutionResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // 7. Retornar a resposta da Evolution API + o instanceName usado
    return new Response(JSON.stringify({
      ...responseData,
      instanceName: finalInstanceName, // Retorna o nome único usado (com versionamento)
      userEmail: instanceName,         // Retorna o email original para referência
      success: true,
      version: version                 // Retorna qual versão foi usada
    }), {
      status: evolutionResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    // Se ocorrer qualquer outro erro (ex: JSON mal formado), retorna um erro genérico.
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 