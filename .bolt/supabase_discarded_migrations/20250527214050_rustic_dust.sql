/*
  # Fix Stories and Models Relationship

  1. Changes
    - Add foreign key constraint between stories.model_id and models.id
    - Add cascade delete behavior
    - Add index on model_id for better performance
    - Update RLS policies to handle the relationship

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Add foreign key constraint
DO $$ 
BEGIN
  ALTER TABLE stories
    ADD CONSTRAINT stories_model_id_fkey 
    FOREIGN KEY (model_id) 
    REFERENCES models(id) 
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN 
    NULL;
END $$;

-- Ensure index exists for foreign key
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_stories_model_id ON stories(model_id);
EXCEPTION
  WHEN duplicate_object THEN 
    NULL;
END $$;

-- Update RLS policies to consider model relationship
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Stories podem ser vistos por todos" ON stories;
  CREATE POLICY "Stories podem ser vistos por todos"
    ON stories FOR SELECT
    USING (
      is_active = true 
      AND expires_at > now()
      AND EXISTS (
        SELECT 1 FROM models 
        WHERE models.id = stories.model_id
      )
    );
END $$;