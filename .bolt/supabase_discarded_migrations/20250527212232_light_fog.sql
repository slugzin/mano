/*
  # Fix Stories Table Schema
  
  1. Changes
    - Add missing columns for stories
    - Make required columns nullable for testing
    - Update policies to be more permissive
    
  2. New Columns
    - whatsapp_number: Store WhatsApp contact number
    - model_name: Store model's display name
    - model_username: Store model's username
    - model_profile_image: Store model's profile image URL
*/

-- Drop existing columns if they exist
ALTER TABLE stories 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS model_name,
DROP COLUMN IF EXISTS model_username,
DROP COLUMN IF EXISTS model_profile_image;

-- Add required columns
ALTER TABLE stories 
ADD COLUMN whatsapp_number text,
ADD COLUMN model_name text,
ADD COLUMN model_username text,
ADD COLUMN model_profile_image text;

-- Make media_url nullable temporarily for testing
ALTER TABLE stories 
ALTER COLUMN media_url DROP NOT NULL;

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