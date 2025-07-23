// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

interface RequestBody {
  tipoEmpresa: string;
  pais: string;
  localizacao?: string;
  idioma: string;
  quantidadeEmpresas: number;
}

interface SerperResponse {
  places: Array<{
    title: string;
    address: string;
    phone?: string;
    website?: string;
    rating?: number;
    reviews?: number;
    category?: string;
    hours?: string;
    position: number;
  }>;
}

// Mapeamento de códigos de país para formato da API
const countryMapping: { [key: string]: string } = {
  'BR': 'br',
  'US': 'us', 
  'PT': 'pt',
  'ES': 'es',
  'AR': 'ar',
  'MX': 'mx'
};

// Mapeamento de idiomas
const languageMapping: { [key: string]: string } = {
  'pt-br': 'pt-br',
  'en': 'en',
  'es': 'es',
  'pt': 'pt'
};

async function buscarEmpresas(
  query: string,
  location: string,
  gl: string,
  hl: string,
  page: number
): Promise<SerperResponse> {
  const myHeaders = new Headers();
  myHeaders.append("X-API-KEY", "a30632a100c0737cf6b57c0f2fd1d0755e392af3");
  myHeaders.append("Content-Type", "application/json");

  // Construir query com localização se fornecida
  const queryFinal = location ? `${query} ${location}` : query;

  const raw = JSON.stringify({
    "q": queryFinal,
    "gl": gl,
    "hl": hl,
    "page": page
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow" as RequestRedirect
  };

  try {
    const response = await fetch("https://google.serper.dev/places", requestOptions);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro na requisição Serper:', error);
    throw error;
  }
}

function construirLocalizacao(pais: string, localizacao?: string): string {
  const paisNomes: { [key: string]: string } = {
    'BR': 'Brazil',
    'US': 'United States',
    'PT': 'Portugal', 
    'ES': 'Spain',
    'AR': 'Argentina',
    'MX': 'Mexico'
  };

  if (localizacao) {
    return `${localizacao}, ${paisNomes[pais]}`;
  }
  
  return paisNomes[pais] || 'Brazil';
}

// Função principal export default
export default async function handler(req: Request): Promise<Response> {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tipoEmpresa, pais, localizacao, idioma, quantidadeEmpresas }: RequestBody = await req.json();

    // Validações
    if (!tipoEmpresa) {
      return new Response(
        JSON.stringify({ error: 'Tipo de empresa é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limitar quantidade máxima para plano free
    const maxEmpresas = Math.min(quantidadeEmpresas || 10, 20);
    
    // Calcular quantas páginas precisamos buscar
    const empresasPorPagina = 10;
    const paginasNecessarias = Math.ceil(maxEmpresas / empresasPorPagina);
    
    // Construir parâmetros da busca
    const query = tipoEmpresa.toLowerCase();
    const location = construirLocalizacao(pais, localizacao);
    const gl = countryMapping[pais] || 'br';
    const hl = languageMapping[idioma] || 'pt-br';

    console.log('Parâmetros da busca:', { query, location, gl, hl, maxEmpresas, paginasNecessarias });

    // Fazer requisições para todas as páginas necessárias
    const todasEmpresas: any[] = [];
    const promises: Promise<SerperResponse>[] = [];

    for (let pagina = 1; pagina <= paginasNecessarias; pagina++) {
      promises.push(buscarEmpresas(query, location, gl, hl, pagina));
    }

    // Executar todas as requisições em paralelo
    const resultados = await Promise.allSettled(promises);

    // Processar resultados
    for (const resultado of resultados) {
      if (resultado.status === 'fulfilled' && resultado.value.places) {
        todasEmpresas.push(...resultado.value.places);
      } else if (resultado.status === 'rejected') {
        console.error('Erro em uma das requisições:', resultado.reason);
      }
    }

    // Limitar ao número solicitado e remover duplicatas
    const empresasUnicas = todasEmpresas
      .filter((empresa, index, array) => 
        array.findIndex(e => e.title === empresa.title && e.address === empresa.address) === index
      )
      .slice(0, maxEmpresas);

    // Formatar resposta
    const resposta = {
      success: true,
      data: {
        empresas: empresasUnicas,
        totalEncontradas: empresasUnicas.length,
        parametrosBusca: {
          tipoEmpresa,
          localizacao: location,
          pais,
          idioma,
          quantidadeSolicitada: maxEmpresas
        }
      },
      message: `Encontradas ${empresasUnicas.length} empresas do tipo "${tipoEmpresa}" em ${location}`
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
    console.error('Erro na Edge Function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro interno do servidor',
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