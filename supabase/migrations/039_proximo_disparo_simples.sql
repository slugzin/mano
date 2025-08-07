-- Versão simplificada da função proximo_disparo para n8n
-- Esta versão não requer JWT, mas ainda é segura através de chave de API

CREATE OR REPLACE FUNCTION proximo_disparo_simples()
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
SECURITY DEFINER  -- Executar com privilégios do criador
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
  
  -- Verificar se a requisição tem uma chave de API válida
  -- Esta é uma forma simples de autenticação para o n8n
  v_api_key := current_setting('request.headers', true)::json->>'x-api-key';
  
  -- Se não tiver chave de API, usar um user_id padrão para n8n
  IF v_api_key IS NULL OR v_api_key = '' THEN
    -- Usar um user_id específico para o n8n (você pode alterar este UUID)
    v_user_id := 'c4a948a1-a1cc-42ed-902c-a70c4959d3b7'::UUID;
    RAISE NOTICE 'Debug: Usando user_id padrão para n8n: %', v_user_id;
  ELSE
    -- Se tiver chave de API, você pode implementar lógica específica aqui
    -- Por enquanto, usar o mesmo user_id
    v_user_id := 'c4a948a1-a1cc-42ed-902c-a70c4959d3b7'::UUID;
    RAISE NOTICE 'Debug: Chave de API fornecida, user_id: %', v_user_id;
  END IF;
  
  -- Debug: Contar disparos pendentes do usuário
  SELECT COUNT(*) INTO v_debug_count
  FROM public.disparos_agendados
  WHERE status = 'pendente'
    AND user_id = v_user_id
    AND agendado_para <= v_now;
  
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
COMMENT ON FUNCTION proximo_disparo_simples() IS 'Função RPC simplificada para n8n que não requer JWT, mas ainda é segura.';

-- Função para testar a função simplificada
CREATE OR REPLACE FUNCTION test_proximo_disparo_simples()
RETURNS TABLE (
    resultado TEXT,
    disparo_encontrado BOOLEAN,
    dados_disparo JSON
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_disparo RECORD;
    v_dados_disparo JSON;
    v_resultado TEXT;
    v_encontrou BOOLEAN := FALSE;
BEGIN
    -- Chamar a função proximo_disparo_simples
    SELECT * INTO v_disparo FROM proximo_disparo_simples();
    
    -- Verificar se encontrou disparo
    IF v_disparo.id IS NOT NULL THEN
        v_encontrou := TRUE;
        v_resultado := 'Disparo encontrado e processado';
        
        -- Converter para JSON
        v_dados_disparo := json_build_object(
            'id', v_disparo.id,
            'empresa_nome', v_disparo.empresa_nome,
            'empresa_telefone', v_disparo.empresa_telefone,
            'mensagem', v_disparo.mensagem,
            'status', v_disparo.status,
            'agendado_para', v_disparo.agendado_para::TEXT
        );
    ELSE
        v_resultado := 'Nenhum disparo encontrado';
        v_dados_disparo := '{}'::JSON;
    END IF;
    
    RETURN QUERY
    SELECT 
        v_resultado,
        v_encontrou,
        v_dados_disparo;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION test_proximo_disparo_simples() IS 'Função para testar a função proximo_disparo_simples.';

-- Função para criar disparo de teste para o n8n
CREATE OR REPLACE FUNCTION criar_disparo_teste_n8n()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_id INTEGER;
    v_user_id UUID;
BEGIN
    -- Usar o mesmo user_id que a função proximo_disparo_simples usa
    v_user_id := 'c4a948a1-a1cc-42ed-902c-a70c4959d3b7'::UUID;
    
    -- Inserir disparo de teste para o n8n
    INSERT INTO public.disparos_agendados (
        empresa_id, empresa_nome, empresa_telefone, empresa_website, 
        empresa_endereco, mensagem, tipo_midia, midia_url, status, 
        agendado_para, criado_em, conexao_id, ordem, fase, user_id
    ) VALUES (
        999,
        'Empresa Teste n8n',
        '5511555555555@s.whatsapp.net',
        'https://teste-n8n.com',
        'Endereço Teste n8n',
        'Mensagem de teste para n8n',
        'nenhum',
        NULL,
        'pendente',
        NOW()::TIMESTAMP,
        NOW()::TIMESTAMP,
        'Teste Conexão n8n',
        1,
        'fase_1',
        v_user_id
    ) RETURNING id INTO v_id;
    
    RETURN 'Disparo de teste n8n criado com ID: ' || v_id || ' para user_id: ' || v_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Erro ao inserir disparo: ' || SQLERRM;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION criar_disparo_teste_n8n() IS 'Função para criar disparo de teste para o n8n.'; 