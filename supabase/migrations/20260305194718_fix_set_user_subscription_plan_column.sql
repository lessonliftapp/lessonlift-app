/*
  # Fix set_user_subscription_plan function

  1. Changes
    - Updates the function to use the correct column name `plan` (not `subscription_plan`)
    - The profiles table has a `plan` column, not `subscription_plan`
    - Also updates `subscription_status` to 'active' when a paid plan is set

  2. Notes
    - Called by the stripe-webhook edge function after a successful payment
    - p_user_id is a text parameter (uuid as text from Stripe metadata)
    - p_plan is one of: 'starter', 'standard', 'pro'
*/

CREATE OR REPLACE FUNCTION public.set_user_subscription_plan(p_user_id text, p_plan text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    plan = p_plan,
    subscription_status = 'active',
    updated_at = now()
  WHERE id = p_user_id::uuid;
END;
$$;
