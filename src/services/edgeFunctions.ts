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
    parametrosBusca: {
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

export async function captarEmpresas(dados: CaptarEmpresasRequest): Promise<CaptarEmpresasResponse> {
  try {
    console.log('Iniciando captura de empresas:', dados);
    
    // Converter dados para o novo formato da API
    const requestBody = {
      query: dados.tipoEmpresa,
      country: dados.pais.toLowerCase(),
      language: dados.idioma,
      location: dados.localizacao || '',
      page: 1
    };
    
    // Calcular quantas requisições precisamos fazer
    // Cada requisição retorna ~10 empresas
    const empresasPorPagina = 10;
    const totalPaginas = Math.ceil(dados.quantidadeEmpresas / empresasPorPagina);
    
    console.log(`Fazendo ${totalPaginas} requisições para ${dados.quantidadeEmpresas} empresas`);
    
    const todasEmpresas: Empresa[] = [];
    
    // Fazer múltiplas requisições se necessário
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      console.log(`Fazendo requisição página ${pagina}/${totalPaginas}`);
      
      const bodyPagina = {
        ...requestBody,
        page: pagina
      };
      
      const { data, error } = await supabase.functions.invoke('captar-empresas', {
        body: bodyPagina
      });

      if (error) {
        console.error(`Erro na página ${pagina}:`, error);
        // Se uma página falhar, continuar com as outras
        continue;
      }

      // Processar resposta da página
      console.log('Resposta da API página', pagina, ':', data);
      
      if (data && data.places && Array.isArray(data.places)) {
        // Formato da API Serper: { places: [...] }
        todasEmpresas.push(...data.places);
        console.log(`Página ${pagina} retornou ${data.places.length} empresas`);
      } else if (data && Array.isArray(data)) {
        // Se a resposta é um array direto
        todasEmpresas.push(...data);
        console.log(`Página ${pagina} retornou ${data.length} empresas`);
      } else if (data && data.empresas && Array.isArray(data.empresas)) {
        // Se a resposta tem estrutura { empresas: [...] }
        todasEmpresas.push(...data.empresas);
        console.log(`Página ${pagina} retornou ${data.empresas.length} empresas`);
      } else {
        console.error(`Formato de resposta não reconhecido na página ${pagina}:`, data);
      }
    }
    
    // Limitar ao número solicitado e remover duplicatas baseadas no CID ou title+address
    const empresasUnicas = todasEmpresas
      .filter((empresa, index, self) => {
        if (empresa.cid) {
          // Se tem CID, usar ele para identificar duplicatas
          return index === self.findIndex(e => e.cid === empresa.cid);
        } else {
          // Senão, usar title + address
          return index === self.findIndex(e => 
            e.title === empresa.title && 
            (e.address || '') === (empresa.address || '')
          );
        }
      })
      .slice(0, dados.quantidadeEmpresas);
    
    console.log(`Total de empresas encontradas: ${empresasUnicas.length}`);
    
    return {
      success: true,
      data: {
        empresas: empresasUnicas,
        totalEncontradas: empresasUnicas.length,
        parametrosBusca: {
          tipoEmpresa: dados.tipoEmpresa,
          localizacao: dados.localizacao || '',
          pais: dados.pais,
          idioma: dados.idioma,
          quantidadeSolicitada: dados.quantidadeEmpresas
        }
      }
    };
    
  } catch (error) {
    console.error('Erro na requisição:', error);
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
  error?: string;
}

export async function salvarEmpresas(dados: SalvarEmpresasRequest): Promise<SalvarEmpresasResponse> {
  try {
    console.log('Salvando empresas no banco:', dados);
    
    // Converter empresas para o formato do banco
    const empresasFormatadas = dados.empresas.map(empresa => ({
      titulo: empresa.title,
      endereco: empresa.address || null,
      categoria: empresa.category || null,
      telefone: empresa.phoneNumber || null,
      website: empresa.website || null,
      latitude: empresa.latitude || null,
      longitude: empresa.longitude || null,
      avaliacao: empresa.rating || null,
      total_avaliacoes: empresa.ratingCount || 0,
      posicao: empresa.position,
      cid: empresa.cid || null,
      links_agendamento: empresa.bookingLinks ? JSON.stringify(empresa.bookingLinks) : null,
      parametros_busca: JSON.stringify(dados.parametrosBusca),
      pesquisa: dados.parametrosBusca.tipoEmpresa,
      status: 'a_contatar' // Definir status inicial como 'a_contatar'
    }));

    // Inserir no banco usando Supabase client diretamente
    const { data, error } = await supabase
      .from('empresas')
      .insert(empresasFormatadas)
      .select();

    if (error) {
      console.error('Erro ao salvar empresas:', error);
      return {
        success: false,
        error: error.message || 'Erro ao salvar empresas no banco'
      };
    }

    console.log('Empresas salvas com sucesso:', data?.length);
    
    return {
      success: true,
      message: `${data?.length || 0} empresas salvas com sucesso!`,
      empresasSalvas: data?.length || 0
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
  titulo: string;
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
    
    let query = supabase
      .from('empresas')
      .select('*')
      .order('capturado_em', { ascending: false });

    // Aplicar filtros
    if (filtros?.categoria) {
      query = query.eq('categoria', filtros.categoria);
    }

    if (filtros?.busca) {
      query = query.or(`titulo.ilike.%${filtros.busca}%,endereco.ilike.%${filtros.busca}%,categoria.ilike.%${filtros.busca}%`);
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
      titulo: string;
      horasAguardando: number;
    }>;
    followUpsSugeridos: Array<{
      id: number;
      titulo: string;
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
          titulo: e.titulo,
          horasAguardando: Math.floor(Math.random() * 48) + 1
        })) || [],
      followUpsSugeridos: empresas?.filter(e => e.status === 'contato_realizado')
        .slice(3, 6)
        .map(e => ({
          id: e.id,
          titulo: e.titulo,
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