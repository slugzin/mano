// Variáveis disponíveis para uso nos templates e fluxos
export const VARIAVEIS_DISPONIVEIS = [
  { variavel: '{empresa}', descricao: 'Nome da empresa' },
  { variavel: '{categoria}', descricao: 'Categoria da empresa' },
  { variavel: '{website}', descricao: 'Website da empresa' },
  { variavel: '{notagoogle}', descricao: 'Avaliação no Google' },
  { variavel: '{avaliacoes}', descricao: 'Total de avaliações' },
  { variavel: '{endereco}', descricao: 'Endereço da empresa' },
  { variavel: '{telefone}', descricao: 'Telefone da empresa' },
  { variavel: '{posicao}', descricao: 'Posição no Google' },
  { variavel: '{pesquisa}', descricao: 'Termo de pesquisa usado' },
  { variavel: '{status}', descricao: 'Status da empresa' },
  { variavel: '{data_captura}', descricao: 'Data de captura da empresa' }
];

// Função para detectar variáveis no texto
export const detectarVariaveis = (texto: string): string[] => {
  const regex = /\{([^}]+)\}/g;
  const matches = [];
  let match;
  
  while ((match = regex.exec(texto)) !== null) {
    matches.push(match[0]);
  }
  
  return [...new Set(matches)];
};

// Função para criar preview com dados de exemplo
export const criarPreview = (texto: string): string => {
  let preview = texto;
  
  // Dados de exemplo para preview
  const dadosExemplo = {
    '{empresa}': 'Extensão de Cílios - Curitiba',
    '{categoria}': 'Studio de cílios',
    '{website}': 'https://lashnaju.com.br/',
    '{notagoogle}': '5.0',
    '{avaliacoes}': '121',
    '{endereco}': 'R. Monsenhor Celso, 211 - Centro, Curitiba - PR, 80010-150',
    '{telefone}': '(41) 99672-1834',
    '{posicao}': '1',
    '{pesquisa}': 'Cilios',
    '{status}': 'a_contatar',
    '{data_captura}': '25/07/2025'
  };
  
  Object.entries(dadosExemplo).forEach(([variavel, valor]) => {
    preview = preview.replace(new RegExp(variavel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), valor);
  });
  
  return preview;
};

// Função para substituir variáveis com dados reais da empresa
export const substituirVariaveis = (texto: string, dadosEmpresa: any): string => {
  let resultado = texto;
  
  // Mapeamento das variáveis para os campos da empresa
  const mapeamento = {
    '{empresa}': dadosEmpresa.empresa_nome || dadosEmpresa.nome || '',
    '{categoria}': dadosEmpresa.categoria || '',
    '{website}': dadosEmpresa.website || '',
    '{notagoogle}': dadosEmpresa.avaliacao || '',
    '{avaliacoes}': dadosEmpresa.total_avaliacoes || '',
    '{endereco}': dadosEmpresa.endereco || '',
    '{telefone}': dadosEmpresa.telefone || '',
    '{posicao}': dadosEmpresa.posicao || '',
    '{pesquisa}': dadosEmpresa.pesquisa || '',
    '{status}': dadosEmpresa.status || '',
    '{data_captura}': dadosEmpresa.capturado_em ? new Date(dadosEmpresa.capturado_em).toLocaleDateString('pt-BR') : ''
  };
  
  Object.entries(mapeamento).forEach(([variavel, valor]) => {
    if (valor) {
      resultado = resultado.replace(new RegExp(variavel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), valor);
    }
  });
  
  return resultado;
};

// Função para validar se todas as variáveis usadas estão disponíveis
export const validarVariaveis = (texto: string): { validas: boolean; invalidas: string[] } => {
  const variaveisUsadas = detectarVariaveis(texto);
  const variaveisValidas = VARIAVEIS_DISPONIVEIS.map(v => v.variavel);
  const invalidas = variaveisUsadas.filter(v => !variaveisValidas.includes(v));
  
  return {
    validas: invalidas.length === 0,
    invalidas
  };
}; 