# Handoff & Tasks Status (`AGENTS.md`)

Este archivo sirve como guía de transferencia para el agente de IA que continuará el desarrollo.

---

## 1. Contexto General y Objetivos
Estamos trabajando en el sitio web de la **Comissió de Festes d'Ares del Maestrat**. La web tiene versión en valenciano (raíz `/`) y en castellano (`/es/`). El backend es **Supabase** (auth + database + storage + edge functions). El panel de administración está en `/admin`.

---

## 2. Estado del Panel de Admin (PRO)
Todas las tareas del panel de administración principal se completaron, verificaron localmente y se **subieron a la rama principal (PRO)** en el commit `a18e2db`.
* **Remoción de Modo Demo**: Se borró la mención a "Mode Demo" del login y se renombraron los estados de la base de datos a "Mode Local".
* **Header & Footer**: Cabecera flotante en cápsula y pie de página negro redondeado (`border-radius: 20px 20px 0 0`) con año dinámico.
* **Barra Lateral Mobile (Hamburguesa)**: Rediseño completo para móviles. El sidebar se comporta como un cajón deslizante vertical (drawer) con fondo difuminado de overlay.
* **Edición de Perfil**: Panel `#tab-profile` que permite cambiar el avatar (subiendo archivo local en Base64 o pegando URL) y el nombre dinámico del usuario activo.
* **Scroll Horizontal Solucionado**: Limitaciones rígidas de ancho (`max-width: 100%`) aplicadas en `.admin-layout`, `.admin-layout main` y `.admin-panel`.

---

## 3. Mejoras Visuales, Animaciones y Tarjetas de Eventos (PRO)
Completadas y subidas en el commit `3f39f02`:
* **Jerarquía de Fechas**: Se invirtió la prioridad visual en `/programacio.html`.
* **Separación del Botón de Cierre en Modales**: Márgenes superiores a la imagen del evento en modales.
* **Carrusel de Noticias Móvil**: Solucionado el desborde lateral. `margin-left: 0`, sangra solo hacia la derecha.
* **Tarjetas de Eventos Destacados (Home)**: `.home-event-card` con bordes de `20px` y sombras, horizontal en escritorio.
* **Bordes del Widget de Tiempo**: Unificados a `20px` la tarjeta y `14px` las celdas.
* **Visualización del Tiempo en Móvil**: Iconos Lucide arreglados con `flex-shrink: 0` y `min-width: 0`.
* **Dropdown de Idiomas**: Apertura por clic y diseño de cápsula integrado en la cabecera.
* **Reloj Mecánico en Cuenta Atrás**: Animación vertical elástica al cambiar los dígitos.
* **Cache-Busting (v1.4)**: Parámetro `?v=1.4` en todos los HTML del proyecto.

---

## 4. Previsualización de Compartir en Redes Sociales (PRO)
Todas las tareas para resolver la previsualización al compartir notícias en redes sociales (como WhatsApp) se completaron con un enfoque JAMstack estático (Opción B) en el commit `350e28c`:
* **Generación Estática**: Se creó el script `scripts/generate-news.js` que descarga las noticias publicadas en Supabase y genera archivos HTML físicos en `noticies/[slug]/index.html` (y en castellano en `es/noticies/[slug_es]/index.html`), permitiendo URLs limpias directamente bajo el dominio principal (`www.comiares.es/noticies/[slug]`).
* **Flujo GitHub Actions (`deploy.yml`)**: Compila las noticias estáticas y despliega la web entera en GitHub Pages en cada push a `main` y ante disparadores externos.
* **Integración del Webhook de Supabase**: Se creó y desplegó la Edge Function `trigger-deploy` (`supabase/functions/trigger-deploy/index.ts`), la cual es llamada por un webhook de base de datos de Supabase ante cambios en la tabla `news` y dispara el flujo de GitHub Actions usando la clave `GITHUB_PAT`. Esto posibilita que el sitio se recompile automáticamente al guardar cambios en el panel de administración.
* **Modificaciones en el Frontend**: Se actualizaron `noticies.html` y `es/noticies.html` para soportar las URLs limpias del enrutamiento de la SPA, leer la variable inyectada `window.staticArticleSlug` y hacer que los botones de compartir apunten a los enlaces normales de la web en lugar de una redirección externa.
* **Solución a Errores 404 y Caché (Commit `a1d6ef1`)**:
  * **Rutas Absolutas a la Raíz**: Se pasaron todas las hojas de estilo y scripts de importación en los 14 archivos HTML del proyecto a rutas absolutas relativas a la raíz (comenzando con `/`) para evitar desajustes de profundidad en subdirectorios.
  * **Precedencia de Carpetas**: El script de compilación `generate-news.js` ahora también genera los archivos `/noticies/index.html` y `/es/noticies/index.html` (copiando las plantillas de listado). Esto resuelve el comportamiento de GitHub Pages que redirigía a carpetas vacías retornando 404.
  * **Comparación Normalizada**: En `js/main.js`, se mejoró el listener del menú dinámico utilizando el constructor `URL` y eliminando la barra final (`replace(/\/$/, '')`) para detectar si se hace clic en la página actual de forma robusta en cualquier profundidad.
  * **Cache-Busting (v1.5)**: Se incrementó la consulta de `js/main.js` a `?v=1.5` en todos los archivos HTML para forzar a los navegadores a descargar los cambios de enrutamiento inmediatamente.

---

## 5. Correcciones Sesión Mac - Commit `61c65dd` (PRO)

### 5.1 Corrección de Fecha en Widget del Tiempo
**Problema**: El widget mostraba el día anterior después de medianoche en España porque `new Date().toISOString()` devuelve UTC (UTC+0), no la hora española (UTC+2 en verano).

**Solución** aplicada en `temps.html`, `es/temps.html`, `index.html`, `es/index.html`:
```javascript
function getLocalDateStr(offsetDays = 0) {
    const d = new Date();
    if (offsetDays !== 0) { d.setDate(d.getDate() + offsetDays); }
    return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
}
```
- La `MOCK_WEATHER` ahora usa `getLocalDateStr(0..6)` en lugar de `Date.now() + n*86400000`.
- Se añadió un filtro en `loadDashboardWeather()` para descartar días pasados del forecast real de AEMET.

### 5.2 Corrección de Persistencia de Perfil de Admin
**Problema**: El nombre y avatar del admin solo se guardaban en `localStorage`, por lo que al cambiar de máquina o navegador se perdían. Las imágenes grandes en Base64 causaban `QuotaExceededError`.

**Solución** en `admin/gestio.js`:
- `saveProfile()` ahora es `async` y llama a `supabase.auth.updateUser({ data: { display_name, avatar_url } })` para sincronizar cross-device.
- `getProfile()` lee primero `user.user_metadata` de Supabase (como fuente de verdad) y cae en `localStorage` como fallback.
- La carga de avatar siempre pasa por `window.db.uploadImage()` (con compresión cliente) en lugar de FileReader puro.
- El botón "Guardar Canvis" muestra estado de carga mientras guarda.

### 5.3 Robustez y Control de Errores en la Sincronización del Perfil
**Problema**: Si la subida de la imagen al Storage de Supabase fallaba (por ejemplo, por políticas de acceso RLS), caía silenciosamente en un string Base64. Esto hacía que `updateUser` de Supabase Auth fallara por exceso de tamaño en el token JWT. Dado que `saveProfile` silenciaba la excepción, la UI mostraba éxito y los cambios sólo persistían en el `localStorage` del equipo local, perdiéndose al cambiar de máquina.

**Solución** en `admin/gestio.js`:
- Se modificó `saveProfile` para validar que no se intenten guardar strings Base64 en `user_metadata` (bajo Supabase activo) y se propagan los errores con `throw` en lugar de silenciarlos.
- En el listener de subida de imagen del perfil, si Supabase está activo pero se devuelve un string Base64 (indicando que falló la subida al Storage), se arroja un error visible que detiene el guardado y vacía el selector.
- Se mejoraron las alertas del formulario de perfil en la UI para presentar los mensajes de error específicos del servidor y guiar el diagnóstico.

### 5.4 Solución definitiva a la persistencia de categorías y FAQs en Supabase
**Problema**: Al crear etiquetas/categorías o editar sus colores, el cambio se guardaba localmente pero desaparecía al recargar o al cambiar de equipo. Esto ocurría porque el "hack" de guardar la configuración dentro de la tabla de `events` (bajo el registro `'event-config-category-colors'`) fallaba en Supabase debido a una violación de restricciones `NOT NULL` de PostgreSQL en las columnas obligatorias del esquema (como `description` o `title_es`) que no se enviaban en el objeto de configuración. Al fallar silenciosamente en el servidor, cada carga del listado de eventos descargaba el registro antiguo de Supabase y sobrescribía el `localStorage` del navegador local con la configuración antigua.

**Solución** en `js/db.js`:
- Se modificaron las funciones `saveCategoryColors(colors)` y `saveFAQs(faqs)` para que los objetos `configItem` de configuración incluyan **todos** los campos del esquema de la tabla `events` (usando strings vacíos o valores por defecto para los que no se utilizan).
- Esto satisface cualquier restricción `NOT NULL` de la base de datos de Supabase, asegurando que las actualizaciones y el `upsert` tengan éxito en el servidor y sincronizando de forma transparente los colores, etiquetas y FAQs creadas por los usuarios en todos los navegadores.

### 5.5 Solución al desborde de etiquetas de programación (Flex-Wrap)
**Problema**: Cuando un evento tiene asignadas múltiples etiquetas de categorías (como en la captura del usuario), la fila de badges se desbordaba horizontalmente por la derecha de la tarjeta de evento. Esto sucedía porque los contenedores flex que envuelven a `window.renderCategoryBadges(...)` no tenían configurado el salto de línea (`flex-wrap: nowrap` por defecto) y los badges tienen `flex-shrink: 0`.

**Solución**:
- Se añadió la propiedad `flex-wrap: wrap;` en los contenedores de etiquetas de la programación pública (en [js/programacio.js](file:///Users/tsoga00/Web_comi_ares/js/programacio.js#L167) y L481) y en el panel de administrador (en [admin/gestio.js](file:///Users/tsoga00/Web_comi_ares/admin/gestio.js#L390)).
- Se incrementó a `?v=1.6` la importación de `db.js` y `programacio.js` en todos los archivos HTML para obligar a los navegadores a recargar inmediatamente los scripts sin recurrir a la caché.

---

## 6. Optimización de Egress y Caché de Supabase (PRO)
Completado y subido en el commit `10ada9a` (y el de documentación `AGENTS.md` subsiguiente):
* **Enfoque JAMstack de Consultas**: Para evitar el límite de 5 GB de transferencia (egress) de la base de datos de Supabase en visitas públicas, el generador estático `generate-news.js` ahora descarga las tablas `news`, `events` y `photos` y las escribe en `data/news.json`, `data/events.json` y `data/photos.json`.
* **Carga en Cliente**: `js/db.js` detecta si está en el panel `/admin/*`. Si no lo está, los visitantes públicos cargan los archivos JSON estáticos (con la versión `?v=1.6`) servidos gratis por el CDN de GitHub Pages. Se incluyen fallbacks automáticos en vivo si falla la descarga estática.
* **Cabeceras de Caché de Imágenes**: Las imágenes subidas a través de `uploadImage` a Supabase Storage ahora incluyen la opción `{ cacheControl: '31536000' }` (1 año) para que el navegador y los CDNs las almacenen permanentemente, ahorrando egreso.
* **Servidor Local Node**: Creado `serve.js` como alternativa multiplataforma basada en Node.js que replica el comportamiento de enrutamiento limpio de `serve.py`.

## 7. Indexación en Google Noticias y Google Discover (PRO)
Completado y subido en el commit `834609b` (y el de documentación `AGENTS.md` subsiguiente):
* **Sitemap Dinámico**: Modificado `sitemap.xml` (añadiendo comentarios de marcador) y `scripts/generate-news.js` para regenerar y añadir automáticamente en el sitemap todas las URLs físicas de noticias publicadas (tanto en valenciano como en castellano, enlazando correctamente las traducciones con etiquetas `alternate` y `hreflang`).
* **Meta robots Discover**: Se inyecta la etiqueta `<meta name="robots" content="max-image-preview:large">` en la cabecera de todas las páginas de noticias para habilitar previsualizaciones de imágenes grandes en Google Discover.
* **Marcación de Datos Estructurados (JSON-LD)**: Inyección dinámica en el `<head>` de cada noticia de un script tipo `NewsArticle` (`schema.org`), facilitando que el algoritmo de Google entienda el titular, descripción, fecha de publicación y autoría, requisitos indispensables para Google Noticias.

---

## 8. Auditoría de Ciberseguridad y Remediación (PRO)
Completado y subido en el commit `25a06d0`. Se realizó una auditoría completa OWASP Top 10 y se aplicaron todas las correcciones automáticas posibles:

* **F1 — Credenciales eliminadas**: `SUPABASE_URL` y `SUPABASE_ANON_KEY` eliminadas de `js/db.js` y `scripts/generate-news.js`. El script de build ahora lee de `process.env` (GitHub Secrets). Workflow `.github/workflows/deploy.yml` actualizado para inyectar `SUPABASE_URL` y `SUPABASE_ANON_KEY` desde los Secrets del repositorio.
* **F2 — Backdoor eliminado**: Contraseña hardcodeada `ares2026` eliminada de `js/db.js`. La única autenticación válida es ahora Supabase Auth real. El modo mock/demo ya no existe.
* **F3 — Cabeceras HTTP de seguridad**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy y Content-Security-Policy (CSP) añadidas como meta-tags en los 22 archivos HTML del proyecto. Adicionalmente, se ha creado el archivo `.htaccess` en la raíz para servir estas cabeceras HTTP de forma real y nativa en servidores web basados en Apache (como el alojamiento compartido de **OVH**).
* **F4 — Edge Function autenticada**: `supabase/functions/trigger-deploy/index.ts` ahora valida el header `Authorization: Bearer <WEBHOOK_SECRET>` antes de disparar cualquier deploy. Devuelve 401 si falla.
* **F5 — CORS restringido**: El `Access-Control-Allow-Origin` de la Edge Function cambió de `*` al origen de Supabase.
* **F6 — postMessage validado**: `admin/gestio.js` ahora verifica `event.origin === window.location.origin` antes de procesar mensajes.
* **F8 — CSS Injection mitigado**: `sanitizeHTML` en `js/db.js` ya no permite los atributos `style` ni `class`, que se eliminan activamente del DOM.
* **F9 — Validación de backup**: La importación de JSON en `admin/gestio.js` ahora valida la estructura, tipos y longitudes de cada ítem antes de importarlo.
* **F10 — Versiones CDN ancladas**: Lucide (`@0.469.0`) y Supabase JS (`@2.49.4`) con versiones fijas en todos los HTML en lugar de `@latest`.
* **F11 — Email admin**: Eliminado el valor prefijado `admin@ares.com` del campo de email del login.
* **F12 — Normalització Automàtica de URLs de Supabase (PRO)**: S'ha implementat un corrector automàtic en `js/db.js` i `admin/gestio.js`. Si l'usuari copia directament la URL del panell de control de Supabase (`https://supabase.com/dashboard/project/...`) en lloc de la URL de la API del projecte (`https://xxxx.supabase.co`), el sistema la normalitza al vol al format correcte. També s'aplica retroactivament en carregar la pàgina si ja estava mal guardada en `localStorage`.
* **Cache-Busting (v1.7)**: S'ha incrementat la consulta de tots els scripts a `?v=1.7` en els 22 fitxers HTML del projecte per a forçar als navegadors a recarregar els fitxers JS modificats immediatament.

### ⚠️ Acciones Manuales Pendientes (el usuario debe ejecutarlas)
1. **Rotar la Supabase anon key**: La clave anterior está en el historial de git. Ir a Supabase → Settings → API → Roll anon key.
2. **Configurar GitHub Secrets**: Añadir `SUPABASE_URL` y `SUPABASE_ANON_KEY` (nueva clave rotada) en GitHub → Settings → Secrets → Actions. El deploy fallará hasta entonces.
3. **Configurar WEBHOOK_SECRET en Supabase Secrets**: Generar un token aleatorio (`openssl rand -hex 32`), añadirlo como secret `WEBHOOK_SECRET` en Supabase Edge Functions, y configurar ese mismo valor en la cabecera `Authorization` del Database Webhook.
4. **Redesplegar la Edge Function**: `supabase functions deploy trigger-deploy`.
5. **Actualizar la anon key en el panel admin**: Después de rotar la clave, actualizar la configuración en el tab "Configuració" del panel `/admin/`. Gràcies a la normalització automàtica (F12), ara és totalment vàlid tant utilitzar la URL del panell de control de Supabase com la URL directa de la API.

---

## 9. Rediseño del Widget del Tiempo y Ajustes Estéticos (PRO)
Completado y subido en el commit `f246d9e`:
* **Enlace de Últimas Noticias**: Se corrigió el enlace "Saber més de nosaltres" / "Saber más de nosotros" de la cabecera de noticias en [index.html](file:///Users/tsoga00/Web_comi_ares/index.html) y [es/index.html](file:///Users/tsoga00/Web_comi_ares/es/index.html) para que apunte correctamente a la sección de todas las noticias (`noticies.html` / `noticies`) en vez de quiénes somos, y se tradujo como "Veure més notícies →" y "Ver más noticias →".
* **Widget de Tiempo Horizontal**: Rediseño completo del widget del clima en la home para abarcar el 100% de la sección en desktop, inspirado en el diseño del widget de Mecca. Se añadió de fondo una fotografía real del pueblo de Ares del Maestrat (`img/temps_bg.jpg`) con gradientes adaptativos claros (`rgba(250, 250, 250, ...)`) para asegurar el contraste de las fuentes en negro/gris de la web.
* **Desenfoque de Cristal Esmerilado (Glassmorphism)**: Las celdas de pronóstico diario ahora tienen `backdrop-filter: blur(8px)`, logrando que el fondo fotográfico se difumine de forma estética detrás de ellas.
* **Solución de Desborde Móvil**: Se solucionó el desbordamiento lateral de la probabilidad de lluvia en móviles. Se envolvieron la temperatura y la gota de agua en el subcontenedor `.weather-day-temp-wrapper` y se les aplicó `margin-left: auto` y `flex-shrink: 0` en responsive, alineando todo limpiamente a la derecha y previniendo cortes en pantallas estrechas.
* **Cache-Busting (v1.10)**: Se bumpó la importación del archivo CSS a `?v=1.10` en los 22 archivos HTML del proyecto para obligar a los navegadores a descargar los nuevos estilos.

---

## 10. Corrección de Solapamientos en Cabecera Móvil y Selector de Idiomas (Local)
Completado localmente:
* **Colisión de Selectores de Enlace**: Se corrigió el conflicto en el menú móvil modificando los selectores del menú de navegación principal en [css/styles.css](file:///c:/Users/andre/Desktop/Andreu/Ares/Comissió/web/css/styles.css) (ej. cambiando `nav.nav-menu ul li a` por `nav.nav-menu ul li > a`). Esto aísla por completo las opciones del selector de idiomas de los estilos de los enlaces del menú principal, previniendo que la opción activa se dibuje como un botón negro gigante.
* **Desplegable de Idioma en Móvil (Dropup)**: Se reubicó la posición del contenedor `.mobile-lang-switch .lang-dropdown-content` para que se abra de abajo hacia arriba (`top: auto; bottom: calc(100% + 8px)`), previniendo que se desborde y se corte por el límite inferior de la pantalla o del drawer.
* **Solapamiento del Logo**: Se ajustaron los z-indices dentro de la media query móvil en [css/styles.css](file:///c:/Users/andre/Desktop/Andreu/Ares/Comissió/web/css/styles.css) (`nav.nav-menu` a `1002`, `.nav-toggle` a `1003` y `.logo` a `1001`) para forzar que el logo se oculte tras el panel blanco/difuminado del menú al abrirse, manteniendo el botón del menú de hamburguesa visible por encima de todo.
* **Cache-Busting (v1.13)**: Se incrementó la consulta de la hoja de estilos a `?v=1.13` en los 22 archivos HTML del proyecto para forzar la recarga inmediata de la caché de CSS en los navegadores.

---

## 11. Próximo Paso
* Completar las acciones manuales de seguridad descritas en la sección 8.
* Probar los cambios en el servidor local y validar que tanto el dropdown como el logo se comporten correctamente en móvil.
* Esperar a nuevas instrucciones del usuario.

