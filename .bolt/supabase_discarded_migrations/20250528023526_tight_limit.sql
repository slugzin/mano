/*
  # Add likes count to posts table

  1. Changes
    - Add `likes_count` column to `posts` table with default value of 0
    - This column will track the number of likes for each post
    
  2. Notes
    - Uses a default value of 0 to ensure existing posts have a valid count
    - Column is nullable to maintain flexibility
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' 
    AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE posts 
    ADD COLUMN likes_count integer DEFAULT 0;
  END IF;
END $$;