/*
  # Add lesson_name column to lessons table

  ## Summary
  Adds an optional custom lesson name field to the lessons table.

  ## Changes
  - `lessons` table: adds `lesson_name` (text, nullable) column

  ## Notes
  - Nullable so existing rows are unaffected
  - If null, the UI falls back to displaying "subject: topic" as before
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'lesson_name'
  ) THEN
    ALTER TABLE lessons ADD COLUMN lesson_name text;
  END IF;
END $$;
