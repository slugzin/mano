-- Funções para diagnosticar disparos futuros e problemas de data
CREATE OR REPLACE FUNCTION debug_disparos_futuros()
RETURNS TABLE (
    total_disparos INTEGER,
    disparos_pendentes INTEGER,
    disparos_passado INTEGER,
    disparos_futuro INTEGER,
    hora_atual TEXT,
    proximo_disparo_futuro TEXT,
    disparos_futuros_detalhes JSON
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_disparos INTEGER;
    v_disparos_pendentes INTEGER;
    v_disparos_passado INTEGER;
    v_disparos_futuro INTEGER;
    v_hora_atual TIMESTAMPTZ;
    v_proximo_disparo_futuro TEXT;
    v_disparos_futuros_detalhes JSON;
BEGIN
    v_hora_atual := NOW();
    
    -- Contar total de disparos
    SELECT COUNT(*) INTO v_total_disparos
    FROM public.disparos_agendados;
    
    -- Contar disparos pendentes
    SELECT COUNT(*) INTO v_disparos_pendentes
    FROM public.disparos_agendados
    WHERE status = 'pendente';
    
    -- Contar disparos agendados para o passado
    SELECT COUNT(*) INTO v_disparos_passado
    FROM public.disparos_agendados
    WHERE status = 'pendente'
      AND agendado_para <= v_hora_atual;
    
    -- Contar disparos agendados para o futuro
    SELECT COUNT(*) INTO v_disparos_futuro
    FROM public.disparos_agendados
    WHERE status = 'pendente'
      AND agendado_para > v_hora_atual;
    
    -- Buscar próximo disparo futuro
    SELECT 
        json_build_object(
            'id', id,
            'empresa_nome', empresa_nome,
            'agendado_para', agendado_para::TEXT,
            'dias_ate_disparo', EXTRACT(EPOCH FROM (agendado_para - v_hora_atual))/86400
        )::TEXT
    INTO v_proximo_disparo_futuro
    FROM public.disparos_agendados
    WHERE status = 'pendente'
      AND agendado_para > v_hora_atual
    ORDER BY agendado_para ASC
    LIMIT 1;
    
    -- Buscar detalhes dos disparos futuros
    SELECT json_agg(
        json_build_object(
            'id', id,
            'empresa_nome', empresa_nome,
            'agendado_para', agendado_para::TEXT,
            'dias_ate_disparo', EXTRACT(EPOCH FROM (agendado_para - v_hora_atual))/86400,
            'status', status
        )
    ) INTO v_disparos_futuros_detalhes
    FROM (
        SELECT id, empresa_nome, agendado_para, status
        FROM public.disparos_agendados
        WHERE status = 'pendente'
          AND agendado_para > v_hora_atual
        ORDER BY agendado_para ASC
        LIMIT 10
    ) t;
    
    RETURN QUERY
    SELECT 
        v_total_disparos,
        v_disparos_pendentes,
        v_disparos_passado,
        v_disparos_futuro,
        v_hora_atual::TEXT,
        COALESCE(v_proximo_disparo_futuro, 'Nenhum'),
        COALESCE(v_disparos_futuros_detalhes, '[]'::JSON);
END;
$$;

-- Função para verificar todos os disparos pendentes (sem filtro de data)
CREATE OR REPLACE FUNCTION verificar_todos_disparos_pendentes()
RETURNS TABLE (
    id TEXT,
    empresa_nome TEXT,
    empresa_telefone TEXT,
    status_disparo TEXT,
    agendado_para_disparo TEXT,
    fase_disparo TEXT,
    ordem_disparo INTEGER,
    dias_ate_disparo NUMERIC
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_hora_atual TIMESTAMPTZ;
BEGIN
    v_hora_atual := NOW();
    
    RETURN QUERY
    SELECT 
        t.id::TEXT,
        t.empresa_nome,
        t.empresa_telefone,
        t.status as status_disparo,
        t.agendado_para::TEXT as agendado_para_disparo,
        t.fase as fase_disparo,
        t.ordem as ordem_disparo,
        EXTRACT(EPOCH FROM (t.agendado_para - v_hora_atual))/86400 as dias_ate_disparo
    FROM public.disparos_agendados t
    WHERE t.status = 'pendente'
    ORDER BY 
        t.agendado_para ASC;
END;
$$;

-- Função para testar a função proximo_disparo sem filtro de data
CREATE OR REPLACE FUNCTION proximo_disparo_sem_filtro_data()
RETURNS TABLE (
  id TEXT,
  empresa_id INTEGER,
  empresa_nome TEXT,
  empresa_telefone TEXT,
  empresa_website TEXT,
  empresa_endereco TEXT,
  mensagem TEXT,
  tipo_midia TEXT,
  midia_url TEXT,
  status TEXT,
  agendado_para TIMESTAMP,
  criado_em TIMESTAMP,
  conexao_id TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_task RECORD;
  v_debug_count INTEGER;
BEGIN
  -- Debug: Contar disparos pendentes (sem filtro de data)
  SELECT COUNT(*) INTO v_debug_count
  FROM public.disparos_agendados
  WHERE status = 'pendente';
  
  -- Log de debug
  RAISE NOTICE 'Debug: Total disparos pendentes: %', v_debug_count;
  
  -- Buscar o próximo disparo disponível (sem filtro de data)
  SELECT t.id, t.empresa_id, t.empresa_nome, t.empresa_telefone, 
         t.empresa_website, t.empresa_endereco, t.mensagem, t.tipo_midia, 
         t.midia_url, t.status, t.agendado_para, t.criado_em, t.conexao_id
  INTO v_next_task
  FROM public.disparos_agendados t
  WHERE t.status = 'pendente'
  ORDER BY 
    t.fase ASC,
    t.ordem ASC,
    t.agendado_para ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- Debug: Verificar se encontrou disparo
  IF v_next_task.id IS NOT NULL THEN
    RAISE NOTICE 'Debug: Encontrou disparo ID: %, Empresa: %, Agendado para: %', 
                 v_next_task.id, v_next_task.empresa_nome, v_next_task.agendado_para;
  ELSE
    RAISE NOTICE 'Debug: Nenhum disparo encontrado';
  END IF;

  -- Se encontrou um disparo, atualizar o status e retornar
  IF v_next_task.id IS NOT NULL THEN
    -- Atualizar o status para 'processando'
    UPDATE public.disparos_agendados 
    SET status = 'processando'
    WHERE id = v_next_task.id;

    RAISE NOTICE 'Debug: Status atualizado para processando';

    -- Retornar os dados do disparo
    RETURN QUERY
    SELECT 
      v_next_task.id::TEXT,
      v_next_task.empresa_id,
      v_next_task.empresa_nome,
      v_next_task.empresa_telefone,
      v_next_task.empresa_website,
      v_next_task.empresa_endereco,
      v_next_task.mensagem,
      v_next_task.tipo_midia,
      v_next_task.midia_url,
      'processando'::TEXT,
      v_next_task.agendado_para::TIMESTAMP,
      v_next_task.criado_em::TIMESTAMP,
      v_next_task.conexao_id;
  END IF;

  -- Se não encontrou nenhum disparo, retornar vazio
  RETURN;
END;
$$;

-- Função para verificar timezone e configurações
CREATE OR REPLACE FUNCTION verificar_timezone_config()
RETURNS TABLE (
    configuracao TEXT,
    valor TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 'Timezone do servidor'::TEXT, current_setting('timezone')::TEXT
    UNION ALL
    SELECT 'Hora atual (NOW())'::TEXT, NOW()::TEXT
    UNION ALL
    SELECT 'Hora atual (CURRENT_TIMESTAMP)'::TEXT, CURRENT_TIMESTAMP::TEXT
    UNION ALL
    SELECT 'Hora atual (LOCALTIMESTAMP)'::TEXT, LOCALTIMESTAMP::TEXT
    UNION ALL
    SELECT 'Timezone do cliente'::TEXT, current_setting('TimeZone')::TEXT;
END;
$$;

-- Comentários explicativos
COMMENT ON FUNCTION debug_disparos_futuros() IS 'Função para diagnosticar disparos futuros e problemas de data.';
COMMENT ON FUNCTION verificar_todos_disparos_pendentes() IS 'Função para verificar todos os disparos pendentes sem filtro de data.';
COMMENT ON FUNCTION proximo_disparo_sem_filtro_data() IS 'Função proximo_disparo sem filtro de data para teste.';
COMMENT ON FUNCTION verificar_timezone_config() IS 'Função para verificar configurações de timezone.'; 