-- Remover coluna titulo da tabela empresas (já renomeada para empresa_nome)
-- Primeiro verificar se a coluna titulo ainda existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'empresas' AND column_name = 'titulo') THEN
        ALTER TABLE empresas DROP COLUMN titulo;
    END IF;
END $$;

-- Comentário para documentação
COMMENT ON TABLE empresas IS 'Tabela de empresas com dados do Google Maps'; 