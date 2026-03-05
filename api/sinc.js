// Vercel Serverless Function: /api/sync
// Cloud sync via Supabase — stores stats, replays, favorites per sync code

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

  // GET /api/sync?code=xxx — pull data
  if (req.method === "GET") {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: "Missing code" });

    const { data, error } = await supabase
      .from("sync_data")
      .select("stats, replays, favorites, updated_at")
      .eq("code", code)
      .single();

    if (error || !data) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({
      stats: data.stats || {},
      replays: data.replays || {},
      favorites: data.favorites || [],
      updated_at: data.updated_at,
    });
  }

  // POST /api/sync — push data
  if (req.method === "POST") {
    const { code, stats, replays, favorites } = req.body || {};
    if (!code || typeof code !== "string" || code.length < 3) {
      return res.status(400).json({ error: "Invalid code (min 3 chars)" });
    }

    const payload = {
      code,
      stats: stats || {},
      replays: replays || {},
      favorites: favorites || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("sync_data")
      .upsert(payload, { onConflict: "code" });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
