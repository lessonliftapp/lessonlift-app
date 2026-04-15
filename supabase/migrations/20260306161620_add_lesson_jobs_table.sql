/*
  # Add lesson_jobs table for async generation tracking

  ## Summary
  Creates a table to track asynchronous lesson generation jobs, allowing the
  frontend to poll for completion rather than waiting for the full AI response.

  ## New Tables
  - `lesson_jobs`
    - `id` (uuid, primary key) - unique job identifier
    - `user_id` (uuid, FK to auth.users) - owning user
    - `status` (text) - 'processing' | 'completed' | 'failed'
    - `lesson_id` (uuid, nullable) - FK to lessons once complete
    - `error` (text, nullable) - error message if failed
    - `request_data` (jsonb) - the original lesson request parameters
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Users can only read/insert their own jobs
*/

CREATE TABLE IF NOT EXISTS lesson_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'processing',
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  error text,
  request_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lesson_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own jobs"
  ON lesson_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON lesson_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS lesson_jobs_user_id_status_idx ON lesson_jobs (user_id, status);
CREATE INDEX IF NOT EXISTS lesson_jobs_user_id_created_at_idx ON lesson_jobs (user_id, created_at DESC);
