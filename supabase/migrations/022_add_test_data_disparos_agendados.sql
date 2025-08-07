-- Função para inserir dados de teste na tabela disparos_agendados
CREATE OR REPLACE FUNCTION inserir_disparo_teste(
    p_empresa_id INTEGER DEFAULT 537,
    p_empresa_nome TEXT DEFAULT 'Restaurante Teste',
    p_empresa_telefone TEXT DEFAULT '554131560967@s.whatsapp.net',
    p_mensagem TEXT DEFAULT 'Oi, tudo bem? Esta é uma mensagem de teste.',
    p_conexao_id TEXT DEFAULT 'Tech Leads',
    p_fase TEXT DEFAULT 'fase_1',
    p_ordem INTEGER DEFAULT 1
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_id TEXT;
    v_now TIMESTAMPTZ;
BEGIN
    v_now := NOW();
    
    -- Inserir disparo de teste
    INSERT INTO public.disparos_agendados (
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
        created_at,
        updated_at
    ) VALUES (
        p_empresa_id,
        p_empresa_nome,
        p_empresa_telefone,
        'https://exemplo.com',
        'R. Teste, 123 - Centro, Curitiba - PR',
        p_mensagem,
        'nenhum',
        NULL,
        'pendente',
        v_now, -- Agendado para agora
        p_conexao_id,
        p_ordem,
        p_fase,
        v_now,
        v_now,
        v_now
    ) RETURNING id::TEXT INTO v_id;
    
    RETURN 'Disparo de teste criado com ID: ' || v_id;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION inserir_disparo_teste() IS 'Função para inserir dados de teste na tabela disparos_agendados.';

-- Função para limpar dados de teste
CREATE OR REPLACE FUNCTION limpar_disparos_teste()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.disparos_agendados 
    WHERE empresa_nome LIKE '%Teste%'
       OR empresa_nome LIKE '%Restaurante Teste%';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION limpar_disparos_teste() IS 'Função para limpar disparos de teste da tabela disparos_agendados.';

-- Função para verificar se há disparos pendentes
CREATE OR REPLACE FUNCTION verificar_disparos_pendentes()
RETURNS TABLE (
    total_pendentes INTEGER,
    proximos_5_disparos JSON
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_pendentes INTEGER;
    v_proximos_disparos JSON;
BEGIN
    -- Contar total de disparos pendentes
    SELECT COUNT(*) INTO v_total_pendentes
    FROM public.disparos_agendados
    WHERE status = 'pendente'
      AND agendado_para <= now();
    
    -- Buscar os próximos 5 disparos pendentes
    SELECT json_agg(
        json_build_object(
            'id', t.id,
            'empresa_nome', t.empresa_nome,
            'empresa_telefone', t.empresa_telefone,
            'mensagem', t.mensagem,
            'status', t.status,
            'agendado_para', t.agendado_para,
            'fase', t.fase,
            'ordem', t.ordem
        )
    ) INTO v_proximos_disparos
    FROM (
        SELECT *
        FROM public.disparos_agendados
        WHERE status = 'pendente'
          AND agendado_para <= now()
        ORDER BY 
            fase ASC,
            ordem ASC,
            agendado_para ASC
        LIMIT 5
    ) t;
    
    RETURN QUERY
    SELECT 
        v_total_pendentes,
        COALESCE(v_proximos_disparos, '[]'::JSON);
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION verificar_disparos_pendentes() IS 'Função para verificar disparos pendentes e retornar informações detalhadas.'; 