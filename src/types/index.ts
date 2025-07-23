// Tipos baseados no schema do Supabase
export interface Profile {
  id: string;
  email: string;
  nome?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Empresa {
  id: string;
  nome: string;
  setor?: string;
  website?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  estado?: string;
  funcionarios?: number;
  status: 'Prospect' | 'Ativo' | 'Cliente' | 'Inativo';
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  nome: string;
  empresa_id?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  cargo?: string;
  origem: 'Website' | 'LinkedIn' | 'Google Ads' | 'Indicação' | 'Evento' | 'Cold Call' | 'Outros';
  status: 'Novo' | 'Qualificado' | 'Em Contato' | 'Proposta' | 'Fechado' | 'Perdido';
  score: number;
  observacoes?: string;
  ultimo_contato?: string;
  proximo_followup?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  empresa?: Empresa; // Relacionamento
}

export interface Campanha {
  id: string;
  nome: string;
  tipo: 'WhatsApp' | 'Email' | 'SMS' | 'LinkedIn';
  status: 'Rascunho' | 'Ativa' | 'Pausada' | 'Concluída' | 'Cancelada';
  mensagem_template?: string;
  data_inicio?: string;
  data_fim?: string;
  total_leads: number;
  mensagens_enviadas: number;
  respostas_recebidas: number;
  taxa_resposta: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BaseDados {
  id: string;
  nome: string;
  categoria?: string;
  origem: 'Manual' | 'Google Maps' | 'LinkedIn' | 'Yellow Pages' | 'Importação' | 'API' | 'Outros';
  total_registros: number;
  registros_validos: number;
  qualidade_score: number;
  status: 'Ativo' | 'Inativo' | 'Processando' | 'Erro';
  arquivo_original?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Mensagem {
  id: string;
  campanha_id: string;
  lead_id: string;
  tipo: 'WhatsApp' | 'Email' | 'SMS' | 'LinkedIn';
  conteudo: string;
  status: 'Pendente' | 'Enviada' | 'Entregue' | 'Lida' | 'Respondida' | 'Erro';
  data_envio: string;
  data_resposta?: string;
  resposta_conteudo?: string;
  user_id: string;
  created_at: string;
}

export interface CampanhaLead {
  id: string;
  campanha_id: string;
  lead_id: string;
  status: 'Pendente' | 'Enviado' | 'Respondido' | 'Erro';
  data_envio?: string;
  user_id: string;
  created_at: string;
}

export interface DashboardStats {
  user_id: string;
  total_leads: number;
  leads_ativos: number;
  leads_fechados: number;
  total_empresas: number;
  campanhas_ativas: number;
  mensagens_enviadas: number;
  taxa_resposta_media: number;
}

// Tipos para formulários
export interface LeadForm {
  nome: string;
  empresa_id?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  cargo?: string;
  origem: string;
  status: string;
  score: number;
  observacoes?: string;
}

export interface EmpresaForm {
  nome: string;
  setor?: string;
  website?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  estado?: string;
  funcionarios?: number;
  status: string;
  observacoes?: string;
}

export interface CampanhaForm {
  nome: string;
  tipo: string;
  status: string;
  mensagem_template?: string;
  data_inicio?: string;
  data_fim?: string;
}