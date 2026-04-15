/*
  # Add stripe_customers table and fix stripe_subscriptions

  1. New Tables
    - `stripe_customers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, unique, references auth.users)
      - `customer_id` (text, unique) — Stripe customer ID
      - `created_at`, `updated_at`

  2. Modified Tables
    - `stripe_subscriptions`: add unique constraint on `customer_id` so upsert works correctly

  3. Security
    - Enable RLS on `stripe_customers`
    - Users can only read their own customer record (service role manages writes)
    - Add authenticated user SELECT policy on `stripe_subscriptions` via join on `stripe_customers`

  4. Notes
    - The `stripe-checkout` edge function creates rows in `stripe_customers` when a new Stripe customer is created
    - The webhook upserts into `stripe_subscriptions` using `customer_id` as conflict key
*/

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

-- Add unique constraint on stripe_subscriptions.customer_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stripe_subscriptions_customer_id_key'
      AND conrelid = 'stripe_subscriptions'::regclass
  ) THEN
    ALTER TABLE stripe_subscriptions ADD CONSTRAINT stripe_subscriptions_customer_id_key UNIQUE (customer_id);
  END IF;
END $$;

-- Add RLS policy so authenticated users can read their own subscription via stripe_customers join
CREATE POLICY "Users can view own subscription"
  ON stripe_subscriptions FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers WHERE user_id = auth.uid()
    )
  );
