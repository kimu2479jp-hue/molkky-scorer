// Vercel Serverless Function: /api/game-wind-data
// Store and retrieve per-game wind sensor data (Supabase game_wind_data table)

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Payload size limit (500KB — wind data can be large with many turns)
const MAX_BODY_SIZE = 512000;

function isLocalNetworkOrigin(origin) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    if (/^10\./.test(hostname)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
    if (/^192\.168\./.test(hostname)) return true;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    return false;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // CORS
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN || "https://molkky-scorer.vercel.app",
  ];
  const origin = req.headers.origin || "";
  const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || isLocalNetworkOrigin(origin);
  res.setHeader("Access-Control-Allow-Origin", isAllowed ? origin : allowedOrigins[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

  // GET /api/game-wind-data?game_id=xxx
  if (req.method === "GET") {
    const gameId = req.query.game_id;
    const syncCode = req.query.sync_code;
    if (!gameId) return res.status(400).json({ error: "Missing game_id" });

    let query = supabase
      .from("game_wind_data")
      .select("*")
      .eq("game_id", gameId);
    if (syncCode) query = query.eq("sync_code", syncCode);

    const { data, error } = await query.single();
    if (error) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ wind_data: data });
  }

  // POST /api/game-wind-data — save or update wind data
  if (req.method === "POST") {
    const body = req.body || {};

    // Payload size check
    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > MAX_BODY_SIZE) {
      return res.status(413).json({ error: "Payload too large" });
    }

    const { sync_code, game_id, wind_sensor, turn_wind_data, wind_summary } = body;

    if (!sync_code) return res.status(400).json({ error: "Missing sync_code" });
    if (!game_id) return res.status(400).json({ error: "Missing game_id" });

    // Basic validation
    if (typeof sync_code !== "string" || sync_code.length > 50) {
      return res.status(400).json({ error: "Invalid sync_code" });
    }
    if (typeof game_id !== "string" || game_id.length > 100) {
      return res.status(400).json({ error: "Invalid game_id" });
    }

    const record = {
      sync_code,
      game_id,
      wind_sensor: wind_sensor || null,
      turn_wind_data: turn_wind_data || null,
      wind_summary: wind_summary || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("game_wind_data")
      .upsert(record, { onConflict: "game_id" })
      .select()
      .single();

    if (error) {
      console.error("game-wind-data save error:", error.message);
      return res.status(500).json({ error: "save_failed" });
    }
    return res.status(200).json({ ok: true, wind_data: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
