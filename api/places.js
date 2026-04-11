// Vercel Serverless Function: /api/places
// Google Places API proxy — keeps API key server-side

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Allowed place types for Molkky venues (public facilities only)
const ALLOWED_TYPES = [
  "park",
  "sports_complex",
  "stadium",
  "school",
  "gym",
  "campground",
  "playground",
  "athletic_field",
  "recreation_center",
];

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
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Google Places API not configured" });

  const body = req.body || {};
  const { query, code } = body;

  if (!query || typeof query !== "string" || query.trim().length < 2) {
    return res.status(400).json({ error: "Query must be at least 2 characters" });
  }
  if (!code || typeof code !== "string" || code.length < 3) {
    return res.status(400).json({ error: "Invalid code" });
  }

  // Validate sync code exists (lightweight auth)
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("sync_data")
        .select("sync_code")
        .eq("sync_code", code)
        .single();
      if (!data) return res.status(403).json({ error: "Invalid sync code" });
    } catch (e) {
      // Fail-open: if Supabase check fails, allow request to proceed
    }
  }

  // Call Google Places Text Search (New)
  try {
    const fieldMask = "places.id,places.displayName,places.formattedAddress,places.location,places.types";
    const searchBody = {
      textQuery: query.trim(),
      languageCode: "ja",
      regionCode: "JP",
      maxResultCount: 10,
    };

    // Try each allowed type to get broader results
    // Google Places Text Search (New) only accepts one includedType at a time
    // So we search without type filter and post-filter results
    const googleRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(searchBody),
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text();
      console.error("Google Places API error:", googleRes.status, errText);
      return res.status(502).json({ error: "Places API error" });
    }

    const data = await googleRes.json();
    const rawPlaces = data.places || [];

    // Privacy guard: filter to only allowed types
    const filtered = rawPlaces.filter(p => {
      const types = p.types || [];
      return types.some(t => ALLOWED_TYPES.includes(t));
    });

    // Sanitize response — only return necessary fields
    const places = filtered.map(p => ({
      place_id: p.id || "",
      name: (p.displayName && p.displayName.text) || "",
      address: p.formattedAddress || "",
      lat: p.location ? p.location.latitude : null,
      lng: p.location ? p.location.longitude : null,
      types: (p.types || []).filter(t => ALLOWED_TYPES.includes(t)),
    }));

    return res.status(200).json({ places });
  } catch (e) {
    console.error("Places search error:", e);
    return res.status(500).json({ error: "Search failed" });
  }
}
