-- Versão mais robusta da função finalizar_task_n8n
-- Remover função anterior
DROP FUNCTION IF EXISTS finalizar_task_n8n(INTEGER);

CREATE OR REPLACE FUNCTION finalizar_task_n8n(p_empresa_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_atual RECORD;
    v_disparo_info RECORD;
    v_campanha_info RECORD;
    v_resultado JSON;
    v_campanha_id UUID;
    v_total_enviados INTEGER;
    v_total_empresas INTEGER;
    v_conversa_id INTEGER;
    v_telefone_limpo TEXT;
    v_message_id TEXT;
    v_instance_name TEXT;
    v_message_timestamp BIGINT;
    v_message_type TEXT;
    v_status TEXT;
    v_user_id UUID;
    v_api_key TEXT;
    v_headers JSON;
BEGIN
    -- Usar SECURITY DEFINER para ter privilégios completos
    -- Pegar headers da requisição
    v_headers := current_setting('request.headers', true)::json;
    v_api_key := v_headers->>'x-api-key';
    
    -- Sempre usar o user_id do n8n
    v_user_id := 'c4a948a1-a1cc-42ed-902c-a70c4959d3b7'::UUID;
    
    RAISE NOTICE 'Debug: Finalizando task para empresa % com user_id %', p_empresa_id, v_user_id;
    RAISE NOTICE 'Debug: Headers: %', v_headers;
    RAISE NOTICE 'Debug: API Key: %', v_api_key;
    
    -- Verificar se a empresa existe (SEM filtrar por user_id primeiro)
    SELECT id, empresa_nome, status, user_id INTO v_empresa_atual
    FROM empresas 
    WHERE id = p_empresa_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Empresa não encontrada com ID: ' || p_empresa_id::TEXT,
            'empresa_id', p_empresa_id,
            'user_id', v_user_id::TEXT,
            'debug_info', 'Empresa não existe na tabela'
        );
    END IF;
    
    RAISE NOTICE 'Debug: Empresa encontrada - Nome: %, User ID: %, Status: %', 
                 v_empresa_atual.empresa_nome, v_empresa_atual.user_id, v_empresa_atual.status;
    
    -- Verificar se a empresa pertence ao user_id correto
    IF v_empresa_atual.user_id != v_user_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Empresa pertence a outro usuário. Empresa user_id: ' || v_empresa_atual.user_id::TEXT || ', N8N user_id: ' || v_user_id::TEXT,
            'empresa_id', p_empresa_id,
            'empresa_user_id', v_empresa_atual.user_id::TEXT,
            'n8n_user_id', v_user_id::TEXT,
            'debug_info', 'Conflito de user_id'
        );
    END IF;

    -- Buscar informações do disparo processando (SEM filtrar por user_id primeiro)
    SELECT 
        id, 
        agendado_para, 
        conexao_id,
        empresa_telefone,
        mensagem,
        status as disparo_status,
        user_id as disparo_user_id
    INTO v_disparo_info
    FROM disparos_agendados 
    WHERE empresa_id = p_empresa_id 
      AND status = 'processando'
    ORDER BY agendado_para DESC 
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Disparo processando não encontrado para empresa: ' || p_empresa_id::TEXT,
            'empresa_id', p_empresa_id,
            'user_id', v_user_id::TEXT,
            'debug_info', 'Nenhum disparo com status processando encontrado'
        );
    END IF;
    
    RAISE NOTICE 'Debug: Disparo encontrado - ID: %, User ID: %, Status: %', 
                 v_disparo_info.id, v_disparo_info.disparo_user_id, v_disparo_info.disparo_status;
    
    -- Verificar se o disparo pertence ao user_id correto
    IF v_disparo_info.disparo_user_id != v_user_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Disparo pertence a outro usuário. Disparo user_id: ' || v_disparo_info.disparo_user_id::TEXT || ', N8N user_id: ' || v_user_id::TEXT,
            'empresa_id', p_empresa_id,
            'disparo_user_id', v_disparo_info.disparo_user_id::TEXT,
            'n8n_user_id', v_user_id::TEXT,
            'debug_info', 'Conflito de user_id no disparo'
        );
    END IF;

    RAISE NOTICE 'Debug: Encontrou disparo ID: % para empresa: %', v_disparo_info.id, v_empresa_atual.empresa_nome;

    -- ATUALIZAR STATUS DA EMPRESA (a_contatar → contato_realizado)
    UPDATE empresas 
    SET 
        status = CASE 
            WHEN status = 'a_contatar' THEN 'contato_realizado'
            ELSE status
        END,
        atualizado_em = NOW()
    WHERE id = p_empresa_id
      AND user_id = v_user_id;

    -- ATUALIZAR HISTÓRICO NO DISPAROS_AGENDADOS (processando → enviado)
    UPDATE disparos_agendados 
    SET 
        status = 'enviado',
        updated_at = NOW()
    WHERE empresa_id = p_empresa_id
      AND status = 'processando'
      AND user_id = v_user_id;

    RAISE NOTICE 'Debug: Status atualizado - empresa: %, disparo: enviado', v_empresa_atual.empresa_nome;

    -- SALVAR MENSAGEM ENVIADA NA TABELA CONVERSAS
    -- Extrair telefone limpo do empresa_telefone
    v_telefone_limpo := v_disparo_info.empresa_telefone;
    IF v_telefone_limpo LIKE '%@s.whatsapp.net' THEN
        v_telefone_limpo := replace(v_telefone_limpo, '@s.whatsapp.net', '');
    END IF;
    IF v_telefone_limpo LIKE '%@c.us' THEN
        v_telefone_limpo := replace(v_telefone_limpo, '@c.us', '');
    END IF;

    -- Preparar dados para conversas
    v_message_id := 'disparo_' || v_disparo_info.id::TEXT;
    v_instance_name := 'Sistema de Disparos';
    v_message_timestamp := extract(epoch from NOW())::BIGINT;
    v_message_type := 'conversation';
    v_status := 'SERVER_ACK';

    -- Inserir na tabela conversas
    INSERT INTO conversas (
        telefone,
        nome_empresa,
        mensagem,
        from_me,
        message_id,
        instance_name,
        message_timestamp,
        message_type,
        status,
        user_id
    ) VALUES (
        v_telefone_limpo,
        v_empresa_atual.empresa_nome,
        v_disparo_info.mensagem,
        true, -- from_me = true (mensagem enviada pelo sistema)
        v_message_id,
        v_instance_name,
        v_message_timestamp,
        v_message_type,
        v_status,
        v_user_id
    ) RETURNING id INTO v_conversa_id;

    RAISE NOTICE 'Debug: Conversa salva com ID: %', v_conversa_id;

    -- Buscar campanha através da conexao_id e empresa_id (apenas do usuário específico)
    SELECT id, total_empresas, total_enviados, total_erros, status INTO v_campanha_info
    FROM campanhas_disparo 
    WHERE conexao_id = v_disparo_info.conexao_id
      AND user_id = v_user_id
      AND empresas_detalhes::TEXT LIKE '%"id": ' || p_empresa_id::TEXT || '%'
    ORDER BY criado_em DESC
    LIMIT 1;

    -- ATUALIZAR CAMPANHA (se encontrou)
    IF v_campanha_info.id IS NOT NULL THEN
        v_campanha_id := v_campanha_info.id;
        
        -- Calcular novos totais (apenas do usuário específico)
        SELECT 
            COUNT(*) as total_enviados,
            v_campanha_info.total_empresas as total_empresas
        INTO v_total_enviados, v_total_empresas
        FROM disparos_agendados 
        WHERE conexao_id = v_disparo_info.conexao_id 
          AND status = 'enviado'
          AND user_id = v_user_id;

        -- Atualizar campanha
        UPDATE campanhas_disparo 
        SET 
            total_enviados = v_total_enviados,
            status = CASE 
                WHEN v_total_enviados >= v_campanha_info.total_empresas THEN 'concluida'
                ELSE 'em_andamento'
            END,
            atualizado_em = NOW()
        WHERE id = v_campanha_info.id
          AND user_id = v_user_id;
          
        RAISE NOTICE 'Debug: Campanha atualizada - ID: %, enviados: %/%', v_campanha_info.id, v_total_enviados, v_campanha_info.total_empresas;
    ELSE
        RAISE NOTICE 'Debug: Campanha não encontrada para conexao_id: %', v_disparo_info.conexao_id;
    END IF;

    -- Retornar resultado
    v_resultado := json_build_object(
        'success', true,
        'empresa_id', p_empresa_id,
        'empresa_nome', v_empresa_atual.empresa_nome,
        'status_anterior', v_empresa_atual.status,
        'status_novo', CASE WHEN v_empresa_atual.status = 'a_contatar' THEN 'contato_realizado' ELSE v_empresa_atual.status END,
        'disparo_status', 'enviado',
        'campanha_id', v_campanha_id,
        'campanha_encontrada', v_campanha_info.id IS NOT NULL,
        'total_enviados_campanha', v_total_enviados,
        'total_empresas_campanha', v_total_empresas,
        'disparo_encontrado', v_disparo_info.id IS NOT NULL,
        'conversa_salva', true,
        'conversa_id', v_conversa_id,
        'telefone_conversa', v_telefone_limpo,
        'user_id', v_user_id::TEXT,
        'timestamp', NOW(),
        'debug_info', 'Função executada com sucesso'
    );

    RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar detalhes
    RETURN json_build_object(
        'success', false,
        'error', 'Erro interno: ' || SQLERRM,
        'empresa_id', p_empresa_id,
        'user_id', v_user_id::TEXT,
        'timestamp', NOW(),
        'debug_info', 'Exceção capturada'
    );
END;
$$;

-- Função para testar a nova versão
CREATE OR REPLACE FUNCTION test_finalizar_task_n8n_robust(p_empresa_id INTEGER DEFAULT 571)
RETURNS TABLE (
    resultado TEXT,
    detalhes JSON
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_resultado JSON;
BEGIN
    -- Chamar a função finalizar_task_n8n
    SELECT finalizar_task_n8n(p_empresa_id) INTO v_resultado;
    
    RETURN QUERY
    SELECT 
        CASE 
            WHEN (v_resultado->>'success')::BOOLEAN THEN 'Sucesso'
            ELSE 'Erro'
        END,
        v_resultado;
END;
$$;

-- Comentários explicativos
COMMENT ON FUNCTION finalizar_task_n8n(INTEGER) IS 'Versão robusta da função para finalizar task do n8n com melhor debug.';
COMMENT ON FUNCTION test_finalizar_task_n8n_robust(INTEGER) IS 'Função para testar finalizar_task_n8n robusta.'; 