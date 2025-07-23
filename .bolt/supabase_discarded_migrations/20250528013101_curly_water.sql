/*
  # Add profile URL and update models table

  1. Changes
    - Add profile URL column to models table
    - Add unique constraint on username
    - Add indexes for better performance

  2. Security
    - Update RLS policies for public access
*/

-- Add profile URL column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'models' AND column_name = 'profile_url'
  ) THEN
    ALTER TABLE models ADD COLUMN profile_url text GENERATED ALWAYS AS (username) STORED;
  END IF;
END $$;

-- Ensure username is unique
ALTER TABLE models DROP CONSTRAINT IF EXISTS models_username_key;
ALTER TABLE models ADD CONSTRAINT models_username_key UNIQUE (username);

-- Add index for username lookups
CREATE INDEX IF NOT EXISTS idx_models_username ON models(username);

-- Update RLS policies
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active models
CREATE POLICY "Models are viewable by everyone" ON models
  FOR SELECT
  USING (true);

-- Only admins can manage models
CREATE POLICY "Only admins can manage models" ON models
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );