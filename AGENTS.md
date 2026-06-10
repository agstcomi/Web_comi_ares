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
Todas las tareas de rediseño visual y animaciones fueron completadas, validadas y **subidas a la rama principal (PRO)** en el commit `c985719`:
* **Jerarquía de Fechas**: Se invirtió la prioridad visual en `/programacio.html` haciendo que la fecha exacta (`.timeline-date-full`) sea grande y negrita, y el día de la semana (`.timeline-date-day`) sea secundario y gris.
* **Separación del Botón de Cierre en Modales**: Se aplicaron márgenes superiores a la imagen del evento en modales para evitar que el botón de cierre circular "X" se superponga sobre las fotografías.
* **Carrusel de Noticias Móvil**: Se solucionó el recorte del primer elemento mediante márgenes `:first-child` y `:last-child` en lugar de paddings de contenedor, asegurando que se alinee perfectamente con el título.
* **Tarjetas de Eventos Destacados (Home)**: Se sustituyó la rejilla de noticias por tarjetas individuales blancas `.home-event-card` con bordes redondeados de `20px` y sombras, distribuidas de forma horizontal (eje de abscisas) en escritorio y en pila vertical en móvil, ubicando siempre la etiqueta de categoría de forma consistente debajo del título.
* **Bordes del Widget de Tiempo**: Se unificaron los radios de borde del tiempo en la home (`20px` la tarjeta y `14px` las celdas diarias, alineándose con `temps.html`).
* **Visualización del Tiempo en Móvil**: Se resolvió la desaparición de los iconos meteorológicos de Lucide y el desborde lateral mediante el uso de `flex-shrink: 0`, `min-width: 0` y paddings horizontales optimizados.
* **Dropdown de Idiomas**: Apertura por clic y diseño de cápsula integrado en la cabecera.
* **Reloj Mecánico en Cuenta Atrás**: Animación vertical elástica al cambiar los dígitos en la landing home.
* **Cache-Busting (v1.3)**: Se actualizó el parámetro de consulta a `?v=1.3` en todas las referencias del stylesheet en los archivos HTML del proyecto para forzar la actualización inmediata de la caché del navegador de los usuarios.

---

## 5. Próximo Paso
* Esperar a nuevas instrucciones del usuario.
