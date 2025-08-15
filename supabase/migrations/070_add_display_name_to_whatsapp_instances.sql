-- Adicionar campo display_name na tabela whatsapp_instances
-- Este campo armazenará o nome personalizado que o usuário digita

DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances' 
        AND column_name = 'display_name'
    ) THEN
        -- Adicionar a coluna display_name
        ALTER TABLE whatsapp_instances 
        ADD COLUMN display_name TEXT;
        
        -- Adicionar comentário
        COMMENT ON COLUMN whatsapp_instances.display_name IS 'Nome personalizado para exibição definido pelo usuário';
        
        RAISE NOTICE 'Coluna display_name adicionada na tabela whatsapp_instances';
    ELSE
        RAISE NOTICE 'Coluna display_name já existe na tabela whatsapp_instances';
    END IF;
END $$;