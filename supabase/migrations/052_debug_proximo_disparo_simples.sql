-- Função de debug para testar proximo_disparo_simples
CREATE OR REPLACE FUNCTION debug_proximo_disparo_simples(p_user_id UUID)
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
    
    -- Contar disparos pendentes do usuário
    SELECT COUNT(*) INTO v_count
    FROM public.disparos_agendados
    WHERE public.disparos_agendados.status = 'pendente'
      AND public.disparos_agendados.user_id = p_user_id
      AND public.disparos_agendados.agendado_para <= v_now;
    
    -- Buscar disparo específico
    SELECT t.id, t.empresa_id, t.empresa_nome, t.empresa_telefone, 
           t.empresa_website, t.empresa_endereco, t.mensagem, t.tipo_midia, 
           t.midia_url, t.status, t.agendado_para, t.criado_em, t.conexao_id
    INTO v_disparo
    FROM public.disparos_agendados t
    WHERE t.status = 'pendente'
      AND t.user_id = p_user_id
      AND t.agendado_para <= v_now
    ORDER BY 
      t.fase ASC,
      t.ordem ASC,
      t.agendado_para ASC
    LIMIT 1;
    
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
            'agendado_para', v_disparo.agendado_para::TEXT,
            'user_id', p_user_id::TEXT
        );
    ELSE
        v_dados_disparo := '{}'::JSON;
    END IF;
    
    -- Informações de debug
    v_debug_info := json_build_object(
        'hora_atual', v_now::TEXT,
        'user_id_procurado', p_user_id::TEXT,
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
COMMENT ON FUNCTION debug_proximo_disparo_simples(UUID) IS 'Função para debug da proximo_disparo_simples.';

-- Função para testar com o user_id específico do exemplo
CREATE OR REPLACE FUNCTION test_proximo_disparo_exemplo()
RETURNS TABLE (
    debug_info JSON,
    disparo_encontrado BOOLEAN,
    dados_disparo JSON
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM debug_proximo_disparo_simples('0f1cba67-cd50-48dc-993c-b606006f2a2a'::UUID);
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION test_proximo_disparo_exemplo() IS 'Função para testar com o user_id do exemplo fornecido.';

-- Log das alterações
DO $$
BEGIN
  RAISE NOTICE 'Funções de debug criadas para testar proximo_disparo_simples';
  RAISE NOTICE 'Use: SELECT * FROM debug_proximo_disparo_simples(user_id)';
  RAISE NOTICE 'Use: SELECT * FROM test_proximo_disparo_exemplo()';
END $$; 