import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, body, url, image, icon } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: "Missing notification title" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "BB2zPqciG55GvUr54fwH4UORMp0b8nvBiRgxmxgft-gBE0CYHDXZDz-z46CEpR1pMQSeXDotdaAZi7wbU7vS6Ec";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "yY_FmZ-eMK9W1lv0y-5_pqwoqCe7NSEKHTOVrJKiMm4";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@comiares.es";

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not configured.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtenir totes les subscripcionsPush de la base de dades
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, sentCount: 0, message: "No active push subscriptions found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const payload = JSON.stringify({
      title: title,
      body: body || "Nova publicació disponible!",
      url: url || "/noticies.html",
      image: image || null,
      icon: icon || "/img/logo.png"
    });

    let sentCount = 0;
    let removedCount = 0;
    const errors: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          sentCount++;
        } catch (err: any) {
          // Si el servidor Push diu 410 o 404 (Gone / Expired), eliminar de la DB
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
            removedCount++;
          } else {
            console.error(`Error sending push to ${sub.endpoint}:`, err);
            errors.push(err.message || String(err));
          }
        }
      })
    );

    return new Response(JSON.stringify({ 
      success: true, 
      sentCount, 
      removedCount, 
      total: subscriptions.length,
      errors: errors.length > 0 ? errors : undefined 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in send-push-notification function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
