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

## 3. Estado del Código Actual (Cambios Locales sin Confirmar)
Actualmente, hay modificaciones **locales sin hacer commit** en tu árbol de trabajo (`git status` muestra cambios en `css/styles.css` y `js/main.js`). Estos cambios corresponden a la primera versión de la integración del botón público para entrar al panel de administración (Àrea de Soci) en la cabecera:

### Cambios actuales en local:
* **[js/main.js](file:///c:/Users/andre/Desktop/Andreu/Ares/Comissió/web/js/main.js)**: Añadido al final del menú del header dinámico el enlace para entrar en `/admin` (Àrea de Soci / Área de Socio según idioma) con la clase `.nav-btn-socis`.
* **[css/styles.css](file:///c:/Users/andre/Desktop/Andreu/Ares/Comissió/web/css/styles.css)**: Definido el estilo `.nav-btn-socis` como botón cápsula con borde y comportamiento hover (se rellena de color sólido), con reglas especiales en `.on-hero` para mostrarse en blanco sobre fondos de portada oscuros.

---

## 4. Próximo Paso Exacto a Ejecutar
El usuario ha solicitado los siguientes cambios de diseño y maquetación para este nuevo botón:

### Requerimientos:
1. **Contorneado y Color**: El botón de `"Àrea de Soci"` / `"Área de Socio"` debe estar contorneado igual que el botón de selección de idioma (`ESP` / `VAL`), pero con un ligero tono/color blanco (por ejemplo, borde blanco semi-transparente o fondo translúcido blanco muy sutil).
2. **Posicionamiento**: El botón **debe estar justificado a la izquierda del header**. Esto implica que en la vista de escritorio, no debe ir al final de la lista de navegación habitual (en el centro), sino posicionado en la parte izquierda de la cabecera flotante (por ejemplo, alineado al lado del logotipo).
3. **Mantener en Local**: Realizar las modificaciones correspondientes en los archivos `js/main.js` y `css/styles.css` y dejarlos listos en el entorno de trabajo local sin hacer commit para que el usuario pueda revisarlo en su nueva máquina.

---

## 5. Instrucciones de Ejecución
Para iniciar el servidor local en la Mac y probar los cambios:
1. Abrir la terminal en la raíz del proyecto.
2. Ejecutar: `npx http-server -p 8080`
3. Abrir en el navegador: `http://localhost:8080`
