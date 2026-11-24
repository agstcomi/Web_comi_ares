# Instrucciones para el despliegue del sistema de clima en Supabase

Este documento contiene las instrucciones paso a paso para desplegar la nueva versión de la función Edge de clima en Supabase con soporte de caché.

## Paso 1: Ejecutar la migración SQL en Supabase
Para habilitar la caché persistente, entra en el **SQL Editor** del Dashboard de Supabase de tu proyecto, crea una consulta nueva y ejecuta el siguiente bloque SQL:

```sql
CREATE TABLE IF NOT EXISTS weather_cache (
  id TEXT PRIMARY KEY DEFAULT 'current',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  data JSONB NOT NULL
);

ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a usuarios anonimos y autenticados" ON weather_cache
  FOR ALL USING (true) WITH CHECK (true);
```

---

## Paso 2: Clonar o actualizar el repositorio en tu PC personal
Desde tu terminal en tu PC personal, navega a la carpeta del proyecto y obtén los últimos cambios (donde ya viene implementada la caché):

```bash
git pull origin main
```

---

## Paso 3: Iniciar sesión en Supabase CLI
Genera un token de acceso desde el navegador en [Supabase Access Tokens](https://supabase.com/dashboard/account/tokens) y luego inicia sesión en tu terminal usando el token:

```bash
supabase login --token TU_TOKEN_DE_ACCESO
```

---

## Paso 4: Desplegar la función a Supabase
Una vez logueado, ejecuta el comando de despliegue:

```bash
supabase functions deploy aemet-weather
```

¡Listo! Con esto la caché estará completamente activa y la web mostrará los datos de AEMET de forma consistente y resiliente.
