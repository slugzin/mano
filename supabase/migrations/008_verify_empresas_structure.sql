-- Verificar e corrigir a estrutura da tabela empresas
-- Garantir que todas as colunas necessárias existam

-- Adicionar coluna empresa_nome se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas' AND column_name = 'empresa_nome') THEN
        ALTER TABLE empresas ADD COLUMN empresa_nome TEXT;
    END IF;
END $$;

-- Garantir que empresa_nome tenha dados válidos
UPDATE empresas 
SET empresa_nome = COALESCE(empresa_nome, 'Empresa ' || id::TEXT)
WHERE empresa_nome IS NULL OR empresa_nome = '';

-- Tornar empresa_nome NOT NULL
ALTER TABLE empresas 
ALTER COLUMN empresa_nome SET NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN empresas.empresa_nome IS 'Nome da empresa (obrigatório)'; 