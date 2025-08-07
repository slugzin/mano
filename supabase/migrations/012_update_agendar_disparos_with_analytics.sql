-- Remover função antiga se existir
DROP FUNCTION IF EXISTS agendar_disparos(INTEGER[], TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER, TEXT);

-- Criar função agendar_disparos com análises das empresas
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
    p_tipo_campanha TEXT DEFAULT 'template'
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
    
    -- Variáveis para análise das empresas
    v_empresas_detalhes JSONB := '[]'::JSONB;
    v_empresas_resumo TEXT;
    v_modalidade_pesquisa TEXT;
    v_status_empresas TEXT;
    v_categorias_encontradas TEXT[] := ARRAY[]::TEXT[];
    v_cidades_encontradas TEXT[] := ARRAY[]::TEXT[];
    v_categoria_temp TEXT;
    v_cidade_temp TEXT;
BEGIN
    v_now := NOW();
    
    v_nome_campanha := COALESCE(
        p_nome_campanha,
        'Campanha de ' || array_length(p_empresa_ids, 1)::TEXT || ' empresas - ' || 
        to_char(v_now, 'DD/MM/YYYY HH24:MI')
    );

    -- ANALISAR EMPRESAS SELECIONADAS ANTES DE PROCESSAR
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
        WHERE id = ANY(p_empresa_ids)
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
    v_empresas_resumo := array_length(p_empresa_ids, 1)::TEXT || ' empresas';
    IF array_length(v_categorias_encontradas, 1) > 0 THEN
        v_empresas_resumo := v_empresas_resumo || ' (' || array_to_string(v_categorias_encontradas, ', ') || ')';
    END IF;
    IF array_length(v_cidades_encontradas, 1) > 0 THEN
        v_empresas_resumo := v_empresas_resumo || ' em ' || array_to_string(v_cidades_encontradas, ', ');
    END IF;

    -- CRIAR CAMPANHA COM DADOS COMPLETOS
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
        atualizado_em
    ) VALUES (
        v_nome_campanha,
        'Disparo automático via sistema',
        'whatsapp',
        'em_andamento',
        array_length(p_empresa_ids, 1),
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
        v_now
    );

    -- PROCESSAR AGENDAMENTOS (mantendo a estrutura atual)
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
    LOOP
        BEGIN
            v_agendado := v_now + (v_contador * p_delay_segundos * interval '1 second');
            
            -- Formatar telefone para WhatsApp (mantendo a lógica atual)
            IF v_empresa.telefone IS NOT NULL THEN
                -- Remover espaços, parênteses e traços
                v_empresa.telefone := regexp_replace(v_empresa.telefone, '[\(\)\s\-]', '', 'g');
                
                -- Remover caracteres não numéricos exceto +
                v_empresa.telefone := regexp_replace(v_empresa.telefone, '[^0-9\+]', '', 'g');
                
                -- Adicionar código do país se não existir
                IF NOT v_empresa.telefone LIKE '55%' THEN
                    v_empresa.telefone := '55' || v_empresa.telefone;
                END IF;
                
                -- Adicionar sufixo do WhatsApp
                v_empresa.telefone := v_empresa.telefone || '@s.whatsapp.net';
            END IF;

            -- INSERIR DISPARO AGENDADO COM ORDEM E FASE (mantendo a estrutura atual)
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
                criado_em
            ) VALUES (
                v_empresa.id,
                COALESCE(v_empresa.nome, 'Empresa ' || v_empresa.id::TEXT),
                v_empresa.telefone,
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
                v_now
            );



            v_tasks_criadas := v_tasks_criadas + 1;
            v_contador := v_contador + 1;

        EXCEPTION WHEN OTHERS THEN
            v_erros := array_append(v_erros, 'Erro ao agendar para empresa ' || COALESCE(v_empresa.nome, 'ID ' || v_empresa.id::TEXT) || ': ' || SQLERRM);
            

        END;
    END LOOP;



    -- Retornar resultado com análises
    v_resultado := json_build_object(
        'success', v_tasks_criadas > 0,
        'tasks_criadas', v_tasks_criadas,
        'total_empresas', array_length(p_empresa_ids, 1),
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
        END
    );

    RETURN v_resultado;
END;
$$; 