import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("AEMET_API_KEY");
    if (!apiKey) {
      throw new Error("AEMET_API_KEY environment variable is not set");
    }

    const municipio = "12014"; // Ares del Maestrat
    const url = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/${municipio}`;

    // Step 1: Call AEMET to get the temporary data URL
    const aemetRes = await fetch(url, {
      headers: {
        "api_key": apiKey,
        "accept": "application/json"
      }
    });

    if (!aemetRes.ok) {
      throw new Error(`AEMET API error: HTTP ${aemetRes.status}`);
    }

    const redirectData = await aemetRes.json();
    if (redirectData.estado !== 200) {
      throw new Error(`AEMET redirect error: ${redirectData.descripcion || redirectData.estado}`);
    }

    const dataUrl = redirectData.datos;
    if (!dataUrl) {
      throw new Error("No data URL returned by AEMET redirect");
    }

    // Step 2: Fetch the actual weather forecast JSON from the temporary URL
    const dataRes = await fetch(dataUrl);
    if (!dataRes.ok) {
      throw new Error(`AEMET data fetch error: HTTP ${dataRes.status}`);
    }

    const rawData = await dataRes.json();
    
    // Step 3: Extract and simplify the forecast data
    const municipioData = rawData[0];
    const days = municipioData?.prediccion?.dia || [];

    // Parse the next 3 days of forecast
    const forecast = days.slice(0, 3).map((day: any) => {
      // Find the most representative sky state (often '00-24' period or the first one)
      const skyStateObj = day.estadoCielo?.find((state: any) => state.periodo === "00-24") || day.estadoCielo?.[0] || {};
      
      // Find probability of precipitation
      const precipObj = day.probPrecipitacion?.find((prob: any) => prob.periodo === "00-24") || day.probPrecipitacion?.[0] || {};
      const precipValue = typeof precipObj.value === "string" ? parseInt(precipObj.value, 10) : (precipObj.value ?? 0);
      
      // Find wind info
      const windObj = day.viento?.find((w: any) => w.periodo === "00-24") || day.viento?.[0] || {};
      const windVel = typeof windObj.velocidad === "string" ? parseInt(windObj.velocidad, 10) : (windObj.velocidad ?? 0);
      
      return {
        date: day.fecha ? day.fecha.split("T")[0] : "",
        tempMax: day.temperatura?.maxima ?? null,
        tempMin: day.temperatura?.minima ?? null,
        skyDescription: skyStateObj.descripcion || "Despejado",
        skyValue: skyStateObj.valor || "11",
        precipProb: precipValue,
        windSpeed: windVel,
        windDir: windObj.direccion || "",
      };
    });

    const responseBody = {
      municipio: "Ares del Maestrat",
      provincia: "Castellón",
      forecast,
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
