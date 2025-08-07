-- Garantir que a coluna empresa_nome da tabela empresas tenha dados válidos
-- Se a coluna empresa_nome for NULL, criar um nome baseado no ID

UPDATE empresas 
SET empresa_nome = COALESCE(empresa_nome, 'Empresa ' || id::TEXT)
WHERE empresa_nome IS NULL OR empresa_nome = '';

-- Garantir que não há registros com empresa_nome NULL
ALTER TABLE empresas 
ALTER COLUMN empresa_nome SET NOT NULL;

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_empresas_empresa_nome ON empresas (empresa_nome);

-- Comentário para documentação
COMMENT ON COLUMN empresas.empresa_nome IS 'Nome da empresa (obrigatório)'; 