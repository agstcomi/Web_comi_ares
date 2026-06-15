const fs = require('fs');
const path = require('path');

// Les credencials es llegeixen de variables d'entorn injectades per GitHub Actions Secrets.
// MAI escriure credencials directament en el codi font.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("ERROR: Les variables d'entorn SUPABASE_URL i SUPABASE_ANON_KEY són obligatòries.");
  console.error("Configura-les com a GitHub Secrets i assegura't que el workflow les injecta.");
  process.exit(1);
}


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

        // Inyectar variable de slug estático en el head para la SPA, robots tags y metadata Schema.org
        const injectionScript = `
    <!-- Inyectado por el generador JAMstack -->
    <meta name="robots" content="max-image-preview:large">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": ${JSON.stringify(title)},
      "description": ${JSON.stringify(subtitle)},
      "image": [
        "${imageUrl}"
      ],
      "datePublished": "${article.created_at}T08:00:00+02:00",
      "dateModified": "${article.updated_at || article.created_at}T08:00:00+02:00",
      "author": [{
        "@type": "Organization",
        "name": "Comissió de Festes d'Ares del Maestrat",
        "url": "https://www.comiares.es"
      }],
      "publisher": {
        "@type": "Organization",
        "name": "Comissió de Festes d'Ares del Maestrat",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.comiares.es/img/logo.svg"
        }
      }
    }
    </script>
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

        // Inyectar variable de slug estático en el head para la SPA, robots tags y metadata Schema.org
        const injectionScript = `
    <!-- Inyectado por el generador JAMstack -->
    <meta name="robots" content="max-image-preview:large">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": ${JSON.stringify(titleEs)},
      "description": ${JSON.stringify(subtitleEs)},
      "image": [
        "${imageUrl}"
      ],
      "datePublished": "${article.created_at}T08:00:00+02:00",
      "dateModified": "${article.updated_at || article.created_at}T08:00:00+02:00",
      "author": [{
        "@type": "Organization",
        "name": "Comisión de Fiestas de Ares del Maestrat",
        "url": "https://www.comiares.es/es/"
      }],
      "publisher": {
        "@type": "Organization",
        "name": "Comisión de Fiestas de Ares del Maestrat",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.comiares.es/img/logo.svg"
        }
      }
    }
    </script>
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

    // --- ACTUALIZAR SITEMAP.XML ---
    const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      let sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
      let dynamicXml = '\n';
      
      for (const article of news) {
        if (article.slug) {
          const date = article.updated_at || article.created_at || new Date().toISOString().split('T')[0];
          const valUrl = `https://www.comiares.es/noticies/${article.slug}/`;
          const castUrl = article.slug_es ? `https://www.comiares.es/es/noticies/${article.slug_es}/` : valUrl;
          
          // Valencian article entry
          dynamicXml += `    <url>
        <loc>${valUrl}</loc>
        <lastmod>${date}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
        <xhtml:link rel="alternate" hreflang="ca" href="${valUrl}"/>
        <xhtml:link rel="alternate" hreflang="ca-ES" href="${valUrl}"/>
        <xhtml:link rel="alternate" hreflang="es" href="${castUrl}"/>
        <xhtml:link rel="alternate" hreflang="es-ES" href="${castUrl}"/>
        <xhtml:link rel="alternate" hreflang="x-default" href="${valUrl}"/>
    </url>\n`;

          // Castellano article entry if it has a Spanish slug
          if (article.slug_es) {
            dynamicXml += `    <url>
        <loc>${castUrl}</loc>
        <lastmod>${date}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
        <xhtml:link rel="alternate" hreflang="ca" href="${valUrl}"/>
        <xhtml:link rel="alternate" hreflang="ca-ES" href="${valUrl}"/>
        <xhtml:link rel="alternate" hreflang="es" href="${castUrl}"/>
        <xhtml:link rel="alternate" hreflang="es-ES" href="${castUrl}"/>
        <xhtml:link rel="alternate" hreflang="x-default" href="${valUrl}"/>
    </url>\n`;
          }
        }
      }
      
      const startIndex = sitemapContent.indexOf('<!-- DYNAMIC NEWS START -->');
      const endIndex = sitemapContent.indexOf('<!-- DYNAMIC NEWS END -->');
      
      if (startIndex !== -1 && endIndex !== -1) {
        sitemapContent = sitemapContent.substring(0, startIndex + '<!-- DYNAMIC NEWS START -->'.length) +
                         dynamicXml + '    ' +
                         sitemapContent.substring(endIndex);
        fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');
        console.log("  [OK] sitemap.xml actualizado con las URLs dinámicas de noticias.");
      } else {
        console.warn("  [WARN] No se encontraron los marcadores <!-- DYNAMIC NEWS START --> y <!-- DYNAMIC NEWS END --> en sitemap.xml");
      }
    }

    console.log("Generación completada exitosamente.");
  } catch (error) {
    console.error("Error crítico durante la generación de noticias:", error);
    process.exit(1);
  }
}

main();
