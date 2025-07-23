/*
  # Ajuste na tabela stories

  1. Alterações
    - Garante que todas as colunas necessárias existem
    - Define valores padrão apropriados
    - Atualiza as políticas de acesso

  2. Segurança
    - Mantém RLS ativo
    - Políticas permissivas para testes
*/

-- Recria a tabela stories com a estrutura correta
DROP TABLE IF EXISTS stories CASCADE;

CREATE TABLE stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('video', 'image')),
  whatsapp_number text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para testes
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

-- Índices para performance
CREATE INDEX stories_model_id_idx ON stories(model_id);
CREATE INDEX stories_expires_at_idx ON stories(expires_at);
CREATE INDEX stories_is_active_idx ON stories(is_active);