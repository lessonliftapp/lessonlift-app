# Annual Plan Validation Guide

## Overview
This document verifies that annual subscription plans are correctly configured to last 12 months and renew automatically.

## Current Configuration

### Annual Plan Price IDs
- **Starter Annual**: `price_1T07ECCVrhYYeZRkvwIjJw4S` (£45/year)
- **Standard Annual**: `price_1T07EXCVrhYYeZRksH8u3rCl` (£75/year)
- **Pro Annual**: `price_1T07F5CVrhYYeZRkj3cSujKL` (£120/year)

### How Annual Plans Work

#### 1. **Stripe Configuration**
- Annual prices MUST be configured with `billing_scheme: recurring` and `recurring.interval: year`
- Stripe automatically handles 12-month billing cycles
- Stripe automatically renews subscriptions every 12 months

#### 2. **Subscription Tracking in Database**
The subscription details are stored in the `stripe_subscriptions` table:

```sql
-- Key columns:
current_period_start   -- When current billing period started (timestamp)
current_period_end     -- When current billing period ends (timestamp)
status                 -- 'active', 'past_due', 'canceled', etc.
cancel_at_period_end   -- If true, subscription will cancel at period end
```

For annual plans:
- `current_period_end` will be exactly 12 months (365 or 366 days) after `current_period_start`
- When renewal occurs, Stripe fires `customer.subscription.updated` webhook
- The webhook updates `current_period_start` and `current_period_end` to the next 12-month period

#### 3. **Renewal Process**

**Timeline for Annual Plans:**
1. **Day 1**: User purchases annual plan
   - `current_period_start`: 2024-03-07
   - `current_period_end`: 2025-03-07
   - Stripe charges immediately

2. **Month 11**: Stripe automatically collects payment for renewal
   - Payment is collected before the period ends
   - If payment fails, subscription status changes to 'past_due'

3. **Day 365 (Period End)**: Subscription renews if payment successful
   - `current_period_start`: 2025-03-07
   - `current_period_end`: 2026-03-07
   - Webhook fires: `customer.subscription.updated`
   - Database is updated with new period dates

4. **If Payment Fails**: Subscription goes to 'past_due' status
   - User's plan reverts to 'free' in the profiles table
   - User receives email notification
   - Stripe retries payment for 4+ days

#### 4. **Webhook Handling**

The `stripe-webhook` Edge Function handles all subscription events:

```typescript
case 'customer.subscription.created':
case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription;
  await handleSubscriptionChange(subscription);
  break;
}
```

For renewal events specifically:
- Webhook receives updated `current_period_start` and `current_period_end`
- These are synced to the database in ISO format
- User plan status is verified and updated if needed
- Period dates in the database always match what Stripe has

#### 5. **Verifying Renewal Configuration**

To verify annual plans are correctly set up in Stripe Dashboard:

1. Go to **Products** > Find the annual price
2. Check **Billing Scheme**: Should be "Recurring"
3. Check **Recurring**:
   - Interval: "Year"
   - Interval count: "1"
4. Check **Trial Period**: Should be "None" (unless trial is desired)

### Key Points for Annual Plans

✅ **What's Correct:**
- Stripe handles the 12-month calculation automatically
- Renewals happen automatically via Stripe's subscription system
- `current_period_end` in database always reflects the next renewal date
- Webhooks sync renewal events to the database automatically
- If renewal fails, Stripe retries and marks subscription as 'past_due'
- User is downgraded to 'free' plan if subscription is not active

✅ **Automatic Behaviors:**
- No manual renewal logic needed - Stripe handles it
- No cron jobs required - Stripe fires webhooks on renewal
- Subscription automatically renews unless explicitly canceled

⚠️ **If Annual Plans Are Not Renewing:**
1. Verify Stripe prices have `recurring.interval = 'year'`
2. Check that payments are being collected
3. Look at webhook logs to ensure `customer.subscription.updated` events are firing
4. Verify database `current_period_end` is being updated correctly
5. Check payment method on file is valid

### Testing Annual Plan Renewal

**Local Testing with Stripe Test Clock:**
1. Create a test price with annual interval
2. Use Stripe test mode with test card: `4242 4242 4242 4242`
3. Use Stripe's Test Clock feature to advance time to near renewal
4. Stripe will automatically trigger renewal events
5. Watch webhook logs to confirm events are processed

**Database Query to Verify Renewal:**
```sql
-- Check subscription period dates
SELECT
  customer_id,
  subscription_id,
  status,
  current_period_start,
  current_period_end,
  AGE(current_period_end, current_period_start) as period_duration
FROM stripe_subscriptions
WHERE status = 'active'
ORDER BY current_period_end DESC;

-- For annual plans, AGE() should show ~12 months (365 days)
-- For monthly plans, should show ~1 month (28-31 days)
```

### Monitoring Renewals

To monitor subscription renewals in the database:

```sql
-- Check which subscriptions are coming due for renewal soon
SELECT
  sc.user_id,
  ss.subscription_id,
  ss.current_period_end,
  p.plan,
  NOW() AS current_time,
  ss.current_period_end - NOW() as time_until_renewal
FROM stripe_subscriptions ss
JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
JOIN profiles p ON sc.user_id = p.id
WHERE ss.status = 'active'
  AND ss.current_period_end > NOW()
  AND ss.current_period_end < NOW() + INTERVAL '30 days'
ORDER BY ss.current_period_end;
```

## Summary

Annual plans are configured correctly if:
1. ✅ Stripe prices have 12-month intervals
2. ✅ Subscriptions store `current_period_end` exactly 12 months after `current_period_start`
3. ✅ Webhooks update renewal dates automatically
4. ✅ No manual renewal code is needed
5. ✅ Stripe handles all retry logic and payment collection

The system relies on Stripe's built-in subscription renewal system, which is the industry standard for handling recurring billing.
