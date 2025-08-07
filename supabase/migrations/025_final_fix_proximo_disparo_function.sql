-- Remover função antiga primeiro
DROP FUNCTION IF EXISTS proximo_disparo();

-- Criar versão final corrigida da função proximo_disparo
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
BEGIN
  -- Pegar hora atual
  v_now := NOW();
  
  -- Buscar o próximo disparo disponível
  -- Usar uma abordagem mais simples e direta
  SELECT t.id, t.empresa_id, t.empresa_nome, t.empresa_telefone, 
         t.empresa_website, t.empresa_endereco, t.mensagem, t.tipo_midia, 
         t.midia_url, t.status, t.agendado_para, t.criado_em, t.conexao_id
  INTO v_next_task
  FROM public.disparos_agendados t
  WHERE t.status = 'pendente'
    AND t.agendado_para <= v_now  -- Usar variável v_now em vez de now()
  ORDER BY 
    t.fase ASC,
    t.ordem ASC,
    t.agendado_para ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- Se encontrou um disparo, atualizar o status e retornar
  IF v_next_task.id IS NOT NULL THEN
    -- Atualizar o status para 'processando'
    UPDATE public.disparos_agendados 
    SET status = 'processando'
    WHERE id = v_next_task.id;

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
COMMENT ON FUNCTION proximo_disparo() IS 'Função RPC final corrigida que retorna o próximo disparo agendado.';

-- Função para testar a função proximo_disparo
CREATE OR REPLACE FUNCTION test_proximo_disparo()
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
            'agendado_para', v_disparo.agendado_para
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
COMMENT ON FUNCTION test_proximo_disparo() IS 'Função para testar a função proximo_disparo.';

-- Função para verificar disparos disponíveis
CREATE OR REPLACE FUNCTION verificar_disparos_disponiveis()
RETURNS TABLE (
    total_pendentes INTEGER,
    total_agendados_passado INTEGER,
    proximos_3_disparos JSON,
    hora_atual TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_pendentes INTEGER;
    v_total_agendados_passado INTEGER;
    v_proximos_disparos JSON;
    v_hora_atual TIMESTAMPTZ;
BEGIN
    v_hora_atual := NOW();
    
    -- Contar total de disparos pendentes
    SELECT COUNT(*) INTO v_total_pendentes
    FROM public.disparos_agendados
    WHERE status = 'pendente';
    
    -- Contar disparos agendados para o passado
    SELECT COUNT(*) INTO v_total_agendados_passado
    FROM public.disparos_agendados
    WHERE status = 'pendente'
      AND agendado_para <= v_hora_atual;
    
    -- Buscar os próximos 3 disparos pendentes
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
            'diferenca_horas', EXTRACT(EPOCH FROM (v_hora_atual - t.agendado_para))/3600
        )
    ) INTO v_proximos_disparos
    FROM (
        SELECT *
        FROM public.disparos_agendados
        WHERE status = 'pendente'
          AND agendado_para <= v_hora_atual
        ORDER BY 
            fase ASC,
            ordem ASC,
            agendado_para ASC
        LIMIT 3
    ) t;
    
    RETURN QUERY
    SELECT 
        v_total_pendentes,
        v_total_agendados_passado,
        COALESCE(v_proximos_disparos, '[]'::JSON),
        v_hora_atual;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION verificar_disparos_disponiveis() IS 'Função para verificar disparos disponíveis para processamento.'; 