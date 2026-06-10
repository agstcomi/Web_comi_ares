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

## 4. Próximo Paso
* Esperar a nuevas instrucciones del usuario.
