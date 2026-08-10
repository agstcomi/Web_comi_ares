const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Funció per demanar dades per consola si no estan definides
function demanaDada(pregunta) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(pregunta, resposta => {
      rl.close();
      resolve(resposta.trim());
    });
  });
}

async function main() {
  console.log("=== Sincronitzador d'Esdeveniments a Supabase ===");

  // 1. Intentar llegir variables d'un arxiu .env si existeix
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    console.log("S'ha trobat un arxiu .env, llegint credencials...");
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key) process.env[key] = val;
      }
    });
  }

  let supabaseUrl = process.env.SUPABASE_URL;
  let supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 2. Demanar credencials si no estan definides
  if (!supabaseUrl) {
    supabaseUrl = await demanaDada("Introdueix la URL del projecte de Supabase (ex: https://xxxx.supabase.co): ");
  }
  if (!supabaseAnonKey) {
    supabaseAnonKey = await demanaDada("Introdueix la Supabase Anon Key: ");
  }
  if (!supabaseServiceKey) {
    // Si no està definida a les variables d'entorn, intentem demanar la service_role key
    supabaseServiceKey = await demanaDada("Introdueix la Supabase Service Role Key (opcional, per a saltar polítiques RLS): ");
  }

  // Si no s'ha introduït Service Key, utilitzem la Anon Key com a mètode d'autenticació per defecte
  if (!supabaseServiceKey) {
    supabaseServiceKey = supabaseAnonKey;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERROR: La URL de Supabase i la Anon Key són obligatòries per a continuar.");
    process.exit(1);
  }

  // Normalitzar la URL de Supabase si l'usuari enganxa la del dashboard
  const dashboardRegex = /supabase\.com\/dashboard\/project\/([a-z0-9]+)/i;
  const match = supabaseUrl.match(dashboardRegex);
  if (match && match[1]) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  }
  supabaseUrl = supabaseUrl.replace(/\/+$/, "");

  // 3. Llegir els actes de data/events.json
  const eventsPath = path.join(__dirname, '..', 'data', 'events.json');
  if (!fs.existsSync(eventsPath)) {
    console.error(`ERROR: No s'ha trobat el fitxer d'actes a: ${eventsPath}`);
    process.exit(1);
  }

  let events = [];
  try {
    events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));
  } catch (err) {
    console.error("ERROR en llegir o analitzar data/events.json:", err);
    process.exit(1);
  }

  console.log(`S'han llegit ${events.length} actes del fitxer local (incloent configuracions).`);

  // 4. Pujar els actes a Supabase (Sincronització neta de taula)
  console.log("\nConnectant amb Supabase...");
  try {
    console.log("Eliminant actes existents a Supabase per evitar conflictes de clau duplicada...");
    const deleteRes = await fetch(`${supabaseUrl}/rest/v1/events?id=not.is.null`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!deleteRes.ok) {
      const deleteErrorText = await deleteRes.text();
      console.warn(`[WARNING] No s'han pogut eliminar els actes anteriors: ${deleteRes.status} ${deleteRes.statusText}`);
      console.warn("Detalls de l'error en esborrar:", deleteErrorText);
    } else {
      console.log("Actes anteriors eliminats correctament de la base de dades.");
    }

    console.log(`Inserint els ${events.length} actes locals...`);
    const res = await fetch(`${supabaseUrl}/rest/v1/events`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(events)
    });

    if (res.ok) {
      console.log("\n[SUCCESS] Tots els actes s'han sincronitzat correctament amb la base de dades de Supabase!");
      console.log("El webhook de la base de dades s'executarà de forma asíncrona i reconstruirà la web a GitHub Pages.");
    } else {
      const errorText = await res.text();
      console.error(`\n[ERROR] La resposta de Supabase no ha sigut correcta: ${res.status} ${res.statusText}`);
      console.error("Detalls de l'error:", errorText);
      if (res.status === 401 || errorText.includes("row-level security")) {
        console.log("\n💡 Pista: Si reps un error de polítiques RLS (Row-Level Security), recorda definir la SUPABASE_SERVICE_ROLE_KEY a l'arxiu .env per tenir permisos d'escriptura.");
      }
    }
  } catch (err) {
    console.error("\n[ERROR] S'ha produït un error de xarxa en connectar amb Supabase:", err);
  }
}

main();
