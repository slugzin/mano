/*
  # Fix Stories Table Structure

  1. Changes
    - Add required columns for stories
    - Update policies to be more permissive for testing
    - Ensure all necessary columns exist
*/

-- Add required columns if they don't exist
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS model_name text,
ADD COLUMN IF NOT EXISTS model_username text,
ADD COLUMN IF NOT EXISTS model_profile_image text;

-- Make media_url and whatsapp_number nullable temporarily for testing
ALTER TABLE stories 
ALTER COLUMN media_url DROP NOT NULL,
ALTER COLUMN whatsapp_number DROP NOT NULL;

-- Update policies to be more permissive for testing
DROP POLICY IF EXISTS "Todos podem ver stories" ON stories;
DROP POLICY IF EXISTS "Todos podem criar stories" ON stories;
DROP POLICY IF EXISTS "Todos podem atualizar stories" ON stories;
DROP POLICY IF EXISTS "Todos podem deletar stories" ON stories;

-- Create new permissive policies
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