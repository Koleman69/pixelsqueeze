import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from "https://esm.sh/stripe@18.5.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Complimentary (free forever) access is granted server-side only and always
    // wins over Stripe: no customer or subscription is required.
    const { data: compRow } = await supabaseClient
      .from("subscribers")
      .select("complimentary_access, subscription_tier")
      .eq("user_id", user.id)
      .maybeSingle();

    if (compRow?.complimentary_access === true) {
      logStep("Complimentary access granted", { userId: user.id });
      return new Response(JSON.stringify({
        subscribed: true,
        is_trialing: false,
        trial_end: null,
        product_id: null,
        subscription_end: null,
        subscription_tier: compRow.subscription_tier ?? "Pro",
        complimentary: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }


    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for both active and trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });
    
    // Filter for active or trialing status
    const validSubscription = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );
    
    const hasValidSub = !!validSubscription;
    let productId = null;
    let subscriptionEnd = null;
    let isTrialing = false;
    let trialEnd = null;

    if (hasValidSub) {
      const subscription = validSubscription;
      isTrialing = subscription.status === 'trialing';
      
      // Safely handle the subscription end date
      const periodEnd = subscription.current_period_end;
      if (periodEnd && typeof periodEnd === 'number' && periodEnd > 0) {
        subscriptionEnd = new Date(periodEnd * 1000).toISOString();
      }
      
      // Get trial end date if in trial
      if (isTrialing && subscription.trial_end) {
        trialEnd = new Date(subscription.trial_end * 1000).toISOString();
      }
      
      logStep("Valid subscription found", { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        isTrialing,
        trialEnd,
        endDate: subscriptionEnd 
      });
      productId = subscription.items.data[0]?.price?.product || null;
      logStep("Determined subscription tier", { productId });
    } else {
      logStep("No active or trialing subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasValidSub,
      is_trialing: isTrialing,
      trial_end: trialEnd,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
})