-- Versão da função proximo_disparo que permite disparos futuros
CREATE OR REPLACE FUNCTION proximo_disparo_com_futuros()
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
  -- Debug: Contar disparos pendentes (incluindo futuros)
  SELECT COUNT(*) INTO v_debug_count
  FROM public.disparos_agendados
  WHERE status = 'pendente';
  
  -- Log de debug
  RAISE NOTICE 'Debug: Total disparos pendentes (incluindo futuros): %', v_debug_count;
  
  -- Buscar o próximo disparo disponível (incluindo futuros)
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

-- Função para criar disparo de teste com data atual
CREATE OR REPLACE FUNCTION criar_disparo_teste_atual()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_id TEXT;
    v_hora_atual TIMESTAMP;
BEGIN
    v_hora_atual := NOW()::TIMESTAMP;
    
    -- Inserir disparo de teste com data atual
    INSERT INTO public.disparos_agendados (
        id, empresa_id, empresa_nome, empresa_telefone, empresa_website, 
        empresa_endereco, mensagem, tipo_midia, midia_url, status, 
        agendado_para, criado_em, conexao_id, ordem, fase, user_id
    ) VALUES (
        'TESTE_' || EXTRACT(EPOCH FROM NOW())::TEXT,
        999,
        'Empresa Teste - Disparo Atual',
        '5511999999999@s.whatsapp.net',
        'https://teste.com',
        'Endereço Teste',
        'Mensagem de teste - disparo atual',
        'nenhum',
        NULL,
        'pendente',
        v_hora_atual,  -- Data atual
        v_hora_atual,
        'Teste Conexão',
        1,
        'fase_1',
        'c4a948a1-a1cc-42ed-902c-a70c4959d3b7'
    ) RETURNING id INTO v_id;
    
    RETURN 'Disparo de teste criado com ID: ' || v_id || ' e data: ' || v_hora_atual::TEXT;
END;
$$;

-- Função para criar disparo de teste com data passada
CREATE OR REPLACE FUNCTION criar_disparo_teste_passado()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_id TEXT;
    v_hora_passada TIMESTAMP;
BEGIN
    v_hora_passada := (NOW() - INTERVAL '1 hour')::TIMESTAMP;
    
    -- Inserir disparo de teste com data passada
    INSERT INTO public.disparos_agendados (
        id, empresa_id, empresa_nome, empresa_telefone, empresa_website, 
        empresa_endereco, mensagem, tipo_midia, midia_url, status, 
        agendado_para, criado_em, conexao_id, ordem, fase, user_id
    ) VALUES (
        'TESTE_PASSADO_' || EXTRACT(EPOCH FROM NOW())::TEXT,
        998,
        'Empresa Teste - Disparo Passado',
        '5511888888888@s.whatsapp.net',
        'https://teste-passado.com',
        'Endereço Teste Passado',
        'Mensagem de teste - disparo passado',
        'nenhum',
        NULL,
        'pendente',
        v_hora_passada,  -- Data passada (1 hora atrás)
        v_hora_passada,
        'Teste Conexão Passado',
        1,
        'fase_1',
        'c4a948a1-a1cc-42ed-902c-a70c4959d3b7'
    ) RETURNING id INTO v_id;
    
    RETURN 'Disparo de teste passado criado com ID: ' || v_id || ' e data: ' || v_hora_passada::TEXT;
END;
$$;

-- Função para limpar disparos de teste
CREATE OR REPLACE FUNCTION limpar_disparos_teste()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.disparos_agendados 
    WHERE id LIKE 'TESTE_%';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN 'Disparos de teste removidos: ' || v_count;
END;
$$;

-- Comentários explicativos
COMMENT ON FUNCTION proximo_disparo_com_futuros() IS 'Versão da função proximo_disparo que permite disparos futuros.';
COMMENT ON FUNCTION criar_disparo_teste_atual() IS 'Função para criar disparo de teste com data atual.';
COMMENT ON FUNCTION criar_disparo_teste_passado() IS 'Função para criar disparo de teste com data passada.';
COMMENT ON FUNCTION limpar_disparos_teste() IS 'Função para limpar disparos de teste.'; 