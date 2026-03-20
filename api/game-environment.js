// Vercel Serverless Function: /api/game-environment
// Store and retrieve per-game environment data

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req, res) {
  // CORS
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN || "https://molkky-scorer.vercel.app",
  ];
  const origin = req.headers.origin || "";
  const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
  res.setHeader("Access-Control-Allow-Origin", isAllowed ? origin : allowedOrigins[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

  // GET /api/game-environment?game_id=xxx
  if (req.method === "GET") {
    const gameId = req.query.game_id;
    if (!gameId) return res.status(400).json({ error: "Missing game_id" });

    const { data, error } = await supabase
      .from("game_environment")
      .select("*")
      .eq("game_id", gameId)
      .single();
    if (error) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ environment: data });
  }

  // POST /api/game-environment — save game environment data
  if (req.method === "POST") {
    const body = req.body || {};
    const { game_id, location_id, field_type, venue_type, temperature, wind_speed, wind_direction, weather_code } = body;

    if (!game_id) return res.status(400).json({ error: "Missing game_id" });
    if (!field_type) return res.status(400).json({ error: "Missing field_type" });

    const validTypes = ["grass", "dirt", "sand", "artificial_grass", "other"];
    if (!validTypes.includes(field_type)) {
      return res.status(400).json({ error: "Invalid field_type" });
    }
    const validVenueTypes = ["outdoor", "covered", "indoor"];
    if (venue_type && !validVenueTypes.includes(venue_type)) {
      return res.status(400).json({ error: "Invalid venue_type" });
    }

    const record = {
      game_id,
      location_id: location_id || null,
      field_type,
      venue_type: venue_type || "outdoor",
      temperature: temperature ?? null,
      wind_speed: wind_speed ?? null,
      wind_direction: wind_direction != null ? Math.round(wind_direction) : null,
      weather_code: weather_code ?? null,
      weather_fetched_at: (temperature != null || weather_code != null) ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("game_environment")
      .upsert(record, { onConflict: "game_id" })
      .select()
      .single();

    if (error) {
      console.error("game-environment save error:", error.message);
      return res.status(500).json({ error: "save_failed" });
    }
    return res.status(200).json({ ok: true, environment: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
