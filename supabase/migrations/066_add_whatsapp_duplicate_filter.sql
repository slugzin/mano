-- Atualizar função agendar_disparos para remover empresas com WhatsApp duplicado
-- Mantém apenas uma empresa por número de WhatsApp

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
    
    -- Pegar user_id se não fornecido
    IF p_user_id IS NULL THEN
        v_user_id := auth.uid();
    ELSE
        v_user_id := p_user_id;
    END IF;
    
    -- Verificar se user_id é válido
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    v_total_original := array_length(p_empresa_ids, 1);
    
    -- PRIMEIRA PASSAGEM: FILTRAR EMPRESAS COM WHATSAPP DUPLICADO
    FOR v_empresa IN 
        SELECT 
            id,
            COALESCE(empresa_nome, 'Empresa ' || id::TEXT) as nome,
            telefone
        FROM empresas 
        WHERE id = ANY(p_empresa_ids)
        AND user_id = v_user_id
        ORDER BY COALESCE(empresa_nome, 'Empresa ' || id::TEXT)
    LOOP
        -- Processar e limpar telefone para verificação de duplicatas
        v_telefone_limpo := NULL;
        
        IF v_empresa.telefone IS NOT NULL THEN
            -- Aplicar a mesma lógica de formatação para verificar duplicatas
            v_telefone_limpo := regexp_replace(v_empresa.telefone, '[\(\)\s\-\.]', '', 'g');
            v_telefone_limpo := regexp_replace(v_telefone_limpo, '[^0-9]', '', 'g');
            
            -- Se começar com 55, remover para processar
            IF v_telefone_limpo LIKE '55%' THEN
                v_telefone_limpo := substring(v_telefone_limpo from 3);
            END IF;
            
            -- Se tiver 11 dígitos (DDD + 9 dígitos), remover o primeiro 9
            IF length(v_telefone_limpo) = 11 THEN
                v_telefone_limpo := substring(v_telefone_limpo from 1 for 2) || 
                                  substring(v_telefone_limpo from 4);
            END IF;
            
            -- Se tiver 10 dígitos (DDD + 8 dígitos), está correto
            IF length(v_telefone_limpo) = 10 THEN
                v_telefone_limpo := '55' || v_telefone_limpo;
            ELSIF length(v_telefone_limpo) = 11 THEN
                -- Se ainda tiver 11 dígitos, remover o primeiro 9
                v_telefone_limpo := '55' || substring(v_telefone_limpo from 1 for 2) || 
                                  substring(v_telefone_limpo from 4);
            ELSE
                -- Se não tiver o formato correto, manter como está
                v_telefone_limpo := '55' || v_telefone_limpo;
            END IF;
            
            -- Verificar se já vimos este número
            IF v_telefone_limpo = ANY(v_whatsapps_vistos) THEN
                -- WhatsApp duplicado - ignorar esta empresa
                v_empresas_ignoradas := array_append(v_empresas_ignoradas, v_empresa.id);
            ELSE
                -- Novo WhatsApp - incluir empresa
                v_whatsapps_vistos := array_append(v_whatsapps_vistos, v_telefone_limpo);
                v_empresas_unicas := array_append(v_empresas_unicas, v_empresa.id);
            END IF;
        ELSE
            -- Empresas sem telefone são sempre incluídas
            v_empresas_unicas := array_append(v_empresas_unicas, v_empresa.id);
        END IF;
    END LOOP;
    
    v_total_unicas := array_length(v_empresas_unicas, 1);
    
    -- Atualizar nome da campanha para refletir filtros aplicados
    v_nome_campanha := COALESCE(
        p_nome_campanha,
        'Campanha de ' || COALESCE(v_total_unicas, 0)::TEXT || ' empresas (filtradas de ' || v_total_original::TEXT || ') - ' || 
        to_char(v_now, 'DD/MM/YYYY HH24:MI')
    );

    -- ANALISAR EMPRESAS ÚNICAS SELECIONADAS
    FOR v_empresa IN 
        SELECT 
            id,
            COALESCE(empresa_nome, 'Empresa ' || id::TEXT) as nome,
            endereco,
            categoria,
            telefone,
            website,
            latitude,
            longitude,
            avaliacao,
            total_avaliacoes,
            posicao,
            cid,
            pesquisa,
            status,
            capturado_em
        FROM empresas 
        WHERE id = ANY(v_empresas_unicas)
        AND user_id = v_user_id
        ORDER BY COALESCE(empresa_nome, 'Empresa ' || id::TEXT)
    LOOP
        -- Construir JSON com detalhes de cada empresa
        v_empresas_detalhes := v_empresas_detalhes || jsonb_build_object(
            'id', v_empresa.id,
            'nome', v_empresa.nome,
            'endereco', v_empresa.endereco,
            'categoria', v_empresa.categoria,
            'telefone', v_empresa.telefone,
            'website', v_empresa.website,
            'avaliacao', v_empresa.avaliacao,
            'total_avaliacoes', v_empresa.total_avaliacoes,
            'posicao', v_empresa.posicao,
            'cid', v_empresa.cid,
            'status', v_empresa.status
        );
        
        -- Coletar categorias únicas
        IF v_empresa.categoria IS NOT NULL THEN
            v_categoria_temp := v_empresa.categoria;
            IF NOT v_categoria_temp = ANY(v_categorias_encontradas) THEN
                v_categorias_encontradas := array_append(v_categorias_encontradas, v_categoria_temp);
            END IF;
        END IF;
        
        -- Coletar cidades únicas (extrair da primeira parte do endereço)
        IF v_empresa.endereco IS NOT NULL THEN
            v_cidade_temp := split_part(split_part(v_empresa.endereco, ',', -2), '-', 1);
            v_cidade_temp := trim(v_cidade_temp);
            IF v_cidade_temp != '' AND NOT v_cidade_temp = ANY(v_cidades_encontradas) THEN
                v_cidades_encontradas := array_append(v_cidades_encontradas, v_cidade_temp);
            END IF;
        END IF;
        
        -- Capturar modalidade e status (assume que todas têm os mesmos)
        IF v_modalidade_pesquisa IS NULL THEN
            v_modalidade_pesquisa := v_empresa.pesquisa;
        END IF;
        
        IF v_status_empresas IS NULL THEN
            v_status_empresas := v_empresa.status;
        END IF;
    END LOOP;
    
    -- Construir resumo textual
    v_empresas_resumo := COALESCE(v_total_unicas, 0)::TEXT || ' empresas';
    IF v_total_original != COALESCE(v_total_unicas, 0) THEN
        v_empresas_resumo := v_empresas_resumo || ' (filtradas de ' || v_total_original::TEXT || ' - ' || 
                           (v_total_original - COALESCE(v_total_unicas, 0))::TEXT || ' WhatsApps duplicados removidos)';
    END IF;
    IF array_length(v_categorias_encontradas, 1) > 0 THEN
        v_empresas_resumo := v_empresas_resumo || ' (' || array_to_string(v_categorias_encontradas, ', ') || ')';
    END IF;
    IF array_length(v_cidades_encontradas, 1) > 0 THEN
        v_empresas_resumo := v_empresas_resumo || ' em ' || array_to_string(v_cidades_encontradas, ', ');
    END IF;

    -- CRIAR CAMPANHA COM DADOS COMPLETOS E USER_ID
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
        empresas_detalhes,
        empresas_resumo,
        modalidade_pesquisa,
        status_empresas,
        categorias_encontradas,
        cidades_encontradas,
        tipo_campanha,
        criado_em,
        atualizado_em,
        user_id
    ) VALUES (
        v_nome_campanha,
        'Disparo automático via sistema (com filtro de WhatsApp duplicado)',
        'whatsapp',
        'em_andamento',
        COALESCE(v_total_unicas, 0),
        0,
        0,
        p_mensagem,
        p_tipo_midia,
        p_midia_url,
        p_conexao_id,
        v_empresas_detalhes,
        v_empresas_resumo,
        v_modalidade_pesquisa,
        v_status_empresas,
        v_categorias_encontradas,
        v_cidades_encontradas,
        CASE 
            WHEN p_tipo_campanha = 'fluxo' THEN 'fluxo'
            ELSE 'template'
        END,
        v_now,
        v_now,
        v_user_id
    );

    -- PROCESSAR AGENDAMENTOS APENAS PARA EMPRESAS ÚNICAS
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
            
            -- FORMATAÇÃO DO TELEFONE: 55 + DDD + 8 dígitos (remover 9 extra)
            v_telefone_formatado := NULL;
            
            IF v_empresa.telefone IS NOT NULL THEN
                -- Remover espaços, parênteses, traços e caracteres não numéricos
                v_telefone_formatado := regexp_replace(v_empresa.telefone, '[\(\)\s\-\.]', '', 'g');
                v_telefone_formatado := regexp_replace(v_telefone_formatado, '[^0-9]', '', 'g');
                
                -- Se começar com 55, remover para processar
                IF v_telefone_formatado LIKE '55%' THEN
                    v_telefone_formatado := substring(v_telefone_formatado from 3);
                END IF;
                
                -- Se tiver 11 dígitos (DDD + 9 dígitos), remover o primeiro 9
                IF length(v_telefone_formatado) = 11 THEN
                    v_telefone_formatado := substring(v_telefone_formatado from 1 for 2) || 
                                          substring(v_telefone_formatado from 4);
                END IF;
                
                -- Se tiver 10 dígitos (DDD + 8 dígitos), está correto
                IF length(v_telefone_formatado) = 10 THEN
                    v_telefone_formatado := '55' || v_telefone_formatado;
                ELSIF length(v_telefone_formatado) = 11 THEN
                    -- Se ainda tiver 11 dígitos, remover o primeiro 9
                    v_telefone_formatado := '55' || substring(v_telefone_formatado from 1 for 2) || 
                                          substring(v_telefone_formatado from 4);
                ELSE
                    -- Se não tiver o formato correto, manter como está
                    v_telefone_formatado := '55' || v_telefone_formatado;
                END IF;
                
                -- Adicionar sufixo do WhatsApp
                v_telefone_formatado := v_telefone_formatado || '@s.whatsapp.net';
            END IF;

            -- INSERIR DISPARO AGENDADO COM TELEFONE FORMATADO
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
                COALESCE(v_empresa.nome, 'Empresa ' || v_empresa.id::TEXT),
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

            v_tasks_criadas := v_tasks_criadas + 1;
            v_contador := v_contador + 1;

        EXCEPTION WHEN OTHERS THEN
            v_erros := array_append(v_erros, 'Erro ao agendar para empresa ' || COALESCE(v_empresa.nome, 'ID ' || v_empresa.id::TEXT) || ': ' || SQLERRM);
        END;
    END LOOP;

    -- Retornar resultado com análises e informações sobre duplicatas
    v_resultado := json_build_object(
        'success', v_tasks_criadas > 0,
        'tasks_criadas', v_tasks_criadas,
        'total_empresas_original', v_total_original,
        'total_empresas_unicas', COALESCE(v_total_unicas, 0),
        'empresas_duplicadas_removidas', (v_total_original - COALESCE(v_total_unicas, 0)),
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
        'filtro_duplicatas_aplicado', true
    );

    RETURN v_resultado;
END;
$$;

-- Comentário para documentação
COMMENT ON FUNCTION agendar_disparos IS 'Função para agendar disparos com filtro automático de WhatsApp duplicado - remove empresas com mesmo número, mantendo apenas uma por WhatsApp';

-- Log das alterações
DO $$
BEGIN
  RAISE NOTICE 'Função agendar_disparos atualizada com filtro de WhatsApp duplicado';
  RAISE NOTICE 'A função agora remove automaticamente empresas com números de WhatsApp duplicados';
  RAISE NOTICE 'Mantém apenas uma empresa por número de WhatsApp único';
END $$; 