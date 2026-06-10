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

---

## 6. Estado del Código Actual
* **Árbol de trabajo**: Limpio en la rama `main`.
* **Push a origin**: Pendiente de autenticación HTTPS. Ejecutar en terminal si se desea forzar:
  ```bash
  cd /Users/tsoga00/Web_comi_ares
  git push origin main
  ```
* **Botón Área de Socio**: Descartado. El header público no tiene modificaciones.

---

## 7. Próximo Paso
* Esperar a nuevas instrucciones del usuario.
