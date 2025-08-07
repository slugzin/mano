-- Versão segura da função proximo_disparo (apenas usuários autenticados)
DROP FUNCTION IF EXISTS proximo_disparo();

CREATE OR REPLACE FUNCTION proximo_disparo()
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
SECURITY INVOKER  -- Executar com privilégios do chamador (respeita RLS)
AS $$
DECLARE
  v_next_task RECORD;
  v_now TIMESTAMP;
  v_debug_count INTEGER;
  v_user_id UUID;
  v_jwt_claims JSON;
BEGIN
  -- Verificar se o usuário está autenticado
  BEGIN
    v_jwt_claims := current_setting('request.jwt.claims', true)::json;
    v_user_id := (v_jwt_claims->>'sub')::UUID;
    
    -- Verificar se o user_id é válido
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Usuário não autenticado. É necessário fazer login.';
    END IF;
    
    -- Verificar se o role não é 'anon'
    IF v_jwt_claims->>'role' = 'anon' THEN
      RAISE EXCEPTION 'Acesso negado. Usuário anônimo não tem permissão.';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Erro de autenticação: %', SQLERRM;
  END;
  
  -- Pegar hora atual
  v_now := NOW()::TIMESTAMP;
  
  -- Debug: Contar disparos pendentes do usuário
  SELECT COUNT(*) INTO v_debug_count
  FROM public.disparos_agendados
  WHERE status = 'pendente'
    AND user_id = v_user_id
    AND agendado_para <= v_now;
  
  -- Log de debug
  RAISE NOTICE 'Debug: Hora atual: %, User ID: %, Disparos pendentes: %', v_now, v_user_id, v_debug_count;
  
  -- Buscar o próximo disparo disponível (apenas do usuário autenticado)
  SELECT t.id, t.empresa_id, t.empresa_nome, t.empresa_telefone, 
         t.empresa_website, t.empresa_endereco, t.mensagem, t.tipo_midia, 
         t.midia_url, t.status, t.agendado_para, t.criado_em, t.conexao_id
  INTO v_next_task
  FROM public.disparos_agendados t
  WHERE t.status = 'pendente'
    AND t.user_id = v_user_id  -- Apenas disparos do usuário
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
    -- Atualizar o status para 'processando' (apenas do usuário)
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
COMMENT ON FUNCTION proximo_disparo() IS 'Função RPC segura que retorna o próximo disparo apenas para usuários autenticados.';

-- Função para testar autenticação
CREATE OR REPLACE FUNCTION test_autenticacao()
RETURNS TABLE (
    status_autenticacao TEXT,
    user_id TEXT,
    role TEXT,
    mensagem TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_jwt_claims JSON;
    v_user_id TEXT;
    v_role TEXT;
    v_status TEXT;
    v_mensagem TEXT;
BEGIN
    BEGIN
        v_jwt_claims := current_setting('request.jwt.claims', true)::json;
        v_user_id := v_jwt_claims->>'sub';
        v_role := v_jwt_claims->>'role';
        
        IF v_user_id IS NULL THEN
            v_status := 'NÃO AUTENTICADO';
            v_mensagem := 'Usuário não está logado';
        ELSIF v_role = 'anon' THEN
            v_status := 'ANÔNIMO';
            v_mensagem := 'Usuário anônimo - sem permissões';
        ELSE
            v_status := 'AUTENTICADO';
            v_mensagem := 'Usuário autenticado com permissões';
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            v_status := 'ERRO';
            v_mensagem := 'Erro ao verificar autenticação: ' || SQLERRM;
            v_user_id := 'ERRO';
            v_role := 'ERRO';
    END;
    
    RETURN QUERY
    SELECT 
        v_status,
        COALESCE(v_user_id, 'NULL'),
        COALESCE(v_role, 'NULL'),
        v_mensagem;
END;
$$;

-- Função para verificar disparos do usuário autenticado
CREATE OR REPLACE FUNCTION verificar_disparos_usuario()
RETURNS TABLE (
    id INTEGER,
    empresa_nome TEXT,
    status_disparo TEXT,
    agendado_para_disparo TEXT,
    user_id_disparo TEXT,
    total_disparos INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_total INTEGER;
BEGIN
    -- Pegar user_id do JWT
    BEGIN
        v_user_id := (current_setting('request.jwt.claims', true)::json->>'sub')::UUID;
        
        IF v_user_id IS NULL THEN
            RAISE EXCEPTION 'Usuário não autenticado';
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Erro de autenticação: %', SQLERRM;
    END;
    
    -- Contar total de disparos do usuário
    SELECT COUNT(*) INTO v_total
    FROM public.disparos_agendados
    WHERE user_id = v_user_id;
    
    -- Retornar disparos do usuário
    RETURN QUERY
    SELECT 
        t.id,
        t.empresa_nome,
        t.status as status_disparo,
        t.agendado_para::TEXT as agendado_para_disparo,
        t.user_id::TEXT as user_id_disparo,
        v_total
    FROM public.disparos_agendados t
    WHERE t.user_id = v_user_id
    ORDER BY t.criado_em DESC
    LIMIT 10;
END;
$$;

-- Função para criar disparo de teste para usuário autenticado
CREATE OR REPLACE FUNCTION criar_disparo_teste_usuario()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_id INTEGER;
    v_user_id UUID;
    v_jwt_claims JSON;
BEGIN
    -- Verificar autenticação
    BEGIN
        v_jwt_claims := current_setting('request.jwt.claims', true)::json;
        v_user_id := (v_jwt_claims->>'sub')::UUID;
        
        IF v_user_id IS NULL THEN
            RAISE EXCEPTION 'Usuário não autenticado';
        END IF;
        
        IF v_jwt_claims->>'role' = 'anon' THEN
            RAISE EXCEPTION 'Usuário anônimo não tem permissão';
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Erro de autenticação: %', SQLERRM;
    END;
    
    -- Inserir disparo de teste para o usuário autenticado
    INSERT INTO public.disparos_agendados (
        empresa_id, empresa_nome, empresa_telefone, empresa_website, 
        empresa_endereco, mensagem, tipo_midia, midia_url, status, 
        agendado_para, criado_em, conexao_id, ordem, fase, user_id
    ) VALUES (
        998,
        'Empresa Teste Usuário',
        '5511666666666@s.whatsapp.net',
        'https://teste-usuario.com',
        'Endereço Teste Usuário',
        'Mensagem de teste para usuário autenticado',
        'nenhum',
        NULL,
        'pendente',
        NOW()::TIMESTAMP,
        NOW()::TIMESTAMP,
        'Teste Conexão Usuário',
        1,
        'fase_1',
        v_user_id
    ) RETURNING id INTO v_id;
    
    RETURN 'Disparo de teste criado com ID: ' || v_id || ' para usuário: ' || v_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Erro ao inserir disparo: ' || SQLERRM;
END;
$$;

-- Comentários explicativos
COMMENT ON FUNCTION test_autenticacao() IS 'Função para testar status de autenticação do usuário.';
COMMENT ON FUNCTION verificar_disparos_usuario() IS 'Função para verificar disparos do usuário autenticado.';
COMMENT ON FUNCTION criar_disparo_teste_usuario() IS 'Função para criar disparo de teste para usuário autenticado.'; 