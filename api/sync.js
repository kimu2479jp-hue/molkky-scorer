// Vercel Serverless Function: /api/sync
// Cloud sync via Supabase — stats, replays, favorites, admin PIN

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req, res) {
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

    // --- Payload size check ---
    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > 5 * 1024 * 1024) {
      return res.status(413).json({ error: "Payload too large" });
    }

    const { code } = body;
    if (!code || typeof code !== "string" || code.length < 3) {
      return res.status(400).json({ error: "Invalid code (min 3 chars)" });
    }

    // --- Action: count_codes (check how many sync codes exist) ---
    if (body.action === "count_codes") {
      const { count, error: cErr } = await supabase
        .from("sync_data")
        .select("sync_code", { count: "exact", head: true });
      if (cErr) { console.error("count_codes error:", cErr.message); return res.status(500).json({ error: "sync_failed" }); }
      return res.status(200).json({ ok: true, count: count || 0 });
    }

    // --- Action: verify_pin (with server-side rate limiting) ---
    if (body.action === "verify_pin") {
      const { pin } = body;
      if (!pin) return res.status(400).json({ error: "Missing pin" });

      // Server-side rate limit: check recent failed attempts
      const { data: row, error: fetchErr } = await supabase
        .from("sync_data")
        .select("admin_pin, pin_updated_at, pin_fail_count, pin_locked_until")
        .eq("sync_code", code)
        .single();
      if (fetchErr || !row) return res.status(404).json({ error: "Not found" });
      if (!row.admin_pin) return res.status(200).json({ ok: false, reason: "no_pin" });

      // Check lockout
      if (row.pin_locked_until) {
        const lockUntil = new Date(row.pin_locked_until).getTime();
        if (Date.now() < lockUntil) {
          const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
          return res.status(429).json({ ok: false, reason: "locked", remaining });
        }
      }

      let match = false;
      const stored = row.admin_pin;
      if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
        // Already hashed — bcrypt compare
        match = await bcrypt.compare(pin, stored);
      } else {
        // Legacy plain text — compare directly, then auto-migrate to hash
        match = (stored === pin);
        if (match) {
          const hashed = await bcrypt.hash(pin, 10);
          await supabase
            .from("sync_data")
            .update({ admin_pin: hashed })
            .eq("sync_code", code);
        }
      }

      if (match) {
        // Reset fail counter on success
        await supabase
          .from("sync_data")
          .update({ pin_fail_count: 0, pin_locked_until: null })
          .eq("sync_code", code);
        return res.status(200).json({
          ok: true,
          reason: "verified",
          pin_updated_at: row.pin_updated_at || null,
        });
      } else {
        // Increment fail counter
        const fails = (row.pin_fail_count || 0) + 1;
        const lockUntil = fails >= 5
          ? new Date(Date.now() + 10 * 60 * 1000).toISOString()
          : null;
        await supabase
          .from("sync_data")
          .update({ pin_fail_count: fails, pin_locked_until: lockUntil })
          .eq("sync_code", code);
        return res.status(200).json({
          ok: false,
          reason: fails >= 5 ? "locked" : "wrong_pin",
          remaining: fails >= 5 ? 600 : undefined,
        });
      }
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
      const hashedPin = await bcrypt.hash(pin, 10);
      const { error: upErr } = await supabase
        .from("sync_data")
        .update({ admin_pin: hashedPin, pin_updated_at: now })
        .eq("sync_code", code);
      if (upErr) { console.error("create_pin error:", upErr.message); return res.status(500).json({ error: "pin_creation_failed" }); }
      return res.status(200).json({ ok: true, pin_updated_at: now });
    }

    // --- Default: push sync data (never overwrites admin_pin) ---
    // --- Data structure validation ---
    if (body.stats && typeof body.stats !== "object") {
      return res.status(400).json({ error: "Invalid stats format" });
    }
    if (body.replays && typeof body.replays !== "object") {
      return res.status(400).json({ error: "Invalid replays format" });
    }
    if (body.favorites && !Array.isArray(body.favorites)) {
      return res.status(400).json({ error: "Invalid favorites format" });
    }

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
    if (error) { console.error("sync push error:", error.message); return res.status(500).json({ error: "sync_failed" }); }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
