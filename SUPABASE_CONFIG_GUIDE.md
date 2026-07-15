# Guía de Configuración y Despliegue de Supabase

Este documento contiene los secretos autogenerados y los comandos exactos para configurar y desplegar las Edge Functions y la base de datos de tu proyecto de Supabase.

---

## 🔑 Secretos Generados

Hemos generado el siguiente secreto aleatorio y seguro para la sincronización entre el Webhook de la Base de Datos y tu Edge Function de despliegue:

* **`WEBHOOK_SECRET`**: `417dd2322e472432b0832969f63ae234ee71706f8ccfcb30ad895930c559b75e`

---

## 🛠️ Paso 1: Configurar Variables de Entorno en Supabase

Ejecuta el siguiente comando en tu terminal para subir las variables de entorno necesarias a Supabase. 

*(Asegúrate de reemplazar `<TU_GITHUB_PAT>` por tu Token de Acceso Personal de GitHub y `<TU_API_KEY_AEMET>` por tu clave de la AEMET)*:

```bash
supabase secrets set WEBHOOK_SECRET="417dd2322e472432b0832969f63ae234ee71706f8ccfcb30ad895930c559b75e" GITHUB_PAT="<TU_GITHUB_PAT>" AEMET_API_KEY="<TU_API_KEY_AEMET>"
```

---

## 🚀 Paso 2: Desplegar todas las Edge Functions

Usa este comando único para desplegar todas las funciones del proyecto a Supabase:

```bash
supabase functions deploy aemet-weather translate-text trigger-deploy share
```

---

## 🔗 Paso 3: Configurar el Database Webhook en Supabase

Para que el despliegue automático funcione cada vez que edites o crees una noticia, configura el webhook en el panel de control de Supabase:

1. Ve a **Database** → **Webhooks**.
2. Edita o crea un webhook para la tabla `news` (eventos `INSERT`, `UPDATE`, `DELETE`).
3. Elige el tipo **HTTP Webhook** apuntando a tu función `trigger-deploy` (URL: `https://<TU_PROYECTO_ID>.supabase.co/functions/v1/trigger-deploy`).
4. En la sección **HTTP Headers**, añade la cabecera de autenticación:
   * **Key**: `Authorization`
   * **Value**: `Bearer 417dd2322e472432b0832969f63ae234ee71706f8ccfcb30ad895930c559b75e`

---

## 🔒 Paso 4: Actualizar Clave Anon en GitHub y Panel de Admin

1. **Rotar Key**: Si aún no lo has hecho, ve a *Supabase Settings → API → Roll anon key* para rotar la clave antigua expuesta en el historial.
2. **Secrets de GitHub**: Ve a tu repositorio en GitHub → *Settings → Secrets and variables → Actions* y añade o edita:
   * `SUPABASE_URL`: La URL del API de tu proyecto (ej: `https://xxxx.supabase.co`).
   * `SUPABASE_ANON_KEY`: La nueva clave `anon` que acabas de rotar.
3. **Panel de Admin**: Entra en la pestaña **Configuració** en tu panel local o de producción (`/admin/`) y pega la nueva clave y URL de tu proyecto. El sistema corregirá automáticamente la URL si copiaste la de la consola de Supabase.
