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

  // F4: Validar el secret compartit entre el webhook de Supabase i aquesta funci\u00f3.
  // El secret s'ha de configurar com a variable d'entorn "WEBHOOK_SECRET" a Supabase Secrets
  // i usar el mateix valor al configurar el Database Webhook de Supabase.
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  const authHeader = req.headers.get("Authorization");

  if (!webhookSecret) {
    console.error("WEBHOOK_SECRET no est\u00e0 configurat als Supabase Secrets.");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
    console.warn("Intent d'acc\u00e9s no autoritzat a trigger-deploy.");
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
