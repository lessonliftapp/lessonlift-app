/*
  # Create Stripe tables and user profiles for subscription management

  1. New Tables
    - `profiles` table: stores user subscription plan and status
      - `id` (uuid, primary key, references auth.users)
      - `plan` (text: 'free', 'starter', 'standard', 'pro')
      - `subscription_status` (text: 'inactive', 'active', 'canceled')
      - `first_name`, `last_name` (user metadata)
      - `created_at`, `updated_at`
    
    - `stripe_customers` table: maps users to Stripe customer IDs
      - `id` (uuid, primary key)
      - `user_id` (uuid, unique, references auth.users)
      - `customer_id` (text, unique) — Stripe customer ID
      - `created_at`, `updated_at`
    
    - `stripe_subscriptions` table: tracks subscription details from Stripe
      - `id` (uuid, primary key)
      - `customer_id` (text, unique) — Stripe customer ID
      - `subscription_id` (text) — Stripe subscription ID
      - `price_id` (text) — Stripe price ID
      - `status` (text) — Subscription status from Stripe
      - `current_period_start`, `current_period_end` (timestamps) — Billing period dates
      - `cancel_at_period_end` (boolean) — Whether subscription will cancel
      - `payment_method_brand`, `payment_method_last4` — Payment details
      - `created_at`, `updated_at`

  2. Security
    - Enable RLS on all new tables
    - Users can only read their own data
    - Service role manages Stripe webhook writes

  3. Important Notes
    - Annual plans must have 12-month billing cycles in Stripe
    - The `current_period_end` field tracks when the next renewal occurs
    - For annual plans: renewals happen every 12 months automatically via Stripe
    - For monthly plans: renewals happen every month
    - Stripe webhooks sync current_period_start/end to database
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'standard', 'pro')),
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'canceled')),
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create stripe_customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customer record"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage stripe customers"
  ON stripe_customers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create stripe_subscriptions table
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text UNIQUE NOT NULL,
  subscription_id text NOT NULL,
  price_id text,
  status text NOT NULL DEFAULT 'not_started',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_brand text,
  payment_method_last4 text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON stripe_subscriptions FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage stripe subscriptions"
  ON stripe_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create usage_tracking table for monitoring plan usage
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  lessons_this_month integer DEFAULT 0,
  lessons_this_year integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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
