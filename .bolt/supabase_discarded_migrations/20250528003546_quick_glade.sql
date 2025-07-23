/*
  # Schema para Stories

  1. Novas Tabelas
    - `stories`
      - `id` (uuid, primary key)
      - `model_id` (uuid, referência para models)
      - `media_url` (text)
      - `media_type` (text - 'image' ou 'video')
      - `whatsapp_number` (text)
      - `expires_at` (timestamp)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      
    - `story_views`
      - `id` (uuid, primary key) 
      - `story_id` (uuid, referência para stories)
      - `user_id` (uuid, referência para auth.users)
      - `viewed_at` (timestamp)

  2. Segurança
    - RLS habilitado em ambas as tabelas
    - Políticas para leitura/escrita baseadas em autenticação
*/

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  whatsapp_number text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create story views table
CREATE TABLE IF NOT EXISTS story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE (story_id, user_id)
);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Stories podem ser vistos por todos"
  ON stories FOR SELECT
  USING (is_active = true AND expires_at > now());

CREATE POLICY "Qualquer um pode criar stories"
  ON stories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Qualquer um pode atualizar stories"
  ON stories FOR UPDATE
  USING (true);

CREATE POLICY "Qualquer um pode deletar stories"
  ON stories FOR DELETE
  USING (true);

-- Story views policies
CREATE POLICY "Users can view story views" 
  ON story_views FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create story views" 
  ON story_views FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_stories_model_id ON stories(model_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_user_id ON story_views(user_id);