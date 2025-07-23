/*
  # Add media type column to posts table

  1. Changes
    - Add `media_type` column to `posts` table
      - Type: text
      - Not nullable
      - Default value: 'image'
      - Check constraint to ensure only valid types ('image' or 'video')

  2. Notes
    - Uses DO block to safely add column if it doesn't exist
    - Adds check constraint to validate media types
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE posts 
    ADD COLUMN media_type text NOT NULL DEFAULT 'image';

    ALTER TABLE posts 
    ADD CONSTRAINT posts_media_type_check 
    CHECK (media_type IN ('image', 'video'));
  END IF;
END $$;