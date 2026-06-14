import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const id = url.searchParams.get("id");
    const imageForSlug = url.searchParams.get("image-for-slug");
    const imageForId = url.searchParams.get("image-for-id");
    const langParam = url.searchParams.get("lang");

    // Helper: Redirect to news list fallback
    const redirectToHome = (isEs: boolean) => {
      const target = isEs ? "https://www.comiares.es/es/noticies.html" : "https://www.comiares.es/noticies.html";
      return new Response("", {
        status: 302,
        headers: { "Location": target }
      });
    };

    // --- PROXY DE IMÁGENES (Para renderizar imágenes Base64 guardadas en la DB como binarios binarios en og:image) ---
    if (imageForSlug || imageForId) {
      let query = supabase.from("news").select("image_url");
      if (imageForSlug) {
        query = query.or(`slug.eq.${imageForSlug},slug_es.eq.${imageForSlug}`);
      } else if (imageForId) {
        query = query.eq("id", imageForId);
      }

      const { data, error } = await query.eq("status", "published").limit(1);

      if (error || !data || data.length === 0 || !data[0].image_url) {
        // Fallback: Redirigir a una imagen por defecto
        return Response.redirect("https://www.comiares.es/img/og-cover.jpg", 302);
      }

      const imageUrl = data[0].image_url;

      if (imageUrl.startsWith("data:image")) {
        const matches = imageUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const bytes = base64Decode(base64Data);

          return new Response(bytes, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=86400", // Caché de 1 día
            },
          });
        }
      }

      // Si no es Base64, es un enlace HTTP directo: redirigir a la imagen real
      return Response.redirect(imageUrl, 307);
    }

    // --- CARGA Y RENDERIZADO DE NOTICIA (Metadatos + Redirección) ---
    if (!slug && !id) {
      return redirectToHome(langParam === "es");
    }

    let query = supabase.from("news").select("*");
    if (slug) {
      query = query.or(`slug.eq.${slug},slug_es.eq.${slug}`);
    } else if (id) {
      query = query.eq("id", id);
    }

    const { data, error } = await query.eq("status", "published").limit(1);

    if (error || !data || data.length === 0) {
      return redirectToHome(langParam === "es");
    }

    const article = data[0];

    // Determinar si la noticia es en Español
    // Se considera español si el parámetro lang es 'es' o si el slug solicitado coincide con slug_es
    const isEs = langParam === "es" || (slug ? article.slug_es === slug : false);
    const lang = isEs ? "es" : "ca";

    // Obtener campos correspondientes al idioma
    const title = isEs && article.title_es ? article.title_es : article.title;
    const subtitle = isEs && article.subtitle_es ? article.subtitle_es : article.subtitle;
    
    // Determinar el og:image apropiado
    let ogImageUrl = article.image_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800";
    if (ogImageUrl.startsWith("data:image")) {
      // Si la imagen es Base64, la servimos a través del proxy de la función
      const functionBase = `https://${url.hostname}/functions/v1/share`;
      if (article.slug) {
        ogImageUrl = `${functionBase}?image-for-slug=${article.slug}`;
      } else {
        ogImageUrl = `${functionBase}?image-for-id=${article.id}`;
      }
    }

    // Enlaces de destino final (Canonical & Redirect)
    const targetSlug = isEs && article.slug_es ? article.slug_es : article.slug;
    const pathPrefix = isEs ? "/es" : "";
    const redirectQuery = targetSlug ? `?slug=${targetSlug}` : `?id=${article.id}`;
    const redirectUrl = `https://www.comiares.es${pathPrefix}/noticies.html${redirectQuery}`;

    // Construir la respuesta HTML con metadatos para crawlers y redirección JS para usuarios reales
    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  
  <!-- SEO & Open Graph / Facebook -->
  <meta name="description" content="${escapeHtml(subtitle || "")}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${redirectUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(subtitle || "")}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Comissió de Festes d'Ares">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${redirectUrl}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(subtitle || "")}">
  <meta name="twitter:image" content="${ogImageUrl}">
  
  <!-- Redirección automática inmediata para navegadores de usuarios -->
  <script type="text/javascript">
    window.location.replace("${redirectUrl}");
  </script>
  
  <!-- Fallback de redirección (si JS está desactivado) -->
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f4f4f5; color: #27272a; text-align: center; padding: 2rem;">
  <div>
    <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Redirigint a la notícia... / Redirigiendo a la noticia...</div>
    <div style="color: #71717a;">Si no et redirigeix automàticament, <a href="${redirectUrl}" style="color: #2563eb; text-decoration: underline;">fes clic ací</a>.</div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=UTF-8",
      },
      status: 200,
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, {
      headers: corsHeaders,
      status: 500,
    });
  }
});

// Helper simple para escapar entidades HTML básicas de forma segura
function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
