// supabase/functions/stripe-webhook/index.ts
// Edge Function: Handles Stripe webhook events (checkout.session.completed)
// to save reservation to DB and send email notifications.
// Deploy with: supabase functions deploy stripe-webhook

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "comiares@gmail.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const rawBody = await req.text();

  // Verify Stripe signature
  let event: any;
  try {
    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }
    // Manual signature verification using Web Crypto API
    const parts = signature.split(",").reduce((acc: any, part) => {
      const [key, value] = part.split("=");
      if (!acc[key]) acc[key] = [];
      acc[key].push(value);
      return acc;
    }, {});
    const timestamp = parts.t?.[0];
    const signatures = parts.v1 || [];
    const signedPayload = `${timestamp}.${rawBody}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(STRIPE_WEBHOOK_SECRET);
    const messageData = encoder.encode(signedPayload);
    const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const computedSig = Array.from(new Uint8Array(signatureBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const isValid = signatures.some((sig: string) => sig === computedSig);
    if (!isValid) {
      return new Response("Invalid signature", { status: 400 });
    }

    event = JSON.parse(rawBody);
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  // Only handle checkout.session.completed
  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const session = event.data.object;
  const meta = session.metadata ?? {};
  const name = meta.name ?? "";
  const surname = meta.surname ?? "";
  const email = meta.email ?? session.customer_email ?? "";
  const size = meta.size ?? "";
  const quantity = parseInt(meta.quantity ?? "1", 10);
  const notes = meta.notes ?? "";
  const amountCents = session.amount_total ?? 0;

  // Save reservation to Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error: dbError } = await supabase.from("reservations").insert([{
    name,
    surname,
    email,
    size,
    quantity,
    amount_cents: amountCents,
    stripe_session_id: session.id,
    stripe_payment_id: session.payment_intent ?? null,
    status: "paid",
    notes,
    created_at: new Date().toISOString(),
  }]);

  if (dbError) {
    console.error("Error saving reservation:", dbError);
    return new Response("DB error", { status: 500 });
  }

  // Send emails via Resend
  if (RESEND_API_KEY) {
    const dateStr = new Date().toLocaleDateString("ca-ES", { day: "2-digit", month: "long", year: "numeric" });
    const amountStr = (amountCents / 100).toFixed(2) + "€";

    // Email to buyer
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Comissió de Festes d'Ares <noreply@comiares.es>",
        to: [email],
        subject: `✅ Confirmació de reserva — Camiseta Talla ${size}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #000; padding: 24px 32px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 24px; letter-spacing: 0.05em;">COMISSIÓ DE FESTES</h1>
              <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 13px;">Ares del Maestrat</p>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
              <h2 style="margin: 0 0 8px; font-size: 20px;">Reserva confirmada! 🎉</h2>
              <p style="color: #6b7280; margin: 0 0 24px;">Hola <strong>${name}</strong>, hem rebut el teu pagament correctament.</p>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280;">Detalls de la reserva</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Nom:</td><td style="padding: 4px 0; font-weight: 600; font-size: 14px;">${name} ${surname}</td></tr>
                  <tr><td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Talla:</td><td style="padding: 4px 0; font-weight: 600; font-size: 14px;">${size}</td></tr>
                  <tr><td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Quantitat:</td><td style="padding: 4px 0; font-weight: 600; font-size: 14px;">${quantity}</td></tr>
                  <tr><td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Import pagat:</td><td style="padding: 4px 0; font-weight: 600; font-size: 14px;">${amountStr}</td></tr>
                  <tr><td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Data:</td><td style="padding: 4px 0; font-size: 14px;">${dateStr}</td></tr>
                </table>
              </div>

              <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>ℹ️ Informació important:</strong> Un cop tancat el període de reserves, enviarem les comandes a fàbrica. Quan les camisetes estiguen llestes, t'avisarem per email amb les instruccions per a recollir-les.
                </p>
              </div>

              <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 0;">
                Comissió de Festes d'Ares del Maestrat · <a href="https://www.comiares.es" style="color: #6b7280;">www.comiares.es</a>
              </p>
            </div>
          </div>
        `,
      }),
    }).catch((e) => console.warn("Error sending confirmation email:", e));

    // Email to admin
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Comissió de Festes d'Ares <noreply@comiares.es>",
        to: [ADMIN_EMAIL],
        subject: `🛒 Nova reserva camiseta — ${name} ${surname} (${size} × ${quantity})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
            <h2 style="margin: 0 0 16px;">🛒 Nova reserva rebuda</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 40%;">Nom:</td><td style="padding: 6px 0; font-weight: 600; font-size: 14px;">${name} ${surname}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Email:</td><td style="padding: 6px 0; font-size: 14px;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Talla:</td><td style="padding: 6px 0; font-weight: 700; font-size: 16px;">${size}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Quantitat:</td><td style="padding: 6px 0; font-size: 14px;">${quantity}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Import:</td><td style="padding: 6px 0; font-weight: 600; font-size: 14px; color: #15803d;">${amountStr}</td></tr>
              ${notes ? `<tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Notes:</td><td style="padding: 6px 0; font-size: 14px;">${notes}</td></tr>` : ""}
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Stripe Session:</td><td style="padding: 6px 0; font-size: 12px; color: #9ca3af;">${session.id}</td></tr>
            </table>
            <p style="margin: 16px 0 0; font-size: 13px; color: #9ca3af;">
              Veure totes les reserves: <a href="https://www.comiares.es/admin/#tab-camisetes">Panel d'administració</a>
            </p>
          </div>
        `,
      }),
    }).catch((e) => console.warn("Error sending admin notification email:", e));
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
