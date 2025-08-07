-- Remover função antiga primeiro
DROP FUNCTION IF EXISTS proximo_disparo();

-- Criar nova função RPC para pegar o próximo disparo - versão compatível com n8n
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
BEGIN
  RETURN QUERY
    WITH next_task AS (
      SELECT t.id
        FROM public.disparos_agendados t
       WHERE t.status = 'pendente'
         AND t.agendado_para <= now()
       ORDER BY 
         t.fase ASC,  -- Primeiro ordena por fase (fase_1, fase_2, etc.)
         t.ordem ASC, -- Depois por ordem dentro da fase (1, 2, 3, etc.)
         t.agendado_para ASC -- Por último por horário agendado
       LIMIT 1
       FOR UPDATE SKIP LOCKED
    )
    UPDATE public.disparos_agendados t
       SET status = 'processando'
     WHERE t.id IN (SELECT next_task.id FROM next_task)
    RETURNING 
      t.id, 
      t.empresa_id, 
      t.empresa_nome, 
      t.empresa_telefone, 
      t.empresa_website, 
      t.empresa_endereco, 
      t.mensagem, 
      t.tipo_midia, 
      t.midia_url, 
      t.status, 
      t.agendado_para, 
      t.criado_em, 
      t.conexao_id;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION proximo_disparo() IS 'Função RPC que retorna o próximo disparo agendado seguindo a ordem: fase_1 ordem_1, fase_1 ordem_2, fase_2 ordem_1, etc. Versão compatível com n8n (13 colunas).'; 