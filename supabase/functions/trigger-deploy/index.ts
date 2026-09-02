import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// F5: CORS restringit - no s'ha d'exposar aquesta funci\u00f3 a origens externs.
// Els webhooks de Supabase Database criden servidor-servidor, no des d'un navegador.
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://supabase.com",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // F4: Validar el secret compartit entre el webhook de Supabase i aquesta funció.
  // Es valida contra WEBHOOK_SECRET, la clau de servei (SUPABASE_SERVICE_ROLE_KEY) o la clau anònima (SUPABASE_ANON_KEY).
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  const apikeyHeader = req.headers.get("apikey") || req.headers.get("ApiKey");

  const isAuthorized =
    (webhookSecret && (authHeader === `Bearer ${webhookSecret}` || authHeader === webhookSecret)) ||
    (serviceRoleKey && (authHeader === `Bearer ${serviceRoleKey}` || authHeader === serviceRoleKey)) ||
    (anonKey && (authHeader === `Bearer ${anonKey}` || apikeyHeader === anonKey));

  if (!isAuthorized) {
    console.warn("Intent d'accés no autoritzat a trigger-deploy. Auth present:", !!authHeader, "apikey present:", !!apikeyHeader);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  try {
    const githubPat = Deno.env.get("GITHUB_PAT");
    if (!githubPat) {
      throw new Error("GITHUB_PAT environment variable is not set in Supabase Secrets");
    }

    const repoOwner = "agstcomi";
    const repoName = "Web_comi_ares";
    const githubUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`;

    // Disparar el evento de repository_dispatch en GitHub
    const res = await fetch(githubUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${githubPat}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Supabase-Webhook-Trigger",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "supabase-news-update",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GitHub API error: HTTP ${res.status} - ${errText}`);
    }

    return new Response(JSON.stringify({ success: true, message: "GitHub workflow trigger dispatch sent successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
