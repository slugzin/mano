/*
  # Update models table and policies

  1. Changes
    - Safely checks if table exists before creating
    - Adds RLS policies for model management
    - Creates performance indexes
    - Sets up update trigger
*/

-- Only create table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    username text NOT NULL UNIQUE,
    bio text,
    profile_image text,
    cover_image text,
    whatsapp_number text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS if not already enabled
DO $$ BEGIN
  ALTER TABLE models ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Drop existing policies if they exist and recreate them
DO $$ BEGIN
  DROP POLICY IF EXISTS "Modelos podem ser vistos por todos" ON models;
  DROP POLICY IF EXISTS "Apenas admins podem gerenciar modelos" ON models;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Create policies
CREATE POLICY "Modelos podem ser vistos por todos"
  ON models FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem gerenciar modelos"
  ON models FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index if it doesn't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_models_username ON models(username);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create trigger if it doesn't exist
DO $$ BEGIN
  CREATE TRIGGER update_models_updated_at
    BEFORE UPDATE ON models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;