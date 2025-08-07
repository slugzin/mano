-- Remover função antiga primeiro
DROP FUNCTION IF EXISTS proximo_disparo();

-- Criar nova função RPC para pegar o próximo disparo - versão com debug
CREATE OR REPLACE FUNCTION proximo_disparo()
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
  v_total_pendentes INTEGER;
  v_total_agendados_passado INTEGER;
  v_debug_info TEXT;
BEGIN
  -- Debug: Contar disparos pendentes
  SELECT COUNT(*) INTO v_total_pendentes
  FROM public.disparos_agendados
  WHERE status = 'pendente';
  
  -- Debug: Contar disparos agendados para o passado
  SELECT COUNT(*) INTO v_total_agendados_passado
  FROM public.disparos_agendados
  WHERE status = 'pendente'
    AND agendado_para <= now();
  
  -- Log de debug
  RAISE NOTICE 'Debug: Total pendentes: %, Agendados para passado: %', v_total_pendentes, v_total_agendados_passado;
  
  -- Buscar o próximo disparo disponível
  SELECT t.id, t.empresa_id, t.empresa_nome, t.empresa_telefone, 
         t.empresa_website, t.empresa_endereco, t.mensagem, t.tipo_midia, 
         t.midia_url, t.status, t.agendado_para, t.criado_em, t.conexao_id
  INTO v_next_task
  FROM public.disparos_agendados t
  WHERE t.status = 'pendente'
    AND t.agendado_para <= now()
  ORDER BY 
    t.fase ASC,  -- Primeiro ordena por fase (fase_1, fase_2, etc.)
    t.ordem ASC, -- Depois por ordem dentro da fase (1, 2, 3, etc.)
    t.agendado_para ASC -- Por último por horário agendado
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
      'processando'::TEXT, -- Status atualizado
      v_next_task.agendado_para,
      v_next_task.criado_em,
      v_next_task.conexao_id;
  END IF;

  -- Se não encontrou nenhum disparo, retornar vazio
  RETURN;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION proximo_disparo() IS 'Função RPC que retorna o próximo disparo agendado com logs de debug.';

-- Função para verificar disparos pendentes com detalhes
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
            'status', t.status,
            'agendado_para', t.agendado_para,
            'fase', t.fase,
            'ordem', t.ordem,
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
COMMENT ON FUNCTION debug_disparos_pendentes() IS 'Função para debug detalhado dos disparos pendentes.'; 