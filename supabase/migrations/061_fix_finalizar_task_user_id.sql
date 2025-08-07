-- Corrigir função finalizar_task para remover verificação de user_id
-- Esta versão permite finalizar tasks de qualquer empresa, independente do user_id

CREATE OR REPLACE FUNCTION finalizar_task(p_empresa_id INTEGER)
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
    
    -- Usar o user_id da empresa encontrada (não hardcoded)
    -- Primeiro buscar a empresa para pegar o user_id correto
    SELECT 
        id, 
        empresa_nome, 
        status, 
        user_id,
        website,
        endereco,
        categoria,
        avaliacao,
        total_avaliacoes,
        posicao,
        links_agendamento
    INTO v_empresa_atual
    FROM empresas 
    WHERE id = p_empresa_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Empresa não encontrada com ID: ' || p_empresa_id::TEXT,
            'empresa_id', p_empresa_id,
            'debug_info', 'Empresa não existe na tabela'
        );
    END IF;
    
    -- Usar o user_id da empresa encontrada
    v_user_id := v_empresa_atual.user_id;
    
    RAISE NOTICE 'Debug: Finalizando task para empresa % com user_id %', p_empresa_id, v_user_id;
    RAISE NOTICE 'Debug: Empresa encontrada - Nome: %, Website: %, Categoria: %', 
                 v_empresa_atual.empresa_nome, v_empresa_atual.website, v_empresa_atual.categoria;

    -- Buscar informações do disparo processando
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
            'debug_info', 'Nenhum disparo com status processando encontrado'
        );
    END IF;
    
    RAISE NOTICE 'Debug: Disparo encontrado - ID: %, Status: %, User ID: %', 
                 v_disparo_info.id, v_disparo_info.disparo_status, v_disparo_info.disparo_user_id;

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

    -- SALVAR MENSAGEM ENVIADA NA TABELA CONVERSAS COM INFORMAÇÕES DA EMPRESA
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

    -- Inserir na tabela conversas COM INFORMAÇÕES DA EMPRESA
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
        user_id,
        empresa_id,
        empresa_website,
        empresa_endereco,
        empresa_categoria,
        empresa_avaliacao,
        empresa_total_avaliacoes,
        empresa_posicao,
        empresa_links_agendamento
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
        v_user_id,
        v_empresa_atual.id,
        v_empresa_atual.website,
        v_empresa_atual.endereco,
        v_empresa_atual.categoria,
        v_empresa_atual.avaliacao,
        v_empresa_atual.total_avaliacoes,
        v_empresa_atual.posicao,
        v_empresa_atual.links_agendamento
    ) RETURNING id INTO v_conversa_id;

    RAISE NOTICE 'Debug: Conversa salva com ID: % e informações da empresa', v_conversa_id;

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
          
        RAISE NOTICE 'Debug: Campanha atualizada - ID: %, enviados: %/%', v_campanha_info.id, v_total_enviados, v_campanha_info.total_empresas;
    END IF;

    -- Retornar resultado
    v_resultado := json_build_object(
        'success', true,
        'empresa_id', p_empresa_id,
        'empresa_nome', v_empresa_atual.empresa_nome,
        'empresa_website', v_empresa_atual.website,
        'empresa_categoria', v_empresa_atual.categoria,
        'empresa_avaliacao', v_empresa_atual.avaliacao,
        'empresa_posicao', v_empresa_atual.posicao,
        'status_anterior', v_empresa_atual.status,
        'status_novo', CASE WHEN v_empresa_atual.status = 'a_contatar' THEN 'contato_realizado' ELSE v_empresa_atual.status END,
        'disparo_status', 'enviado',
        'conversa_salva', true,
        'conversa_id', v_conversa_id,
        'telefone_conversa', v_telefone_limpo,
        'user_id', v_user_id::TEXT,
        'timestamp', NOW()
    );

    RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar detalhes
    RETURN json_build_object(
        'success', false,
        'error', 'Erro interno: ' || SQLERRM,
        'empresa_id', p_empresa_id,
        'user_id', COALESCE(v_user_id::TEXT, 'N/A'),
        'timestamp', NOW()
    );
END;
$$; 