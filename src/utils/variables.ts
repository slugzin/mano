// Variáveis disponíveis para uso nos templates e fluxos
export const VARIAVEIS_DISPONIVEIS = [
  { variavel: '{empresa}', descricao: 'Nome da empresa' },
  { variavel: '{empresa_nome}', descricao: 'Nome da empresa' },
  { variavel: '{categoria}', descricao: 'Categoria da empresa' },
  { variavel: '{empresa_categoria}', descricao: 'Categoria da empresa' },
  { variavel: '{website}', descricao: 'Website da empresa' },
  { variavel: '{empresa_website}', descricao: 'Website da empresa' },
  { variavel: '{avaliacao}', descricao: 'Avaliação no Google' },
  { variavel: '{empresa_avaliacao}', descricao: 'Avaliação no Google' },
  { variavel: '{total_avaliacoes}', descricao: 'Total de avaliações' },
  { variavel: '{endereco}', descricao: 'Endereço da empresa' },
  { variavel: '{empresa_endereco}', descricao: 'Endereço da empresa' },
  { variavel: '{cidade}', descricao: 'Cidade da empresa' },
  { variavel: '{empresa_cidade}', descricao: 'Cidade da empresa' },
  { variavel: '{telefone}', descricao: 'Telefone da empresa' },
  { variavel: '{empresa_telefone}', descricao: 'Telefone da empresa' },
  { variavel: '{posicao}', descricao: 'Posição no Google' },
  { variavel: '{empresa_posicao}', descricao: 'Posição no Google' },
  { variavel: '{pesquisa}', descricao: 'Termo de pesquisa usado' },
  { variavel: '{status}', descricao: 'Status da empresa' },
  { variavel: '{capturado_em}', descricao: 'Data de captura da empresa' }
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
    '{empresa_nome}': 'Extensão de Cílios - Curitiba',
    '{categoria}': 'Studio de cílios',
    '{empresa_categoria}': 'Studio de cílios',
    '{website}': 'https://lashnaju.com.br/',
    '{empresa_website}': 'https://lashnaju.com.br/',
    '{avaliacao}': '5.0',
    '{empresa_avaliacao}': '5.0',
    '{total_avaliacoes}': '121',
    '{endereco}': 'R. Monsenhor Celso, 211 - Centro, Curitiba - PR, 80010-150',
    '{empresa_endereco}': 'R. Monsenhor Celso, 211 - Centro, Curitiba - PR, 80010-150',
    '{cidade}': 'Curitiba',
    '{empresa_cidade}': 'Curitiba',
    '{telefone}': '(41) 99672-1834',
    '{empresa_telefone}': '(41) 99672-1834',
    '{posicao}': '1',
    '{empresa_posicao}': '1',
    '{pesquisa}': 'Cilios',
    '{status}': 'a_contatar',
    '{capturado_em}': '25/07/2025'
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
    '{empresa_nome}': dadosEmpresa.empresa_nome || dadosEmpresa.nome || '',
    '{categoria}': dadosEmpresa.categoria || '',
    '{empresa_categoria}': dadosEmpresa.categoria || '',
    '{website}': dadosEmpresa.website || '',
    '{empresa_website}': dadosEmpresa.website || '',
    '{avaliacao}': dadosEmpresa.avaliacao || '',
    '{empresa_avaliacao}': dadosEmpresa.avaliacao || '',
    '{total_avaliacoes}': dadosEmpresa.total_avaliacoes || '',
    '{endereco}': dadosEmpresa.endereco || '',
    '{empresa_endereco}': dadosEmpresa.endereco || '',
    '{cidade}': dadosEmpresa.endereco ? dadosEmpresa.endereco.split(',').slice(-2)[0]?.split('-')[0]?.trim() || '' : '',
    '{empresa_cidade}': dadosEmpresa.endereco ? dadosEmpresa.endereco.split(',').slice(-2)[0]?.split('-')[0]?.trim() || '' : '',
    '{telefone}': dadosEmpresa.telefone || '',
    '{empresa_telefone}': dadosEmpresa.telefone || '',
    '{posicao}': dadosEmpresa.posicao || '',
    '{empresa_posicao}': dadosEmpresa.posicao || '',
    '{pesquisa}': dadosEmpresa.pesquisa || '',
    '{status}': dadosEmpresa.status || '',
    '{capturado_em}': dadosEmpresa.capturado_em ? new Date(dadosEmpresa.capturado_em).toLocaleDateString('pt-BR') : ''
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