-- Função de teste para verificar disparos pendentes
CREATE OR REPLACE FUNCTION test_disparos_pendentes()
RETURNS TABLE (
  id TEXT,
  empresa_id INTEGER,
  empresa_nome TEXT,
  empresa_telefone TEXT,
  status TEXT,
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
    t.status,
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
COMMENT ON FUNCTION test_disparos_pendentes() IS 'Função de teste para verificar disparos pendentes e debug da função proximo_disparo.';

-- Função para limpar disparos em processamento (útil para debug)
CREATE OR REPLACE FUNCTION reset_disparos_processando()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.disparos_agendados 
  SET status = 'pendente'
  WHERE status = 'processando';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION reset_disparos_processando() IS 'Função para resetar disparos que ficaram em status processando (útil para debug).'; 