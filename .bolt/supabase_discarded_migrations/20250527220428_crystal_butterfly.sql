/*
  # Fix Models and Stories Permissions
  
  1. Changes
    - Add proper RLS policies for models table
    - Fix models table structure
    - Update stories table foreign key constraint
    - Add admin-only policies for model management
  
  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
    - Add policies for admin-only write access
*/

-- Fix models table structure if needed
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'models' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE models ADD COLUMN display_name text;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Models podem ser vistos por todos" ON models;
DROP POLICY IF EXISTS "Only admins can manage models" ON models;
DROP POLICY IF EXISTS "Stories podem ser vistos por todos" ON stories;
DROP POLICY IF EXISTS "Qualquer um pode criar stories" ON stories;

-- Create new policies for models
CREATE POLICY "Models podem ser vistos por todos"
  ON models FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage models"
  ON models FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create new policies for stories
CREATE POLICY "Stories podem ser vistos por todos"
  ON stories FOR SELECT
  USING (
    is_active = true 
    AND expires_at > now()
  );

CREATE POLICY "Only admins can manage stories"
  ON stories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add necessary indexes
CREATE INDEX IF NOT EXISTS idx_models_username ON models(username);
CREATE INDEX IF NOT EXISTS idx_stories_model_id ON stories(model_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);

-- Ensure foreign key constraint exists
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_model_id_fkey;
ALTER TABLE stories ADD CONSTRAINT stories_model_id_fkey 
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE;