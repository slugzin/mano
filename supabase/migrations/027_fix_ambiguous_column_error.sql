-- Corrigir função test_disparos_pendentes com erro de coluna ambígua
DROP FUNCTION IF EXISTS test_disparos_pendentes();

CREATE OR REPLACE FUNCTION test_disparos_pendentes()
RETURNS TABLE (
  id TEXT,
  empresa_id INTEGER,
  empresa_nome TEXT,
  empresa_telefone TEXT,
  status_disparo TEXT,
  agendado_para TIMESTAMPTZ,
  fase TEXT,
  ordem INTEGER,
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
    t.status as status_disparo,  -- Especificar alias para evitar ambiguidade
    t.agendado_para,
    t.fase,
    t.ordem,
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
COMMENT ON FUNCTION test_disparos_pendentes() IS 'Função de teste para verificar disparos pendentes - versão corrigida.';

-- Criar versão mais robusta da função proximo_disparo
DROP FUNCTION IF EXISTS proximo_disparo();

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
  v_now TIMESTAMPTZ;
  v_debug_count INTEGER;
BEGIN
  -- Pegar hora atual
  v_now := NOW();
  
  -- Debug: Contar disparos pendentes
  SELECT COUNT(*) INTO v_debug_count
  FROM public.disparos_agendados
  WHERE status = 'pendente'
    AND agendado_para <= v_now;
  
  -- Log de debug
  RAISE NOTICE 'Debug: Hora atual: %, Disparos pendentes no passado: %', v_now, v_debug_count;
  
  -- Buscar o próximo disparo disponível
  SELECT t.id, t.empresa_id, t.empresa_nome, t.empresa_telefone, 
         t.empresa_website, t.empresa_endereco, t.mensagem, t.tipo_midia, 
         t.midia_url, t.status, t.agendado_para, t.criado_em, t.conexao_id
  INTO v_next_task
  FROM public.disparos_agendados t
  WHERE t.status = 'pendente'
    AND t.agendado_para <= v_now
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
      v_next_task.agendado_para,
      v_next_task.criado_em,
      v_next_task.conexao_id;
  END IF;

  -- Se não encontrou nenhum disparo, retornar vazio
  RETURN;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION proximo_disparo() IS 'Função RPC corrigida que retorna o próximo disparo agendado com debug.';

-- Função para verificar disparos com detalhes completos
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
            'status', t.status,
            'agendado_para', t.agendado_para,
            'fase', t.fase,
            'ordem', t.ordem,
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
COMMENT ON FUNCTION verificar_disparos_detalhado() IS 'Função para verificação detalhada dos disparos com informações completas.'; 