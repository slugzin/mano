/*
  # Add RLS policies for posts table

  1. Changes
    - Enable RLS on posts table
    - Add policies for CRUD operations
    - Add policy for public read access to non-exclusive posts
    - Add policy for subscribers to read exclusive posts
    - Add policy for admins to manage all posts

  2. Security
    - Public can read non-exclusive posts
    - Subscribers can read all posts
    - Admins can manage all posts
*/

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to non-exclusive posts
CREATE POLICY "Public posts are viewable by everyone"
  ON posts
  FOR SELECT
  USING (
    is_exclusive = false OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy for admins to manage all posts
CREATE POLICY "Admins can manage all posts"
  ON posts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );