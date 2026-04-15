import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    if (!stripeSecretKey) throw new Error("Stripe secret key not configured");

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Authentication failed');

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-11-20.acacia" });

    const { planType, billingCycle } = await req.json();
    if (!planType || !billingCycle) throw new Error("Plan type and billing cycle are required");
    if (!['starter', 'standard', 'pro'].includes(planType)) throw new Error("Invalid plan type");
    if (!['monthly', 'annual'].includes(billingCycle)) throw new Error("Invalid billing cycle");

    // Map plan + billing cycle to the correct Stripe price ID
    let priceId = '';
    if (planType === 'starter') {
      priceId = billingCycle === 'monthly'
        ? Deno.env.get('STRIPE_PRICE_STARTER')!
        : Deno.env.get('STRIPE_PRICE_STARTER_ANNUAL')!;
    } else if (planType === 'standard') {
      priceId = billingCycle === 'monthly'
        ? Deno.env.get('STRIPE_PRICE_STANDARD')!
        : Deno.env.get('STRIPE_PRICE_STANDARD_ANNUAL')!;
    } else if (planType === 'pro') {
      priceId = billingCycle === 'monthly'
        ? Deno.env.get('STRIPE_PRICE_PRO')!
        : Deno.env.get('STRIPE_PRICE_PRO_ANNUAL')!;
    }

    if (!priceId) throw new Error("Stripe price ID not found for selected plan");

    const productionDomain = "https://lessonlift.co.uk";
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const baseUrl = origin.includes("localhost") ? origin : productionDomain;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_type: planType,
          billing_cycle: billingCycle,
          email: user.email,
        },
      },
      metadata: {
        user_id: user.id,
        plan_type: planType,
        billing_cycle: billingCycle,
        email: user.email,
      },
      customer_email: user.email,
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});