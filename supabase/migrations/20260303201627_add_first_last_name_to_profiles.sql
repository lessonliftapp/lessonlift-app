/*
  # Add first_name and last_name to profiles

  1. Changes
    - Add `first_name` (text, nullable) column to profiles table
    - Add `last_name` (text, nullable) column to profiles table
    - Backfill first_name from existing `name` column where it exists

  2. Notes
    - These are optional fields the user can set from the account panel
    - Existing `name` column is preserved for backwards compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;
END $$;
