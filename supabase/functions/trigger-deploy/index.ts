import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
