-- Corrigir função test_disparos_pendentes com todas as colunas específicas
DROP FUNCTION IF EXISTS test_disparos_pendentes();

CREATE OR REPLACE FUNCTION test_disparos_pendentes()
RETURNS TABLE (
  id TEXT,
  empresa_id INTEGER,
  empresa_nome TEXT,
  empresa_telefone TEXT,
  status_disparo TEXT,
  agendado_para_disparo TIMESTAMPTZ,
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
    t.agendado_para as agendado_para_disparo,
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
COMMENT ON FUNCTION test_disparos_pendentes() IS 'Função de teste para verificar disparos pendentes - versão corrigida sem ambiguidade.';

-- Corrigir função debug_disparos_pendentes
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
            'agendado_para_disparo', t.agendado_para,
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
                   ', Hora atual: ' || now();
    
    RETURN QUERY
    SELECT 
        v_total_pendentes,
        v_total_agendados_passado,
        COALESCE(v_proximos_disparos, '[]'::JSON),
        v_debug_info;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION debug_disparos_pendentes() IS 'Função para debug detalhado dos disparos pendentes - versão corrigida.';

-- Corrigir função verificar_disparos_detalhado
DROP FUNCTION IF EXISTS verificar_disparos_detalhado();

CREATE OR REPLACE FUNCTION verificar_disparos_detalhado()
RETURNS TABLE (
    total_pendentes INTEGER,
    total_agendados_passado INTEGER,
    hora_atual TIMESTAMPTZ,
    timezone_atual TEXT,
    disparos_info JSON
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_pendentes INTEGER;
    v_total_agendados_passado INTEGER;
    v_hora_atual TIMESTAMPTZ;
    v_timezone_atual TEXT;
    v_disparos_info JSON;
BEGIN
    v_hora_atual := NOW();
    v_timezone_atual := current_setting('TIMEZONE');
    
    -- Contar total de disparos pendentes
    SELECT COUNT(*) INTO v_total_pendentes
    FROM public.disparos_agendados
    WHERE status = 'pendente';
    
    -- Contar disparos agendados para o passado
    SELECT COUNT(*) INTO v_total_agendados_passado
    FROM public.disparos_agendados
    WHERE status = 'pendente'
      AND agendado_para <= v_hora_atual;
    
    -- Buscar informações detalhadas dos disparos
    SELECT json_agg(
        json_build_object(
            'id', t.id,
            'empresa_nome', t.empresa_nome,
            'empresa_telefone', t.empresa_telefone,
            'status_disparo', t.status,
            'agendado_para_disparo', t.agendado_para,
            'fase_disparo', t.fase,
            'ordem_disparo', t.ordem,
            'diferenca_horas', EXTRACT(EPOCH FROM (v_hora_atual - t.agendado_para))/3600,
            'esta_no_passado', CASE WHEN t.agendado_para <= v_hora_atual THEN true ELSE false END
        )
    ) INTO v_disparos_info
    FROM (
        SELECT *
        FROM public.disparos_agendados
        WHERE status = 'pendente'
        ORDER BY 
            fase ASC,
            ordem ASC,
            agendado_para ASC
        LIMIT 10
    ) t;
    
    RETURN QUERY
    SELECT 
        v_total_pendentes,
        v_total_agendados_passado,
        v_hora_atual,
        v_timezone_atual,
        COALESCE(v_disparos_info, '[]'::JSON);
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION verificar_disparos_detalhado() IS 'Função para verificação detalhada dos disparos com informações completas - versão corrigida.';

-- Função simples para testar sem ambiguidade
CREATE OR REPLACE FUNCTION test_basico_disparos()
RETURNS TABLE (
    total_pendentes INTEGER,
    primeiro_id TEXT,
    primeiro_empresa TEXT,
    primeiro_agendado TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_pendentes INTEGER;
    v_primeiro RECORD;
BEGIN
    -- Contar disparos pendentes
    SELECT COUNT(*) INTO v_total_pendentes
    FROM public.disparos_agendados
    WHERE status = 'pendente';
    
    -- Buscar primeiro disparo
    SELECT id, empresa_nome, agendado_para
    INTO v_primeiro
    FROM public.disparos_agendados
    WHERE status = 'pendente'
    ORDER BY agendado_para ASC
    LIMIT 1;
    
    RETURN QUERY
    SELECT 
        v_total_pendentes,
        COALESCE(v_primeiro.id::TEXT, 'NENHUM'),
        COALESCE(v_primeiro.empresa_nome, 'NENHUMA'),
        COALESCE(v_primeiro.agendado_para, '1900-01-01'::TIMESTAMPTZ);
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION test_basico_disparos() IS 'Função básica para testar disparos sem ambiguidade.'; 