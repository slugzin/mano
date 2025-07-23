/*
  # Adicionar coluna whatsapp_number à tabela stories

  1. Alterações
    - Adiciona coluna whatsapp_number à tabela stories
    - Torna a coluna NOT NULL para garantir que sempre tenha um número
*/

ALTER TABLE stories
ADD COLUMN IF NOT EXISTS whatsapp_number text NOT NULL;

-- Atualiza as políticas para permitir acesso durante testes
DROP POLICY IF EXISTS "Stories podem ser vistos por todos" ON stories;
DROP POLICY IF EXISTS "Todos podem criar stories" ON stories;
DROP POLICY IF EXISTS "Todos podem atualizar stories" ON stories;
DROP POLICY IF EXISTS "Todos podem deletar stories" ON stories;

-- Cria novas políticas mais permissivas
CREATE POLICY "Todos podem ver stories"
  ON stories FOR SELECT
  USING (true);

CREATE POLICY "Todos podem criar stories"
  ON stories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar stories"
  ON stories FOR UPDATE
  USING (true);

CREATE POLICY "Todos podem deletar stories"
  ON stories FOR DELETE
  USING (true);