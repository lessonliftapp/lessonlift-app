/*
  # Create profiles table with lessons_remaining

  ## Summary
  Creates the profiles table for the first time in this database instance.
  The table was defined in earlier migration files but never applied to the live database.

  ## New Tables
  - `profiles`
    - `id` (uuid, primary key, references auth.users)
    - `plan` (text, default 'free') - subscription plan tier
    - `subscription_status` (text, default 'inactive') - active/inactive/canceled
    - `first_name` (text, nullable)
    - `last_name` (text, nullable)
    - `name` (text, nullable) - display name from signup
    - `lessons_remaining` (integer, default 3) - free trial lesson count, starts at 3 for all new users
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on profiles table
  - Users can only read and update their own profile
  - Insert restricted to authenticated users inserting their own row

  ## Important Notes
  1. lessons_remaining defaults to 3 so ALL new users start with 3 free trial lessons
  2. The DEFAULT 3 ensures no user ever starts at 0 or NULL
  3. Backfill sets lessons_remaining = 3 for any rows where it is NULL (safety net)
  4. This table is required by AuthContext.tsx signUp flow
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'standard', 'pro')),
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'canceled')),
  first_name text,
  last_name text,
  name text,
  lessons_remaining integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

UPDATE profiles SET lessons_remaining = 3 WHERE lessons_remaining IS NULL;
