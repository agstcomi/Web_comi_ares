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

function getAbsoluteImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("data:image")) return "";
  
  let resolvedUrl = url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    resolvedUrl = url;
  } else {
    const cleanUrl = url.startsWith("/") ? url.slice(1) : url;
    resolvedUrl = `https://www.comiares.es/${cleanUrl}`;
  }

  // Convert to WebP if local image format
  const isLocal = resolvedUrl.startsWith("https://www.comiares.es/");
  if (isLocal) {
    const lastDot = resolvedUrl.lastIndexOf('.');
    if (lastDot !== -1) {
      const ext = resolvedUrl.substring(lastDot).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
        resolvedUrl = resolvedUrl.substring(0, lastDot) + '.webp';
      }
    }
  }
  return resolvedUrl;
}

async function main() {
  console.log("Iniciando generación de páginas estáticas de noticias...");

  try {
    // 1. Obtener noticias, eventos y fotos de Supabase
    const headers = {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    };

    const newsResponse = await fetch(`${SUPABASE_URL}/rest/v1/news?status=in.(published,scheduled)&select=*&order=created_at.desc`, { headers });
    if (!newsResponse.ok) {
      throw new Error(`Error al consultar noticias en Supabase: ${newsResponse.status} ${newsResponse.statusText}`);
    }
    const allFetchedNews = await newsResponse.json();
    const now = new Date();
    const news = allFetchedNews.filter(item => {
      if (item.status === 'draft') return false;
      const pubDateStr = item.published_at || item.created_at;
      if (pubDateStr) {
        const pubDate = new Date(pubDateStr);
        if (!isNaN(pubDate.getTime()) && pubDate > now) {
          return false; // Scheduled for future date/time -> skip until exact moment
        }
      }
      return true;
    });
    console.log(`Se encontraron ${news.length} noticias publicadas accesibles en el front.`);

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

    const productsResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`, { headers });
    if (!productsResponse.ok) {
      throw new Error(`Error al consultar productos en Supabase: ${productsResponse.status} ${productsResponse.statusText}`);
    }
    const products = await productsResponse.json();
    console.log(`Se encontraron ${products.length} productos.`);

    // Crear la carpeta data/ si no existe y guardar los archivos JSON
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, 'news.json'), JSON.stringify(news, null, 2), 'utf-8');
    fs.writeFileSync(path.join(dataDir, 'events.json'), JSON.stringify(events, null, 2), 'utf-8');
    fs.writeFileSync(path.join(dataDir, 'photos.json'), JSON.stringify(photos, null, 2), 'utf-8');
    fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2), 'utf-8');
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
        const castUrl = article.slug_es ? `https://www.comiares.es/es/noticies/${article.slug_es}/` : redirectUrl;

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

        // Canonical & Alternates (hreflang)
        html = html.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${redirectUrl}">`);
        html = html.replace(/<link rel="alternate" hreflang="ca" href="[^"]*">/i, `<link rel="alternate" hreflang="ca" href="${redirectUrl}">`);
        html = html.replace(/<link rel="alternate" hreflang="ca-ES" href="[^"]*">/i, `<link rel="alternate" hreflang="ca-ES" href="${redirectUrl}">`);
        html = html.replace(/<link rel="alternate" hreflang="es" href="[^"]*">/i, `<link rel="alternate" hreflang="es" href="${castUrl}">`);
        html = html.replace(/<link rel="alternate" hreflang="es-ES" href="[^"]*">/i, `<link rel="alternate" hreflang="es-ES" href="${castUrl}">`);
        html = html.replace(/<link rel="alternate" hreflang="x-default" href="[^"]*">/i, `<link rel="alternate" hreflang="x-default" href="${redirectUrl}">`);

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
        const valUrl = article.slug ? `https://www.comiares.es/noticies/${article.slug}/` : redirectUrl;

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

        // Canonical & Alternates (hreflang)
        html = html.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${redirectUrl}">`);
        html = html.replace(/<link rel="alternate" hreflang="ca" href="[^"]*">/i, `<link rel="alternate" hreflang="ca" href="${valUrl}">`);
        html = html.replace(/<link rel="alternate" hreflang="ca-ES" href="[^"]*">/i, `<link rel="alternate" hreflang="ca-ES" href="${valUrl}">`);
        html = html.replace(/<link rel="alternate" hreflang="es" href="[^"]*">/i, `<link rel="alternate" hreflang="es" href="${redirectUrl}">`);
        html = html.replace(/<link rel="alternate" hreflang="es-ES" href="[^"]*">/i, `<link rel="alternate" hreflang="es-ES" href="${redirectUrl}">`);
        html = html.replace(/<link rel="alternate" hreflang="x-default" href="[^"]*">/i, `<link rel="alternate" hreflang="x-default" href="${valUrl}">`);

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

    // --- GENERAR PÁGINAS ESTÁTICAS DE PRODUCTOS (CAMISETES) ---
    console.log("Generando páginas estáticas de productos...");
    const templateProdValPath = path.join(__dirname, '..', 'camisetes.html');
    const templateProdCastPath = path.join(__dirname, '..', 'es', 'camisetes.html');

    if (fs.existsSync(templateProdValPath) && fs.existsSync(templateProdCastPath)) {
      const templateProdVal = fs.readFileSync(templateProdValPath, 'utf-8');
      const templateProdCast = fs.readFileSync(templateProdCastPath, 'utf-8');

      for (const product of products) {
        if (!product.slug) continue;
        console.log(`Procesando producto: "${product.name}" (Slug: ${product.slug})`);

        let imageUrl = product.image_url || "https://www.comiares.es/img/camiseta-product.jpg";
        imageUrl = getAbsoluteImageUrl(imageUrl);

        // --- VALENCIANO ---
        const outDirVal = path.join(__dirname, '..', 'camisetes', product.slug);
        if (!fs.existsSync(outDirVal)) {
          fs.mkdirSync(outDirVal, { recursive: true });
        }

        const titleVal = product.name || "Camiseta Festes Ares SD";
        const descVal = product.description || "Reserva la camiseta oficial de les Festes Patronals d'Ares del Maestrat 2026.";
        const redirectUrlVal = `https://www.comiares.es/camisetes/${product.slug}/`;
        const redirectUrlCast = `https://www.comiares.es/es/camisetes/${product.slug}/`;

        let htmlVal = templateProdVal;
        htmlVal = htmlVal.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(titleVal)} | Tenda Oficial Comissió de Festes</title>`);
        htmlVal = htmlVal.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escapeHtml(descVal)}">`);
        htmlVal = htmlVal.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${redirectUrlVal}">`);
        htmlVal = htmlVal.replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${escapeHtml(titleVal)}">`);
        htmlVal = htmlVal.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${escapeHtml(descVal)}">`);
        htmlVal = htmlVal.replace(/<meta property="og:image" content="[^"]*">/i, `<meta property="og:image" content="${imageUrl}">`);
        htmlVal = htmlVal.replace(/<meta property="twitter:url" content="[^"]*">/i, `<meta property="twitter:url" content="${redirectUrlVal}">`);
        htmlVal = htmlVal.replace(/<meta property="twitter:title" content="[^"]*">/i, `<meta property="twitter:title" content="${escapeHtml(titleVal)}">`);
        htmlVal = htmlVal.replace(/<meta property="twitter:description" content="[^"]*">/i, `<meta property="twitter:description" content="${escapeHtml(descVal)}">`);
        htmlVal = htmlVal.replace(/<meta property="twitter:image" content="[^"]*">/i, `<meta property="twitter:image" content="${imageUrl}">`);
        htmlVal = htmlVal.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${redirectUrlVal}">`);
        htmlVal = htmlVal.replace(/<link rel="alternate" hreflang="ca" href="[^"]*">/i, `<link rel="alternate" hreflang="ca" href="${redirectUrlVal}">`);
        htmlVal = htmlVal.replace(/<link rel="alternate" hreflang="ca-ES" href="[^"]*">/i, `<link rel="alternate" hreflang="ca-ES" href="${redirectUrlVal}">`);
        htmlVal = htmlVal.replace(/<link rel="alternate" hreflang="es" href="[^"]*">/i, `<link rel="alternate" hreflang="es" href="${redirectUrlCast}">`);
        htmlVal = htmlVal.replace(/<link rel="alternate" hreflang="es-ES" href="[^"]*">/i, `<link rel="alternate" hreflang="es-ES" href="${redirectUrlCast}">`);
        htmlVal = htmlVal.replace(/<link rel="alternate" hreflang="x-default" href="[^"]*">/i, `<link rel="alternate" hreflang="x-default" href="${redirectUrlVal}">`);

        const injectionVal = `
    <!-- Inyectado por el generador JAMstack de productos -->
    <meta name="robots" content="max-image-preview:large">
    <script>
      window.staticProductSlug = "${product.slug}";
    </script>
  </head>`;
        htmlVal = htmlVal.replace(/<\/head>/i, injectionVal);

        fs.writeFileSync(path.join(outDirVal, 'index.html'), htmlVal, 'utf-8');
        console.log(`  [OK] Creado: camisetes/${product.slug}/index.html`);

        // --- CASTELLANO ---
        const outDirCast = path.join(__dirname, '..', 'es', 'camisetes', product.slug);
        if (!fs.existsSync(outDirCast)) {
          fs.mkdirSync(outDirCast, { recursive: true });
        }

        const titleCast = product.name_es || product.name || "Camiseta Fiestas Ares SD";
        const descCast = product.description_es || product.description || "Reserva la camiseta oficial de las Fiestas Patronales de Ares del Maestrat 2026.";

        let htmlCast = templateProdCast;
        htmlCast = htmlCast.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(titleCast)} | Tienda Oficial Comisión de Fiestas</title>`);
        htmlCast = htmlCast.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escapeHtml(descCast)}">`);
        htmlCast = htmlCast.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${redirectUrlCast}">`);
        htmlCast = htmlCast.replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${escapeHtml(titleCast)}">`);
        htmlCast = htmlCast.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${escapeHtml(descCast)}">`);
        htmlCast = htmlCast.replace(/<meta property="og:image" content="[^"]*">/i, `<meta property="og:image" content="${imageUrl}">`);
        htmlCast = htmlCast.replace(/<meta property="twitter:url" content="[^"]*">/i, `<meta property="twitter:url" content="${redirectUrlCast}">`);
        htmlCast = htmlCast.replace(/<meta property="twitter:title" content="[^"]*">/i, `<meta property="twitter:title" content="${escapeHtml(titleCast)}">`);
        htmlCast = htmlCast.replace(/<meta property="twitter:description" content="[^"]*">/i, `<meta property="twitter:description" content="${escapeHtml(descCast)}">`);
        htmlCast = htmlCast.replace(/<meta property="twitter:image" content="[^"]*">/i, `<meta property="twitter:image" content="${imageUrl}">`);
        htmlCast = htmlCast.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${redirectUrlCast}">`);
        htmlCast = htmlCast.replace(/<link rel="alternate" hreflang="ca" href="[^"]*">/i, `<link rel="alternate" hreflang="ca" href="${redirectUrlVal}">`);
        htmlCast = htmlCast.replace(/<link rel="alternate" hreflang="ca-ES" href="[^"]*">/i, `<link rel="alternate" hreflang="ca-ES" href="${redirectUrlVal}">`);
        htmlCast = htmlCast.replace(/<link rel="alternate" hreflang="es" href="[^"]*">/i, `<link rel="alternate" hreflang="es" href="${redirectUrlCast}">`);
        htmlCast = htmlCast.replace(/<link rel="alternate" hreflang="es-ES" href="[^"]*">/i, `<link rel="alternate" hreflang="es-ES" href="${redirectUrlCast}">`);
        htmlCast = htmlCast.replace(/<link rel="alternate" hreflang="x-default" href="[^"]*">/i, `<link rel="alternate" hreflang="x-default" href="${redirectUrlVal}">`);

        const injectionCast = `
    <!-- Inyectado por el generador JAMstack de productos -->
    <meta name="robots" content="max-image-preview:large">
    <script>
      window.staticProductSlug = "${product.slug}";
    </script>
  </head>`;
        htmlCast = htmlCast.replace(/<\/head>/i, injectionCast);

        fs.writeFileSync(path.join(outDirCast, 'index.html'), htmlCast, 'utf-8');
        console.log(`  [OK] Creado: es/camisetes/${product.slug}/index.html`);
      }
    }

    // --- ACTUALIZAR SITEMAP.XML ---
    const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      let sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
      
      // Update News
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
        console.log("  [OK] sitemap.xml preparado con las URLs dinámicas de noticias.");
      } else {
        console.warn("  [WARN] No se encontraron los marcadores <!-- DYNAMIC NEWS START --> y <!-- DYNAMIC NEWS END --> en sitemap.xml");
      }

      // Update Products
      let productsXml = '\n';
      for (const product of products) {
        if (product.slug) {
          const date = product.created_at ? product.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
          const valUrl = `https://www.comiares.es/camisetes/${product.slug}/`;
          const castUrl = `https://www.comiares.es/es/camisetes/${product.slug}/`;
          
          // Valencian product entry
          productsXml += `    <url>
        <loc>${valUrl}</loc>
        <lastmod>${date}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
        <xhtml:link rel="alternate" hreflang="ca" href="${valUrl}"/>
        <xhtml:link rel="alternate" hreflang="ca-ES" href="${valUrl}"/>
        <xhtml:link rel="alternate" hreflang="es" href="${castUrl}"/>
        <xhtml:link rel="alternate" hreflang="es-ES" href="${castUrl}"/>
        <xhtml:link rel="alternate" hreflang="x-default" href="${valUrl}"/>
    </url>\n`;

          // Castellano product entry
          productsXml += `    <url>
        <loc>${castUrl}</loc>
        <lastmod>${date}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
        <xhtml:link rel="alternate" hreflang="ca" href="${valUrl}"/>
        <xhtml:link rel="alternate" hreflang="ca-ES" href="${valUrl}"/>
        <xhtml:link rel="alternate" hreflang="es" href="${castUrl}"/>
        <xhtml:link rel="alternate" hreflang="es-ES" href="${castUrl}"/>
        <xhtml:link rel="alternate" hreflang="x-default" href="${valUrl}"/>
    </url>\n`;
        }
      }
      
      const startProdIdx = sitemapContent.indexOf('<!-- DYNAMIC PRODUCTS START -->');
      const endProdIdx = sitemapContent.indexOf('<!-- DYNAMIC PRODUCTS END -->');
      
      if (startProdIdx !== -1 && endProdIdx !== -1) {
        sitemapContent = sitemapContent.substring(0, startProdIdx + '<!-- DYNAMIC PRODUCTS START -->'.length) +
                         productsXml + '    ' +
                         sitemapContent.substring(endProdIdx);
        console.log("  [OK] sitemap.xml preparado con las URLs dinámicas de productos.");
      } else {
        console.warn("  [WARN] No se encontraron los marcadores <!-- DYNAMIC PRODUCTS START --> y <!-- DYNAMIC PRODUCTS END --> en sitemap.xml");
      }

      // Update Gallery
      let latestPhotoDate = '2026-06-15';
      if (photos.length > 0) {
        const dates = photos.map(p => p.created_at).filter(Boolean);
        if (dates.length > 0) {
          latestPhotoDate = dates[0].split('T')[0];
        }
      }

      let galleryXml = '\n';

      // Valencian gallery entry
      galleryXml += `    <url>
        <loc>https://www.comiares.es/galeria</loc>
        <lastmod>${latestPhotoDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
        <xhtml:link rel="alternate" hreflang="ca" href="https://www.comiares.es/galeria"/>
        <xhtml:link rel="alternate" hreflang="ca-ES" href="https://www.comiares.es/galeria"/>
        <xhtml:link rel="alternate" hreflang="es" href="https://www.comiares.es/es/galeria"/>
        <xhtml:link rel="alternate" hreflang="es-ES" href="https://www.comiares.es/es/galeria"/>
        <xhtml:link rel="alternate" hreflang="x-default" href="https://www.comiares.es/galeria"/>\n`;

      for (const photo of photos) {
        const imgUrl = getAbsoluteImageUrl(photo.image_url);
        if (imgUrl) {
          const title = photo.title || '';
          const caption = photo.category || '';
          galleryXml += `        <image:image>
            <image:loc>${escapeHtml(imgUrl)}</image:loc>\n`;
          if (title) {
            galleryXml += `            <image:title>${escapeHtml(title)}</image:title>\n`;
          }
          if (caption) {
            galleryXml += `            <image:caption>${escapeHtml(caption)}</image:caption>\n`;
          }
          galleryXml += `        </image:image>\n`;
        }
      }
      galleryXml += `    </url>\n`;

      // Castellano gallery entry
      galleryXml += `    <url>
        <loc>https://www.comiares.es/es/galeria</loc>
        <lastmod>${latestPhotoDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
        <xhtml:link rel="alternate" hreflang="ca" href="https://www.comiares.es/galeria"/>
        <xhtml:link rel="alternate" hreflang="ca-ES" href="https://www.comiares.es/galeria"/>
        <xhtml:link rel="alternate" hreflang="es" href="https://www.comiares.es/es/galeria"/>
        <xhtml:link rel="alternate" hreflang="es-ES" href="https://www.comiares.es/es/galeria"/>
        <xhtml:link rel="alternate" hreflang="x-default" href="https://www.comiares.es/galeria"/>\n`;

      for (const photo of photos) {
        const imgUrl = getAbsoluteImageUrl(photo.image_url);
        if (imgUrl) {
          const titleEs = photo.title_es || photo.title || '';
          const captionEs = photo.category_es || photo.category || '';
          galleryXml += `        <image:image>
            <image:loc>${escapeHtml(imgUrl)}</image:loc>\n`;
          if (titleEs) {
            galleryXml += `            <image:title>${escapeHtml(titleEs)}</image:title>\n`;
          }
          if (captionEs) {
            galleryXml += `            <image:caption>${escapeHtml(captionEs)}</image:caption>\n`;
          }
          galleryXml += `        </image:image>\n`;
        }
      }
      galleryXml += `    </url>\n`;

      const startGal = sitemapContent.indexOf('<!-- DYNAMIC GALLERY START -->');
      const endGal = sitemapContent.indexOf('<!-- DYNAMIC GALLERY END -->');

      if (startGal !== -1 && endGal !== -1) {
        sitemapContent = sitemapContent.substring(0, startGal + '<!-- DYNAMIC GALLERY START -->'.length) +
                         galleryXml + '    ' +
                         sitemapContent.substring(endGal);
        console.log("  [OK] sitemap.xml actualizado con las URLs de la galeria e Imagenes.");
      } else {
        console.warn("  [WARN] No se encontraron los marcadores <!-- DYNAMIC GALLERY START --> y <!-- DYNAMIC GALLERY END --> en sitemap.xml");
      }

      fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');
    }

    // --- ACTUALIZAR DATOS ESTRUCTURADOS ESTÁTICOS DE PROGRAMACIÓN ---
    console.log("Generando datos estructurados de eventos estáticos para programacio.html...");
    const filteredEvents = events.filter(e => !e.id.startsWith('event-config-'));
    
    const generateEventSchemas = (lang) => {
      const isEs = lang === 'es';
      return filteredEvents.map(event => {
        const title = isEs && event.title_es ? event.title_es : event.title;
        const desc = isEs && event.description_es ? event.description_es : event.description;
        const loc = isEs && event.location_es ? event.location_es : event.location;

        const startIso = `${event.date}T${event.time}:00+02:00`;
        
        let endHour = parseInt(event.time.split(':')[0]) + 2;
        let endDateStr = event.date;
        if (endHour >= 24) {
          endHour = endHour - 24;
          const dateObj = new Date(event.date);
          dateObj.setDate(dateObj.getDate() + 1);
          endDateStr = dateObj.toISOString().split('T')[0];
        }
        const endHourStr = String(endHour).padStart(2, '0');
        const endMinuteStr = event.time.split(':')[1] || '00';
        const endIso = `${endDateStr}T${endHourStr}:${endMinuteStr}:00+02:00`;

        return {
          "@context": "https://schema.org",
          "@type": "Event",
          "name": title,
          "description": desc || title,
          "startDate": startIso,
          "endDate": endIso,
          "eventStatus": "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "location": {
            "@type": "Place",
            "name": loc || "Ares del Maestrat",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": loc || "Ares del Maestrat",
              "addressLocality": "Ares del Maestrat",
              "addressRegion": "Castellón",
              "addressCountry": "ES",
              "postalCode": "12165"
            }
          },
          "organizer": {
            "@type": "Organization",
            "name": isEs ? "Comisión de Fiestas de Ares del Maestrat" : "Comissió de Festes d'Ares del Maestrat",
            "url": "https://www.comiares.es/"
          }
        };
      });
    };

    // Actualizar programacio.html (Valenciano)
    const progPathVal = path.join(__dirname, '..', 'programacio.html');
    if (fs.existsSync(progPathVal)) {
      let htmlContent = fs.readFileSync(progPathVal, 'utf-8');
      const startIdx = htmlContent.indexOf('<!-- DYNAMIC EVENTS SCHEMA START -->');
      const endIdx = htmlContent.indexOf('<!-- DYNAMIC EVENTS SCHEMA END -->');
      
      if (startIdx !== -1 && endIdx !== -1) {
        const schemas = generateEventSchemas('ca');
        const injectScript = `\n    <script type="application/ld+json">\n${JSON.stringify(schemas, null, 2)}\n    </script>\n    `;
        htmlContent = htmlContent.substring(0, startIdx + '<!-- DYNAMIC EVENTS SCHEMA START -->'.length) +
                      injectScript +
                      htmlContent.substring(endIdx);
        fs.writeFileSync(progPathVal, htmlContent, 'utf-8');
        console.log("  [OK] programacio.html actualizada con datos estructurados de eventos estáticos.");
      }
    }

    // Actualizar es/programacio.html (Castellano)
    const progPathCast = path.join(__dirname, '..', 'es', 'programacio.html');
    if (fs.existsSync(progPathCast)) {
      let htmlContent = fs.readFileSync(progPathCast, 'utf-8');
      const startIdx = htmlContent.indexOf('<!-- DYNAMIC EVENTS SCHEMA START -->');
      const endIdx = htmlContent.indexOf('<!-- DYNAMIC EVENTS SCHEMA END -->');
      
      if (startIdx !== -1 && endIdx !== -1) {
        const schemas = generateEventSchemas('es');
        const injectScript = `\n    <script type="application/ld+json">\n${JSON.stringify(schemas, null, 2)}\n    </script>\n    `;
        htmlContent = htmlContent.substring(0, startIdx + '<!-- DYNAMIC EVENTS SCHEMA START -->'.length) +
                      injectScript +
                      htmlContent.substring(endIdx);
        fs.writeFileSync(progPathCast, htmlContent, 'utf-8');
        console.log("  [OK] es/programacio.html actualizada con datos estructurados de eventos estáticos.");
      }
    }
    // F1 - Inject Supabase credentials into js/db.js if available in environment
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const dbJsPath = path.join(__dirname, '..', 'js', 'db.js');
      if (fs.existsSync(dbJsPath)) {
        let dbJsContent = fs.readFileSync(dbJsPath, 'utf-8');
        let updated = false;
        
        if (dbJsContent.includes('%%SUPABASE_URL%%')) {
          dbJsContent = dbJsContent.replace('%%SUPABASE_URL%%', SUPABASE_URL);
          updated = true;
        }
        if (dbJsContent.includes('%%SUPABASE_ANON_KEY%%')) {
          dbJsContent = dbJsContent.replace('%%SUPABASE_ANON_KEY%%', SUPABASE_ANON_KEY);
          updated = true;
        }
        
        if (updated) {
          fs.writeFileSync(dbJsPath, dbJsContent, 'utf-8');
          console.log("  [OK] Credenciales de Supabase inyectadas en js/db.js.");
        }
      }
    }

    console.log("Generación completada exitosamente.");
  } catch (error) {
    console.error("Error crítico durante la generación de noticias:", error);
    process.exit(1);
  }
}

main();
