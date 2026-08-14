// supabase/functions/create-checkout-session/index.ts
// Edge Function: Creates a Stripe Checkout session for t-shirt reservations.
// Deploy with: supabase functions deploy create-checkout-session

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.comiares.es";
const PRICE_CENTS = 3500; // 35€ per unit

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const body = await req.json();
    const { name, surname, email, size, quantity = 1, notes = "" } = body;

    if (!name || !surname || !email || !size) {
      return new Response(
        JSON.stringify({ error: "Falten camps obligatoris: name, surname, email, size" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeQuantity = Math.min(Math.max(parseInt(quantity, 10) || 1, 1), 10);
    const totalCents = PRICE_CENTS * safeQuantity;

    // Create Stripe Checkout Session
    const stripeBody = new URLSearchParams({
      "payment_method_types[]": "card",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][product_data][name]": `Camiseta Festes Ares 2026 — Talla ${size}`,
      "line_items[0][price_data][product_data][description]": `${safeQuantity} x Camiseta talla ${size} — Comissió de Festes d'Ares del Maestrat`,
      "line_items[0][price_data][unit_amount]": PRICE_CENTS.toString(),
      "line_items[0][quantity]": safeQuantity.toString(),
      "mode": "payment",
      "customer_email": email,
      "success_url": `${SITE_URL}/camisetes/confirmacio.html?session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url": `${SITE_URL}/camisetes.html?cancelled=1`,
      "metadata[name]": name,
      "metadata[surname]": surname,
      "metadata[email]": email,
      "metadata[size]": size,
      "metadata[quantity]": safeQuantity.toString(),
      "metadata[notes]": notes,
    });

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: stripeBody.toString(),
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Stripe error:", session);
      throw new Error(session.error?.message ?? "Error creating Stripe session");
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("create-checkout-session error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
