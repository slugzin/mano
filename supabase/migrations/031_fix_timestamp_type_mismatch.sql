-- Corrigir incompatibilidade de tipos de timestamp
DROP FUNCTION IF EXISTS test_disparos_pendentes();

CREATE OR REPLACE FUNCTION test_disparos_pendentes()
RETURNS TABLE (
  id TEXT,
  empresa_id INTEGER,
  empresa_nome TEXT,
  empresa_telefone TEXT,
  status_disparo TEXT,
  agendado_para_disparo TIMESTAMP,  -- Mudado de TIMESTAMPTZ para TIMESTAMP
  fase_disparo TEXT,
  ordem_disparo INTEGER,
  total_pendentes INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_pendentes INTEGER;
BEGIN
  -- Contar total de disparos pendentes
  SELECT COUNT(*) INTO v_total_pendentes
  FROM public.disparos_agendados
  WHERE status = 'pendente'
    AND agendado_para <= now();

  -- Retornar os próximos 5 disparos pendentes para debug
  RETURN QUERY
  SELECT 
    t.id::TEXT,
    t.empresa_id,
    t.empresa_nome,
    t.empresa_telefone,
    t.status as status_disparo,
    t.agendado_para::TIMESTAMP as agendado_para_disparo,  -- Converter para TIMESTAMP
    t.fase as fase_disparo,
    t.ordem as ordem_disparo,
    v_total_pendentes
  FROM public.disparos_agendados t
  WHERE t.status = 'pendente'
    AND t.agendado_para <= now()
  ORDER BY 
    t.fase ASC,
    t.ordem ASC,
    t.agendado_para ASC
  LIMIT 5;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION test_disparos_pendentes() IS 'Função de teste para verificar disparos pendentes - versão corrigida com tipos de timestamp compatíveis.';

-- Corrigir função debug_disparos_pendentes também
DROP FUNCTION IF EXISTS debug_disparos_pendentes();

CREATE OR REPLACE FUNCTION debug_disparos_pendentes()
RETURNS TABLE (
    total_pendentes INTEGER,
    total_agendados_passado INTEGER,
    proximos_disparos JSON,
    debug_info TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_pendentes INTEGER;
    v_total_agendados_passado INTEGER;
    v_proximos_disparos JSON;
    v_debug_info TEXT;
BEGIN
    -- Contar total de disparos pendentes
    SELECT COUNT(*) INTO v_total_pendentes
    FROM public.disparos_agendados
    WHERE status = 'pendente';
    
    -- Contar disparos agendados para o passado
    SELECT COUNT(*) INTO v_total_agendados_passado
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
            'status_disparo', t.status,
            'agendado_para_disparo', t.agendado_para::TEXT,  -- Converter para TEXT para evitar problemas de tipo
            'fase_disparo', t.fase,
            'ordem_disparo', t.ordem,
            'agendado_passado', CASE WHEN t.agendado_para <= now() THEN true ELSE false END
        )
    ) INTO v_proximos_disparos
    FROM (
        SELECT *
        FROM public.disparos_agendados
        WHERE status = 'pendente'
        ORDER BY 
            fase ASC,
            ordem ASC,
            agendado_para ASC
        LIMIT 5
    ) t;
    
    -- Criar info de debug
    v_debug_info := 'Total pendentes: ' || v_total_pendentes || 
                   ', Agendados para passado: ' || v_total_agendados_passado ||
                   ', Hora atual: ' || now()::TEXT;
    
    RETURN QUERY
    SELECT 
        v_total_pendentes,
        v_total_agendados_passado,
        COALESCE(v_proximos_disparos, '[]'::JSON),
        v_debug_info;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION debug_disparos_pendentes() IS 'Função para debug detalhado dos disparos pendentes - versão corrigida com tipos compatíveis.';

-- Função para verificar tipos de colunas na tabela
CREATE OR REPLACE FUNCTION verificar_tipos_colunas()
RETURNS TABLE (
    coluna_nome TEXT,
    tipo_dados TEXT,
    eh_nullable TEXT,
    valor_padrao TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT,
        COALESCE(c.column_default, 'NULL')::TEXT
    FROM information_schema.columns c
    WHERE c.table_name = 'disparos_agendados'
      AND c.table_schema = 'public'
      AND c.column_name IN ('agendado_para', 'criado_em', 'created_at', 'updated_at')
    ORDER BY c.ordinal_position;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION verificar_tipos_colunas() IS 'Função para verificar os tipos de colunas de timestamp na tabela disparos_agendados.';

-- Função para testar conversão de tipos
CREATE OR REPLACE FUNCTION test_conversao_timestamp()
RETURNS TABLE (
    agendado_para_original TEXT,
    agendado_para_timestamp TEXT,
    agendado_para_timestamptz TEXT,
    hora_atual TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_agendado_para TIMESTAMP;
    v_hora_atual TIMESTAMPTZ;
BEGIN
    v_hora_atual := NOW();
    
    -- Buscar um disparo para teste
    SELECT agendado_para INTO v_agendado_para
    FROM public.disparos_agendados
    WHERE status = 'pendente'
    LIMIT 1;
    
    RETURN QUERY
    SELECT 
        COALESCE(v_agendado_para::TEXT, 'NULL') as agendado_para_original,
        COALESCE(v_agendado_para::TIMESTAMP::TEXT, 'NULL') as agendado_para_timestamp,
        COALESCE(v_agendado_para::TIMESTAMPTZ::TEXT, 'NULL') as agendado_para_timestamptz,
        v_hora_atual::TEXT as hora_atual;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION test_conversao_timestamp() IS 'Função para testar conversões de tipos de timestamp.'; 