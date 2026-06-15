const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://wqelwzlnxhbhiedmxona.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_INr3m7b6-y55MSRt9c9-ew_paoZMPan";

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function main() {
  console.log("Iniciando generación de páginas estáticas de noticias...");

  try {
    // 1. Obtener noticias, eventos y fotos de Supabase
    const headers = {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    };

    const newsResponse = await fetch(`${SUPABASE_URL}/rest/v1/news?status=eq.published&select=*&order=created_at.desc`, { headers });
    if (!newsResponse.ok) {
      throw new Error(`Error al consultar noticias en Supabase: ${newsResponse.status} ${newsResponse.statusText}`);
    }
    const news = await newsResponse.json();
    console.log(`Se encontraron ${news.length} noticias publicadas.`);

    const eventsResponse = await fetch(`${SUPABASE_URL}/rest/v1/events?select=*&order=date.asc,time.asc`, { headers });
    if (!eventsResponse.ok) {
      throw new Error(`Error al consultar eventos en Supabase: ${eventsResponse.status} ${eventsResponse.statusText}`);
    }
    const events = await eventsResponse.json();
    console.log(`Se encontraron ${events.length} eventos (incluyendo configuraciones).`);

    const photosResponse = await fetch(`${SUPABASE_URL}/rest/v1/photos?select=*&order=created_at.desc`, { headers });
    if (!photosResponse.ok) {
      throw new Error(`Error al consultar fotos en Supabase: ${photosResponse.status} ${photosResponse.statusText}`);
    }
    const photos = await photosResponse.json();
    console.log(`Se encontraron ${photos.length} fotos.`);

    // Crear la carpeta data/ si no existe y guardar los archivos JSON
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, 'news.json'), JSON.stringify(news, null, 2), 'utf-8');
    fs.writeFileSync(path.join(dataDir, 'events.json'), JSON.stringify(events, null, 2), 'utf-8');
    fs.writeFileSync(path.join(dataDir, 'photos.json'), JSON.stringify(photos, null, 2), 'utf-8');
    console.log("  [OK] Archivos de datos estáticos guardados en la carpeta /data/");

    // 2. Leer las plantillas base
    const templatePathVal = path.join(__dirname, '..', 'noticies.html');
    const templatePathCast = path.join(__dirname, '..', 'es', 'noticies.html');

    if (!fs.existsSync(templatePathVal)) {
      throw new Error(`No se encuentra la plantilla en Valenciano: ${templatePathVal}`);
    }
    if (!fs.existsSync(templatePathCast)) {
      throw new Error(`No se encuentra la plantilla en Castellano: ${templatePathCast}`);
    }

    const templateVal = fs.readFileSync(templatePathVal, 'utf-8');
    const templateCast = fs.readFileSync(templatePathCast, 'utf-8');

    // 3. Procesar cada noticia
    for (const article of news) {
      console.log(`Procesando noticia: "${article.title}" (ID: ${article.id})`);

      // Determinar la URL de la imagen (usar proxy si es Base64)
      let imageUrl = article.image_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800";
      if (imageUrl.startsWith("data:image")) {
        imageUrl = `https://wqelwzlnxhbhiedmxona.supabase.co/functions/v1/share?image-for-slug=${article.slug || article.id}`;
      }

      // --- GENERAR VERSIÓN EN VALENCIANO ---
      if (article.slug) {
        const slug = article.slug;
        const outDir = path.join(__dirname, '..', 'noticies', slug);
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }

        const title = article.title;
        const subtitle = article.subtitle || "";
        const redirectUrl = `https://www.comiares.es/noticies/${slug}/`;

        let html = templateVal;

        // Reemplazar Meta Tags en Valenciano
        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)} | Comissió de Festes d'Ares del Maestrat</title>`);
        html = html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escapeHtml(subtitle)}">`);
        
        // Open Graph
        html = html.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${redirectUrl}">`);
        html = html.replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${escapeHtml(title)}">`);
        html = html.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${escapeHtml(subtitle)}">`);
        html = html.replace(/<meta property="og:image" content="[^"]*">/i, `<meta property="og:image" content="${imageUrl}">`);

        // Twitter
        html = html.replace(/<meta property="twitter:url" content="[^"]*">/i, `<meta property="twitter:url" content="${redirectUrl}">`);
        html = html.replace(/<meta property="twitter:title" content="[^"]*">/i, `<meta property="twitter:title" content="${escapeHtml(title)}">`);
        html = html.replace(/<meta property="twitter:description" content="[^"]*">/i, `<meta property="twitter:description" content="${escapeHtml(subtitle)}">`);
        html = html.replace(/<meta property="twitter:image" content="[^"]*">/i, `<meta property="twitter:image" content="${imageUrl}">`);

        // Canonical
        html = html.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${redirectUrl}">`);

        // Rutas absolutas a la raíz / se usan por defecto, no es necesario ajustar profundidades

        // Inyectar variable de slug estático en el head para la SPA
        const injectionScript = `
    <!-- Inyectado por el generador JAMstack -->
    <script>
      window.staticArticleSlug = "${slug}";
    </script>
  </head>`;
        html = html.replace(/<\/head>/i, injectionScript);

        // Guardar archivo
        fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
        console.log(`  [OK] Creado: noticies/${slug}/index.html`);
      }

      // --- GENERAR VERSIÓN EN CASTELLANO ---
      if (article.slug_es) {
        const slugEs = article.slug_es;
        const outDir = path.join(__dirname, '..', 'es', 'noticies', slugEs);
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }

        const titleEs = article.title_es || article.title;
        const subtitleEs = article.subtitle_es || article.subtitle || "";
        const redirectUrl = `https://www.comiares.es/es/noticies/${slugEs}/`;

        let html = templateCast;

        // Reemplazar Meta Tags en Castellano
        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(titleEs)} | Comisión de Fiestas de Ares del Maestrat</title>`);
        html = html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escapeHtml(subtitleEs)}">`);
        
        // Open Graph
        html = html.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${redirectUrl}">`);
        html = html.replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${escapeHtml(titleEs)}">`);
        html = html.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${escapeHtml(subtitleEs)}">`);
        html = html.replace(/<meta property="og:image" content="[^"]*">/i, `<meta property="og:image" content="${imageUrl}">`);

        // Twitter
        html = html.replace(/<meta property="twitter:url" content="[^"]*">/i, `<meta property="twitter:url" content="${redirectUrl}">`);
        html = html.replace(/<meta property="twitter:title" content="[^"]*">/i, `<meta property="twitter:title" content="${escapeHtml(titleEs)}">`);
        html = html.replace(/<meta property="twitter:description" content="[^"]*">/i, `<meta property="twitter:description" content="${escapeHtml(subtitleEs)}">`);
        html = html.replace(/<meta property="twitter:image" content="[^"]*">/i, `<meta property="twitter:image" content="${imageUrl}">`);

        // Canonical
        html = html.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${redirectUrl}">`);

        // Rutas absolutas a la raíz / se usan por defecto, no es necesario ajustar profundidades

        // Inyectar variable de slug estático en el head para la SPA
        const injectionScript = `
    <!-- Inyectado por el generador JAMstack -->
    <script>
      window.staticArticleSlug = "${slugEs}";
    </script>
  </head>`;
        html = html.replace(/<\/head>/i, injectionScript);

        // Guardar archivo
        fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
        console.log(`  [OK] Creado: es/noticies/${slugEs}/index.html`);
      }
    }

    // --- GENERAR LISTADOS DE NOTICIAS DE SUBDIRECTORIO ---
    console.log("Generando archivos index.html para listados de noticias en subdirectorios...");
    
    // Valenciano: copiar noticies.html a noticies/index.html
    const listDirVal = path.join(__dirname, '..', 'noticies');
    if (!fs.existsSync(listDirVal)) {
      fs.mkdirSync(listDirVal, { recursive: true });
    }
    fs.writeFileSync(path.join(listDirVal, 'index.html'), templateVal, 'utf-8');
    console.log("  [OK] Creado listado: noticies/index.html");

    // Castellano: copiar es/noticies.html a es/noticies/index.html
    const listDirCast = path.join(__dirname, '..', 'es', 'noticies');
    if (!fs.existsSync(listDirCast)) {
      fs.mkdirSync(listDirCast, { recursive: true });
    }
    fs.writeFileSync(path.join(listDirCast, 'index.html'), templateCast, 'utf-8');
    console.log("  [OK] Creado listado: es/noticies/index.html");

    console.log("Generación completada exitosamente.");
  } catch (error) {
    console.error("Error crítico durante la generación de noticias:", error);
    process.exit(1);
  }
}

main();
