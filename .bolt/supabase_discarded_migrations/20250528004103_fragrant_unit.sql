/*
  # Add metadata fields to stories table

  1. Changes
    - Add video_name for storing the original filename
    - Add end_message for customizable end message
    - Add duration_seconds for configurable story duration
    - Update existing stories with default values
*/

-- Add new columns to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS video_name text;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS end_message text DEFAULT 'Story privado acabou...';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 10;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stories_video_name ON stories(video_name);