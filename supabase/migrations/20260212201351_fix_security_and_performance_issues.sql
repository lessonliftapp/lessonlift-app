/*
  # Fix Security and Performance Issues
  
  ## Changes Made
  
  ### 1. RLS Performance Optimization
  All RLS policies now use `(select auth.uid())` instead of `auth.uid()` to prevent
  re-evaluation for each row, significantly improving query performance at scale.
  
  Affected tables:
  - user_limits
  - lessons
  - daily_lesson_counts
  - monthly_lesson_counts
  
  ### 2. Remove Duplicate Policies
  The lessons table had multiple permissive policies for the same actions:
  - Removed duplicate INSERT policy: "Allow users to insert their own lessons"
  - Removed duplicate SELECT policy: "Allow users to read their own lessons"
  - Kept the more clearly named policies: "Users can insert own lessons" and "Users can read own lessons"
  
  ### 3. Remove Unused Index
  Dropped the unused index `lessons_user_id_created_at_idx` to improve write performance
  and reduce storage overhead.
  
  ### 4. Fix Function Search Paths
  Set explicit search_path for all functions to prevent search path injection attacks.
  All functions now use `search_path = 'public'` with schema-qualified references.
  
  Affected functions:
  - get_plan_daily_limit
  - get_plan_export_formats
  - get_plan_monthly_limit
  - check_and_increment_monthly_count
  - get_monthly_lesson_count
  - get_daily_lesson_count
  - check_and_increment_daily_count
  - get_user_plan
  - set_user_subscription_plan
  - has_paid_plan
  - get_trial_status
  - get_user_subscription_status
  
  ### 5. Enable RLS on Public Tables
  Enabled RLS and added appropriate policies for:
  - profiles
  - stripe_orders
  - stripe_subscriptions
  
  ### 6. Security Policies
  All new RLS policies follow the principle of least privilege:
  - Users can only access their own data
  - Service role required for sensitive operations
  - Proper authentication checks on all policies
*/

-- =====================================================
-- 1. FIX RLS PERFORMANCE ISSUES
-- =====================================================

-- Drop and recreate policies for user_limits
DROP POLICY IF EXISTS "Users can read their own limits" ON public.user_limits;
CREATE POLICY "Users can read their own limits"
  ON public.user_limits
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Drop and recreate policies for lessons
DROP POLICY IF EXISTS "Allow users to insert their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Allow users to read their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can read own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can insert own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can delete own lessons" ON public.lessons;

CREATE POLICY "Users can read own lessons"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own lessons"
  ON public.lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own lessons"
  ON public.lessons
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Drop and recreate policies for daily_lesson_counts
DROP POLICY IF EXISTS "Users can view own daily counts" ON public.daily_lesson_counts;
CREATE POLICY "Users can view own daily counts"
  ON public.daily_lesson_counts
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Drop and recreate policies for monthly_lesson_counts
DROP POLICY IF EXISTS "Users can view own monthly counts" ON public.monthly_lesson_counts;
CREATE POLICY "Users can view own monthly counts"
  ON public.monthly_lesson_counts
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 2. REMOVE UNUSED INDEX
-- =====================================================

DROP INDEX IF EXISTS public.lessons_user_id_created_at_idx;

-- =====================================================
-- 3. FIX FUNCTION SEARCH PATHS
-- =====================================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_plan_daily_limit(text);
DROP FUNCTION IF EXISTS public.get_plan_export_formats(text);
DROP FUNCTION IF EXISTS public.get_plan_monthly_limit(text);
DROP FUNCTION IF EXISTS public.get_monthly_lesson_count(uuid);
DROP FUNCTION IF EXISTS public.get_daily_lesson_count(uuid);
DROP FUNCTION IF EXISTS public.check_and_increment_daily_count(uuid);
DROP FUNCTION IF EXISTS public.check_and_increment_monthly_count(uuid);
DROP FUNCTION IF EXISTS public.get_user_plan(uuid);
DROP FUNCTION IF EXISTS public.set_user_subscription_plan(uuid, text);
DROP FUNCTION IF EXISTS public.has_paid_plan(uuid);
DROP FUNCTION IF EXISTS public.get_trial_status(uuid);
DROP FUNCTION IF EXISTS public.get_user_subscription_status(uuid);

-- Recreate functions with secure search_path
CREATE FUNCTION public.get_plan_daily_limit(p_plan_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN CASE p_plan_name
    WHEN 'free' THEN 3
    WHEN 'starter' THEN 10
    WHEN 'professional' THEN 50
    WHEN 'unlimited' THEN 999999
    ELSE 3
  END;
END;
$$;

CREATE FUNCTION public.get_plan_export_formats(p_plan_name text)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN CASE p_plan_name
    WHEN 'free' THEN ARRAY['pdf']
    WHEN 'starter' THEN ARRAY['pdf', 'docx']
    WHEN 'professional' THEN ARRAY['pdf', 'docx', 'html']
    WHEN 'unlimited' THEN ARRAY['pdf', 'docx', 'html', 'pptx']
    ELSE ARRAY['pdf']
  END;
END;
$$;

CREATE FUNCTION public.get_plan_monthly_limit(p_plan_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN CASE p_plan_name
    WHEN 'free' THEN 10
    WHEN 'starter' THEN 100
    WHEN 'professional' THEN 500
    WHEN 'unlimited' THEN 999999
    ELSE 10
  END;
END;
$$;

CREATE FUNCTION public.get_monthly_lesson_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count integer;
  v_current_month text;
BEGIN
  v_current_month := to_char(CURRENT_DATE, 'YYYY-MM');
  
  SELECT count INTO v_count
  FROM public.monthly_lesson_counts
  WHERE user_id = p_user_id AND year_month = v_current_month;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE FUNCTION public.get_daily_lesson_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count INTO v_count
  FROM public.daily_lesson_counts
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE FUNCTION public.check_and_increment_daily_count(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_count integer;
  v_daily_limit integer;
  v_plan_name text;
BEGIN
  SELECT plan INTO v_plan_name FROM public.user_limits WHERE user_id = p_user_id;
  v_plan_name := COALESCE(v_plan_name, 'free');
  
  v_daily_limit := public.get_plan_daily_limit(v_plan_name);
  v_current_count := public.get_daily_lesson_count(p_user_id);
  
  IF v_current_count >= v_daily_limit THEN
    RETURN false;
  END IF;
  
  INSERT INTO public.daily_lesson_counts (user_id, date, count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET count = public.daily_lesson_counts.count + 1;
  
  RETURN true;
END;
$$;

CREATE FUNCTION public.check_and_increment_monthly_count(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_count integer;
  v_monthly_limit integer;
  v_plan_name text;
  v_current_month text;
BEGIN
  v_current_month := to_char(CURRENT_DATE, 'YYYY-MM');
  
  SELECT plan INTO v_plan_name FROM public.user_limits WHERE user_id = p_user_id;
  v_plan_name := COALESCE(v_plan_name, 'free');
  
  v_monthly_limit := public.get_plan_monthly_limit(v_plan_name);
  v_current_count := public.get_monthly_lesson_count(p_user_id);
  
  IF v_current_count >= v_monthly_limit THEN
    RETURN false;
  END IF;
  
  INSERT INTO public.monthly_lesson_counts (user_id, year_month, count)
  VALUES (p_user_id, v_current_month, 1)
  ON CONFLICT (user_id, year_month)
  DO UPDATE SET count = public.monthly_lesson_counts.count + 1;
  
  RETURN true;
END;
$$;

CREATE FUNCTION public.get_user_plan(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_plan text;
BEGIN
  SELECT plan INTO v_plan FROM public.user_limits WHERE user_id = p_user_id;
  RETURN COALESCE(v_plan, 'free');
END;
$$;

CREATE FUNCTION public.set_user_subscription_plan(p_user_id uuid, p_plan_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_limits (user_id, plan)
  VALUES (p_user_id, p_plan_name)
  ON CONFLICT (user_id)
  DO UPDATE SET plan = p_plan_name;
END;
$$;

CREATE FUNCTION public.has_paid_plan(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_plan text;
BEGIN
  SELECT plan INTO v_plan FROM public.user_limits WHERE user_id = p_user_id;
  RETURN v_plan IS NOT NULL AND v_plan != 'free';
END;
$$;

CREATE FUNCTION public.get_trial_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_trial_uses integer;
  v_trial_ends timestamptz;
  v_trial_active boolean;
BEGIN
  SELECT trial_uses_remaining, trial_ends_at INTO v_trial_uses, v_trial_ends
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF v_trial_uses IS NULL THEN
    RETURN jsonb_build_object(
      'active', false,
      'usesRemaining', 5
    );
  END IF;
  
  v_trial_active := v_trial_uses > 0 AND now() < v_trial_ends;
  
  RETURN jsonb_build_object(
    'active', v_trial_active,
    'usesRemaining', v_trial_uses,
    'endsAt', v_trial_ends
  );
END;
$$;

CREATE FUNCTION public.get_user_subscription_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_plan text;
  v_stripe_status text;
  v_trial_info jsonb;
BEGIN
  SELECT ul.plan, ss.status INTO v_plan, v_stripe_status
  FROM public.user_limits ul
  LEFT JOIN public.stripe_subscriptions ss ON ul.user_id = ss.customer_id::uuid
  WHERE ul.user_id = p_user_id;
  
  v_plan := COALESCE(v_plan, 'free');
  v_trial_info := public.get_trial_status(p_user_id);
  
  RETURN jsonb_build_object(
    'plan', v_plan,
    'stripeStatus', v_stripe_status,
    'trial', v_trial_info
  );
END;
$$;

-- =====================================================
-- 4. ENABLE RLS ON PUBLIC TABLES
-- =====================================================

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Enable RLS on stripe_orders
ALTER TABLE public.stripe_orders ENABLE ROW LEVEL SECURITY;

-- Stripe orders policies - only service role can access
DROP POLICY IF EXISTS "Service role can manage orders" ON public.stripe_orders;

CREATE POLICY "Service role can manage orders"
  ON public.stripe_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on stripe_subscriptions
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Stripe subscriptions policies - only service role can access
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.stripe_subscriptions;

CREATE POLICY "Service role can manage subscriptions"
  ON public.stripe_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Add useful indexes that will actually be used
CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON public.lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_counts_user_date ON public.daily_lesson_counts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_monthly_counts_user_month ON public.monthly_lesson_counts(user_id, year_month);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
