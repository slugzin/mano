-- Versão simplificada da função proximo_disparo (sem condição de tempo)
CREATE OR REPLACE FUNCTION proximo_disparo_simple()
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
  
  -- Debug: Contar disparos pendentes (sem condição de tempo)
  SELECT COUNT(*) INTO v_debug_count
  FROM public.disparos_agendados
  WHERE status = 'pendente';
  
  -- Log de debug
  RAISE NOTICE 'Debug: Hora atual: %, Total disparos pendentes: %', v_now, v_debug_count;
  
  -- Buscar o próximo disparo disponível (SEM condição de tempo)
  SELECT t.id, t.empresa_id, t.empresa_nome, t.empresa_telefone, 
         t.empresa_website, t.empresa_endereco, t.mensagem, t.tipo_midia, 
         t.midia_url, t.status, t.agendado_para, t.criado_em, t.conexao_id
  INTO v_next_task
  FROM public.disparos_agendados t
  WHERE t.status = 'pendente'
    -- REMOVIDO: AND t.agendado_para <= v_now
  ORDER BY 
    t.fase ASC,
    t.ordem ASC,
    t.agendado_para ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- Debug: Verificar se encontrou disparo
  IF v_next_task.id IS NOT NULL THEN
    RAISE NOTICE 'Debug: Encontrou disparo ID: %, Empresa: %, Agendado para: %, Está no passado: %', 
                 v_next_task.id, v_next_task.empresa_nome, v_next_task.agendado_para,
                 CASE WHEN v_next_task.agendado_para <= v_now THEN 'SIM' ELSE 'NÃO' END;
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

  -- Se não encontrou nenhum disparo, retornar vazio
  RETURN;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION proximo_disparo_simple() IS 'Versão simplificada da função proximo_disparo sem condição de tempo para debug.';

-- Função para testar se há disparos pendentes simples
CREATE OR REPLACE FUNCTION test_disparos_simples()
RETURNS TABLE (
    total_pendentes INTEGER,
    primeiro_disparo_id TEXT,
    primeiro_disparo_empresa TEXT,
    primeiro_disparo_agendado TIMESTAMPTZ,
    hora_atual TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_pendentes INTEGER;
    v_primeiro_disparo RECORD;
    v_hora_atual TIMESTAMPTZ;
BEGIN
    v_hora_atual := NOW();
    
    -- Contar disparos pendentes
    SELECT COUNT(*) INTO v_total_pendentes
    FROM public.disparos_agendados
    WHERE status = 'pendente';
    
    -- Buscar primeiro disparo pendente
    SELECT id, empresa_nome, agendado_para
    INTO v_primeiro_disparo
    FROM public.disparos_agendados
    WHERE status = 'pendente'
    ORDER BY agendado_para ASC
    LIMIT 1;
    
    RETURN QUERY
    SELECT 
        v_total_pendentes,
        COALESCE(v_primeiro_disparo.id::TEXT, 'NENHUM'),
        COALESCE(v_primeiro_disparo.empresa_nome, 'NENHUMA'),
        COALESCE(v_primeiro_disparo.agendado_para, '1900-01-01'::TIMESTAMPTZ),
        v_hora_atual;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION test_disparos_simples() IS 'Função simples para testar se há disparos pendentes.';

-- Função para verificar se há problemas com RLS
CREATE OR REPLACE FUNCTION verificar_rls_disparos()
RETURNS TABLE (
    rls_ativado BOOLEAN,
    politicas_count INTEGER,
    pode_ler BOOLEAN,
    pode_escrever BOOLEAN
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_rls_ativado BOOLEAN;
    v_politicas_count INTEGER;
    v_pode_ler BOOLEAN;
    v_pode_escrever BOOLEAN;
BEGIN
    -- Verificar se RLS está ativo
    SELECT relrowsecurity INTO v_rls_ativado
    FROM pg_class
    WHERE relname = 'disparos_agendados';
    
    -- Contar políticas
    SELECT COUNT(*) INTO v_politicas_count
    FROM pg_policies
    WHERE tablename = 'disparos_agendados';
    
    -- Testar se pode ler
    BEGIN
        PERFORM 1 FROM public.disparos_agendados LIMIT 1;
        v_pode_ler := TRUE;
    EXCEPTION WHEN OTHERS THEN
        v_pode_ler := FALSE;
    END;
    
    -- Testar se pode escrever
    BEGIN
        UPDATE public.disparos_agendados SET status = status WHERE id = 'test';
        v_pode_escrever := TRUE;
    EXCEPTION WHEN OTHERS THEN
        v_pode_escrever := FALSE;
    END;
    
    RETURN QUERY
    SELECT 
        v_rls_ativado,
        v_politicas_count,
        v_pode_ler,
        v_pode_escrever;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION verificar_rls_disparos() IS 'Função para verificar se há problemas com RLS na tabela disparos_agendados.'; 