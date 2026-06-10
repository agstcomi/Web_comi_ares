import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import SunCalc from "https://esm.sh/suncalc@1.9.0";

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
    const url = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/${municipio}?api_key=${apiKey}`;

    // Step 1: Call AEMET to get the temporary data URL
    const aemetRes = await fetch(url, {
      headers: {
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

    // Parse the 7 days of forecast
    const forecast = days.map((day: any) => {
      // Find the most representative sky state (often '00-24' period or the first one)
      const skyStateObj = day.estadoCielo?.find((state: any) => state.periodo === "00-24") || day.estadoCielo?.[0] || {};
      
      // Find probability of precipitation
      const precipObj = day.probPrecipitacion?.find((prob: any) => prob.periodo === "00-24") || day.probPrecipitacion?.[0] || {};
      const precipValue = typeof precipObj.value === "string" ? parseInt(precipObj.value, 10) : (precipObj.value ?? 0);
      
      // Find wind info
      const windObj = day.viento?.find((w: any) => w.periodo === "00-24") || day.viento?.[0] || {};
      const windVel = typeof windObj.velocidad === "string" ? parseInt(windObj.velocidad, 10) : (windObj.velocidad ?? 0);
      
      const tempMax = day.temperatura?.maxima !== undefined ? parseInt(String(day.temperatura.maxima), 10) : null;
      const tempMin = day.temperatura?.minima !== undefined ? parseInt(String(day.temperatura.minima), 10) : null;
      
      const sensMax = day.sensTermica?.maxima !== undefined ? parseInt(String(day.sensTermica.maxima), 10) : null;
      const sensMin = day.sensTermica?.minima !== undefined ? parseInt(String(day.sensTermica.minima), 10) : null;
      
      const humidityMax = day.humedadRelativa?.maxima !== undefined ? parseInt(String(day.humedadRelativa.maxima), 10) : null;
      const humidityMin = day.humedadRelativa?.minima !== undefined ? parseInt(String(day.humedadRelativa.minima), 10) : null;
      
      const uvMax = day.uvMax !== undefined ? parseInt(String(day.uvMax), 10) : null;

      // Calculate sunrise and sunset locally using SunCalc for Ares del Maestrat coordinates
      const dateStr = day.fecha ? day.fecha.split("T")[0] : "";
      const dateObj = new Date(`${dateStr}T12:00:00`);
      const sunTimes = SunCalc.getTimes(dateObj, 40.4578, -0.1333);
      const sunrise = sunTimes.sunrise.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
      const sunset = sunTimes.sunset.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

      return {
        date: dateStr,
        tempMax,
        tempMin,
        skyDescription: skyStateObj.descripcion || "Despejado",
        skyValue: skyStateObj.valor || "11",
        precipProb: precipValue,
        windSpeed: windVel,
        windDir: windObj.direccion || "",
        sensMax,
        sensMin,
        humidityMax,
        humidityMin,
        uvMax,
        sunrise,
        sunset,
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
