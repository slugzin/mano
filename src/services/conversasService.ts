import { supabase } from '../lib/supabase';

export interface Conversa {
  id: number;
  telefone: string;
  nome_empresa: string;
  mensagem: string;
  from_me: boolean;
  message_id: string;
  instance_name: string;
  instance_id: string;
  message_timestamp: number;
  message_type: string;
  status: string;
  criado_em: string;
  atualizado_em: string;
}

export interface EstatisticasConversas {
  totalConversas: number;
  totalEmpresas: number;
  mensagensEnviadas: number;
  mensagensRecebidas: number;
  taxaResposta: number;
}

// Buscar todas as conversas com paginação
export const buscarConversas = async (
  page = 1, 
  limit = 50, 
  filtros?: {
    telefone?: string;
    nomeEmpresa?: string;
    fromMe?: boolean;
    dataInicio?: string;
    dataFim?: string;
  }
) => {
  try {
    let query = supabase
      .from('conversas')
      .select('*', { count: 'exact' })
      .order('criado_em', { ascending: false });

    // Aplicar filtros
    if (filtros?.telefone) {
      query = query.ilike('telefone', `%${filtros.telefone}%`);
    }
    
    if (filtros?.nomeEmpresa) {
      query = query.ilike('nome_empresa', `%${filtros.nomeEmpresa}%`);
    }
    
    if (filtros?.fromMe !== undefined) {
      query = query.eq('from_me', filtros.fromMe);
    }
    
    if (filtros?.dataInicio) {
      query = query.gte('criado_em', filtros.dataInicio);
    }
    
    if (filtros?.dataFim) {
      query = query.lte('criado_em', filtros.dataFim);
    }

    // Paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data as Conversa[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }
};

// Buscar conversas por telefone específico
export const buscarConversasPorTelefone = async (telefone: string) => {
  try {
    const { data, error } = await supabase
      .from('conversas')
      .select('*')
      .eq('telefone', telefone)
      .order('criado_em', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data as Conversa[]
    };
  } catch (error) {
    console.error('Erro ao buscar conversas por telefone:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: []
    };
  }
};

// Obter estatísticas das conversas
export const obterEstatisticasConversas = async (): Promise<EstatisticasConversas> => {
  try {
    // Total de conversas
    const { count: totalConversas } = await supabase
      .from('conversas')
      .select('*', { count: 'exact', head: true });

    // Total de empresas únicas
    const { data: empresasUnicas } = await supabase
      .from('conversas')
      .select('telefone')
      .neq('telefone', null);

    const totalEmpresas = new Set(empresasUnicas?.map(c => c.telefone)).size;

    // Mensagens enviadas (from_me = true)
    const { count: mensagensEnviadas } = await supabase
      .from('conversas')
      .select('*', { count: 'exact', head: true })
      .eq('from_me', true);

    // Mensagens recebidas (from_me = false)
    const { count: mensagensRecebidas } = await supabase
      .from('conversas')
      .select('*', { count: 'exact', head: true })
      .eq('from_me', false);

    // Calcular taxa de resposta
    const taxaResposta = mensagensEnviadas && mensagensEnviadas > 0 
      ? ((mensagensRecebidas || 0) / mensagensEnviadas) * 100 
      : 0;

    return {
      totalConversas: totalConversas || 0,
      totalEmpresas,
      mensagensEnviadas: mensagensEnviadas || 0,
      mensagensRecebidas: mensagensRecebidas || 0,
      taxaResposta: Math.round(taxaResposta * 100) / 100
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return {
      totalConversas: 0,
      totalEmpresas: 0,
      mensagensEnviadas: 0,
      mensagensRecebidas: 0,
      taxaResposta: 0
    };
  }
};

// Buscar conversas recentes (últimas 24h)
export const buscarConversasRecentes = async (limit = 10) => {
  try {
    const dataLimite = new Date();
    dataLimite.setHours(dataLimite.getHours() - 24);

    const { data, error } = await supabase
      .from('conversas')
      .select('*')
      .gte('criado_em', dataLimite.toISOString())
      .order('criado_em', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      data: data as Conversa[]
    };
  } catch (error) {
    console.error('Erro ao buscar conversas recentes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: []
    };
  }
};

// Marcar conversa como lida (se implementarmos esse recurso futuramente)
export const marcarConversaComoLida = async (conversaId: number) => {
  try {
    const { data, error } = await supabase
      .from('conversas')
      .update({ atualizado_em: new Date().toISOString() })
      .eq('id', conversaId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data as Conversa
    };
  } catch (error) {
    console.error('Erro ao marcar conversa como lida:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}; 