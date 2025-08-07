-- Resolver problema de duplicação de empresas com mesmo cid
-- O problema é que a mesma empresa (mesmo cid) pode ser capturada por usuários diferentes

-- 1. Primeiro, vamos verificar se existe uma constraint única no cid
DO $$
BEGIN
    -- Verificar se existe constraint única no cid
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'empresas' 
        AND constraint_name LIKE '%cid%' 
        AND constraint_type = 'UNIQUE'
    ) THEN
        -- Remover a constraint única existente no cid
        EXECUTE 'ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresas_cid_key';
    END IF;
END $$;

-- 2. Criar uma constraint única composta (cid + user_id)
-- Isso permite que a mesma empresa seja salva por usuários diferentes
ALTER TABLE empresas 
ADD CONSTRAINT empresas_cid_user_id_unique 
UNIQUE (cid, user_id);

-- 3. Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_empresas_cid_user_id ON empresas (cid, user_id);

-- 4. Comentário explicativo
COMMENT ON CONSTRAINT empresas_cid_user_id_unique ON empresas IS 'Constraint única para evitar duplicação de mesma empresa por mesmo usuário';

-- 5. Função para verificar se empresa já existe para o usuário
CREATE OR REPLACE FUNCTION empresa_existe_para_usuario(p_cid TEXT, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM empresas 
        WHERE cid = p_cid AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- 6. Comentário da função
COMMENT ON FUNCTION empresa_existe_para_usuario(TEXT, UUID) IS 'Verifica se uma empresa já existe para um usuário específico';

-- 7. Log das alterações
DO $$
BEGIN
    RAISE NOTICE 'Constraint única composta criada: empresas_cid_user_id_unique';
    RAISE NOTICE 'Função empresa_existe_para_usuario criada';
    RAISE NOTICE 'Índice idx_empresas_cid_user_id criado';
END $$; 