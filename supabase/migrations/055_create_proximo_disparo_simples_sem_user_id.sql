-- Criar função proximo_disparo_simples sem filtro de user_id
DROP FUNCTION IF EXISTS proximo_disparo_simples(UUID);

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
SECURITY DEFINER
AS $$
DECLARE
  v_next_task RECORD;
  v_now TIMESTAMP;
  v_debug_count INTEGER;
BEGIN
  -- Pegar hora atual
  v_now := NOW()::TIMESTAMP;
  
  -- Debug: Contar disparos pendentes (sem filtro de user_id)
  SELECT COUNT(*) INTO v_debug_count
  FROM public.disparos_agendados
  WHERE public.disparos_agendados.status = 'pendente'
    AND public.disparos_agendados.agendado_para <= v_now;
  
  -- Log de debug
  RAISE NOTICE 'Debug: Hora atual: %, Disparos pendentes totais: %', v_now, v_debug_count;
  
  -- Buscar o próximo disparo disponível (sem filtro de user_id)
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
COMMENT ON FUNCTION proximo_disparo_simples() IS 'Função RPC simplificada para n8n que busca qualquer disparo pendente sem filtro de user_id.';

-- Log das alterações
DO $$
BEGIN
  RAISE NOTICE 'Função proximo_disparo_simples criada sem filtro de user_id';
  RAISE NOTICE 'Agora busca qualquer disparo pendente, independente do usuário';
END $$; 