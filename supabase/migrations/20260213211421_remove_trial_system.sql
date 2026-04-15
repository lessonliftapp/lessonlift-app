/*
  # Remove Trial System and Simplify Subscription Handling

  1. Changes
    - Drop trial-related columns from profiles table
    - Drop daily and monthly lesson tracking tables
    - Drop user_limits table
    - Keep only stripe_subscriptions for subscription tracking
  
  2. Security
    - Maintain existing RLS policies on remaining tables
*/

-- Drop trial-related columns from profiles table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_uses_remaining'
  ) THEN
    ALTER TABLE profiles DROP COLUMN trial_uses_remaining;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE profiles DROP COLUMN trial_ends_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE profiles DROP COLUMN subscription_plan;
  END IF;
END $$;

-- Drop lesson limit tracking tables
DROP TABLE IF EXISTS daily_lesson_counts CASCADE;
DROP TABLE IF EXISTS monthly_lesson_counts CASCADE;
DROP TABLE IF EXISTS user_limits CASCADE;

-- Drop any trial-related functions
DROP FUNCTION IF EXISTS check_lesson_limit();
DROP FUNCTION IF EXISTS increment_lesson_count();
DROP FUNCTION IF EXISTS can_generate_lesson(uuid);
DROP FUNCTION IF EXISTS get_remaining_lessons(uuid);
DROP FUNCTION IF EXISTS check_daily_limit(uuid);
DROP FUNCTION IF EXISTS increment_daily_count(uuid);
DROP FUNCTION IF EXISTS reset_daily_limits();
DROP FUNCTION IF EXISTS get_user_plan(uuid);
