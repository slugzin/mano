-- Corrigir tamanhos das colunas da tabela empresas
-- O erro "value too long for type character varying(50)" indica que algumas colunas têm limite muito restritivo

-- Verificar a estrutura atual da tabela
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'empresas';

-- Ampliar limites das colunas que podem ter conteúdo longo
-- Empresa nome - pode ser bem longo
ALTER TABLE empresas ALTER COLUMN empresa_nome TYPE TEXT;

-- Categoria - pode ter descrições longas como "Restaurante de comida italiana e pizzaria"
ALTER TABLE empresas ALTER COLUMN categoria TYPE TEXT;

-- Endereço - pode ser muito longo
ALTER TABLE empresas ALTER COLUMN endereco TYPE TEXT;

-- Telefone - geralmente curto mas pode ter múltiplos números
ALTER TABLE empresas ALTER COLUMN telefone TYPE VARCHAR(100);

-- Website - URLs podem ser longas
ALTER TABLE empresas ALTER COLUMN website TYPE TEXT;

-- Pesquisa - pode ter texto longo
ALTER TABLE empresas ALTER COLUMN pesquisa TYPE TEXT;

-- CID - normalmente é um hash, pode ser longo
ALTER TABLE empresas ALTER COLUMN cid TYPE TEXT;

-- Verificar se existem outras colunas que precisam de ajuste
-- Links de agendamento - já deve ser TEXT
-- Parâmetros de busca - já deve ser JSON/TEXT

-- Adicionar índices para performance se não existirem
CREATE INDEX IF NOT EXISTS idx_empresas_user_id ON empresas(user_id);
CREATE INDEX IF NOT EXISTS idx_empresas_cid ON empresas(cid);
CREATE INDEX IF NOT EXISTS idx_empresas_categoria ON empresas(categoria);
CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status);
CREATE INDEX IF NOT EXISTS idx_empresas_tem_whatsapp ON empresas(tem_whatsapp);

-- Função para verificar a estrutura da tabela empresas
CREATE OR REPLACE FUNCTION check_empresas_structure()
RETURNS TABLE(
  column_name TEXT,
  data_type TEXT,
  character_maximum_length INTEGER,
  is_nullable TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.character_maximum_length,
    c.is_nullable::TEXT
  FROM information_schema.columns c
  WHERE c.table_name = 'empresas'
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar empresas com dados muito longos
CREATE OR REPLACE FUNCTION check_empresas_long_data()
RETURNS TABLE(
  id INTEGER,
  campo_problematico TEXT,
  tamanho_atual INTEGER,
  conteudo_truncado TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    'empresa_nome' as campo_problematico,
    length(e.empresa_nome) as tamanho_atual,
    left(e.empresa_nome, 50) as conteudo_truncado
  FROM empresas e
  WHERE length(e.empresa_nome) > 50
  
  UNION ALL
  
  SELECT 
    e.id,
    'categoria' as campo_problematico,
    length(e.categoria) as tamanho_atual,
    left(e.categoria, 50) as conteudo_truncado
  FROM empresas e
  WHERE length(e.categoria) > 50
  
  UNION ALL
  
  SELECT 
    e.id,
    'endereco' as campo_problematico,
    length(e.endereco) as tamanho_atual,
    left(e.endereco, 50) as conteudo_truncado
  FROM empresas e
  WHERE length(e.endereco) > 50
  
  ORDER BY tamanho_atual DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 