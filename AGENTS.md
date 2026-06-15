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

---

## 7. Próximo Paso
* Esperar a nuevas instrucciones del usuario.
