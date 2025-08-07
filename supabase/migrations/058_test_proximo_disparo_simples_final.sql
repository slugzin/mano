-- Função de teste final para proximo_disparo_simples
CREATE OR REPLACE FUNCTION test_proximo_disparo_simples_final()
RETURNS TABLE (
    debug_info JSON,
    disparo_encontrado BOOLEAN,
    dados_disparo JSON
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_disparo RECORD;
    v_dados_disparo JSON;
    v_debug_info JSON;
    v_encontrou BOOLEAN := FALSE;
    v_now TIMESTAMP;
    v_count INTEGER;
BEGIN
    -- Pegar hora atual
    v_now := NOW()::TIMESTAMP;
    
    -- Contar disparos pendentes totais
    SELECT COUNT(*) INTO v_count
    FROM public.disparos_agendados
    WHERE public.disparos_agendados.status = 'pendente'
      AND public.disparos_agendados.agendado_para <= v_now;
    
    -- Chamar a função proximo_disparo_simples
    SELECT * INTO v_disparo FROM proximo_disparo_simples();
    
    -- Verificar se encontrou disparo
    IF v_disparo.id IS NOT NULL THEN
        v_encontrou := TRUE;
        
        -- Converter para JSON
        v_dados_disparo := json_build_object(
            'id', v_disparo.id,
            'empresa_nome', v_disparo.empresa_nome,
            'empresa_telefone', v_disparo.empresa_telefone,
            'mensagem', v_disparo.mensagem,
            'status', v_disparo.status,
            'agendado_para', v_disparo.agendado_para::TEXT
        );
    ELSE
        v_dados_disparo := '{}'::JSON;
    END IF;
    
    -- Informações de debug
    v_debug_info := json_build_object(
        'hora_atual', v_now::TEXT,
        'total_disparos_pendentes', v_count,
        'disparo_encontrado', v_encontrou
    );
    
    RETURN QUERY
    SELECT 
        v_debug_info,
        v_encontrou,
        v_dados_disparo;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION test_proximo_disparo_simples_final() IS 'Função para testar proximo_disparo_simples final.';

-- Log das alterações
DO $$
BEGIN
  RAISE NOTICE 'Função de teste final criada para proximo_disparo_simples';
  RAISE NOTICE 'Use: SELECT * FROM test_proximo_disparo_simples_final()';
END $$; 