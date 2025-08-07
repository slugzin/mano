-- Corrigir função proximo_disparo_simples para usar o user_id correto
DROP FUNCTION IF EXISTS proximo_disparo_simples(UUID);

CREATE OR REPLACE FUNCTION proximo_disparo_simples(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id INTEGER,
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
SECURITY DEFINER
AS $$
DECLARE
  v_next_task RECORD;
  v_now TIMESTAMP;
  v_debug_count INTEGER;
  v_api_key TEXT;
  v_user_id UUID;
BEGIN
  -- Pegar hora atual
  v_now := NOW()::TIMESTAMP;
  
  -- Determinar user_id
  IF p_user_id IS NOT NULL THEN
    -- Se user_id foi fornecido como parâmetro, usar ele
    v_user_id := p_user_id;
    RAISE NOTICE 'Debug: Usando user_id fornecido como parâmetro: %', v_user_id;
  ELSE
    -- Verificar se a requisição tem uma chave de API válida
    v_api_key := current_setting('request.headers', true)::json->>'x-api-key';
    
    -- Se não tiver chave de API, usar um user_id padrão para n8n
    IF v_api_key IS NULL OR v_api_key = '' THEN
      v_user_id := '0f1cba67-cd50-48dc-993c-b606006f2a2a'::UUID; -- User ID do exemplo
      RAISE NOTICE 'Debug: Usando user_id padrão para n8n: %', v_user_id;
    ELSE
      -- Se tiver chave de API, você pode implementar lógica específica aqui
      -- Por enquanto, usar o mesmo user_id
      v_user_id := '0f1cba67-cd50-48dc-993c-b606006f2a2a'::UUID; -- User ID do exemplo
      RAISE NOTICE 'Debug: Chave de API fornecida, user_id: %', v_user_id;
    END IF;
  END IF;
  
  -- Debug: Contar disparos pendentes do usuário
  SELECT COUNT(*) INTO v_debug_count
  FROM public.disparos_agendados
  WHERE public.disparos_agendados.status = 'pendente'
    AND public.disparos_agendados.user_id = v_user_id
    AND public.disparos_agendados.agendado_para <= v_now;
  
  -- Log de debug
  RAISE NOTICE 'Debug: Hora atual: %, User ID: %, Disparos pendentes: %', v_now, v_user_id, v_debug_count;
  
  -- Buscar o próximo disparo disponível (apenas do usuário específico)
  SELECT t.id, t.empresa_id, t.empresa_nome, t.empresa_telefone, 
         t.empresa_website, t.empresa_endereco, t.mensagem, t.tipo_midia, 
         t.midia_url, t.status, t.agendado_para, t.criado_em, t.conexao_id
  INTO v_next_task
  FROM public.disparos_agendados t
  WHERE t.status = 'pendente'
    AND t.user_id = v_user_id  -- Apenas disparos do usuário específico
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
    RAISE NOTICE 'Debug: Nenhum disparo encontrado para o usuário %', v_user_id;
  END IF;

  -- Se encontrou um disparo, atualizar o status e retornar
  IF v_next_task.id IS NOT NULL THEN
    -- Atualizar o status para 'processando' (apenas do usuário específico)
    UPDATE public.disparos_agendados 
    SET status = 'processando'
    WHERE id = v_next_task.id
      AND user_id = v_user_id;  -- Garantir que só atualiza disparos próprios

    RAISE NOTICE 'Debug: Status atualizado para processando';

    -- Retornar os dados do disparo
    RETURN QUERY
    SELECT 
      v_next_task.id,
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

-- Comentário explicativo da função
COMMENT ON FUNCTION proximo_disparo_simples(UUID) IS 'Função RPC simplificada para n8n que aceita user_id como parâmetro. Corrigida para usar o user_id correto.';

-- Log das alterações
DO $$
BEGIN
  RAISE NOTICE 'Função proximo_disparo_simples corrigida - agora usa o user_id correto';
  RAISE NOTICE 'User ID padrão alterado para: 0f1cba67-cd50-48dc-993c-b606006f2a2a';
END $$; 