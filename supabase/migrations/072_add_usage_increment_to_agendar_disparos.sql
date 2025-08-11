-- Adicionar incremento automático de uso de disparos na função agendar_disparos
-- Quando disparos forem agendados, incrementar automaticamente o uso do plano

CREATE OR REPLACE FUNCTION agendar_disparos(
    p_empresa_ids INTEGER[],
    p_mensagem TEXT,
    p_conexao_id TEXT,
    p_tipo_midia TEXT DEFAULT NULL,
    p_midia_url TEXT DEFAULT NULL,
    p_delay_segundos INTEGER DEFAULT 5,
    p_nome_campanha TEXT DEFAULT NULL,
    p_ordem INTEGER DEFAULT 1,
    p_fase TEXT DEFAULT 'fase_1',
    p_tipo_campanha TEXT DEFAULT 'template',
    p_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_empresa RECORD;
    v_agendado TIMESTAMP;
    v_now TIMESTAMP;
    v_contador INTEGER := 0;
    v_resultado JSON;
    v_tasks_criadas INTEGER := 0;
    v_erros TEXT[] := ARRAY[]::TEXT[];
    v_nome_campanha TEXT;
    v_user_id UUID;
    v_telefone_formatado TEXT;
    
    -- Variáveis para análise das empresas
    v_empresas_detalhes JSONB := '[]'::JSONB;
    v_empresas_resumo TEXT;
    v_modalidade_pesquisa TEXT;
    v_status_empresas TEXT;
    v_categorias_encontradas TEXT[] := ARRAY[]::TEXT[];
    v_cidades_encontradas TEXT[] := ARRAY[]::TEXT[];
    v_categoria_temp TEXT;
    v_cidade_temp TEXT;
    
    -- Variáveis para controle de duplicatas
    v_whatsapps_vistos TEXT[] := ARRAY[]::TEXT[];
    v_empresas_unicas INTEGER[] := ARRAY[]::INTEGER[];
    v_empresas_ignoradas INTEGER[] := ARRAY[]::INTEGER[];
    v_telefone_limpo TEXT;
    v_total_original INTEGER;
    v_total_unicas INTEGER;
BEGIN
    v_now := NOW();
    
    -- Determinar user_id (do parâmetro ou do contexto atual)
    v_user_id := COALESCE(p_user_id, auth.uid());
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não identificado para agendamento'
        );
    END IF;
    
    v_total_original := array_length(p_empresa_ids, 1);
    
    -- PRIMEIRA PASSADA: Identificar empresas únicas por WhatsApp
    FOR v_empresa IN 
        SELECT 
            id,
            COALESCE(empresa_nome, 'Empresa ' || id::TEXT) as nome,
            telefone,
            website,
            endereco,
            categoria,
            avaliacao,
            total_avaliacoes,
            latitude,
            longitude,
            posicao,
            cid,
            pesquisa,
            status,
            capturado_em
        FROM empresas 
        WHERE id = ANY(p_empresa_ids)
        AND user_id = v_user_id
    LOOP
        -- Processar telefone
        IF v_empresa.telefone IS NOT NULL THEN
            -- Remover espaços, parênteses e traços
            v_telefone_limpo := regexp_replace(v_empresa.telefone, '[\(\)\s\-]', '', 'g');
            -- Remover caracteres não numéricos exceto +
            v_telefone_limpo := regexp_replace(v_telefone_limpo, '[^0-9\+]', '', 'g');
            -- Adicionar código do país se não existir
            IF NOT v_telefone_limpo LIKE '55%' THEN
                v_telefone_limpo := '55' || v_telefone_limpo;
            END IF;
            
            -- Verificar se este WhatsApp já foi visto
            IF v_telefone_limpo = ANY(v_whatsapps_vistos) THEN
                -- WhatsApp duplicado, ignorar esta empresa
                v_empresas_ignoradas := array_append(v_empresas_ignoradas, v_empresa.id);
            ELSE
                -- WhatsApp único, adicionar às listas
                v_whatsapps_vistos := array_append(v_whatsapps_vistos, v_telefone_limpo);
                v_empresas_unicas := array_append(v_empresas_unicas, v_empresa.id);
            END IF;
        ELSE
            -- Sem telefone, adicionar às empresas únicas mesmo assim
            v_empresas_unicas := array_append(v_empresas_unicas, v_empresa.id);
        END IF;
    END LOOP;
    
    v_total_unicas := array_length(v_empresas_unicas, 1);
    
    -- Nome da campanha
    v_nome_campanha := COALESCE(
        p_nome_campanha,
        'Campanha de ' || v_total_unicas::TEXT || ' empresas - ' || 
        to_char(v_now, 'DD/MM/YYYY HH24:MI')
    );

    -- CRIAR CAMPANHA
    INSERT INTO campanhas_disparo (
        nome,
        descricao,
        tipo,
        status,
        total_empresas,
        total_enviados,
        total_erros,
        mensagem,
        tipo_midia,
        midia_url,
        conexao_id,
        criado_em,
        atualizado_em,
        user_id
    ) VALUES (
        v_nome_campanha,
        'Disparo automático via sistema - ' || v_total_unicas || ' empresas únicas (filtradas ' || (v_total_original - v_total_unicas) || ' duplicatas)',
        'whatsapp',
        'em_andamento',
        v_total_unicas,
        0,
        0,
        p_mensagem,
        p_tipo_midia,
        p_midia_url,
        p_conexao_id,
        v_now,
        v_now,
        v_user_id
    );

    -- SEGUNDA PASSADA: Processar apenas empresas únicas
    FOR v_empresa IN 
        SELECT 
            id,
            COALESCE(empresa_nome, 'Empresa ' || id::TEXT) as nome,
            telefone,
            website,
            endereco,
            categoria,
            avaliacao,
            total_avaliacoes,
            latitude,
            longitude,
            posicao,
            cid,
            pesquisa,
            status,
            capturado_em
        FROM empresas 
        WHERE id = ANY(v_empresas_unicas)
        AND user_id = v_user_id
    LOOP
        BEGIN
            v_agendado := v_now + (v_contador * p_delay_segundos * interval '1 second');
            
            -- Formatar telefone para WhatsApp
            v_telefone_formatado := v_empresa.telefone;
            IF v_telefone_formatado IS NOT NULL THEN
                -- Remover espaços, parênteses e traços
                v_telefone_formatado := regexp_replace(v_telefone_formatado, '[\(\)\s\-]', '', 'g');
                -- Remover caracteres não numéricos exceto +
                v_telefone_formatado := regexp_replace(v_telefone_formatado, '[^0-9\+]', '', 'g');
                -- Adicionar código do país se não existir
                IF NOT v_telefone_formatado LIKE '55%' THEN
                    v_telefone_formatado := '55' || v_telefone_formatado;
                END IF;
                -- Adicionar sufixo do WhatsApp
                v_telefone_formatado := v_telefone_formatado || '@s.whatsapp.net';
            END IF;

            -- INSERIR DISPARO AGENDADO
            INSERT INTO disparos_agendados (
                empresa_id,
                empresa_nome,
                empresa_telefone,
                empresa_website,
                empresa_endereco,
                mensagem,
                tipo_midia,
                midia_url,
                status,
                agendado_para,
                conexao_id,
                ordem,
                fase,
                criado_em,
                user_id
            ) VALUES (
                v_empresa.id,
                v_empresa.nome,
                v_telefone_formatado,
                v_empresa.website,
                v_empresa.endereco,
                p_mensagem,
                p_tipo_midia,
                p_midia_url,
                'pendente',
                v_agendado,
                p_conexao_id,
                p_ordem,
                p_fase,
                v_now,
                v_user_id
            );

            -- Coletar detalhes da empresa para análise
            v_empresas_detalhes := v_empresas_detalhes || jsonb_build_object(
                'id', v_empresa.id,
                'nome', v_empresa.nome,
                'categoria', v_empresa.categoria,
                'cidade', split_part(v_empresa.endereco, ',', -1),
                'avaliacao', v_empresa.avaliacao,
                'posicao', v_empresa.posicao
            );

            -- Coletar categorias únicas
            IF v_empresa.categoria IS NOT NULL AND NOT v_empresa.categoria = ANY(v_categorias_encontradas) THEN
                v_categorias_encontradas := array_append(v_categorias_encontradas, v_empresa.categoria);
            END IF;

            -- Coletar cidades únicas
            v_cidade_temp := split_part(v_empresa.endereco, ',', -1);
            IF v_cidade_temp IS NOT NULL AND NOT v_cidade_temp = ANY(v_cidades_encontradas) THEN
                v_cidades_encontradas := array_append(v_cidades_encontradas, v_cidade_temp);
            END IF;

            v_tasks_criadas := v_tasks_criadas + 1;
            v_contador := v_contador + 1;

        EXCEPTION
            WHEN OTHERS THEN
                v_erros := array_append(v_erros, 'Erro ao agendar empresa ' || v_empresa.id || ': ' || SQLERRM);
        END;
    END LOOP;

    -- INCREMENTAR USO DIÁRIO DE DISPAROS SE HOUVER TAREFAS CRIADAS
    IF v_tasks_criadas > 0 THEN
        BEGIN
            PERFORM increment_daily_usage(v_user_id, 'disparos', v_tasks_criadas);
        EXCEPTION
            WHEN OTHERS THEN
                -- Se falhar ao incrementar uso, loggar mas não falhar o disparo
                RAISE WARNING 'Falha ao incrementar uso diário de disparos: %', SQLERRM;
        END;
    END IF;

    -- Análise resumida
    IF array_length(v_categorias_encontradas, 1) > 0 THEN
        v_empresas_resumo := array_to_string(v_categorias_encontradas[1:3], ', ');
        IF array_length(v_categorias_encontradas, 1) > 3 THEN
            v_empresas_resumo := v_empresas_resumo || ' e mais ' || (array_length(v_categorias_encontradas, 1) - 3)::TEXT || ' categorias';
        END IF;
    ELSE
        v_empresas_resumo := 'Empresas diversas';
    END IF;

    -- RETORNO
    v_resultado := json_build_object(
        'success', true,
        'tasks_criadas', v_tasks_criadas,
        'empresas_processadas', v_total_unicas,
        'empresas_originais', v_total_original,
        'empresas_filtradas', (v_total_original - v_total_unicas),
        'empresas_ignoradas_ids', v_empresas_ignoradas,
        'erros', v_erros,
        'nome_campanha', v_nome_campanha,
        'empresas_resumo', v_empresas_resumo,
        'categorias', v_categorias_encontradas,
        'cidades', v_cidades_encontradas,
        'modalidade_pesquisa', v_modalidade_pesquisa,
        'status_empresas', v_status_empresas,
        'tipo', 'whatsapp',
        'tipo_campanha', CASE 
            WHEN p_tipo_campanha = 'fluxo' THEN 'fluxo'
            ELSE 'template'
        END,
        'filtro_duplicatas_aplicado', true,
        'uso_disparos_incrementado', v_tasks_criadas
    );

    RETURN v_resultado;
END;
$$;

-- Comentário para documentação
COMMENT ON FUNCTION agendar_disparos IS 'Função para agendar disparos com filtro automático de WhatsApp duplicado e incremento automático do uso diário de disparos';

-- Log das alterações
DO $$
BEGIN
  RAISE NOTICE 'Função agendar_disparos atualizada com incremento automático de uso diário';
  RAISE NOTICE 'Agora incrementa automaticamente o contador de disparos do plano gratuito';
END $$; 