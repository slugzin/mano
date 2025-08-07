-- Debug: Verificar user_id da empresa 665
-- Esta migration é temporária para investigar o problema

-- Função para verificar user_id de uma empresa específica
CREATE OR REPLACE FUNCTION debug_empresa_user_id(p_empresa_id INTEGER)
RETURNS TABLE (
    empresa_id INTEGER,
    empresa_nome TEXT,
    user_id UUID,
    status TEXT,
    criado_em TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.empresa_nome,
        e.user_id,
        e.status,
        e.criado_em
    FROM empresas e
    WHERE e.id = p_empresa_id;
END;
$$ LANGUAGE plpgsql;

-- Função para listar todas as empresas com seus user_ids
CREATE OR REPLACE FUNCTION listar_empresas_com_user_id()
RETURNS TABLE (
    empresa_id INTEGER,
    empresa_nome TEXT,
    user_id UUID,
    status TEXT,
    criado_em TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.empresa_nome,
        e.user_id,
        e.status,
        e.criado_em
    FROM empresas e
    ORDER BY e.criado_em DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar disparos de uma empresa
CREATE OR REPLACE FUNCTION debug_disparos_empresa(p_empresa_id INTEGER)
RETURNS TABLE (
    disparo_id INTEGER,
    empresa_id INTEGER,
    status TEXT,
    user_id UUID,
    agendado_para TIMESTAMP,
    criado_em TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.empresa_id,
        d.status,
        d.user_id,
        d.agendado_para,
        d.criado_em
    FROM disparos_agendados d
    WHERE d.empresa_id = p_empresa_id
    ORDER BY d.criado_em DESC;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON FUNCTION debug_empresa_user_id(INTEGER) IS 'Debug: Verificar user_id de uma empresa específica';
COMMENT ON FUNCTION listar_empresas_com_user_id() IS 'Debug: Listar empresas com seus user_ids';
COMMENT ON FUNCTION debug_disparos_empresa(INTEGER) IS 'Debug: Verificar disparos de uma empresa';

-- Log das funções criadas
DO $$
BEGIN
    RAISE NOTICE 'Funções de debug criadas:';
    RAISE NOTICE '- debug_empresa_user_id(empresa_id)';
    RAISE NOTICE '- listar_empresas_com_user_id()';
    RAISE NOTICE '- debug_disparos_empresa(empresa_id)';
    RAISE NOTICE '';
    RAISE NOTICE 'Para testar:';
    RAISE NOTICE 'SELECT * FROM debug_empresa_user_id(665);';
    RAISE NOTICE 'SELECT * FROM listar_empresas_com_user_id();';
    RAISE NOTICE 'SELECT * FROM debug_disparos_empresa(665);';
END $$; 