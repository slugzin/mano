/*
  # Create posts table for model content

  1. New Tables
    - `posts` table for storing model content
      - `id` (uuid, primary key)
      - `model_id` (uuid, references models)
      - `title` (text)
      - `description` (text)
      - `media_url` (text)
      - `media_type` (text: 'image' or 'video')
      - `is_exclusive` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for content access
*/

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  is_exclusive boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_model_id ON posts(model_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- RLS Policies
CREATE POLICY "Public posts are viewable by everyone"
  ON posts FOR SELECT
  USING (
    is_exclusive = false OR
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = auth.uid()
      AND subscriptions.status = 'active'
      AND subscriptions.current_period_end > now()
    )
  );

CREATE POLICY "Models can manage their own posts"
  ON posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM models
      WHERE models.id = posts.model_id
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all posts"
  ON posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();