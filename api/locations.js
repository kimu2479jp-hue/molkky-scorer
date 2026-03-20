// Vercel Serverless Function: /api/locations
// CRUD for location profiles — shared across all users

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Verify admin PIN against sync_data
async function verifyPin(supabase, code, pin) {
  if (!code || !pin) return false;
  const { data: row, error } = await supabase
    .from("sync_data")
    .select("admin_pin, pin_fail_count, pin_locked_until")
    .eq("sync_code", code)
    .single();
  if (error || !row || !row.admin_pin) return false;
  // Check lockout
  if (row.pin_locked_until) {
    const lockUntil = new Date(row.pin_locked_until).getTime();
    if (Date.now() < lockUntil) return false;
  }
  const stored = row.admin_pin;
  let match = false;
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
    match = await bcrypt.compare(pin, stored);
  } else {
    match = (stored === pin);
    if (match) {
      const hashed = await bcrypt.hash(pin, 10);
      await supabase.from("sync_data").update({ admin_pin: hashed }).eq("sync_code", code);
    }
  }
  if (!match) {
    const fails = (row.pin_fail_count || 0) + 1;
    const lockUntil = fails >= 5 ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null;
    await supabase.from("sync_data").update({ pin_fail_count: fails, pin_locked_until: lockUntil }).eq("sync_code", code);
  } else {
    await supabase.from("sync_data").update({ pin_fail_count: 0, pin_locked_until: null }).eq("sync_code", code);
  }
  return match;
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

  // GET /api/locations — list all locations (no auth required)
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("place_name", { ascending: true })
      .order("sub_name", { ascending: true });
    if (error) {
      console.error("locations fetch error:", error.message);
      return res.status(500).json({ error: "fetch_failed" });
    }
    return res.status(200).json({ locations: data || [] });
  }

  // POST /api/locations — create / update / delete (PIN auth required)
  if (req.method === "POST") {
    const body = req.body || {};
    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > 1 * 1024 * 1024) {
      return res.status(413).json({ error: "Payload too large" });
    }

    const { code, pin, action } = body;
    if (!code || typeof code !== "string" || code.length < 3) {
      return res.status(400).json({ error: "Invalid code" });
    }
    if (!pin) {
      return res.status(400).json({ error: "PIN required" });
    }

    // Verify admin PIN
    const authorized = await verifyPin(supabase, code, pin);
    if (!authorized) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // --- Action: create ---
    if (action === "create") {
      const { google_place_id, place_name, sub_name, field_type, latitude, longitude } = body;
      if (!google_place_id || !place_name || !sub_name || !field_type) {
        return res.status(400).json({ error: "Missing required fields: google_place_id, place_name, sub_name, field_type" });
      }
      const validTypes = ["grass", "dirt", "sand", "artificial_grass", "other"];
      if (!validTypes.includes(field_type)) {
        return res.status(400).json({ error: "Invalid field_type" });
      }
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const { data, error } = await supabase
        .from("locations")
        .insert({
          google_place_id,
          place_name,
          sub_name,
          field_type,
          latitude,
          longitude,
        })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") {
          return res.status(409).json({ error: "duplicate", message: "This sub-location already exists" });
        }
        console.error("location create error:", error.message);
        return res.status(500).json({ error: "create_failed" });
      }
      return res.status(200).json({ ok: true, location: data });
    }

    // --- Action: update ---
    if (action === "update") {
      const { id } = body;
      if (!id) return res.status(400).json({ error: "Missing id" });

      const updates = {};
      if (body.sub_name !== undefined) updates.sub_name = body.sub_name;
      if (body.field_type !== undefined) {
        const validTypes = ["grass", "dirt", "sand", "artificial_grass", "other"];
        if (!validTypes.includes(body.field_type)) {
          return res.status(400).json({ error: "Invalid field_type" });
        }
        updates.field_type = body.field_type;
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }
      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("locations")
        .update(updates)
        .eq("id", id);
      if (error) {
        console.error("location update error:", error.message);
        return res.status(500).json({ error: "update_failed" });
      }
      return res.status(200).json({ ok: true });
    }

    // --- Action: delete ---
    if (action === "delete") {
      const { id } = body;
      if (!id) return res.status(400).json({ error: "Missing id" });

      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("location delete error:", error.message);
        return res.status(500).json({ error: "delete_failed" });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
