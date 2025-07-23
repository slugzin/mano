/*
  # Fix Stories Schema
  
  1. Changes
    - Drop existing stories table and recreate with correct structure
    - Add proper columns for model info and media
    - Set up RLS policies
    
  2. New Structure
    - id: Primary key
    - model_id: Reference to models table
    - media_url: URL of the story media
    - media_type: Type of media (video/image)
    - whatsapp_number: Contact number
    - expires_at: When the story expires
    - is_active: If the story is active
    - created_at: When the story was created
*/

-- Drop existing table and recreate with correct structure
DROP TABLE IF EXISTS stories CASCADE;

CREATE TABLE stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('video', 'image')),
  whatsapp_number text NOT NULL,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Create policies for stories
CREATE POLICY "Stories podem ser vistos por todos"
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

-- Create indexes for better performance
CREATE INDEX stories_model_id_idx ON stories(model_id);
CREATE INDEX stories_expires_at_idx ON stories(expires_at);
CREATE INDEX stories_is_active_idx ON stories(is_active);