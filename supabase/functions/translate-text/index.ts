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
    const { text, email } = await req.json();
    if (!text) {
      throw new Error("Text parameter is missing");
    }

    const emailParam = email || "comissio@aresdelmaestrat.com";
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ca|es&de=${encodeURIComponent(emailParam)}`;

    console.log(`Translating text via MyMemory API (length: ${text.length})...`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`MyMemory API error: HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.responseStatus && data.responseStatus !== 200) {
      throw new Error(data.responseDetails || `MyMemory API status ${data.responseStatus}`);
    }

    const translatedText = data?.responseData?.translatedText || "";

    return new Response(JSON.stringify({ translatedText }), {
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
