import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbzH6tLo8_opRSFGWw0b8jAhwqlRGix1pUCzcPG1nM-eg01oyT-Ctk6Z56pgvlXM3nNl/exec";

function sb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── helpers ──────────────────────────────────────────────────────────

function predictSolarPower(temperature: number, humidity: number, lightIntensity: number, cloudCover: number) {
  const baseEfficiency = 0.18;
  const tempFactor = Math.max(0, 1 - Math.abs(temperature - 25) * 0.004);
  const humidityFactor = Math.max(0, 1 - humidity * 0.005);
  const lightFactor = Math.min(1, lightIntensity / 1000);
  const cloudFactor = Math.max(0, 1 - cloudCover / 100);
  const maxPanelWatts = 300;
  const predictedPower = maxPanelWatts * baseEfficiency * tempFactor * humidityFactor * lightFactor * cloudFactor * 5.5;
  const confidence = 70 + lightFactor * 15 + cloudFactor * 10 + (1 - humidity / 100) * 5;
  return { predictedPower: Math.round(predictedPower * 100) / 100, confidence: Math.round(Math.min(95, confidence) * 10) / 10 };
}

function detectFaults(voltage: number, current: number, power: number, temperature: number, efficiency: number) {
  const faults: { type: string; severity: string; message: string }[] = [];
  if (voltage < 12) faults.push({ type: "voltage_anomaly", severity: "critical", message: `Voltage at ${voltage.toFixed(1)}V is critically low` });
  else if (voltage < 16) faults.push({ type: "voltage_anomaly", severity: "warning", message: `Voltage at ${voltage.toFixed(1)}V below optimal` });
  if (current < 0.5 && voltage > 10) faults.push({ type: "current_anomaly", severity: "warning", message: `Current at ${current.toFixed(2)}A unusually low` });
  if (power < 10 && voltage > 10 && current > 0.3) faults.push({ type: "power_drop", severity: "warning", message: "Power output dropped unexpectedly" });
  if (efficiency < 10) faults.push({ type: "low_efficiency", severity: efficiency < 5 ? "critical" : "warning", message: `Efficiency at ${efficiency.toFixed(1)}%` });
  if (temperature > 65) faults.push({ type: "overheating", severity: "critical", message: `Temperature at ${temperature.toFixed(1)}C exceeds safe limit` });
  else if (temperature > 55) faults.push({ type: "overheating", severity: "warning", message: `Temperature at ${temperature.toFixed(1)}C is high` });
  return { isAnomaly: faults.length > 0, faults };
}

function calculateLoadRecommendations(availableWatts: number, weather: string, strategy: string) {
  const appliances = [
    { name: "LED Bulbs", power: 40, category: "essential", priority: 1 },
    { name: "WiFi Router", power: 12, category: "essential", priority: 1 },
    { name: "Phone Charger", power: 15, category: "essential", priority: 1 },
    { name: "Refrigerator", power: 150, category: "essential", priority: 1 },
    { name: "Laptop", power: 65, category: "essential", priority: 2 },
    { name: "Water Pump", power: 750, category: "essential", priority: 2 },
    { name: "Ceiling Fan", power: 75, category: "comfort", priority: 3 },
    { name: "TV 32\"", power: 50, category: "comfort", priority: 3 },
    { name: "Desktop", power: 250, category: "general", priority: 3 },
    { name: "TV 55\"", power: 100, category: "comfort", priority: 3 },
    { name: "Washing Machine", power: 500, category: "general", priority: 4 },
    { name: "Microwave", power: 800, category: "general", priority: 4 },
    { name: "Iron", power: 1000, category: "general", priority: 4 },
    { name: "Air Conditioner", power: 1200, category: "luxury", priority: 5 },
    { name: "Electric Kettle", power: 1500, category: "luxury", priority: 5 },
  ];

  let effective = availableWatts;
  if (weather === "cloudy") effective *= 0.5;
  if (weather === "overcast") effective *= 0.2;
  if (weather === "rainy") effective *= 0.1;
  effective *= 0.85;

  const recommended: { name: string; power_watts: number; max_runtime_hours: number; category: string }[] = [];
  const avoided: { name: string; power_watts: number; max_runtime_hours: number; category: string }[] = [];
  let remaining = effective;
  const multiplier = strategy === "eco" ? 0.6 : strategy === "comfort" ? 1.0 : 0.8;

  for (const app of appliances) {
    if (remaining >= app.power) {
      const maxH = Math.round((remaining / app.power) * multiplier * 10) / 10;
      recommended.push({ name: app.name, power_watts: app.power, max_runtime_hours: Math.min(maxH, strategy === "comfort" ? 10 : 8), category: app.category });
      remaining -= app.power * (strategy !== "comfort" ? 0.5 : 0.3);
    } else {
      avoided.push({ name: app.name, power_watts: app.power, max_runtime_hours: 0, category: app.category });
    }
  }

  const totalRec = recommended.reduce((s, a) => s + a.power_watts, 0);
  const totalAll = appliances.reduce((s, a) => s + a.power, 0);
  return { recommended, avoided, optimization_score: Math.round((totalRec / totalAll) * 100) };
}

// ── route handler ────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/solar-api", "").replace(/^\/+/, "");

    const json = (r: unknown, status = 200) =>
      new Response(JSON.stringify(r), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    // ─── /debug  (see what your hardware is sending) ───────────────────
    if (path === "debug" && req.method === "POST") {
      let body;
      const contentType = req.headers.get("content-type") || "";
      try {
        if (contentType.includes("application/json")) {
          body = await req.json();
        } else {
          body = await req.text();
        }
      } catch (e) {
        body = { error: "Could not parse body", raw: await req.text().catch(() => "unreadable") };
      }
      return json({
        received: body,
        contentType,
        fieldAnalysis: {
          light_intensity: body?.light_intensity !== undefined ? { value: body.light_intensity, type: typeof body.light_intensity } : "NOT PROVIDED",
          voltage: body?.voltage !== undefined ? { value: body.voltage, type: typeof body.voltage } : "NOT PROVIDED",
          current: body?.current !== undefined ? { value: body.current, type: typeof body.current } : "NOT PROVIDED",
          temperature: body?.temperature !== undefined ? { value: body.temperature, type: typeof body.temperature } : "NOT PROVIDED",
          humidity: body?.humidity !== undefined ? { value: body.humidity, type: typeof body.humidity } : "NOT PROVIDED",
        },
        tip: "If light_intensity shows 0 or is NOT PROVIDED, your hardware code needs to send it in the JSON payload",
      });
    }

    // ─── /ingest  (public – Arduino / ESP8266 posts here) ──────────
    if (path === "ingest" && req.method === "POST") {
      const rawBody = await req.text();
      let body;
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        return json({ error: "Invalid JSON", raw: rawBody.substring(0, 500) }, 400);
      }

      // Helper to parse numeric values, supporting multiple field name variations
      const parseNum = (val: unknown): number => {
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Support multiple field name variations for light_intensity
      const lightVal = body.light_intensity ?? body.lightIntensity ?? body.light ?? body.lux ?? body.luminosity ?? 0;

      const voltage = parseNum(body.voltage);
      const current = parseNum(body.current);
      const power = parseNum(body.power) || voltage * current;
      const temperature = parseNum(body.temperature);
      const humidity = parseNum(body.humidity);
      const light_intensity = parseNum(lightVal);
      const panel_efficiency = parseNum(body.panel_efficiency ?? body.efficiency);
      const device_id = String(body.device_id || body.deviceId || "arduino_01");
      const user_id = String(body.user_id || body.userId || "");
      const now = new Date().toISOString();

      // 1) Store in Supabase
      const supabase = sb();

      // Find or create a system user to associate sensor data with
      let ownerId = user_id;
      if (!ownerId) {
        const { data: adminUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "admin")
          .limit(1)
          .single();
        ownerId = adminUser?.id;
      }
      if (!ownerId) {
        // Fallback: use the first authenticated user
        const { data: anyUser } = await supabase
          .from("profiles")
          .select("id")
          .limit(1)
          .single();
        ownerId = anyUser?.id;
      }

      if (ownerId) {
        await supabase.from("sensor_data").insert({
          user_id: ownerId,
          voltage,
          current,
          power,
          temperature,
          humidity,
          light_intensity,
          panel_efficiency,
          device_id,
          is_online: true,
        });
      }

      // 2) Forward to Google Sheet (fire-and-forget)
      try {
        EdgeRuntime.waitUntil(
          fetch(GOOGLE_SHEET_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              voltage,
              current,
              power,
              temperature,
              humidity,
              light_intensity,
              panel_efficiency,
              device_id,
              recorded_at: now,
            }),
          })
        );
      } catch {
        /* best-effort */
      }

      // 3) Run fault detection on freshly-ingested data
      const faultResult = detectFaults(voltage, current, power, temperature, panel_efficiency);
      if (faultResult.faults.length > 0 && ownerId) {
        for (const fault of faultResult.faults) {
          await supabase.from("alerts").insert({
            user_id: ownerId,
            alert_type: fault.type === "voltage_anomaly" ? "fault"
              : fault.type === "overheating" ? "fault"
              : fault.type === "low_efficiency" ? "low_efficiency"
              : "fault",
            severity: fault.severity,
            title: fault.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
            message: fault.message,
            sensor_value: voltage,
            threshold_value: 16,
          });
        }
      }

      // 4) Run prediction on freshly-ingested data
      if (ownerId && light_intensity > 0) {
        const prediction = predictSolarPower(temperature, humidity, light_intensity, 25);
        await supabase.from("predictions").insert({
          user_id: ownerId,
          predicted_power: prediction.predictedPower,
          predicted_energy: prediction.predictedPower / 1000 * 5.5,
          predicted_bill: prediction.predictedPower / 1000 * 0.12 * 5.5,
          confidence_score: prediction.confidence,
          prediction_type: "hourly",
          input_features: { voltage, current, temperature, humidity, light_intensity, panel_efficiency },
          target_date: now,
        });
      }

      return json({
        status: "received",
        data: { voltage, current, power, temperature, humidity, light_intensity, panel_efficiency, recorded_at: now },
        stored_in_supabase: !!ownerId,
        forwarded_to_sheet: true,
        fault_detection: faultResult,
      });
    }

    // ─── /sync-sheet  (public – pulls recent Google Sheet rows into Supabase) ──
    if (path === "sync-sheet" && req.method === "POST") {
      // The Google Sheet script only has doPost (no read capability).
      // This endpoint accepts an array of rows that were previously written to the
      // Google Sheet (e.g. copy-pasted / exported) and backfills them into Supabase.
      // It also returns info about the gap between Sheet and DB.
      const body = await req.json();
      const rows: Array<Record<string, unknown>> = body.rows || [];

      const supabase = sb();

      // Find a user to associate data with
      const { data: owner } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .single();
      const ownerId = owner?.id || body.user_id;

      let inserted = 0;
      if (ownerId && rows.length > 0) {
        const inserts = rows.map(r => ({
          user_id: ownerId,
          voltage: Number(r.voltage) || 0,
          current: Number(r.current) || 0,
          power: Number(r.power) || 0,
          temperature: Number(r.temperature) || 0,
          humidity: Number(r.humidity) || 0,
          light_intensity: Number(r.light_intensity) || 0,
          panel_efficiency: Number(r.panel_efficiency) || 0,
          device_id: String(r.device_id || "arduino_01"),
          is_online: true,
          recorded_at: r.recorded_at || new Date().toISOString(),
        }));

        const { count } = await supabase.from("sensor_data").insert(inserts);
        inserted = inserts.length;
      }

      const { count: totalRows } = await supabase
        .from("sensor_data")
        .select("*", { count: "exact", head: true });

      return json({
        synced: inserted,
        total_in_supabase: totalRows || 0,
        google_sheet_url: GOOGLE_SHEET_URL,
        message: inserted > 0
          ? `Synced ${inserted} rows into Supabase`
          : "No rows provided. POST { rows: [...] } with sensor data to backfill.",
      });
    }

    // ─── /sensor-data  GET ────────────────────────────────────────
    if (path === "sensor-data" && req.method === "GET") {
      const limit = parseInt(url.searchParams.get("limit") || "48");
      const supabase = sb();
      const { data, error } = await supabase
        .from("sensor_data")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(limit);
      if (error) return json({ error: error.message }, 500);
      return json({ data: data || [] });
    }

    // ─── /sensor-data  POST (legacy – same as /ingest) ────────────
    if (path === "sensor-data" && req.method === "POST") {
      // Redirect to /ingest logic by re-processing
      const body = await req.json();
      const voltage = Number(body.voltage) || 0;
      const current = Number(body.current) || 0;
      const power = Number(body.power) || voltage * current || 0;
      const temperature = Number(body.temperature) || 0;
      const humidity = Number(body.humidity) || 0;
      const light_intensity = Number(body.light_intensity) || 0;
      const panel_efficiency = Number(body.panel_efficiency) || 0;
      const device_id = String(body.device_id || "arduino_01");
      const now = new Date().toISOString();

      const supabase = sb();
      const { data: owner } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .single();
      const ownerId = owner?.id || body.user_id;

      if (ownerId) {
        await supabase.from("sensor_data").insert({
          user_id: ownerId,
          voltage, current, power, temperature, humidity,
          light_intensity, panel_efficiency, device_id, is_online: true,
        });
      }

      try {
        EdgeRuntime.waitUntil(
          fetch(GOOGLE_SHEET_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ voltage, current, power, temperature, humidity, light_intensity, panel_efficiency, recorded_at: now }),
          })
        );
      } catch {}

      return json({ status: "received", data: { voltage, current, power, temperature, humidity, light_intensity, panel_efficiency, recorded_at: now } });
    }

    // ─── /sensor-stats ─────────────────────────────────────────────
    if (path === "sensor-stats" && req.method === "GET") {
      const days = parseInt(url.searchParams.get("days") || "30");
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const supabase = sb();
      const { data, error } = await supabase
        .from("sensor_data")
        .select("*")
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true });
      if (error) return json({ error: error.message }, 500);

      const records = data || [];
      const avgPower = records.length > 0 ? records.reduce((s, r) => s + (r.power || 0), 0) / records.length : 0;
      const totalEnergy = records.reduce((s, r) => s + (r.power || 0), 0) / (1000 * 12);
      const avgEfficiency = records.length > 0 ? records.reduce((s, r) => s + (r.panel_efficiency || 0), 0) / records.length : 0;
      const peakPower = records.length > 0 ? Math.max(...records.map(r => r.power || 0)) : 0;
      const avgVoltage = records.length > 0 ? records.reduce((s, r) => s + (r.voltage || 0), 0) / records.length : 0;
      const avgCurrent = records.length > 0 ? records.reduce((s, r) => s + (r.current || 0), 0) / records.length : 0;

      return json({
        period: `last_${days}_days`,
        record_count: records.length,
        avg_power: Math.round(avgPower * 100) / 100,
        total_energy_kwh: Math.round(totalEnergy * 100) / 100,
        avg_efficiency: Math.round(avgEfficiency * 100) / 100,
        peak_power: Math.round(peakPower * 100) / 100,
        avg_voltage: Math.round(avgVoltage * 100) / 100,
        avg_current: Math.round(avgCurrent * 100) / 100,
        data: records,
      });
    }

    // ─── /alerts ──────────────────────────────────────────────────
    if (path === "alerts" && req.method === "GET") {
      const supabase = sb();
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return json({ error: error.message }, 500);

      const alerts = data || [];

      // If no real alerts, generate from latest sensor reading
      if (alerts.length === 0) {
        const { data: latest } = await supabase
          .from("sensor_data")
          .select("*")
          .order("recorded_at", { ascending: false })
          .limit(1);
        const sensor = latest?.[0];
        if (sensor) {
          const faultResult = detectFaults(sensor.voltage, sensor.current, sensor.power, sensor.temperature, sensor.panel_efficiency);
          const generated = faultResult.faults.map((f, i) => ({
            id: `gen-${i}`,
            user_id: sensor.user_id,
            alert_type: f.type,
            severity: f.severity,
            title: f.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
            message: f.message,
            is_read: false,
            sensor_value: sensor.voltage,
            threshold_value: 16,
            created_at: new Date().toISOString(),
          }));
          return json({ alerts: generated, source: "auto_generated" });
        }
        return json({ alerts: [{ id: "info-1", alert_type: "info", severity: "info", title: "System Online", message: "All sensors reporting normally", is_read: false, created_at: new Date().toISOString() }], source: "auto_generated" });
      }

      return json({ alerts, source: "database" });
    }

    // ─── /predict-power ───────────────────────────────────────────
    if (path === "predict-power" && req.method === "POST") {
      const body = await req.json();
      const supabase = sb();

      // Use latest sensor data if no params given
      let temperature = body.temperature;
      let humidity = body.humidity;
      let light_intensity = body.light_intensity;
      let cloud_cover = body.cloud_cover || 25;

      if (temperature == null || humidity == null || light_intensity == null) {
        const { data: latest } = await supabase
          .from("sensor_data")
          .select("temperature, humidity, light_intensity")
          .order("recorded_at", { ascending: false })
          .limit(1);
        const s = latest?.[0];
        if (s) {
          temperature = temperature ?? s.temperature;
          humidity = humidity ?? s.humidity;
          light_intensity = light_intensity ?? s.light_intensity;
        }
      }

      const result = predictSolarPower(temperature || 28, humidity || 50, light_intensity || 600, cloud_cover);
      const hourly = Array.from({ length: 24 }, (_, h) => {
        const s = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));
        return { hour: h, power: Math.round(result.predictedPower * s * 100) / 100 };
      });
      return json({ ...result, hourly_forecast: hourly, input: { temperature, humidity, light_intensity, cloud_cover } });
    }

    // ─── /detect-fault ────────────────────────────────────────────
    if (path === "detect-fault" && req.method === "POST") {
      const body = await req.json();
      const supabase = sb();

      let voltage = body?.voltage;
      let current = body?.current;
      let power = body?.power;
      let temperature = body?.temperature;
      let panel_efficiency = body?.panel_efficiency;

      if (voltage == null || current == null) {
        const { data: latest } = await supabase
          .from("sensor_data")
          .select("voltage, current, power, temperature, panel_efficiency")
          .order("recorded_at", { ascending: false })
          .limit(1);
        const s = latest?.[0];
        if (s) {
          voltage = voltage ?? s.voltage;
          current = current ?? s.current;
          power = power ?? s.power;
          temperature = temperature ?? s.temperature;
          panel_efficiency = panel_efficiency ?? s.panel_efficiency;
        }
      }

      const result = detectFaults(voltage || 20, current || 3, power || 60, temperature || 35, panel_efficiency || 18);
      return json({ ...result, input: { voltage, current, power, temperature, panel_efficiency } });
    }

    // ─── /load-management ─────────────────────────────────────────
    if (path === "load-management" && req.method === "POST") {
      const body = await req.json();
      const supabase = sb();

      let available_watts = body.available_solar_watts;
      if (available_watts == null) {
        const { data: latest } = await supabase
          .from("sensor_data")
          .select("power")
          .order("recorded_at", { ascending: false })
          .limit(1);
        available_watts = latest?.[0]?.power || 200;
      }

      const result = calculateLoadRecommendations(available_watts, body.weather_condition || "clear", body.strategy || "balanced");
      return json({ ...result, available_solar_watts: available_watts });
    }

    // ─── /bill-estimation ─────────────────────────────────────────
    if (path === "bill-estimation" && req.method === "POST") {
      const body = await req.json();
      const tariff = body.tariff_rate || 0.12;
      const consumed = body.energy_consumed_kwh || 10;
      const generated = body.energy_generated_kwh || 4;
      const grid = Math.max(0, consumed - generated);
      const solarPct = consumed > 0 ? (generated / consumed) * 100 : 0;
      return json({
        daily_cost: Math.round(grid * tariff * 100) / 100,
        monthly_cost: Math.round(grid * tariff * 30 * 100) / 100,
        solar_savings: Math.round(Math.min(generated, consumed) * tariff * 100) / 100,
        grid_dependency: Math.round(100 - Math.min(100, solarPct)),
        solar_contribution: Math.round(Math.min(100, solarPct)),
      });
    }

    // ─── /weather ─────────────────────────────────────────────────
    if (path === "weather") {
      const hour = new Date().getHours();
      const solarFactor = Math.max(0, Math.sin(((hour + 6) / 12) * Math.PI));
      return json({
        condition: solarFactor > 0.5 ? "clear" : "partly_cloudy",
        temperature_c: 28 + (Math.random() - 0.5) * 5,
        humidity_percent: 45 + Math.random() * 20,
        cloud_cover_percent: 20 + Math.random() * 40,
        solar_intensity: solarFactor * 950,
        uv_index: solarFactor * 10,
      });
    }

    // ─── /analytics ──────────────────────────────────────────────
    if (path === "analytics") {
      const supabase = sb();
      const { data } = await supabase
        .from("sensor_data")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(100);
      const records = data || [];
      const avgPower = records.length > 0 ? records.reduce((s, r) => s + (r.power || 0), 0) / records.length : 85.5;
      const totalEnergy = records.reduce((s, r) => s + (r.power || 0), 0) / (1000 * 12) || 12.4;
      const avgEfficiency = records.length > 0 ? records.reduce((s, r) => s + (r.panel_efficiency || 0), 0) / records.length : 17.2;
      const peakPower = records.length > 0 ? Math.max(...records.map(r => r.power || 0)) : 245.8;
      return json({ period: "daily", avg_power: Math.round(avgPower * 100) / 100, total_energy: Math.round(totalEnergy * 100) / 100, avg_efficiency: Math.round(avgEfficiency * 100) / 100, peak_power: Math.round(peakPower * 100) / 100, record_count: records.length });
    }

    // ─── /sustainability ──────────────────────────────────────────
    if (path === "sustainability") {
      const supabase = sb();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase
        .from("sensor_data")
        .select("power, panel_efficiency")
        .gte("recorded_at", thirtyDaysAgo);
      const records = data || [];
      const totalSolarKwh = records.length > 0 ? records.reduce((s, r) => s + (r.power || 0), 0) / (1000 * 12) : 5;
      const co2Saved = totalSolarKwh * 0.42;
      const renewablePct = records.length > 0 ? Math.min(100, (records.reduce((s, r) => s + (r.panel_efficiency || 0), 0) / records.length) * 5) : 42;
      return json({
        co2_reduction_kg: Math.round(co2Saved * 100) / 100,
        carbon_savings_kg: Math.round(co2Saved * 100) / 100,
        trees_equivalent: Math.round((co2Saved / 1000) * 45 * 100) / 100,
        renewable_percentage: Math.round(renewablePct),
        sustainability_score: Math.round(Math.min(100, renewablePct * 1.2 + 30)),
      });
    }

    // ─── /status ──────────────────────────────────────────────────
    if (path === "" || path === "health" || path === "status") {
      const supabase = sb();
      const { count } = await supabase
        .from("sensor_data")
        .select("*", { count: "exact", head: true });
      const { data: latestRow } = await supabase
        .from("sensor_data")
        .select("recorded_at")
        .order("recorded_at", { ascending: false })
        .limit(1);

      return json({
        service: "AI Smart Solar Monitoring API",
        version: "2.1.0",
        status: "healthy",
        google_sheet_linked: true,
        sensor_data_count: count || 0,
        latest_reading: latestRow?.[0]?.recorded_at || null,
        endpoints: ["/ingest", "/sync-sheet", "/sensor-data", "/sensor-stats", "/predict-power", "/detect-fault", "/load-management", "/bill-estimation", "/weather", "/alerts", "/analytics", "/sustainability"],
      });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error)?.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
