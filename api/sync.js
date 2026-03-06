// Vercel Serverless Function: /api/sync
// Cloud sync via Supabase — stats, replays, favorites, admin PIN

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

  // GET /api/sync?code=xxx — pull data (PIN is NEVER sent to client)
  if (req.method === "GET") {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: "Missing code" });

    const { data, error } = await supabase
      .from("sync_data")
      .select("stats, replays, favorites, updated_at, admin_pin, pin_updated_at")
      .eq("sync_code", code)
      .single();

    if (error || !data) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({
      stats: data.stats || {},
      replays: data.replays || {},
      favorites: data.favorites || [],
      updated_at: data.updated_at,
      has_pin: !!data.admin_pin,
      pin_updated_at: data.pin_updated_at || null,
    });
  }

  // POST /api/sync
  if (req.method === "POST") {
    const body = req.body || {};
    const { code } = body;
    if (!code || typeof code !== "string" || code.length < 3) {
      return res.status(400).json({ error: "Invalid code (min 3 chars)" });
    }

    // --- Action: count_codes (check how many sync codes exist) ---
    if (body.action === "count_codes") {
      const { count, error: cErr } = await supabase
        .from("sync_data")
        .select("sync_code", { count: "exact", head: true });
      if (cErr) return res.status(500).json({ error: cErr.message });
      return res.status(200).json({ ok: true, count: count || 0 });
    }

    // --- Action: verify_pin ---
    if (body.action === "verify_pin") {
      const { pin } = body;
      if (!pin) return res.status(400).json({ error: "Missing pin" });
      const { data, error } = await supabase
        .from("sync_data")
        .select("admin_pin, pin_updated_at")
        .eq("sync_code", code)
        .single();
      if (error || !data) return res.status(404).json({ error: "Not found" });
      if (!data.admin_pin) return res.status(200).json({ ok: false, reason: "no_pin" });
      const match = data.admin_pin === pin;
      return res.status(200).json({
        ok: match,
        reason: match ? "verified" : "wrong_pin",
        pin_updated_at: data.pin_updated_at || null,
      });
    }

    // --- Action: create_pin (only if no PIN exists yet) ---
    if (body.action === "create_pin") {
      const { pin } = body;
      if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be 4-6 digits" });
      }
      const { data: existing } = await supabase
        .from("sync_data")
        .select("admin_pin")
        .eq("sync_code", code)
        .single();
      if (existing && existing.admin_pin) {
        return res.status(403).json({ error: "PIN already set. Change via Supabase dashboard only." });
      }
      const now = new Date().toISOString();
      const { error: upErr } = await supabase
        .from("sync_data")
        .update({ admin_pin: pin, pin_updated_at: now })
        .eq("sync_code", code);
      if (upErr) return res.status(500).json({ error: upErr.message });
      return res.status(200).json({ ok: true, pin_updated_at: now });
    }

    // --- Default: push sync data (never overwrites admin_pin) ---
    const payload = {
      sync_code: code,
      stats: body.stats || {},
      replays: body.replays || {},
      favorites: body.favorites || [],
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("sync_data")
      .upsert(payload, { onConflict: "sync_code" });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
