/*
  # Add Newsletter Subscribers Table

  ## Summary
  Creates a table to store newsletter email subscribers captured from the footer
  signup form on the public landing page.

  ## New Tables
  - `newsletter_subscribers`
    - `id` (uuid, primary key)
    - `email` (text, unique) — subscriber's email address
    - `subscribed_at` (timestamptz) — when they subscribed
    - `confirmed` (boolean) — whether a confirmation email was sent successfully

  ## Security
  - RLS enabled
  - No authenticated user policy needed — inserts are done by service role via edge function
  - Service role has full access
*/

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  confirmed boolean NOT NULL DEFAULT false
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage newsletter subscribers"
  ON newsletter_subscribers FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read newsletter subscribers"
  ON newsletter_subscribers FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update newsletter subscribers"
  ON newsletter_subscribers FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_email_idx ON newsletter_subscribers(email);
