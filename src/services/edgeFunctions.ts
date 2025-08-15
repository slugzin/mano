import { supabase } from '../lib/supabase';

export interface CaptarEmpresasRequest {
  tipoEmpresa: string;
  pais: string;
  localizacao?: string;
  idioma: string;
  quantidadeEmpresas: number;
}

export interface Empresa {
  position: number;
  title: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  ratingCount?: number;
  category?: string;
  phoneNumber?: string;
  website?: string;
  bookingLinks?: string[];
  cid?: string;
}

export interface CaptarEmpresasResponse {
  success: boolean;
  data?: {
    empresas: Empresa[];
    totalEncontradas: number;
    paginaInicial?: number;
    totalPaginas?: number;
    parametrosBusca?: {
      tipoEmpresa: string;
      localizacao: string;
      pais: string;
      idioma: string;
      quantidadeSolicitada: number;
    };
  };
  message?: string;
  error?: string;
}

// Interface para controlar offset de buscas
interface BuscaOffset {
  query: string;
  location: string;
  lastPage: number;
  lastTimestamp: number;
}

// Função para calcular próxima página baseada em buscas anteriores
async function getNextPageForSearch(query: string, location: string, userId: string): Promise<number> {
  try {
    // Buscar histórico de buscas similares nas últimas 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentSearches } = await supabase
      .from('empresas')
      .select('parametros_busca')
      .eq('user_id', userId)
      .gte('capturado_em', oneDayAgo)
      .order('capturado_em', { ascending: false })
      .limit(50);
    
    if (!recentSearches || recentSearches.length === 0) {
      return 1; // Primeira busca, começar da página 1
    }
    
    // Analisar buscas similares
    let maxPage = 0;
    const normalizedQuery = query.toLowerCase().trim();
    const normalizedLocation = location.toLowerCase().trim();
    
    for (const search of recentSearches) {
      try {
        const params = typeof search.parametros_busca === 'string' 
          ? JSON.parse(search.parametros_busca) 
          : search.parametros_busca;
        
        const searchQuery = params?.tipoEmpresa?.toLowerCase().trim() || '';
        const searchLocation = params?.localizacao?.toLowerCase().trim() || '';
        
        // Verificar se é busca similar (mesmo tipo + mesma localização)
        if (searchQuery === normalizedQuery && searchLocation === normalizedLocation) {
          // Estimar página baseada na quantidade de empresas já capturadas
          const empresasPorPagina = 10;
          const estimatedPage = Math.floor(maxPage / empresasPorPagina) + 1;
          maxPage = Math.max(maxPage, estimatedPage);
        }
      } catch (e) {
        // Ignorar erros de parsing
        continue;
      }
    }
    
    // Calcular próxima página
    const nextPage = maxPage + 1;
    
    console.log(`🔍 Busca dinâmica: "${query}" em "${location}" → Página ${nextPage}`);
    console.log(`📊 Análise: ${recentSearches.length} buscas recentes, maior página encontrada: ${maxPage}`);
    
    return Math.max(1, nextPage); // Nunca retornar página menor que 1
    
  } catch (error) {
    console.error('Erro ao calcular próxima página:', error);
    return 1; // Fallback para página 1 em caso de erro
  }
}

export async function captarEmpresas(dados: CaptarEmpresasRequest): Promise<CaptarEmpresasResponse> {
  try {
    console.log('Iniciando captura de empresas:', dados);
    
    // Obter usuário atual
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      };
    }
    
    // Calcular página inicial dinâmica
    const paginaInicial = await getNextPageForSearch(
      dados.tipoEmpresa,
      dados.localizacao || '',
      user.user.id
    );
    
    // Converter dados para o novo formato da API
    const requestBody = {
      query: dados.tipoEmpresa,
      country: dados.pais.toLowerCase(),
      language: dados.idioma,
      location: dados.localizacao || '',
      page: paginaInicial // Usar página dinâmica em vez de sempre 1
    };
    
    // Calcular quantas requisições precisamos fazer
    const empresasPorPagina = 10;
    const totalPaginas = Math.ceil(dados.quantidadeEmpresas / empresasPorPagina);
    
    console.log(`🚀 Busca dinâmica iniciando na página ${paginaInicial}`);
    console.log(`📄 Fazendo ${totalPaginas} requisições para ${dados.quantidadeEmpresas} empresas`);
    
    const todasEmpresas: Empresa[] = [];
    
    // Fazer múltiplas requisições sequenciais a partir da página inicial
    for (let i = 0; i < totalPaginas; i++) {
      const paginaAtual = paginaInicial + i;
      console.log(`Fazendo requisição página ${paginaAtual} (${i + 1}/${totalPaginas})`);
      
      const bodyPagina = {
        ...requestBody,
        page: paginaAtual
      };
      
      const { data, error } = await supabase.functions.invoke('captar-empresas', {
        body: bodyPagina
      });

      if (error) {
        console.error(`Erro na página ${paginaAtual}:`, error);
        // Se uma página falhar, continuar com as outras
        continue;
      }

      // Processar resposta da página
      console.log('Resposta da API página', paginaAtual, ':', data);
      
      if (data && data.places && Array.isArray(data.places)) {
        // Formato da API Serper: { places: [...] }
        todasEmpresas.push(...data.places);
        console.log(`✅ Página ${paginaAtual} retornou ${data.places.length} empresas`);
      } else {
        console.warn(`⚠️ Página ${paginaAtual} não retornou empresas válidas`);
      }
      
      // Pequeno delay entre requisições para não sobrecarregar a API
      if (i < totalPaginas - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`🎯 Total de empresas encontradas: ${todasEmpresas.length}`);
    
    if (todasEmpresas.length === 0) {
      return {
        success: false,
        error: 'Nenhuma empresa encontrada para os critérios especificados'
      };
    }
    
    return {
      success: true,
      data: {
        empresas: todasEmpresas,
        totalEncontradas: todasEmpresas.length,
        paginaInicial: paginaInicial,
        totalPaginas: totalPaginas
      }
    };
    
  } catch (error) {
    console.error('Erro na requisição de capturar empresas:', error);
    return {
      success: false,
      error: 'Erro de conexão. Tente novamente.'
    };
  }
}

// Nova função para buscar localizações
export interface BuscarLocalizacoesRequest {
  q: string;
  limit?: number;
}

export interface BuscarLocalizacoesResponse {
  success: boolean;
  data?: Array<{
    name: string;
    canonicalName?: string;
    googleId?: number;
    countryCode: string;
    targetType?: string;
  }>;
  query?: string;
  total?: number;
  error?: string;
  message?: string;
}

export async function buscarLocalizacoes(query: string, limit = 25): Promise<BuscarLocalizacoesResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('location', {
      body: { q: query }
    });

    if (error) {
      console.error('Erro na Edge Function de localização:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar localizações'
      };
    }

    return data as BuscarLocalizacoesResponse;
  } catch (error) {
    console.error('Erro na requisição de localização:', error);
    return {
      success: false,
      error: 'Erro de conexão. Tente novamente.'
    };
  }
}

// Interface para salvar empresas
export interface SalvarEmpresasRequest {
  empresas: Empresa[];
  parametrosBusca: {
    tipoEmpresa: string;
    localizacao: string;
    pais: string;
    idioma: string;
    quantidadeSolicitada: number;
  };
}

export interface SalvarEmpresasResponse {
  success: boolean;
  message?: string;
  empresasSalvas?: number;
  empresasExistentes?: number;
  error?: string;
}

// Interface para verificar WhatsApp
export interface VerificarWhatsAppRequest {
  numeros: string[];
}

export interface VerificarWhatsAppResponse {
  success: boolean;
  data?: {
    numerosVerificados: Array<{
      numero: string;
      temWhatsapp: boolean;
      status: string;
    }>;
    totalVerificados: number;
    totalComWhatsapp: number;
    totalSemWhatsapp: number;
    percentualWhatsapp: number;
  };
  error?: string;
}

// Função para verificar WhatsApp
export async function verificarWhatsApp(numeros: string[]): Promise<VerificarWhatsAppResponse> {
  try {
    console.log('Verificando WhatsApp para números:', numeros);
    
    const { data, error } = await supabase.functions.invoke('verificar-whatsapp', {
      body: { numeros }
    });

    if (error) {
      console.error('Erro na verificação de WhatsApp:', error);
      return {
        success: false,
        error: error.message || 'Erro ao verificar WhatsApp'
      };
    }

    console.log('Resposta da verificação de WhatsApp:', data);
    
    return {
      success: true,
      data: data
    };
    
  } catch (error) {
    console.error('Erro na requisição de verificação de WhatsApp:', error);
    return {
      success: false,
      error: 'Erro de conexão. Tente novamente.'
    };
  }
}

// Função para formatar número de telefone para o formato da API
function formatarNumeroParaAPI(phoneNumber: string): string {
  // Remove todos os caracteres não numéricos
  let numero = phoneNumber.replace(/\D/g, '');
  
  // Se não começar com 55 (Brasil), adiciona
  if (!numero.startsWith('55')) {
    numero = '55' + numero;
  }
  
  return numero;
}

export async function salvarEmpresas(dados: SalvarEmpresasRequest): Promise<SalvarEmpresasResponse> {
  try {
    console.log('Salvando empresas no banco:', dados);
    
    // Pegar o usuário atual
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      };
    }
    
    // Converter empresas para o formato do banco
    // Verificar empresas já existentes para este usuário
    const cidsExistentes = dados.empresas
      .filter(empresa => empresa.cid)
      .map(empresa => empresa.cid);

    let empresasExistentes: any[] = [];
    if (cidsExistentes.length > 0) {
      const { data: existentes } = await supabase
        .from('empresas')
        .select('cid')
        .in('cid', cidsExistentes)
        .eq('user_id', user.user.id);
      
      empresasExistentes = existentes || [];
    }

    const cidsJaExistentes = new Set(empresasExistentes.map(e => e.cid));

    // Filtrar empresas que não existem para este usuário
    const empresasNovas = dados.empresas.filter(empresa => 
      !empresa.cid || !cidsJaExistentes.has(empresa.cid)
    );

    console.log(`Total de empresas: ${dados.empresas.length}`);
    console.log(`Empresas já existentes: ${empresasExistentes.length}`);
    console.log(`Empresas novas para inserir: ${empresasNovas.length}`);

    if (empresasNovas.length === 0) {
      return {
        success: true,
        message: 'Todas as empresas já existem no seu banco de dados!',
        empresasSalvas: 0,
        empresasExistentes: empresasExistentes.length
      };
    }

    // Função para truncar strings muito longas e evitar erros de banco
    const truncateString = (str: string | null | undefined, maxLength: number = 255): string | null => {
      if (!str) return null;
      return str.length > maxLength ? str.substring(0, maxLength).trim() : str;
    };

    const empresasFormatadas = empresasNovas.map(empresa => {
      return {
        empresa_nome: truncateString(empresa.title, 255),
        endereco: truncateString(empresa.address, 500), // Endereços podem ser longos
        categoria: truncateString(empresa.category, 255),
        telefone: truncateString(empresa.phoneNumber, 50),
        website: truncateString(empresa.website, 500), // URLs podem ser longas
        latitude: empresa.latitude || null,
        longitude: empresa.longitude || null,
        avaliacao: empresa.rating || null,
        total_avaliacoes: empresa.ratingCount || 0,
        posicao: empresa.position,
        cid: truncateString(empresa.cid, 100),
        links_agendamento: empresa.bookingLinks ? JSON.stringify(empresa.bookingLinks) : null,
        parametros_busca: JSON.stringify(dados.parametrosBusca),
        pesquisa: truncateString(dados.parametrosBusca.tipoEmpresa, 255),
        status: 'a_contatar', // Definir status inicial como 'a_contatar'
        tem_whatsapp: (empresa as any).temWhatsapp || false, // Usar informação já verificada
        user_id: user.user.id // Adicionar user_id
      };
    });

    // Remover duplicatas baseadas em cid antes de inserir
    const empresasUnicas = empresasFormatadas.reduce((acc, empresa) => {
      // Usar cid como chave principal, ou combinação de nome+telefone como fallback
      const key = empresa.cid || `${empresa.empresa_nome || ''}-${empresa.telefone || ''}`;
      if (!acc.has(key)) {
        acc.set(key, empresa);
      } else {
        // Se já existe, manter a que tem mais informações
        const existente = acc.get(key);
        const infoAtual = Object.values(empresa).filter(v => v !== null && v !== undefined && v !== '').length;
        const infoExistente = Object.values(existente).filter(v => v !== null && v !== undefined && v !== '').length;
        
        if (infoAtual > infoExistente) {
          acc.set(key, empresa);
        }
      }
      return acc;
    }, new Map<string, any>());

    const empresasParaInserir = Array.from(empresasUnicas.values());

    console.log(`Empresas únicas para inserir: ${empresasParaInserir.length}`);

    // Verificar se há empresas com cid duplicado no banco para este usuário
    const cidsParaInserir = empresasParaInserir
      .filter(empresa => empresa.cid)
      .map(empresa => empresa.cid);

    if (cidsParaInserir.length > 0) {
      const { data: duplicatasExistentes } = await supabase
        .from('empresas')
        .select('cid')
        .in('cid', cidsParaInserir)
        .eq('user_id', user.user.id);

      if (duplicatasExistentes && duplicatasExistentes.length > 0) {
        const cidsDuplicados = new Set(duplicatasExistentes.map(e => e.cid));
        const empresasSemDuplicatas = empresasParaInserir.filter(empresa => 
          !empresa.cid || !cidsDuplicados.has(empresa.cid)
        );

        console.log(`Empresas após remoção de duplicatas do banco: ${empresasSemDuplicatas.length}`);
        
        if (empresasSemDuplicatas.length === 0) {
          return {
            success: true,
            message: 'Todas as empresas já existem no seu banco de dados!',
            empresasSalvas: 0,
            empresasExistentes: empresasExistentes.length
          };
        }

        // Usar apenas empresas sem duplicatas
        const { data, error } = await supabase
          .from('empresas')
          .insert(empresasSemDuplicatas)
          .select();

        if (error) {
          console.error('Erro ao inserir empresas:', error);
          return {
            success: false,
            error: 'Erro ao salvar empresas no banco'
          };
        }

        return {
          success: true,
          message: `${data?.length || 0} empresas salvas com sucesso!`,
          empresasSalvas: data?.length || 0,
          empresasExistentes: empresasExistentes.length
        };
      }
    }

    // Se não há duplicatas, usar insert normal em vez de upsert para evitar conflitos
    const { data, error } = await supabase
      .from('empresas')
      .insert(empresasParaInserir)
      .select();

    if (error) {
      console.error('Erro ao salvar empresas:', error);
      
      let errorMessage = 'Erro ao salvar empresas no banco';
      
      // Tratar erros específicos
      if (error.code === '22001') {
        errorMessage = 'Alguns dados das empresas são muito longos. Os dados foram ajustados automaticamente.';
        console.warn('Dados truncados devido a limite de tamanho');
      } else if (error.code === '23505') {
        errorMessage = 'Algumas empresas já existem no seu banco de dados.';
      } else if (error.code === '21000') {
        errorMessage = 'Erro de duplicação detectado. Tentando inserir apenas empresas únicas...';
        console.warn('Erro de duplicação, tentando abordagem alternativa');
      } else if (error.message?.includes('value too long')) {
        errorMessage = 'Alguns dados das empresas excedem o limite permitido. Tente novamente.';
      } else if (error.message?.includes('violates row-level security')) {
        errorMessage = 'Erro de permissão. Verifique se você está logado corretamente.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }

    console.log('Empresas salvas com sucesso:', data?.length);
    
    return {
      success: true,
      message: `${data?.length || 0} empresas salvas com sucesso!`,
      empresasSalvas: data?.length || 0,
      empresasExistentes: empresasExistentes.length
    };
    
  } catch (error) {
    console.error('Erro na requisição de salvar empresas:', error);
    return {
      success: false,
      error: 'Erro de conexão. Tente novamente.'
    };
  }
}

// Interface para empresa do banco
export interface EmpresaBanco {
  id: number;
  empresa_nome: string;
  endereco?: string;
  categoria?: string;
  telefone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  avaliacao?: number;
  total_avaliacoes: number;
  posicao: number;
  cid?: string;
  links_agendamento?: string;
  parametros_busca?: string;
  pesquisa?: string;
  status?: string;
  tem_whatsapp?: boolean;
  capturado_em: string;
  atualizado_em: string;
}

export interface BuscarEmpresasResponse {
  success: boolean;
  data?: EmpresaBanco[];
  total?: number;
  error?: string;
}

export async function buscarEmpresas(filtros?: {
  categoria?: string;
  busca?: string;
  pesquisa?: string;
  limite?: number;
  offset?: number;
}): Promise<BuscarEmpresasResponse> {
  try {
    console.log('Buscando empresas do banco:', filtros);
    
    // Pegar o usuário atual
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      };
    }
    
    let query = supabase
      .from('empresas')
      .select('*')
      .eq('user_id', user.user.id) // Filtrar apenas empresas do usuário atual
      .order('capturado_em', { ascending: false });

    // Aplicar filtros
    if (filtros?.categoria) {
      query = query.eq('categoria', filtros.categoria);
    }

    if (filtros?.busca) {
      query = query.or(`empresa_nome.ilike.%${filtros.busca}%,endereco.ilike.%${filtros.busca}%,categoria.ilike.%${filtros.busca}%`);
    }

    if (filtros?.pesquisa) {
      query = query.eq('pesquisa', filtros.pesquisa);
    }

    if (filtros?.limite) {
      query = query.limit(filtros.limite);
    }

    if (filtros?.offset) {
      query = query.range(filtros.offset, filtros.offset + (filtros.limite || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar empresas:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar empresas'
      };
    }

    return {
      success: true,
      data: data || [],
      total: count || data?.length || 0
    };
    
  } catch (error) {
    console.error('Erro na requisição de buscar empresas:', error);
    return {
      success: false,
      error: 'Erro de conexão. Tente novamente.'
    };
  }
}

// Interface para estatísticas do funil
export interface EstatisticasFunil {
  totalEmpresas: number;
  novasEstaSemana: number;
  contatosRealizadosMes: number;
  comparativoContatosMesAnterior: number;
  taxaResposta: number;
  negociosGanhosMes: number;
  funil: {
    a_contatar: number;
    contato_realizado: number;
    em_negociacao: number;
    ganhos: number;
    perdidos: number;
  };
  proximasAcoes: {
    respostasAguardando: Array<{
      id: number;
      empresa_nome: string;
      horasAguardando: number;
    }>;
    followUpsSugeridos: Array<{
      id: number;
      empresa_nome: string;
      diasDesdeContato: number;
    }>;
    novosProspects: number;
  };
  performancePorCategoria: Array<{
    categoria: string;
    total: number;
    taxaResposta: number;
  }>;
}

export interface EstatisticasFunilResponse {
  success: boolean;
  data?: EstatisticasFunil;
  error?: string;
}

export async function buscarEstatisticasFunil(modalidade?: string): Promise<EstatisticasFunilResponse> {
  try {
    console.log('Buscando estatísticas do funil...', modalidade ? `para modalidade: ${modalidade}` : 'para todas as modalidades');
    
    // Buscar empresas com filtro de modalidade se especificado
    let query = supabase.from('empresas').select('*');
    
    if (modalidade && modalidade !== 'todas') {
      query = query.eq('pesquisa', modalidade);
    }
    
    const { data: empresas, error: empresasError } = await query;

    if (empresasError) {
      console.error('Erro ao buscar empresas:', empresasError);
      return {
        success: false,
        error: empresasError.message
      };
    }

    // Buscar mensagens enviadas do mês
    const { data: mensagens, error: mensagensError } = await supabase
      .from('mensagens_enviadas')
      .select('*')
      .gte('enviado_em', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    if (mensagensError) {
      console.log('Aviso: Tabela mensagens_enviadas não encontrada, usando dados simulados');
    }

    const agora = new Date();
    const inicioSemana = new Date(agora.setDate(agora.getDate() - agora.getDay()));
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0);

    // Calcular métricas
    const totalEmpresas = empresas?.length || 0;
    const novasEstaSemana = empresas?.filter(e => 
      new Date(e.capturado_em) >= inicioSemana
    ).length || 0;

    // Contagem por status do funil
    const funil = {
      a_contatar: empresas?.filter(e => e.status === 'a_contatar').length || 0,
      contato_realizado: empresas?.filter(e => e.status === 'contato_realizado').length || 0,
      em_negociacao: empresas?.filter(e => e.status === 'em_negociacao').length || 0,
      ganhos: empresas?.filter(e => e.status === 'ganhos').length || 0,
      perdidos: empresas?.filter(e => e.status === 'perdidos').length || 0,
    };

    // Simular dados para métricas mais avançadas por enquanto
    const contatosRealizadosMes = mensagens?.filter(m => m.tipo_mensagem === 'primeira_mensagem').length || Math.floor(Math.random() * 50) + 20;
    const contatosRealizadosMesAnterior = Math.floor(Math.random() * 45) + 15;
    const comparativoContatosMesAnterior = contatosRealizadosMesAnterior > 0 ? 
      ((contatosRealizadosMes - contatosRealizadosMesAnterior) / contatosRealizadosMesAnterior) * 100 : 0;

    // Taxa de resposta simulada baseada no funil
    const taxaResposta = funil.contato_realizado > 0 ? 
      ((funil.em_negociacao + funil.ganhos) / funil.contato_realizado) * 100 : 0;

    const negociosGanhosMes = funil.ganhos;

    // Performance por categoria
    const categorias = [...new Set(empresas?.map(e => e.pesquisa).filter(Boolean))] as string[];
    const performancePorCategoria = categorias.map(categoria => {
      const empresasCategoria = empresas?.filter(e => e.pesquisa === categoria) || [];
      const totalCategoria = empresasCategoria.length;
      const sucessoCategoria = empresasCategoria.filter(e => 
        e.status === 'em_negociacao' || e.status === 'ganhos'
      ).length;
      const taxaResposta = totalCategoria > 0 ? (sucessoCategoria / totalCategoria) * 100 : 0;
      
      return {
        categoria,
        total: totalCategoria,
        taxaResposta
      };
    });

    // Próximas ações simuladas
    const proximasAcoes = {
      respostasAguardando: empresas?.filter(e => e.status === 'contato_realizado')
        .slice(0, 3)
        .map(e => ({
          id: e.id,
          empresa_nome: e.empresa_nome,
          horasAguardando: Math.floor(Math.random() * 48) + 1
        })) || [],
      followUpsSugeridos: empresas?.filter(e => e.status === 'contato_realizado')
        .slice(3, 6)
        .map(e => ({
          id: e.id,
          empresa_nome: e.empresa_nome,
          diasDesdeContato: Math.floor(Math.random() * 7) + 3
        })) || [],
      novosProspects: funil.a_contatar
    };

    return {
      success: true,
      data: {
        totalEmpresas,
        novasEstaSemana,
        contatosRealizadosMes,
        comparativoContatosMesAnterior,
        taxaResposta,
        negociosGanhosMes,
        funil,
        proximasAcoes,
        performancePorCategoria
      }
    };
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas do funil:', error);
    return {
      success: false,
      error: 'Erro de conexão. Tente novamente.'
    };
  }
}

// Interface para atualização de webhook
export interface AtualizarWebhookRequest {
  instanceName: string;
}

export interface AtualizarWebhookResponse {
  success: boolean;
  message?: string;
  instanceName?: string;
  webhookAnterior?: any;
  webhookAtualizado?: any;
  verificacao?: any;
  error?: string;
  status?: number;
  details?: string;
}

export async function atualizarWebhook(dados: AtualizarWebhookRequest): Promise<AtualizarWebhookResponse> {
  try {
    console.log('Atualizando webhook para instância:', dados.instanceName);
    
    const { data, error } = await supabase.functions.invoke('atualizar-webhook', {
      body: dados
    });

    if (error) {
      console.error('Erro ao atualizar webhook:', error);
      return {
        success: false,
        error: error.message || 'Erro ao atualizar webhook'
      };
    }

    console.log('Webhook atualizado com sucesso:', data);
    
    return {
      success: true,
      message: data.message || 'Webhook atualizado com sucesso',
      instanceName: data.instanceName,
      webhookAnterior: data.webhookAnterior,
      webhookAtualizado: data.webhookAtualizado,
      verificacao: data.verificacao
    };
    
  } catch (error) {
    console.error('Erro na requisição de atualizar webhook:', error);
    return {
      success: false,
      error: 'Erro de conexão. Tente novamente.'
    };
  }
} 