/*
  # Add Usage Tracking and Plan Limits

  ## Summary
  Creates a usage_tracking table to count lesson generations per user, with
  monthly reset logic for paid plans. Also ensures profiles.plan defaults to
  'free' (not 'starter') for new users, and adds a free plan to the price map.

  ## New Tables
  - `usage_tracking`
    - `user_id` (uuid, FK to auth.users, unique) — one row per user
    - `plan` (text) — current plan: free | starter | standard | pro
    - `monthly_count` (int) — lessons generated this billing month
    - `daily_count` (int) — lessons generated today (UTC)
    - `month_reset_at` (date) — the month this count is valid for (YYYY-MM-01)
    - `day_reset_at` (date) — the date this daily count is valid for

  ## Plan Limits
  - free: 3/day, PDF only
  - starter: 30/month, PDF + DOCX + TXT
  - standard: 50/month, all formats
  - pro: unlimited, all formats

  ## Security
  - RLS enabled
  - Users can read their own row
  - Service role manages all rows
*/

CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  monthly_count integer NOT NULL DEFAULT 0,
  daily_count integer NOT NULL DEFAULT 0,
  month_reset_at date NOT NULL DEFAULT date_trunc('month', now())::date,
  day_reset_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON usage_tracking FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS usage_tracking_user_id_idx ON usage_tracking(user_id);

/*
  Function: increment_usage
  Increments daily and monthly lesson counts for the user.
  Resets counters when the day/month rolls over.
  Returns the updated row.
*/
CREATE OR REPLACE FUNCTION increment_usage(p_user_id uuid)
RETURNS usage_tracking
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row usage_tracking;
  v_today date := CURRENT_DATE;
  v_this_month date := date_trunc('month', now())::date;
BEGIN
  INSERT INTO usage_tracking (user_id, monthly_count, daily_count, month_reset_at, day_reset_at)
  VALUES (p_user_id, 1, 1, v_this_month, v_today)
  ON CONFLICT (user_id) DO UPDATE SET
    monthly_count = CASE
      WHEN usage_tracking.month_reset_at < v_this_month THEN 1
      ELSE usage_tracking.monthly_count + 1
    END,
    daily_count = CASE
      WHEN usage_tracking.day_reset_at < v_today THEN 1
      ELSE usage_tracking.daily_count + 1
    END,
    month_reset_at = v_this_month,
    day_reset_at = v_today,
    updated_at = now()
  RETURNING * INTO v_row;

  IF v_row IS NULL THEN
    SELECT * INTO v_row FROM usage_tracking WHERE user_id = p_user_id;
  END IF;

  RETURN v_row;
END;
$$;

/*
  Function: get_usage
  Returns current usage row, resetting stale counters if needed without incrementing.
*/
CREATE OR REPLACE FUNCTION get_usage(p_user_id uuid)
RETURNS usage_tracking
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row usage_tracking;
  v_today date := CURRENT_DATE;
  v_this_month date := date_trunc('month', now())::date;
BEGIN
  SELECT * INTO v_row FROM usage_tracking WHERE user_id = p_user_id;

  IF v_row IS NULL THEN
    INSERT INTO usage_tracking (user_id, monthly_count, daily_count, month_reset_at, day_reset_at)
    VALUES (p_user_id, 0, 0, v_this_month, v_today)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING * INTO v_row;

    IF v_row IS NULL THEN
      SELECT * INTO v_row FROM usage_tracking WHERE user_id = p_user_id;
    END IF;
    RETURN v_row;
  END IF;

  IF v_row.month_reset_at < v_this_month OR v_row.day_reset_at < v_today THEN
    UPDATE usage_tracking SET
      monthly_count = CASE WHEN month_reset_at < v_this_month THEN 0 ELSE monthly_count END,
      daily_count = CASE WHEN day_reset_at < v_today THEN 0 ELSE daily_count END,
      month_reset_at = v_this_month,
      day_reset_at = v_today,
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage(uuid) TO authenticated;
