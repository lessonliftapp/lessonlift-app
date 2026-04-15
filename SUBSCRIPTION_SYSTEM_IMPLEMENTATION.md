# Subscription System Implementation Details

## Architecture Overview

The subscription system is built on three core components:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER PURCHASES PLAN                      │
│                      (PricingPage.tsx)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CREATE CHECKOUT SESSION                         │
│         (stripe-checkout Edge Function)                      │
│  - Creates/updates Stripe customer                          │
│  - Creates checkout session with price_id                   │
│  - Passes plan_type in metadata                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            STRIPE PAYMENT & SUBSCRIPTION CREATION            │
│           (Happens in Stripe, not our system)               │
│  - User completes payment on Stripe Checkout               │
│  - Stripe creates subscription with 12-month billing       │
│  - Subscription status: "active"                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              WEBHOOK: CHECKOUT.SESSION.COMPLETED             │
│         (stripe-webhook Edge Function)                      │
│  - Retrieves full subscription details from Stripe         │
│  - Calls syncSubscription() with full subscription data    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              WEBHOOK: SUBSCRIPTION.UPDATED                   │
│         (stripe-webhook Edge Function)                      │
│  - Fires 11 months before renewal for payment collection   │
│  - Fires on renewal (new period starts)                    │
│  - Fires on cancellation or other changes                  │
│  - Calls syncSubscription() with updated data              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            DATABASE UPDATES IN SYNC FUNCTION                │
│  1. Update stripe_subscriptions table:                      │
│     - current_period_start                                 │
│     - current_period_end                                   │
│     - status                                               │
│     - cancel_at_period_end                                 │
│                                                            │
│  2. Update profiles table:                                 │
│     - plan (starter/standard/pro/free)                    │
│     - subscription_status (active/inactive)               │
│                                                            │
│  3. Update usage_tracking table:                          │
│     - Ensure user's plan is tracked                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            APPLICATION USES SUBSCRIPTION DATA                │
│  - Dashboard shows plan and remaining lessons              │
│  - Lesson creation checks daily/monthly limits             │
│  - Export limits enforced based on plan                    │
│  - Plan restrictions applied consistently                  │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

### Frontend Components
- `src/components/pricing/PricingPage.tsx` - Plan selection UI, switches between monthly/annual
- `src/utils/stripe.ts` - `createCheckoutSession()` function calls Edge Function
- `src/components/SubscriptionStatus.tsx` - Shows current plan and renewal date

### Backend Services
- `src/services/stripe.ts` - Exports checkout function
- `supabase/functions/stripe-checkout/index.ts` - Creates checkout session, manages Stripe customer creation
- `supabase/functions/stripe-webhook/index.ts` - Handles all webhook events, syncs subscription data

### Database
- `profiles` - User plan and subscription status
- `stripe_customers` - Maps user_id to Stripe customer_id
- `stripe_subscriptions` - Stores subscription details from Stripe
- `usage_tracking` - Monitors lesson plan usage

## Detailed Renewal Flow for Annual Plans

### Initial Purchase (Day 0)
```typescript
// User selects annual plan in PricingPage.tsx
const planType = 'starter_annual' // For annual Starter plan
const priceId = 'price_1T07ECCVrhYYeZRkvwIjJw4S' // Annual Starter price

// Frontend calls checkout function
await createCheckoutSession({
  priceId: priceId,
  planType: planType, // Contains "_annual" suffix
})
```

### Edge Function: Create Checkout Session
```typescript
// File: supabase/functions/stripe-checkout/index.ts

// 1. Authenticate user
const user = await supabase.auth.getUser(token)

// 2. Create or retrieve Stripe customer
const customer = await stripe.customers.create({
  email: user.email,
  metadata: { userId: user.id }
})

// 3. Create checkout session with plan metadata
const session = await stripe.checkout.sessions.create({
  customer: customer.id,
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  subscription_data: {
    metadata: {
      user_id: user.id,
      plan_type: 'starter_annual' // Passed to webhook
    }
  }
})
```

### Stripe Creates Subscription
```
Stripe receives the checkout completion:
- Creates subscription with recurring.interval = 'year'
- Sets current_period_start = now
- Sets current_period_end = now + 365 days
- Status = 'active'
- Charges payment immediately
- Sets next payment date ~11 months from now
```

### Webhook: Checkout Session Completed
```typescript
// File: supabase/functions/stripe-webhook/index.ts
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session
  if (session.mode === 'subscription') {
    // Get full subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    )
    // Sync it to database
    await syncSubscription(subscription, userId)
  }
}
```

### Database Sync
```typescript
async function syncSubscription(subscription: Stripe.Subscription, userId: string) {
  // Extract period dates from Stripe
  const currentPeriodStart = new Date(subscription.current_period_start * 1000)
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

  // For annual plans, currentPeriodEnd will be 365 days after currentPeriodStart

  // Update stripe_subscriptions table
  await supabase.from('stripe_subscriptions').upsert({
    customer_id: customerId,
    subscription_id: subscription.id,
    current_period_start: currentPeriodStart.toISOString(),
    current_period_end: currentPeriodEnd.toISOString(), // 12 months away
    status: subscription.status, // 'active'
    cancel_at_period_end: subscription.cancel_at_period_end,
  })

  // Update profiles table
  await supabase.from('profiles').update({
    plan: 'starter', // Removes '_annual' suffix
    subscription_status: 'active'
  })
}
```

### 11 Months Later: Payment Reminder
```
Stripe fires webhook event (no user action needed):
- Event: 'invoice.created'
- Stripe collects payment for next period
- Payment method is charged automatically
```

### 12 Months: Subscription Renewal
```
Stripe automatically renews subscription:
- Sets new current_period_start = previous end date
- Sets new current_period_end = new start + 365 days
- Updates subscription status

Stripe fires webhook event:
- Event: 'customer.subscription.updated'
- subscription.current_period_start = 2025-03-07
- subscription.current_period_end = 2026-03-07
```

### Webhook: Subscription Updated (Renewal)
```typescript
case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription
  await handleSubscriptionChange(subscription)
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  // Get user_id from metadata or lookup via customer_id
  const userId = subscription.metadata?.user_id ||
                 (await lookupUserByCustomerId(subscription.customer))

  // Sync updated subscription with NEW period dates
  await syncSubscription(subscription, userId)
}
```

### Database Updated with Renewal Dates
```sql
-- Before renewal (period ending)
SELECT current_period_start, current_period_end FROM stripe_subscriptions
WHERE subscription_id = 'sub_xyz';
-- 2024-03-07 | 2025-03-07

-- After renewal (same record, updated dates)
SELECT current_period_start, current_period_end FROM stripe_subscriptions
WHERE subscription_id = 'sub_xyz';
-- 2025-03-07 | 2026-03-07
```

## Payment Failure Scenario

### Payment Fails During Renewal
```
Stripe fires webhooks:
1. 'invoice.payment_failed' - Payment attempt failed
2. 'customer.subscription.updated' - Status = 'past_due'

Webhook handler calls syncSubscription() with:
- subscription.status = 'past_due'

Database updated:
- stripe_subscriptions.status = 'past_due'
- profiles.plan = 'free'
- profiles.subscription_status = 'inactive'
```

### Stripe Retries
```
Stripe retries payment for 4+ days automatically
- No action needed from our system
- Webhook fires if retry succeeds or gives up
```

### If Payment Eventually Succeeds
```
Stripe fires webhook:
- Event: 'customer.subscription.updated'
- subscription.status = 'active'

Database updated:
- stripe_subscriptions.status = 'active'
- stripe_subscriptions.current_period_end = now + 365 days
- profiles.plan = 'starter'
- profiles.subscription_status = 'active'
```

## Key Implementation Details

### Price ID Mapping
```typescript
const PRICE_TO_PLAN: Record<string, string> = {
  // Annual prices (12-month billing)
  'price_1T07ECCVrhYYeZRkvwIjJw4S': 'starter', // £45/year
  'price_1T07EXCVrhYYeZRksH8u3rCl': 'standard', // £75/year
  'price_1T07F5CVrhYYeZRkj3cSujKL': 'pro', // £120/year

  // Monthly prices (1-month billing)
  'price_1SpaYECVrhYYeZRkoBDVNJU1': 'starter', // £4.99/month
  'price_1SpaYaCVrhYYeZRkzoB3NAVC': 'standard', // £7.99/month
  'price_1SpaYuCVrhYYeZRkL3hXHreu': 'pro', // £12.99/month
}
```

### Plan Suffix Handling
```typescript
// When user selects annual, frontend sends plan_type with '_annual'
const planType = billingCycle === 'annual' ? `${baseType}_annual` : baseType
// 'starter_annual' vs 'starter'

// Webhook removes suffix when storing in database
const planType = rawPlanType ? rawPlanType.replace('_annual', '') : null
// Stores as 'starter' in profiles.plan
```

### Period Duration for Annual Plans
```sql
-- For annual subscriptions, this should show ~365 days:
SELECT
  subscription_id,
  current_period_start,
  current_period_end,
  AGE(current_period_end, current_period_start) as duration
FROM stripe_subscriptions
WHERE price_id IN (
  'price_1T07ECCVrhYYeZRkvwIjJw4S',
  'price_1T07EXCVrhYYeZRksH8u3rCl',
  'price_1T07F5CVrhYYeZRkj3cSujKL'
);

-- Result: "1 year" or "365 days"
```

## Verification Queries

### Check All Active Subscriptions
```sql
SELECT
  sc.user_id,
  u.email,
  ss.subscription_id,
  ss.price_id,
  CASE
    WHEN ss.price_id IN ('price_1T07ECCVrhYYeZRkvwIjJw4S', 'price_1T07EXCVrhYYeZRksH8u3rCl', 'price_1T07F5CVrhYYeZRkj3cSujKL')
      THEN 'Annual'
    ELSE 'Monthly'
  END as billing_cycle,
  p.plan,
  ss.current_period_start,
  ss.current_period_end,
  ss.status
FROM stripe_subscriptions ss
JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
JOIN auth.users u ON sc.user_id = u.id
JOIN profiles p ON sc.user_id = p.id
WHERE ss.status = 'active'
ORDER BY ss.current_period_end DESC;
```

### Verify Annual Plans Have 12-Month Periods
```sql
SELECT * FROM verify_annual_plan_duration();

-- Shows:
-- customer_id | subscription_id | plan_type | period_days | is_valid | notes
```

### Get Renewals Happening Soon
```sql
SELECT * FROM get_upcoming_renewals(30);

-- Shows subscriptions renewing in next 30 days
```

## Summary

The annual subscription system:
1. ✅ Relies on Stripe's built-in 12-month billing cycles
2. ✅ Syncs all period dates from Stripe via webhooks
3. ✅ Stores renewal dates in `stripe_subscriptions.current_period_end`
4. ✅ Automatically updates on renewal via webhook events
5. ✅ Handles payment failures with automatic retries
6. ✅ Downgrades to free plan if subscription lapses
7. ✅ Requires no manual intervention or cron jobs

The key insight is that **Stripe handles all renewal logic automatically**, and our system simply syncs the data via webhooks. The `current_period_end` date tells us exactly when the next renewal will occur.
