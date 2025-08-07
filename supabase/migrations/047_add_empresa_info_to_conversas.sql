-- Adicionar colunas de informações da empresa na tabela conversas
ALTER TABLE public.conversas ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE public.conversas ADD COLUMN IF NOT EXISTS empresa_website TEXT;
ALTER TABLE public.conversas ADD COLUMN IF NOT EXISTS empresa_endereco TEXT;
ALTER TABLE public.conversas ADD COLUMN IF NOT EXISTS empresa_categoria TEXT;
ALTER TABLE public.conversas ADD COLUMN IF NOT EXISTS empresa_avaliacao DECIMAL(2,1);
ALTER TABLE public.conversas ADD COLUMN IF NOT EXISTS empresa_total_avaliacoes INTEGER;
ALTER TABLE public.conversas ADD COLUMN IF NOT EXISTS empresa_posicao INTEGER;
ALTER TABLE public.conversas ADD COLUMN IF NOT EXISTS empresa_links_agendamento TEXT;

-- Atualizar função finalizar_task_n8n para salvar informações da empresa
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
    
    -- Buscar informações completas da empresa (incluindo dados para conversas)
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
            'user_id', v_user_id::TEXT,
            'debug_info', 'Empresa não existe na tabela'
        );
    END IF;
    
    RAISE NOTICE 'Debug: Empresa encontrada - Nome: %, Website: %, Categoria: %', 
                 v_empresa_atual.empresa_nome, v_empresa_atual.website, v_empresa_atual.categoria;
    
    -- Verificar se a empresa pertence ao user_id correto
    IF v_empresa_atual.user_id != v_user_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Empresa pertence a outro usuário',
            'empresa_id', p_empresa_id,
            'debug_info', 'Conflito de user_id'
        );
    END IF;

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
    
    -- Verificar se o disparo pertence ao user_id correto
    IF v_disparo_info.disparo_user_id != v_user_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Disparo pertence a outro usuário',
            'empresa_id', p_empresa_id,
            'debug_info', 'Conflito de user_id no disparo'
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
      AND user_id = v_user_id
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
        'user_id', v_user_id::TEXT,
        'timestamp', NOW()
    );
END;
$$;

-- Função para atualizar conversas existentes com informações da empresa
CREATE OR REPLACE FUNCTION atualizar_conversas_com_empresa_info()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversa RECORD;
    v_empresa RECORD;
    v_updated_count INTEGER := 0;
    v_user_id UUID := 'c4a948a1-a1cc-42ed-902c-a70c4959d3b7'::UUID;
BEGIN
    -- Atualizar conversas existentes que não têm informações da empresa
    FOR v_conversa IN 
        SELECT id, telefone, nome_empresa 
        FROM conversas 
        WHERE empresa_id IS NULL 
          AND user_id = v_user_id
        LIMIT 100 -- Processar em lotes
    LOOP
        -- Tentar encontrar a empresa por nome
        SELECT id, website, endereco, categoria, avaliacao, total_avaliacoes, posicao, links_agendamento
        INTO v_empresa
        FROM empresas
        WHERE empresa_nome ILIKE '%' || v_conversa.nome_empresa || '%'
          AND user_id = v_user_id
        LIMIT 1;
        
        IF FOUND THEN
            -- Atualizar a conversa com as informações da empresa
            UPDATE conversas 
            SET 
                empresa_id = v_empresa.id,
                empresa_website = v_empresa.website,
                empresa_endereco = v_empresa.endereco,
                empresa_categoria = v_empresa.categoria,
                empresa_avaliacao = v_empresa.avaliacao,
                empresa_total_avaliacoes = v_empresa.total_avaliacoes,
                empresa_posicao = v_empresa.posicao,
                empresa_links_agendamento = v_empresa.links_agendamento
            WHERE id = v_conversa.id;
            
            v_updated_count := v_updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN 'Atualizadas ' || v_updated_count || ' conversas com informações da empresa';
END;
$$;

COMMENT ON FUNCTION finalizar_task_n8n(INTEGER) IS 'Função para finalizar task do n8n e salvar informações da empresa na conversa.';
COMMENT ON FUNCTION atualizar_conversas_com_empresa_info() IS 'Função para atualizar conversas existentes com informações da empresa.'; 