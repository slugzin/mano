-- Função de teste para finalizar_task
-- Testa a função com diferentes cenários

CREATE OR REPLACE FUNCTION test_finalizar_task(p_empresa_id INTEGER)
RETURNS TABLE (
    test_result JSON,
    debug_info JSON
) AS $$
DECLARE
    v_empresa_info RECORD;
    v_disparo_info RECORD;
    v_test_result JSON;
    v_debug_info JSON;
BEGIN
    -- Coletar informações de debug
    SELECT 
        id, empresa_nome, user_id, status, criado_em
    INTO v_empresa_info
    FROM empresas 
    WHERE id = p_empresa_id;
    
    IF NOT FOUND THEN
        v_test_result := json_build_object(
            'success', false,
            'error', 'Empresa não encontrada',
            'empresa_id', p_empresa_id
        );
    ELSE
        -- Verificar se há disparo processando
        SELECT 
            id, status, user_id, agendado_para
        INTO v_disparo_info
        FROM disparos_agendados 
        WHERE empresa_id = p_empresa_id 
          AND status = 'processando'
        ORDER BY agendado_para DESC 
        LIMIT 1;
        
        IF NOT FOUND THEN
            v_test_result := json_build_object(
                'success', false,
                'error', 'Nenhum disparo processando encontrado',
                'empresa_id', p_empresa_id
            );
        ELSE
            -- Testar a função finalizar_task
            SELECT * INTO v_test_result
            FROM finalizar_task(p_empresa_id);
        END IF;
    END IF;
    
    -- Preparar informações de debug
    v_debug_info := json_build_object(
        'empresa_info', CASE 
            WHEN v_empresa_info.id IS NOT NULL THEN
                json_build_object(
                    'id', v_empresa_info.id,
                    'nome', v_empresa_info.empresa_nome,
                    'user_id', v_empresa_info.user_id,
                    'status', v_empresa_info.status,
                    'criado_em', v_empresa_info.criado_em
                )
            ELSE 'null'
        END,
        'disparo_info', CASE 
            WHEN v_disparo_info.id IS NOT NULL THEN
                json_build_object(
                    'id', v_disparo_info.id,
                    'status', v_disparo_info.status,
                    'user_id', v_disparo_info.user_id,
                    'agendado_para', v_disparo_info.agendado_para
                )
            ELSE 'null'
        END,
        'timestamp', NOW()
    );
    
    RETURN QUERY
    SELECT v_test_result, v_debug_info;
END;
$$ LANGUAGE plpgsql;

-- Função para listar empresas com disparos processando
CREATE OR REPLACE FUNCTION listar_empresas_com_disparos_processando()
RETURNS TABLE (
    empresa_id INTEGER,
    empresa_nome TEXT,
    empresa_user_id UUID,
    disparo_id INTEGER,
    disparo_status TEXT,
    disparo_user_id UUID,
    agendado_para TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.empresa_nome,
        e.user_id as empresa_user_id,
        d.id as disparo_id,
        d.status as disparo_status,
        d.user_id as disparo_user_id,
        d.agendado_para
    FROM empresas e
    INNER JOIN disparos_agendados d ON e.id = d.empresa_id
    WHERE d.status = 'processando'
    ORDER BY d.agendado_para ASC;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON FUNCTION test_finalizar_task(INTEGER) IS 'Testa a função finalizar_task com debug completo';
COMMENT ON FUNCTION listar_empresas_com_disparos_processando() IS 'Lista empresas que têm disparos processando';

-- Log das funções criadas
DO $$
BEGIN
    RAISE NOTICE 'Funções de teste criadas:';
    RAISE NOTICE '- test_finalizar_task(empresa_id)';
    RAISE NOTICE '- listar_empresas_com_disparos_processando()';
    RAISE NOTICE '';
    RAISE NOTICE 'Para testar:';
    RAISE NOTICE 'SELECT * FROM test_finalizar_task(665);';
    RAISE NOTICE 'SELECT * FROM listar_empresas_com_disparos_processando();';
END $$; 