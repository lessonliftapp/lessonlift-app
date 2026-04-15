import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const PRICE_TO_PLAN: Record<string, string> = {
  'price_1SpaYECVrhYYeZRkoBDVNJU1': 'starter',
  'price_1SpaYaCVrhYYeZRkzoB3NAVC': 'standard',
  'price_1SpaYuCVrhYYeZRkL3hXHreu': 'pro',
  'price_1T07ECCVrhYYeZRkvwIjJw4S': 'starter',
  'price_1T07EXCVrhYYeZRksH8u3rCl': 'standard',
  'price_1T07F5CVrhYYeZRkj3cSujKL': 'pro',
};

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        stripeWebhookSecret
      );
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(
        `Webhook signature verification failed: ${error.message}`,
        { status: 400 }
      );
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  console.log(`Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          await handleCheckoutSessionCompleted(session);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
    }
  } catch (error) {
    console.error(`Error handling event ${event.type}:`, error);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const userId = session.metadata?.user_id || session.client_reference_id;

  console.log(`Checkout completed for customer ${customerId}, user ${userId}`);

  if (!userId) {
    console.error('No user_id in checkout session metadata');
    return;
  }

  const { error: customerError } = await supabase
    .from('stripe_customers')
    .upsert(
      { user_id: userId, customer_id: customerId },
      { onConflict: 'user_id' }
    );

  if (customerError) {
    console.error('Error upserting stripe_customers:', customerError);
  }

  if (session.subscription) {
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method'],
    });

    await syncSubscription(subscription, userId);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  console.log(`Subscription ${subscription.status} for customer ${subscription.customer}, user ${userId}`);

  if (!userId) {
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;
    const { data: customerData } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (!customerData?.user_id) {
      console.error(`No user_id found for customer ${customerId}`);
      return;
    }

    await syncSubscription(subscription, customerData.user_id);
    return;
  }

  await syncSubscription(subscription, userId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const { error } = await supabase
    .from('stripe_subscriptions')
    .upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        status: 'canceled',
        cancel_at_period_end: false,
      },
      { onConflict: 'customer_id' }
    );

  if (error) {
    console.error('Error updating canceled subscription:', error);
    return;
  }

  const { data: customerData } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .maybeSingle();

  if (customerData?.user_id) {
    await supabase
      .from('profiles')
      .update({ plan: 'free', subscription_status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', customerData.user_id);
  }
}

async function syncSubscription(subscription: Stripe.Subscription, userId: string) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const rawPlanType = subscription.metadata?.plan_type
    || (priceId ? PRICE_TO_PLAN[priceId] : null)
    || null;
  const planType = rawPlanType ? rawPlanType.replace('_annual', '') : null;

  const paymentMethod = subscription.default_payment_method;
  const paymentBrand = (paymentMethod && typeof paymentMethod !== 'string')
    ? paymentMethod.card?.brand ?? null
    : null;
  const paymentLast4 = (paymentMethod && typeof paymentMethod !== 'string')
    ? paymentMethod.card?.last4 ?? null
    : null;

  const { error: subError } = await supabase
    .from('stripe_subscriptions')
    .upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: priceId,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        payment_method_brand: paymentBrand,
        payment_method_last4: paymentLast4,
        status: subscription.status,
      },
      { onConflict: 'customer_id' }
    );

  if (subError) {
    console.error('Error syncing stripe_subscriptions:', subError);
  } else {
    console.log(`Synced subscription ${subscription.id} with status ${subscription.status}`);
  }

  if (subscription.status === 'active' && planType) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan: planType,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile plan:', profileError);
    } else {
      console.log(`Set plan ${planType} and subscription_status=active for user ${userId}`);
    }

    await supabase
      .from('usage_tracking')
      .upsert(
        { user_id: userId, plan: planType },
        { onConflict: 'user_id' }
      );

    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email;
    const userMeta = userData?.user?.user_metadata;
    const userName = (userMeta?.first_name && userMeta?.last_name)
      ? `${userMeta.first_name} ${userMeta.last_name}`.trim()
      : userMeta?.name || userMeta?.full_name || 'Teacher';

    if (userEmail) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'welcome',
          to: userEmail,
          name: userName,
          plan: planType,
        }),
      }).catch((err) => console.error('Failed to send welcome email:', err));
    }
  } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
    await supabase
      .from('profiles')
      .update({
        plan: 'free',
        subscription_status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }
}
