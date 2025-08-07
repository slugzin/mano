-- Corrigir função proximo_disparo para funcionar com RLS e tipos corretos
DROP FUNCTION IF EXISTS proximo_disparo();

CREATE OR REPLACE FUNCTION proximo_disparo()
RETURNS TABLE (
  id INTEGER,  -- Mudado de TEXT para INTEGER
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
  v_user_id UUID;
BEGIN
  -- Pegar hora atual
  v_now := NOW()::TIMESTAMP;
  
  -- Pegar user_id do JWT ou usar NULL para bypass RLS
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::json->>'sub')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      v_user_id := NULL;
  END;
  
  -- Debug: Contar disparos pendentes
  SELECT COUNT(*) INTO v_debug_count
  FROM public.disparos_agendados
  WHERE status = 'pendente'
    AND (v_user_id IS NULL OR user_id = v_user_id)
    AND agendado_para <= v_now;
  
  -- Log de debug
  RAISE NOTICE 'Debug: Hora atual: %, User ID: %, Disparos pendentes: %', v_now, v_user_id, v_debug_count;
  
  -- Buscar o próximo disparo disponível
  SELECT t.id, t.empresa_id, t.empresa_nome, t.empresa_telefone, 
         t.empresa_website, t.empresa_endereco, t.mensagem, t.tipo_midia, 
         t.midia_url, t.status, t.agendado_para, t.criado_em, t.conexao_id
  INTO v_next_task
  FROM public.disparos_agendados t
  WHERE t.status = 'pendente'
    AND (v_user_id IS NULL OR t.user_id = v_user_id)
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
      v_next_task.id,  -- Já é INTEGER
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
COMMENT ON FUNCTION proximo_disparo() IS 'Função RPC corrigida que retorna o próximo disparo agendado com suporte a RLS e tipos corretos.';

-- Função para testar a função proximo_disparo
CREATE OR REPLACE FUNCTION test_proximo_disparo_final()
RETURNS TABLE (
    resultado TEXT,
    disparo_encontrado BOOLEAN,
    dados_disparo JSON
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_disparo RECORD;
    v_dados_disparo JSON;
    v_resultado TEXT;
    v_encontrou BOOLEAN := FALSE;
BEGIN
    -- Chamar a função proximo_disparo
    SELECT * INTO v_disparo FROM proximo_disparo();
    
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

-- Função para verificar dados com bypass RLS
CREATE OR REPLACE FUNCTION verificar_dados_disparos_agendados()
RETURNS TABLE (
    id INTEGER,  -- Mudado de TEXT para INTEGER
    empresa_nome TEXT,
    status_disparo TEXT,
    agendado_para_disparo TEXT,
    user_id_disparo TEXT,
    criado_em_disparo TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,  -- Já é INTEGER
        t.empresa_nome,
        t.status as status_disparo,
        t.agendado_para::TEXT as agendado_para_disparo,
        t.user_id::TEXT as user_id_disparo,
        t.criado_em::TEXT as criado_em_disparo
    FROM public.disparos_agendados t
    ORDER BY t.criado_em DESC
    LIMIT 10;
END;
$$;

-- Função para criar disparo de teste com tipos corretos
CREATE OR REPLACE FUNCTION criar_disparo_teste_correto()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id INTEGER;
    v_user_id UUID;
BEGIN
    -- Usar user_id específico
    v_user_id := 'c4a948a1-a1cc-42ed-902c-a70c4959d3b7'::UUID;
    
    -- Inserir disparo de teste com ID automático
    INSERT INTO public.disparos_agendados (
        empresa_id, empresa_nome, empresa_telefone, empresa_website, 
        empresa_endereco, mensagem, tipo_midia, midia_url, status, 
        agendado_para, criado_em, conexao_id, ordem, fase, user_id
    ) VALUES (
        997,
        'Empresa Teste Corrigida',
        '5511777777777@s.whatsapp.net',
        'https://teste-corrigido.com',
        'Endereço Teste Corrigido',
        'Mensagem de teste corrigida',
        'nenhum',
        NULL,
        'pendente',
        NOW()::TIMESTAMP,
        NOW()::TIMESTAMP,
        'Teste Conexão Corrigida',
        1,
        'fase_1',
        v_user_id
    ) RETURNING id INTO v_id;
    
    RETURN 'Disparo de teste criado com ID: ' || v_id || ' e user_id: ' || v_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Erro ao inserir disparo: ' || SQLERRM;
END;
$$;

-- Comentários explicativos
COMMENT ON FUNCTION test_proximo_disparo_final() IS 'Função para testar a função proximo_disparo com tipos corrigidos.';
COMMENT ON FUNCTION verificar_dados_disparos_agendados() IS 'Função para verificar dados da tabela com bypass RLS.';
COMMENT ON FUNCTION criar_disparo_teste_correto() IS 'Função para criar disparo de teste com tipos corretos.'; 