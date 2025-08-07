-- Remover função antiga primeiro
DROP FUNCTION IF EXISTS proximo_disparo();

-- Criar nova função RPC para pegar o próximo disparo - versão corrigida
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
BEGIN
  -- Primeiro, buscar o próximo disparo disponível
  SELECT t.id, t.empresa_id, t.empresa_nome, t.empresa_telefone, 
         t.empresa_website, t.empresa_endereco, t.mensagem, t.tipo_midia, 
         t.midia_url, t.status, t.agendado_para, t.criado_em, t.conexao_id
  INTO v_next_task
  FROM public.disparos_agendados t
  WHERE t.status = 'pendente'
    AND t.agendado_para <= now()
  ORDER BY 
    t.fase ASC,  -- Primeiro ordena por fase (fase_1, fase_2, etc.)
    t.ordem ASC, -- Depois por ordem dentro da fase (1, 2, 3, etc.)
    t.agendado_para ASC -- Por último por horário agendado
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
      'processando'::TEXT, -- Status atualizado
      v_next_task.agendado_para,
      v_next_task.criado_em,
      v_next_task.conexao_id;
  END IF;

  -- Se não encontrou nenhum disparo, retornar vazio
  RETURN;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION proximo_disparo() IS 'Função RPC que retorna o próximo disparo agendado seguindo a ordem: fase_1 ordem_1, fase_1 ordem_2, fase_2 ordem_1, etc. Versão corrigida para compatibilidade com n8n.';

-- Criar índice para melhorar performance da consulta
CREATE INDEX IF NOT EXISTS idx_disparos_agendados_status_agendado_para 
ON public.disparos_agendados (status, agendado_para) 
WHERE status = 'pendente';

-- Criar índice composto para ordenação
CREATE INDEX IF NOT EXISTS idx_disparos_agendados_ordem_completa 
ON public.disparos_agendados (fase, ordem, agendado_para) 
WHERE status = 'pendente'; 