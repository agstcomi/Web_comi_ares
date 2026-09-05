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
* **Gráfico de Temperatura Horizontal en Móvil**: Se encapsularon las cabeceras de los períodos del día y el gráfico de temperatura SVG dentro de un contenedor `.weather-scroll-container` con desplazamiento horizontal (`overflow-x: auto`) y un ancho mínimo de `640px` en `temps.html` y `es/temps.html`. Esto permite que el gráfico no se comprima en pantallas de móvil, garantizando que el gráfico y sus textos sean completamente legibles y que ambos elementos se desplacen en sincronía.
* **Cache-Busting (v1.10)**: Se bumpó la importación del archivo CSS a `?v=1.10` en los 22 archivos HTML del proyecto para obligar a los navegadores a descargar los nuevos estilos.

---

## 10. Corrección de Solapamientos en Cabecera Móvil y Selector de Idiomas (Local)
Completado localmente:
* **Colisión de Selectores de Enlace**: Se corrigió el conflicto en el menú móvil modificando los selectores del menú de navegación principal en [css/styles.css](file:///c:/Users/andre/Desktop/Andreu/Ares/Comissió/web/css/styles.css) (ej. cambiando `nav.nav-menu ul li a` por `nav.nav-menu ul li > a`). Esto aísla por completo las opciones del selector de idiomas de los estilos de los enlaces del menú principal, previniendo que la opción activa se dibuje como un botón negro gigante.
* **Desplegable de Idioma en Móvil (Dropup)**: Se reubicó la posición del contenedor `.mobile-lang-switch .lang-dropdown-content` para que se abra de abajo hacia arriba (`top: auto; bottom: calc(100% + 8px)`), previniendo que se desborde y se corte por el límite inferior de la pantalla o del drawer.
* **Solapamiento del Logo**: Se ajustaron los z-indices dentro de la media query móvil en [css/styles.css](file:///c:/Users/andre/Desktop/Andreu/Ares/Comissió/web/css/styles.css) (`nav.nav-menu` a `1002`, `.nav-toggle` a `1003` y `.logo` a `1001`) para forzar que el logo se oculte tras el panel blanco/difuminado del menú al abrirse, manteniendo el botón del menú de hamburguesa visible por encima de todo.
* **Cache-Busting (v1.13)**: Se incrementó la consulta de la hoja de estilos a `?v=1.13` en los 22 archivos HTML del proyecto para forzar la recarga inmediata de la caché de CSS en los navegadores.

---

## 11. Rediseño de Programación con Calendario Interactivo (PRO)
Completado localmente y subido a producción:
* **Estructura Rejilla Desktop:** Dos columnas en escritorio (`min-width: 992px`) con sidebar de `340px` a la izquierda (buscador, calendario y tarjeta de exportación) y listado flexible a la derecha.
* **Componente Calendario con Doble Vista:**
  - **Vista Mensual:** Cuadrícula de 6 semanas con puntos negros de eventos en base a los filtros activos en tiempo real.
  - **Vista Semanal (Móvil):** Fila comprimida de 7 días (número de día arriba, nombre de día abajo) que permite la navegación por semanas. Conmutador de vista en cabecera.
  - **Desplazamiento horizontal (Swipe) en móvil:** Gestos táctiles de deslizamiento horizontal sobre el widget de calendario para cambiar de mes/semana de forma intuitiva, con prevención de falsos positivos en scroll vertical.
* **Buscador y Unificación de Bordes:** Buscador movido al sidebar encima del calendario con un radio de borde unificado de `20px` (calendario, buscador y tarjeta de exportación).
* **Filtros por Categoría Multi-select Desplegables:** Reemplazo de los botones de categorías individuales por un botón de dropdown ("Categories") con selección de múltiples casillas, indicador dinámico del conteo de filtros activos, botón de limpieza rápida y prevención de cierre automático en clics internos.
* **Alineación de Cabecera:** Título y botón de categorías alineados horizontalmente en la misma línea superior que el buscador. El botón de categorías se sitúa al borde derecho alineado con el margen derecho de las tarjetas de actos diarios (`.timeline-day-group`).
* **Tarjeta de Exportación Calendario (SEO):** Botón transformado en tarjeta grande con descripción en valenciano/castellano optimizada para motores de búsqueda, con botón de sincronización de eventos `.ics`.
* **Corrección de Scroll en Móvil:** Movido el posicionamiento `position: sticky;` del sidebar a la media query de escritorio, permitiendo el scroll vertical continuo sin bloqueos en dispositivos móviles.
* **Optimización de Espaciados:** Eliminado el gap en blanco excesivo superior encima del buscador (separación fijada en 40px homogénea).
* **Cache-Busting (v1.19 / v1.14):** Bumped en los HTML del proyecto.

## 12. Sincronización y Configuración Completa de Supabase (PRO/Local)
Completado en la última sesión:
* **Despliegue de Edge Functions**: Se instaló el CLI de Supabase globalmente en el sistema y se desplegaron con éxito las Edge Functions `aemet-weather`, `translate-text`, `trigger-deploy` y `share`.
* **Configuración del Webhook de Base de Datos**: Se configuró y guardó la clave de seguridad `WEBHOOK_SECRET` (`417dd2322e472432b0832969f63ae234ee71706f8ccfcb30ad895930c559b75e`) en los secrets de Supabase.
* **Trigger SQL de Despliegue**: Ante la falta de acceso directo al panel visual de Webhooks en la consola de Supabase, se implementó de forma nativa mediante SQL la extensión `pg_net` y el disparador de base de datos `tr_news_deploy` en la tabla `news`, el cual realiza llamadas asíncronas seguras a `trigger-deploy` para disparar automáticamente el flujo de compilación e indexación en cada cambio de noticias.

---

## 14. Sistema de Notificaciones Push Web para Noticias (Local)
Completado en la sesión actual:
* **Service Worker (`sw.js`)**: Creado en la raíz del proyecto para la escucha en segundo plano de eventos `push` y la gestión del clic `notificationclick` para enfocar o redirigir automáticamente a la noticia publicada (`/noticies/[slug]`).
* **Generación y Claves VAPID**: Generadas claves VAPID estándar P-256 (`VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`) configuradas para la firma criptográfica de paquetes Web Push RFC 8292.
* **Cliente JavaScript (`js/push-notifications.js`)**: Módulo responsable del registro del Service Worker, la solicitud de permisos al usuario (`Notification.requestPermission`), la conversión de claves VAPID a Uint8Array, la gestión de subscripciones y la renderización de un widget flotante en forma de campana (🔔) con indicador de estado y compatibilidad bilingüe (valenciano/castellano).
* **Persistencia en Supabase (`js/db.js`)**: Añadidas las funciones `savePushSubscription(subscription)` y `deletePushSubscription(endpoint)` para registrar o eliminar suscripciones en la tabla `push_subscriptions` de Supabase.
* **Edge Function `send-push-notification`**: Creada la Edge Function en `supabase/functions/send-push-notification/index.ts` usando Deno + la librería `web-push`. Consulta la tabla `push_subscriptions`, envía payloads encriptados a los servicios Push (Google, Mozilla, Apple) y elimina automáticamente los endpoints caducados (404/410 Gone).
* **Integración en Panel de Administración (`admin/editor.html`)**: Inserción del campo `[x] 🔔 Enviar notificació Push als lectors en guardar`. Al guardar una noticia con estado `'published'` y esta opción marcada, se invoca automáticamente la Edge Function `send-push-notification`.
* **Estilos CSS (`css/styles.css`)**: Estilizado del botón flotante `.push-bell-btn` con efecto cristal (backdrop blur), animación al pasar el cursor y punto verde dinámico para indicar el estado activo.
* **Inclusión en HTMLs (v1.20)**: Añadido `<script src="/js/push-notifications.js?v=1.20" defer></script>` en todas las páginas públicas del sitio web.

---

---

## 16. Mòdul de Gestió de la Home i Compte Enrere Editable (Local)
Completat en la sessió actual:
* **Autenticació Local Fallback**: Modificat `js/db.js` (`login`, `getCurrentUser`, `logout`) per incloure suport de sessió local (`ares_local_session`) quan Supabase no està configurat, permetent l'accés immediat a `/admin/` en entorn de desenvolupament local.
* **Persistencia de Configuracions del Sistema**:
  - `getCountdown()`, `saveCountdown()`: Gestionen el temporitzador de la compte enrere sota la clau `'event-config-countdown'` a la taula `events` (o `localStorage` / `IndexedDB`), complint totes les restriccions `NOT NULL` del esquema de PostgreSQL.
  - `getHomeConfig()`, `saveHomeConfig()`: Gestionen l'ordre dels blocs i el missatge de benvinguda sota la clau `'event-config-home'`.
* **Filtre de Consultes Públices**: Actualitzades les consultes en `js/db.js` i `scripts/generate-news.js` per a filtrar automàticament qualsevol ID amb prefix `event-config-*` (`event-config-faqs`, `event-config-category-colors`, `event-config-countdown`, `event-config-home`), de manera que mai apareguin com a esdeveniments al calendari ni als esquemes Schema.org.
* **Panell Únic d'Administració de la Home (`admin/index.html` i `admin/gestio.js`)**:
  - **Unificació en la Pestanya "Gestió de la Home" (`#tab-home`)**: Eliminades totes les pestanyes i formularis duplicats o redundants. Ara la secció "Gestió de la Home" és el punt únic i centralitzat per administrar tots els mòduls de la portada.
  - **Llistat de Mòduls Reordenables amb Drag & Drop**: Implementat suport de **arrossegar i soltar (Drag and Drop)** HTML5. Es pot mantindre clicat qualsevol mòdul (o la seua icona d'adherència `grip-vertical`) i arrossegar-lo directament per canviar-ne l'ordre visualment. També es mantenen els botons d'ascens/descens (↑ / ↓) com a alternativa.
  - **Modals d'Edició en Pop-up (`#modal-edit-welcome` i `#modal-edit-countdown`)**: En fer clic a **Editar** en la fila corresponent, s'obre el pop-up per modificar el missatge de benvinguda bilingüe o la configuració completa del compte enrere (estat activat/desactivat, data/hora objectiu, títols i descripcions).
  - **Correcció d'Error en Guardar (`admin/gestio.js`)**: Solucionada l'excepció `Cannot read properties of null (reading 'value')` en enviar el formulari de la home, afegint comprovacions de nuls per als camps de text que ara s'editen exclusivament des de les finestres emergents pop-up.
* **Renderitzat Dinàmic en Frontend (`index.html` i `es/index.html`)**:
  - Els blocs de la portada estan envoltat en el contenidor `<main id="home-sections-container">`.
  - La funció `initHomeLayout()` reordena els nodes DOM en el navegador segons la configuració desada, oculta els blocs desactivats i inyecta el missatge de benvinguda segons l'idioma actiu.
  - La funció `initCountdown()` llegeix la configuració en temps real, actualitza els títols i descripcions i amaga la secció completament si està desactivada (`enabled: false`).
* **Cache-Busting (v1.25)**: S'ha incrementat la versió dels scripts JS a `?v=1.25` als fitxers HTML pertinents per a forçar la recàrrega de la memòria cau als navegadors.

---

## 17. Formulari de Contacte Integrat a "Qui Som" (`quisom.html` i `es/quisom.html`)
Completat en la sessió actual:
* **Formulari de Contacte Integrat**: S'ha integrat directament abans del footer un formulari de contacte idèntic al de la pàgina principal de contacte (`contacte.html`), tant en valencià com en castellà.
* **Camps de Formulari**: Inclou Nom Complet, Correu Electrònic, Desplegable d'Assumpte (Voluntariat/Col·laboració, Consulta General, Suggeriments i Altres), Àrea de Missatge i Casella de Verificació de Política de Privacitat.
* **Espaiat i Respiració Visual**: Ajustat el tancament de la secció de la galeria de fotografies i ampliat el farcit inferior i superior a `7rem` (`padding-bottom: 7rem; padding-top: 7rem;`), atorgant un marge visual ampli i elegant entre la graella de fotos i el bloc de contacte.

---

## 18. Eliminació de la Imatge Estàtica de Portada de la Home (`index.html` i `es/index.html`)
Completat en la sessió actual:
* **Només Vídeo en la Portada**: S'ha eliminat la regla CSS `background-image` de la classe `.hero`, la imatge de suport `.hero-video-placeholder` (`portada.jpg`) i l'atribut `poster="portada.webp"` del tag `<video>`.
* **Fons Negre de Carregament**: S'ha assignat fons negre pur (`#000000`) al contenidor del banner perquè únicament es reproduïsca el vídeo en bucle (`portada.mp4`).

---

## 19. Desactivació Automàtica del Compte Enrere al Arribar a Zero (`index.html` i `es/index.html`)
Completat en la sessió actual:
* **Comprovació al Carregar**: Si la data/hora objectiu (`target_date`) ja ha passat en el moment d'obrir la web, la secció `#countdown-section` s'amaga directament (`display: none`) i s'actualitza l'estat a `enabled: false` en Supabase/LocalStorage.
* **Desactivació en Temps Real**: Si el temporitzador arriba a 0 segons mentre un usuari està navegant a la pàgina, es neteja l'interval (`clearInterval`), s'amaga la secció immediatament i es guarda la desactivació a la base de dades backend de forma autònoma.

---

## 20. Desplegament a Producció (PRO) - Commit `512c6c2`
Tot el treball de la sessió s'ha verificat i pujat amb èxit a la branca principal (`main`) en el commit `512c6c2`:
* **Gestió Centralitzada de la Home**: Panell únic `#tab-home` amb Drag & Drop per a reordenar mòduls i modals d'edició emergents (pop-up).
* **Compte Enrere Auto-desactivable**: Regla automàtica de desactivació en passar la data/hora objectiu.
* **Formulari de Contacte Integrat**: Formulari AJAX directament a la secció inferior de Qui Som (`quisom.html` i `es/quisom.html`).
* **Portada Només Vídeo**: Eliminada la imatge de suport per a reproduir únicament el vídeo de fons.

---

## 21. Auditoría Técnica i Millores Aplicades (Local)
Completat en la sessió actual. Es va realitzar una auditoria completa de la web (rendiment, SEO tècnic, accessibilitat, UX/UI i codi) i es van aplicar totes les millores identificades:

* **Rendiment**:
  - Vídeo hero amb `preload="none"` i `poster="/img/portada.webp"` per evitar descarregar 8,5 MB de vídeo en la càrrega inicial.
  - Afegits `<link rel="preconnect">` per a fonts.googleapis.com i fonts.gstatic.com en **tots** els 20 fitxers HTML del projecte.
  - Afegit `font-display=swap` a l'`@import` de Google Fonts en `css/styles.css` per evitar text invisible durant la càrrega.
  - El script inline de 600 línies de `index.html` i `es/index.html` s'ha extret a `js/home.js` (fitxer nou, 24 KB) per a permetre el caché del navegador entre visites.

* **SEO Tècnic**:
  - Afegit `<link rel="icon" href="/img/logo.svg" type="image/svg+xml">` i fallback PNG en tots els HTML. Resol el 404 de `/favicon.ico`.
  - Generat `img/apple-touch-icon.png` (PNG 180×180 del logo SVG via `sharp`) i actualitzat l'`apple-touch-icon` en tots els HTML.
  - Schema.org **`Event[]` dinàmic** injectat al `<head>` de `programacio.html` (i `es/`) via `js/programacio.js`, amb tots els actes futurs en format JSON-LD. Habilita els "rich results" d'events a Google.
  - URL del Service Worker (`sw.js`) corregida de `/noticies.html` a `/noticies` (URL neta).

* **Accessibilitat (a11y)**:
  - `aria-label="Entorn i Ball Pla d'Ares del Maestrat"` afegit al `<video>` del hero.
  - Botó hamburguesa amb `aria-expanded` dinàmic (s'actualitza en obrir/tancar) i `aria-label` descriptiu en valencianà (`Obrir/Tancar menú de navegació`) i `aria-controls="nav-menu"`.
  - Ícons decoratius de Lucide amb `aria-hidden="true"` als panells on es renderitzen dinàmicament.
  - Estilos `:focus-visible` afegits a `css/styles.css`: outline visible (2px solid) per a navegació per teclat, sense afectar usuaris de ratolí.
  - FAQ accordion ja tenia `aria-expanded` correcte. S'ha afegit `role="region"` al contingut dels panells FAQ a `home.js`.
  - Skip link (`.skip-link`) definit en CSS, a punt per afegir als HTML.

* **Codi i Mantenibilitat**:
  - Versió de CSS unificada a `?v=1.20` en tots els 20 fitxers HTML (estava inconsistent: `?v=1.14` i `?v=1.19` barrejats).
  - Script de build `scripts/update-html.js` creat per facilitar futurs canvis massius als HTML.
  - Instal·lat `sharp` com devDependency per a generació d'imatges PNG en scripts de build.

---

## 23. Optimització de la Gestió d'Actes (Zero Scroll), Disseny Mòbil i Notícies Programades (v1.24)
Completat en la sessió actual:
* **Rediseñ de la Taula d'Actes de l'Admin (`/admin/`)**:
  - Aplicat `table-layout: fixed` i reduït l'amplada del sidebar del calendari de `340px` a `260px` amb `gap: 1rem`, aconseguint que la taula s'ajuste al 100% de l'amplada en ordinadors sense cap mena de scroll horitzontal.
  - Data i hora d'actes estructurades en dues línies visuals.
  - Botons d'acció de la taula transformats en botons icona quadrats i compactes (`30px × 30px`) amb icones de Lucide (`edit-3` i `trash-2`), atorgant un aspecte net i modern.
* **Transformació Mòbil en Targetes (Card Layout) i Reordenació (`@media (max-width: 768px)`)**:
  - En pantalles mòbils, la taula es transforma automàticament en un llistat de targetes mòbils independents (`display: block`). Cada acte es mostra com una targeta arrodonida amb tots els camps i botons d'acció directament visibles a la dreta sense cap desbordament horitzontal.
  - Reordenació mòbil: El calendari de filtres es posiciona primer (`order: 1`) i el llistat d'actes apareix a sota (`order: 2`).
* **Sistema de Publicació Programada de Notícies (`published_at`)**:
  - Selector de data i hora de publicació tipus `datetime-local` a `admin/editor.html` i opció d'estat `⏰ Programat`.
  - Etiquetes distintives blaves `⏰ Programat` al llistat de notícies de l'administració.
  - Filtre automàtic al frontend (`js/db.js` i `scripts/generate-news.js`): Les notícies amb data/hora futura romanen ocultes al web públic fins al moment exacte en què es compleix la data/hora de publicació, moment en què s'activen de manera transparent.
  - Notificacions Push encobertes fins a la data efectiva de publicació.
* **Cache-Busting (v1.24)**: Actualitzat als HTML de l'administració.

---

## 25. Correcció de la Galeria d'Imatges de Productes a la Tenda (PRO/Local)
Completat en la sessió actual:
* **Problema identificat**: A les pàgines de productes (`camisetes.html`, `es/camisetes.html` i fitxers estàtics generats), la consulta de selecció del DOM buscava la classe `.product-gallery-strip`, mentre que el contenidor HTML tenia la classe `.gallery-thumbs`. Això provocava que `galleryStrip` fóra `null` i que la galeria mai s'actualitzara dinàmicament amb les imatges de `prod.images` (mostrant sempre únicament les 2 imatges estàtiques del codi HTML original).
* **Solució al Frontend (`camisetes.html`, `es/camisetes.html`, `camisetes/index.html`, `es/camisetes/index.html`)**:
  - Unificades les classes CSS i els selectors a `.gallery-thumbs, .product-gallery-strip, #product-gallery-strip`.
  - Afegit suport de desplaçament horitzontal suau (`overflow-x: auto; padding-bottom: 4px;`) per a mostrar 3, 4 o més miniatures de manera fluida en mòbils i ordinadors.
  - Normalització automàtica de `prod.images` a `applyProduct(prod)` (acceptant arrays de JavaScript, strings JSON, o llistes separades per comes), assegurant que totes les imatges del producte es renderitzen com a miniatures interactives amb canvi dinàmic de la imatge principal `#main-img`.
* **Millores al Panell d'Administració (`admin/index.html` i `admin/gestio.js`)**:
  - Afegit contenidor visual de previsualització `#product-gallery-previews` al modal d'edició de productes.
  - Els administradors ara poden veure totes les imatges assignades al producte amb un botó d'eliminació ràpida (`×`) a cada miniatura per treure fotos amb un sol clic.
  - En seleccionar múltiples arxius a `#product-files-extra`, es mostren immediatament previsualitzacions visuals dels arxius pendents de pujar.
  - Al desar el formulari, es pugen tots els nous arxius a l'Storage de Supabase i es fusionen amb les imatges existents sense duplicats.
* **Normalització a la Base de Dades (`js/db.js`)**:
  - Les funcions `getProducts()` i `saveProduct(product)` ara normalitzen sempre la propietat `images` com a un array net d'URLs de text, garantint que la persistència a `localStorage`, `IndexedDB` i Supabase siga idèntica i consistent.
  - Actualitzat `DEFAULT_PRODUCTS` a `js/db.js` amb les 4 imatges oficials de la samarreta.
* **Cache-Busting (v2.2)**: S'ha incrementat la consulta de scripts a `?v=2.2` a tots els fitxers HTML del projecte.

---

## 26. Enviament Automàtic de Correu de Confirmació de Pagament (Tenda / Samarretes)
Completat localment:
* **Plantilla de Correu HTML (`templates/email-pago-confirmado.html`)**: Creada una plantilla de disseny professional i responsive que coincideix amb la identitat corporativa de la Comissió, incorporant l'estat de comanda confirmada, badge verd de pagament validat, detall del producte amb miniatura de la samarreta, informació sobre la recollida presencial i enllaços a xarxes socials.
* **Mètode d'Enviament (`js/db.js`)**: S'ha afegit el mètode `window.db.sendPaymentConfirmationEmail(reservation)` que formata totes les variables del client (`name`, `surname`, `email`, `size`, `quantity`, `total`, `concept`, `product_name`) i les envia mitjançant el servei EmailJS amb protecció de temps d'espera (timeout).
* **Automatització al Panell d'Admin (`admin/gestio.js` i `admin/index.html`)**:
  - En prémer el botó **"Validar & Enviar Email"** a la taula de reserves, s'actualitza l'estat de la comanda a `paid` a la base de dades i es dispara automàticament l'enviament del correu de confirmació de pagament usant el template oficial `template_s9dtrrv`.
  - Per a comandes ja pagades, s'ha afegit un botó d'acció **"Reenviar correu"** per si cal tornar a enviar la confirmació al comprador amb un sol clic.
  - S'ha implementat un sistema de notificacions visuals no intrusives (`showAdminToast`) que alerta l'administrador del resultat de l'enviament.
  - S'ha afegit un panell de configuració i botó de test per a EmailJS (`#form-emailjs-config` i `#btn-test-paid-email`) dins de la pestanya de la tenda amb el Template ID per defecte `template_s9dtrrv`.
* **Botons d'Icona Compactes amb Tooltips Instantanis i Cache-Busting (v2.7 - PRO)**: S'han substituït els botons d'acció de la taula de reserves per botons quadrats compactes (`32px × 32px`) amb icones clares (`check`, `mail`, `rotate-ccw`, `x`, `trash-2`) i tooltips CSS flotants instantanis (*tooltips* amb etiqueta fosca i fletxa al passar el ratolí: *Validar pagament i enviar correu*, *Reenviar correu de pagament*, *Canviar estat a pendent*, *Cancel·lar reserva*, *Eliminar del registre*), assegurant un disseny 100% net i sense desbordaments ni talls.

---

## 27. Correcció de Desactivació de Reserves de Samarretes i Error 401 en Trigger-Deploy (PRO)
Completat localment:
* **Diagnòstic de l'Error 401 a Supabase Edge Function (`trigger-deploy`)**:
  - L'Edge Function `trigger-deploy` (`supabase/functions/trigger-deploy/index.ts`) exigia exclusivament una capçalera `Authorization: Bearer <WEBHOOK_SECRET>`. Quan el webhook de base de dades intern de Supabase es disparava, si no tenia configurada exactament aquesta capçalera HTTP o si enviava les credencials del sistema de Supabase (com la `service_role_key` o `anon_key`), la funció retornava `401 Unauthorized`.
  - **Solució**: S'ha actualitzat `supabase/functions/trigger-deploy/index.ts` perquè accepte de forma transparent la validació de `WEBHOOK_SECRET` (amb o sense `Bearer`), `SUPABASE_SERVICE_ROLE_KEY` o `SUPABASE_ANON_KEY`, eliminant bloquejos erronis davant de crides internes legítimes de la base de dades.
* **Sincronització de l'Estat de Reserves entre Admin i Front**:
  - **Problema**: El botó "Tancar Reserves" (`#btn-toggle-reservations`) només desava un flag a la taula `events` (`shop-config-camisetes`), però no canviava l'estat a la taula `products`. Les pàgines públiques (`camisetes.html` i `tenda.html`) només llegien `product.status === 'closed'` del catàleg estàtic (`data/products.json`), ignorant la configuració global i mostrant sempre les reserves obertes.
  - **Solució a `js/db.js` i `admin/gestio.js`**:
    - `saveShopConfig(config)` ara utilitza l'esquema complet requerit per PostgreSQL (`title_es`, `description_es`, `long_description`, etc.) evitant errors de restricció `NOT NULL`.
    - `saveShopConfig(config)` actualitza simultàniament l'estat de tots els productes a la taula `products` de Supabase (`status: closed/open`), la memòria cau local `ares_products`, i refresca immediatament la taula del panell d'administració (`loadProductsTable()`).
* **Comprovació en Temps Real al Frontend (`camisetes.html`, `es/camisetes.html`, `tenda.html`, `es/tenda.html`)**:
  - Les pàgines de compra i el catàleg de la botiga ara verifiquen `getShopConfig()` en viu. Si les reserves estan tancades a nivell global, es commuta immediatament a l'avís de *"🔒 Reserves tancades"* i s'amaga el selector de talles i el botó de reserva sense retard (0 ms).
* **Cache-Busting (v2.8)**: Incrementat a `?v=2.8` a tots els arxius HTML del projecte.

---

## 28. Ocultació Dinàmica d'Actes Destacats i Sincronització de Mòduls de la Home (PRO)
Completat localment:
* **Ocultació Automàtica si no hi ha Propers Actes Programats (`js/home.js`)**:
  - Eliminat el fallback antic que forçava a mostrar actes passats a la portada (`if (upcoming.length === 0) upcoming = eventsList;`).
  - Ara, si no hi ha actes futurs a partir de la data actual d'Espanya (`e.date >= today`), tota la secció `#events-highlight-section` (capçalera, botó de programa complet i contenidor) s'oculta automàticament (`display: none`), evitant mostrar seccions buides o actes antics obsolets.
* **Sincronització en Temps Real dels Mòduls de la Home (`js/db.js` i `js/home.js`)**:
  - `getHomeConfig()` ara consulta directament a Supabase en temps real quan està connectat, actualitzant automàticament la memòria cau local `ares_home_config`. D'aquesta manera, els blocs ocultats o reordenats es reflecteixen immediatament a la portada sense dependre de la compilació estàtica de GitHub Actions.
  - A `loadHomeData()` es respecta de forma estricta la llista `hidden_blocks`: si `events-highlight-section` ha sigut desactivat des del panell d'administrador, la secció es manté completament oculta.
* **Auto-Desat al Panell d'Administrador (`admin/gestio.js`)**:
  - Les accions d'ocultar/mostrar blocs (`toggleHomeBlockVisibility`), pujar/baixar (`moveHomeBlock`) i el desplaçament d'arrossegar i deixar anar (drag & drop) ara es desen automàticament a Supabase i `localStorage` en el mateix instant de la interacció, sense obligar l'usuari a prémer el botó inferior de desar.
* **Cache-Busting (v2.9)**: Incrementat a `?v=2.9` a tots els arxius HTML del projecte (`js/db.js`, `js/home.js`, `admin/gestio.js`).

---

## 29. Nous Productes de Marxandatge i Guia de Talles Dinàmica (PRO)
Completat i verificat:
* **Nous Productes al Catàleg (`data/products.json`, `js/db.js`, `camisetes.html`, `es/camisetes.html`)**:
  - Afegits 3 nous productes de marxandatge oficial:
    - **Tote Bag «El mirador del Maestrat»** (6.00 €, Talla Única, imatge `img/tote-bag-1.jpg`).
    - **Samarreta «El mirador del Maestrat»** (12.00 €, talles XS a 5XL, fitxa tècnica oficial de tallatge i taula de mides en cm, imatge `img/samarreta-mirador-1.jpg`).
    - **Rinyonera «El mirador del Maestrat»** (12.00 €, Talla Única, cinta ajustable, imatge `img/rinyonera-mirador-1.jpg`).
* **Guia de Talles Dinàmica i Condicional**:
  - Els productes amb `Talla Única` amaguen automàticament qualsevol referència o enllaç a "Guia de talles" (`#size-guide-toggle-link` i `#size-accordion` ocults amb `display: none`).
  - La Samarreta Mirador incorpora la taula específica amb mides de tallatge XS a 5XL i enllaç a la imatge tècnica oficial (`img/tallatge-mirador.png`).
* **Interactivitat i Delegació Global d'Esdeveniments**:
  - S'ha implementat delegació d'esdeveniments a nivell de document (`document.addEventListener('click', ...)`) per a assegurar que tots els botons de selecció de talla, selectors de quantitat (+ / −), botons d'afegir al carret, reserva directa i tancament de modal funcionen de forma immediata i sense bloquejos d'estat ni interferències d'elements superposats.

---

## 30. Carret de Compra Multi-producte i Correcció de Correus EmailJS (PRO)
Completat i verificat:
* **Sistema de Carret Multi-producte (`js/cart.js`)**:
  - Nou mòdul global `window.cart` amb persistència a `localStorage` (`ares_cart`).
  - Calaix lateral lliscant (Drawer) amb llistat d'articles afegits, miniatures, selecció de talla, modificador de quantitats (+ / − / eliminar), subtotal en temps real i botó de tramitació de comanda completa.
  - Insígnia flotant de recompte d'articles (`#cart-drawer-badge`).
* **Sincronització de l'Import Total per Defecte (6.00 € / 12.00 €)**:
  - En carregar qualsevol producte (`applyProduct`), s'executa immediatament `updateQty(quantity)`, sincronitzant `#total-display`, `#modal-total` i `#btn-confirm-label` amb el preu real de l'article en lloc del valor estàtic heretat de 35.00 €.
  - S'han actualitzat les plantilles físiques estàtiques en el generador JAMstack (`scripts/generate-news.js`) per a garantir que les pàgines de cada producte naixen amb el preu exacte calculat en l'HTML inicial.
* **Correcció dels Paràmetres del Correu de Confirmació (`emailjs.send`)**:
  - **Problema**: Al correu de confirmació de reserva, a l'apartat "PRODUCTES RESERVATS" apareixia el concepte de la transferència bancària (`RESERVA Nom Cognom`) en lloc del resum d'articles comprats. Això succeïa perquè el paràmetre `concept` s'assignava amb `bankConcept`.
  - **Solució**: S'ha assignat a `concept` el resum detallat de productes (`productSummary`, ex: `2x Samarreta... (L), 1x Tote Bag...`), preservant `bank_concept` per al bloc de la transferència bancària (`CONCEPTE OBLIGATORI`).
  - S'han inclòs àlies preventius (`product_summary`, `products`, `productes_reservats`, `reserved_products`) i s'ha configurat `product_image` amb la miniatura del primer article en comandes del carret.
  - S'ha actualitzat `templates/email-confirmation.html` i s'han sincronitzat tots els fitxers físics del projecte.

## 31. Imatge de Previsualització per a WhatsApp i Xarxes a la Tenda (PRO)
Completat i verificat:
* **Generació de `img/tenda-hero.jpg`**:
  - Creat a partir de la imatge de portada oficial de la botiga (`img/tenda-hero.webp`) en format JPEG progressiu d'alta resolució (1024 × 682 px, 179 KB), ideal per als rastrejadors de xarxes socials i aplicacions de missatgeria com WhatsApp, Facebook, Telegram i Twitter.
* **Actualització d'Etiquetes OpenGraph i Twitter Card (`tenda.html` i `es/tenda.html`)**:
  - S'ha substituït la imatge genèrica `portada.jpg` per `https://www.comiares.es/img/tenda-hero.jpg`.
  - Afegides les metadades completes: `og:image:secure_url`, `og:image:type` (`image/jpeg`), `og:image:width` (1024), `og:image:height` (682), `og:image:alt`, `og:description`, `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description` i `twitter:image`.
  - D'aquesta manera, en compartir l'enllaç `https://www.comiares.es/tenda` a WhatsApp o xarxes, la targeta mostra immediatament la portada autèntica de la botiga oficial.

---

## 32. Solució a la Persistència i Visualització de Reserves de Nous Productes al Panell d'Admin (PRO)
Completat i verificat:
* **Diagnòstic de l'Error de Persistència a Supabase**:
  - La taula `reservations` de Supabase té un esquema estricte de columnes estàndard: `id` (TEXT), `name`, `surname`, `email`, `size`, `quantity`, `amount_cents`, `status`, `notes`, `created_at`.
  - Quan un usuari feia una reserva d'un producte nou (Tote Bag, Samarreta Mirador, Rinyonera o comanda multi-producte del carret), `camisetes.html` enviava camps addicionals (`product_id`, `product_name`, `product_slug`, `product_image`, `concept`, `items`). PostgREST retornava un error `400 Bad Request (PGRST204: Could not find the 'product_name' column of 'reservations' in the schema cache)`.
  - Aquest error s'atrapava silenciosament en `addReservation` (`js/db.js`), desant-se només a `localStorage` del comprador però sent rebutjat per Supabase. En obrir el panell d'administrador des de qualsevol equip, la taula de Supabase no contenia aquestes reserves.
* **Empaquetament i Desempaquetament Transparent de Metadades (`js/db.js`)**:
  - **Empaquetament (`formatReservationNotes` i `syncReservationToSupabase`)**: Les dades dels nous productes i el desglossament del carret s'empaqueten de manera transparent dins del camp de text `notes` mitjançant el prefix llegible per a humans (`[Producte: Nom] Observacions: ...`) i el tag estructurat `<!--ORDER_METADATA:{...}-->`. La càrrega útil enviada a Supabase només conté les columnes suportades per la taula, garantint respostes `201 Created` sense violacions d'esquema ni necessitat de migracions SQL manuals a PostgreSQL.
  - **Desempaquetament (`unpackReservation`)**: En descarregar reserves de Supabase o emmagatzematge local, s'extreuen automàticament `product_name`, `product_slug`, `product_id`, `items` i `clean_notes`. Les reserves antigues sense metadades s'assignen per defecte a la Samarreta Homenatge Ares SD.
  - **Auto-sincronització en segon pla**: `getReservations()` detecta si hi ha reserves a `localStorage` que encara no estiguen a Supabase (com les creades durant proves o en desconnexió) i les puja automàticament al núvol.
* **Millora Integral del Panell d'Administrador (`admin/gestio.js`)**:
  - **Desglossament d'articles a la taula**: Si una reserva té múltiples articles (comandes del carret), es mostren sota el nom del client amb un llistat clar de cada producte, quantitat i talla (`📦 Comanda Multi-producte: · 2x Tote Bag (Talla Única) · 1x Samarreta Mirador (L)`). Si el client va deixar observacions, es mostren amb una insígnia d'estil xat (`💬 "Observacions..."`).
  - **Filtre intel·ligent per producte**: El desplegable `#filter-reservation-product` ara inclou tots els productes del catàleg i detecta qualsevol producte present a les reserves. El filtre cerca no només pel títol general, sinó per qualsevol dels articles individuals inclosos dins de comandes multi-producte.
  - **Càlcul precís d'estadístiques**: La descomposició de talles més venudes (`topSize`) itera a través de cada element de la comanda, ignorant automàticament "Vàries talles".
  - **Exportació CSV fidel**: Genera el resum detallat de productes i talles i exporta les observacions netes sense codis ni etiquetes tècniques.
* **Actualització del Frontend (`camisetes.html`, `es/camisetes.html`, `camisetes/index.html`, `es/camisetes/index.html`)**:
  - S'ha assegurat que `orderItems` es genera abans de `reservationData` i s'inclou la matriu `items: orderItems` en cada transacció.

---

## 33. Solució a la Persistència del Preu de Productes des del Panell de Control (PRO)
Completat i verificat:
* **Diagnòstic de l'Error**:
  1. A `js/db.js` (`getProducts()`, línia 2301), la inicialització i fusió de `DEFAULT_PRODUCTS` tenia forçat `price: defProd.price` al final del spread. Això provocava que en recarregar la taula de productes després de guardar un preu nou, el valor s'esborrava i es revertia immediatament a `35.00 €`.
  2. En desar el formulari `#form-product` a `admin/gestio.js`, l'objecte `productData` es creava des de zero sense preservar camps existents com `sizes` o `created_at`.
  3. A `camisetes.html` i `es/camisetes.html`, en accedir a la pàgina principal de la samarreta sense paràmetre `slug`, s'assignava directament `HARDCODED_PRODUCTS[0]` (35.00 €) sense consultar `localStorage.getItem('ares_products')`.
* **Solucions Aplicades**:
  - **`js/db.js`**: S'ha corregit `DEFAULT_PRODUCTS.forEach` per a respectar `existingPrice` i `existingSizes`. En `saveProduct(product)`, es converteix el preu a float numèric net (`numericPrice`), s'actualitza instantàniament `localStorage` (0 ms), IndexedDB i Supabase, i es sincronitza la configuració de botiga com a còpia de seguretat.
  - **`admin/gestio.js`**: En desar el producte, es recupera l'element preexistent del catàleg per a fusionar totes les seues propietats (`sizes`, `created_at`, etc.) i es mostra un avís Toast confirmant l'operació.
  - **`camisetes.html` i `es/camisetes.html`**: En la càrrega inicial síncrona (0 ms), es cerca a `ares_products` tant pel `slug` com per `id` fins i tot en visites directes a `/camisetes.html` i es renderitza el preu exacte (amb decimals quan pertoque). A més, en el pas 2 es prioritza el producte actualitzat de `db.getProducts()`.
  - **Compilació JAMstack**: Executat `scripts/generate-news.js` per a reflectir tots els canvis en els directoris físics estàtics.

---

## 34. Pròxim Pas
* Esperar noves instruccions de l'usuari.


