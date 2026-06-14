# Handoff & Tasks Status (`AGENTS.md`)

Este archivo sirve como guía de transferencia para el agente de IA que continuará el desarrollo en la nueva máquina Mac.

---

## 1. Contexto General y Objetivos
Estamos trabajando en el sitio web de la **Comissió de Festes d'Ares del Maestrat**. Recientemente rediseñamos el Panel de Administración privado (`/admin`) para alinearlo estéticamente con el diseño premium flotante y oscuro del front-end. 

---

## 2. Estado de la Tarea del Panel de Admin (PRO)
Todas las tareas del panel de administración principal se completaron, verificaron localmente y se **subieron a la rama principal (PRO)** en el commit `a18e2db`. 
* **Remoción de Modo Demo**: Se borró la mención a "Mode Demo" del login y se renombraron los estados de la base de datos a "Mode Local" (en [admin/index.html](file:///c:/Users/andre/Desktop/Andreu/Ares/Comissió/web/admin/index.html) y [admin/gestio.js](file:///c:/Users/andre/Desktop/Andreu/Ares/Comissió/web/admin/gestio.js)).
* **Header & Footer**: Cabecera flotante en cápsula y pie de página negro redondeado (`border-radius: 20px 20px 0 0`) con año dinámico.
* **Barra Lateral Mobile (Hamburguesa)**: Rediseño completo para móviles. El sidebar se comporta como un cajón deslizante vertical (drawer) con fondo difuminado de overlay.
* **Edición de Perfil**: Panel `#tab-profile` que permite cambiar el avatar (subiendo archivo local en Base64 o pegando URL) y el nombre dinámico del usuario activo.
* **Scroll Horizontal Solucionado**: Limitaciones rígidas de ancho (`max-width: 100%`) aplicadas en `.admin-layout`, `.admin-layout main` y `.admin-panel` que contienen por completo el contenido y delegan el scroll de forma interna en las tablas.

---

## 3. Estado del Código Actual
* **Árbol de trabajo**: Limpio en la rama `main` (todos los desarrollos de la administración están confirmados y subidos a origin).
* **Botón Área de Socio**: La propuesta de añadir un botón de acceso al panel en la cabecera pública fue **descartada** por el momento, por lo que el código público del header no tiene modificaciones.

---

## 4. Mejoras Visuales, Animaciones y Tarjetas de Eventos (PRO)
Todas las tareas de rediseño visual y animaciones fueron completadas, validadas y **subidas a la rama principal (PRO)** en el commit `3f39f02`:
* **Jerarquía de Fechas**: Se invirtió la prioridad visual en `/programacio.html` haciendo que la fecha exacta (`.timeline-date-full`) sea grande y negrita, y el día de la semana (`.timeline-date-day`) sea secundario y gris.
* **Separación del Botón de Cierre en Modales**: Se aplicaron márgenes superiores a la imagen del evento en modales para evitar que el botón de cierre circular "X" se superponga sobre las fotografías.
* **Carrusel de Noticias Móvil**: Se solucionó de manera robusta el desborde lateral y el recorte del primer elemento eliminando el margen negativo izquierdo (`margin-left: 0`) para alinearlo naturalmente con el título 'ÚLTIMES NOTÍCIES'. El carrusel sangra y fluye solo hacia la derecha (`margin-right: -2rem`, `padding-right: 2rem`), y se añadió `overflow-y: hidden;` para evitar un scroll vertical parásito.
* **Tarjetas de Eventos Destacados (Home)**: Se sustituyó la rejilla de noticias por tarjetas individuales blancas `.home-event-card` con bordes redondeados de `20px` y sombras, distribuidas de forma horizontal (eje de abscisas) en escritorio y en pila vertical en móvil, ubicando siempre la etiqueta de categoría de forma consistente debajo del título.
* **Bordes del Widget de Tiempo**: Se unificaron los radios de borde del tiempo en la home (`20px` la tarjeta y `14px` las celdas diarias, alineándose con `temps.html`).
* **Visualización del Tiempo en Móvil**: Se resolvió la desaparición de los iconos meteorológicos de Lucide y el desborde lateral mediante el uso de `flex-shrink: 0`, `min-width: 0` y paddings horizontales optimizados.
* **Dropdown de Idiomas**: Apertura por clic y diseño de cápsula integrado en la cabecera.
* **Reloj Mecánico en Cuenta Atrás**: Animación vertical elástica al cambiar los dígitos en la landing home.
* **Cache-Busting (v1.4)**: Se actualizó el parámetro de consulta a `?v=1.4` en todas las referencias del stylesheet en los archivos HTML del proyecto para forzar la actualización inmediata de la caché del navegador de los usuarios.

---

## 5. Previsualización de Compartir en Redes Sociales (PRO)
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

## 6. Próximo Paso
* Esperar a nuevas instrucciones del usuario.
