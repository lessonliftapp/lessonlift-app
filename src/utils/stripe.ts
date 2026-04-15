import { supabase } from '../lib/supabase';

interface CheckoutSessionParams {
  priceId: string;
  planType: 'starter' | 'standard' | 'pro';
}

export async function createCheckoutSession({ priceId, planType }: CheckoutSessionParams): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be logged in to checkout');
  }

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_id: priceId,
      mode: 'subscription',
      plan_type: planType,
      success_url: `${window.location.origin}/payment-success`,
      cancel_url: `${window.location.origin}/pricing`,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Checkout error:', errorData);
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  const { url } = await response.json();

  if (!url) {
    throw new Error('No Stripe checkout URL returned');
  }

  window.location.href = url;
}
