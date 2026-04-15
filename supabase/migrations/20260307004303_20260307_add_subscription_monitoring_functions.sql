/*
  # Add subscription monitoring and validation functions

  1. New Functions
    - `verify_annual_plan_duration()`: Checks that annual subscriptions have ~12 month periods
    - `get_upcoming_renewals()`: Identifies subscriptions renewing soon
    - `check_subscription_health()`: Validates subscription data integrity

  2. Purpose
    - Monitor annual plan renewals automatically
    - Verify 12-month billing cycles are in place
    - Alert if renewal data looks incorrect
*/

-- Function to verify annual plans are 12 months long
CREATE OR REPLACE FUNCTION verify_annual_plan_duration()
RETURNS TABLE (
  customer_id text,
  subscription_id text,
  plan_type text,
  period_start timestamptz,
  period_end timestamptz,
  period_days integer,
  is_valid boolean,
  notes text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ss.customer_id,
    ss.subscription_id,
    CASE
      WHEN ss.price_id IN ('price_1T07ECCVrhYYeZRkvwIjJw4S', 'price_1SpaYECVrhYYeZRkoBDVNJU1') THEN 'starter'
      WHEN ss.price_id IN ('price_1T07EXCVrhYYeZRksH8u3rCl', 'price_1SpaYaCVrhYYeZRkzoB3NAVC') THEN 'standard'
      WHEN ss.price_id IN ('price_1T07F5CVrhYYeZRkj3cSujKL', 'price_1SpaYuCVrhYYeZRkL3hXHreu') THEN 'pro'
      ELSE 'unknown'
    END as plan_type,
    ss.current_period_start,
    ss.current_period_end,
    CAST(AGE(ss.current_period_end, ss.current_period_start) / interval '1 day' AS integer) as period_days,
    -- Annual plans should have 365-366 days, monthly should have 28-31 days
    CASE
      WHEN ss.price_id IN ('price_1T07ECCVrhYYeZRkvwIjJw4S', 'price_1T07EXCVrhYYeZRksH8u3rCl', 'price_1T07F5CVrhYYeZRkj3cSujKL')
        THEN (CAST(AGE(ss.current_period_end, ss.current_period_start) / interval '1 day' AS integer) BETWEEN 364 AND 367)
      WHEN ss.price_id IN ('price_1SpaYECVrhYYeZRkoBDVNJU1', 'price_1SpaYaCVrhYYeZRkzoB3NAVC', 'price_1SpaYuCVrhYYeZRkL3hXHreu')
        THEN (CAST(AGE(ss.current_period_end, ss.current_period_start) / interval '1 day' AS integer) BETWEEN 27 AND 32)
      ELSE false
    END as is_valid,
    CASE
      WHEN ss.status != 'active' THEN 'Subscription is ' || ss.status
      WHEN ss.current_period_end IS NULL THEN 'Period end date is missing'
      WHEN ss.current_period_start IS NULL THEN 'Period start date is missing'
      WHEN CAST(AGE(ss.current_period_end, ss.current_period_start) / interval '1 day' AS integer) < 1 THEN 'Period is less than 1 day'
      ELSE 'Valid'
    END as notes
  FROM stripe_subscriptions ss
  ORDER BY ss.current_period_end DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscriptions renewing within N days
CREATE OR REPLACE FUNCTION get_upcoming_renewals(days_ahead integer DEFAULT 30)
RETURNS TABLE (
  user_email text,
  plan text,
  renewal_date timestamptz,
  days_until_renewal integer,
  subscription_id text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.email,
    p.plan,
    ss.current_period_end,
    CAST((ss.current_period_end - NOW()) / interval '1 day' AS integer) as days_until_renewal,
    ss.subscription_id
  FROM stripe_subscriptions ss
  JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
  JOIN auth.users u ON sc.user_id = u.id
  JOIN profiles p ON sc.user_id = p.id
  WHERE ss.status = 'active'
    AND ss.current_period_end > NOW()
    AND ss.current_period_end <= NOW() + (days_ahead || ' days')::interval
  ORDER BY ss.current_period_end ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check overall subscription health
CREATE OR REPLACE FUNCTION check_subscription_health()
RETURNS TABLE (
  metric text,
  value text,
  status text
) AS $$
DECLARE
  v_total_subscriptions integer;
  v_active_subscriptions integer;
  v_invalid_periods integer;
  v_past_due_subscriptions integer;
  v_upcoming_renewals integer;
BEGIN
  SELECT COUNT(*) INTO v_total_subscriptions FROM stripe_subscriptions;
  SELECT COUNT(*) INTO v_active_subscriptions FROM stripe_subscriptions WHERE status = 'active';
  SELECT COUNT(*) INTO v_past_due_subscriptions FROM stripe_subscriptions WHERE status = 'past_due';
  SELECT COUNT(*) INTO v_invalid_periods FROM verify_annual_plan_duration() WHERE NOT is_valid;
  SELECT COUNT(*) INTO v_upcoming_renewals FROM get_upcoming_renewals(30);

  RETURN QUERY VALUES
    ('Total Subscriptions', v_total_subscriptions::text, CASE WHEN v_total_subscriptions > 0 THEN 'OK' ELSE 'No subscriptions' END),
    ('Active Subscriptions', v_active_subscriptions::text, CASE WHEN v_active_subscriptions > 0 THEN 'OK' ELSE 'None' END),
    ('Past Due Subscriptions', v_past_due_subscriptions::text, CASE WHEN v_past_due_subscriptions = 0 THEN 'OK' ELSE 'ALERT' END),
    ('Invalid Period Durations', v_invalid_periods::text, CASE WHEN v_invalid_periods = 0 THEN 'OK' ELSE 'ALERT' END),
    ('Renewals in Next 30 Days', v_upcoming_renewals::text, CASE WHEN v_upcoming_renewals >= 0 THEN 'OK' ELSE 'ERROR' END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
