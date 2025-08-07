-- Modificar função finalizar_task para também salvar mensagens enviadas na tabela conversas
CREATE OR REPLACE FUNCTION finalizar_task(p_empresa_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
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
BEGIN
    -- Verificar se a empresa existe
    SELECT id, empresa_nome, status INTO v_empresa_atual
    FROM empresas 
    WHERE id = p_empresa_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Empresa não encontrada com ID: ' || p_empresa_id::TEXT,
            'empresa_id', p_empresa_id
        );
    END IF;

    -- Buscar informações do disparo processando (incluindo dados para conversas)
    SELECT 
        id, 
        agendado_para, 
        conexao_id,
        empresa_telefone,
        mensagem,
        status as disparo_status
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
            'empresa_id', p_empresa_id
        );
    END IF;

    -- ATUALIZAR STATUS DA EMPRESA (a_contatar → contato_realizado)
    UPDATE empresas 
    SET 
        status = CASE 
            WHEN status = 'a_contatar' THEN 'contato_realizado'
            ELSE status
        END,
        atualizado_em = NOW()
    WHERE id = p_empresa_id;

    -- ATUALIZAR HISTÓRICO NO DISPAROS_AGENDADOS (processando → enviado)
    UPDATE disparos_agendados 
    SET 
        status = 'enviado',
        updated_at = NOW()
    WHERE empresa_id = p_empresa_id
      AND status = 'processando';

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
        status
    ) VALUES (
        v_telefone_limpo,
        v_empresa_atual.empresa_nome,
        v_disparo_info.mensagem,
        true, -- from_me = true (mensagem enviada pelo sistema)
        v_message_id,
        v_instance_name,
        v_message_timestamp,
        v_message_type,
        v_status
    ) RETURNING id INTO v_conversa_id;

    -- Buscar campanha através da conexao_id e empresa_id
    SELECT id, total_empresas, total_enviados, total_erros, status INTO v_campanha_info
    FROM campanhas_disparo 
    WHERE conexao_id = v_disparo_info.conexao_id
      AND empresas_detalhes::TEXT LIKE '%"id": ' || p_empresa_id::TEXT || '%'
    ORDER BY criado_em DESC
    LIMIT 1;

    -- ATUALIZAR CAMPANHA (se encontrou)
    IF v_campanha_info.id IS NOT NULL THEN
        v_campanha_id := v_campanha_info.id;
        
        -- Calcular novos totais
        SELECT 
            COUNT(*) as total_enviados,
            v_campanha_info.total_empresas as total_empresas
        INTO v_total_enviados, v_total_empresas
        FROM disparos_agendados 
        WHERE conexao_id = v_disparo_info.conexao_id 
          AND status = 'enviado';

        -- Atualizar campanha
        UPDATE campanhas_disparo 
        SET 
            total_enviados = v_total_enviados,
            status = CASE 
                WHEN v_total_enviados >= v_campanha_info.total_empresas THEN 'concluida'
                ELSE 'em_andamento'
            END,
            atualizado_em = NOW()
        WHERE id = v_campanha_info.id;
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
        'timestamp', NOW()
    );

    RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar detalhes
    RETURN json_build_object(
        'success', false,
        'error', 'Erro interno: ' || SQLERRM,
        'empresa_id', p_empresa_id,
        'timestamp', NOW()
    );
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION finalizar_task(INTEGER) IS 'Função RPC para finalizar uma task de disparo, atualizando status da empresa, disparo, campanha e salvando mensagem enviada na tabela conversas.'; 