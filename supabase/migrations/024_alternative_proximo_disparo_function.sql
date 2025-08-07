-- Versão alternativa da função proximo_disparo
CREATE OR REPLACE FUNCTION proximo_disparo_alt()
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
  agendado_para TIMESTAMPTZ,
  criado_em TIMESTAMPTZ,
  conexao_id TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_task RECORD;
  v_now TIMESTAMPTZ;
  v_debug_info TEXT;
BEGIN
  -- Pegar hora atual com timezone
  v_now := NOW();
  
  -- Debug info
  v_debug_info := 'Hora atual: ' || v_now || ', Timezone: ' || current_setting('TIMEZONE');
  RAISE NOTICE 'Debug: %', v_debug_info;
  
  -- Buscar o próximo disparo disponível (sem condição de tempo para teste)
  SELECT t.id, t.empresa_id, t.empresa_nome, t.empresa_telefone, 
         t.empresa_website, t.empresa_endereco, t.mensagem, t.tipo_midia, 
         t.midia_url, t.status, t.agendado_para, t.criado_em, t.conexao_id
  INTO v_next_task
  FROM public.disparos_agendados t
  WHERE t.status = 'pendente'
    -- Remover condição de tempo temporariamente para debug
    -- AND t.agendado_para <= now()
  ORDER BY 
    t.fase ASC,
    t.ordem ASC,
    t.agendado_para ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- Debug: Verificar se encontrou disparo
  IF v_next_task.id IS NOT NULL THEN
    RAISE NOTICE 'Debug: Encontrou disparo ID: %, Empresa: %, Agendado para: %, Hora atual: %', 
                 v_next_task.id, v_next_task.empresa_nome, v_next_task.agendado_para, v_now;
    
    -- Verificar se o disparo está no passado
    IF v_next_task.agendado_para <= v_now THEN
      RAISE NOTICE 'Debug: Disparo está no passado, processando...';
    ELSE
      RAISE NOTICE 'Debug: Disparo está no futuro, mas processando mesmo assim para teste';
    END IF;
  ELSE
    RAISE NOTICE 'Debug: Nenhum disparo pendente encontrado';
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
      v_next_task.agendado_para,
      v_next_task.criado_em,
      v_next_task.conexao_id;
  END IF;

  RETURN;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION proximo_disparo_alt() IS 'Versão alternativa da função proximo_disparo sem condição de tempo para debug.';

-- Função para verificar timezone e datas
CREATE OR REPLACE FUNCTION verificar_timezone_datas()
RETURNS TABLE (
    hora_atual TIMESTAMPTZ,
    timezone_atual TEXT,
    disparos_pendentes JSON,
    disparos_passado JSON
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_hora_atual TIMESTAMPTZ;
    v_timezone_atual TEXT;
    v_disparos_pendentes JSON;
    v_disparos_passado JSON;
BEGIN
    v_hora_atual := NOW();
    v_timezone_atual := current_setting('TIMEZONE');
    
    -- Buscar disparos pendentes
    SELECT json_agg(
        json_build_object(
            'id', t.id,
            'empresa_nome', t.empresa_nome,
            'agendado_para', t.agendado_para,
            'diferenca_horas', EXTRACT(EPOCH FROM (v_hora_atual - t.agendado_para))/3600
        )
    ) INTO v_disparos_pendentes
    FROM (
        SELECT *
        FROM public.disparos_agendados
        WHERE status = 'pendente'
        ORDER BY agendado_para ASC
        LIMIT 5
    ) t;
    
    -- Buscar disparos no passado
    SELECT json_agg(
        json_build_object(
            'id', t.id,
            'empresa_nome', t.empresa_nome,
            'agendado_para', t.agendado_para,
            'diferenca_horas', EXTRACT(EPOCH FROM (v_hora_atual - t.agendado_para))/3600
        )
    ) INTO v_disparos_passado
    FROM (
        SELECT *
        FROM public.disparos_agendados
        WHERE status = 'pendente'
          AND agendado_para <= v_hora_atual
        ORDER BY agendado_para ASC
        LIMIT 5
    ) t;
    
    RETURN QUERY
    SELECT 
        v_hora_atual,
        v_timezone_atual,
        COALESCE(v_disparos_pendentes, '[]'::JSON),
        COALESCE(v_disparos_passado, '[]'::JSON);
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION verificar_timezone_datas() IS 'Função para verificar timezone e datas dos disparos.'; 