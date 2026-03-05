// Vercel Serverless Function: /api/sync
// Cloud sync via Supabase — GET (pull) / POST (push)

export default async function handler(req, res) {
res.setHeader(“Access-Control-Allow-Origin”, “*”);
res.setHeader(“Access-Control-Allow-Methods”, “GET, POST, OPTIONS”);
res.setHeader(“Access-Control-Allow-Headers”, “Content-Type”);
if (req.method === “OPTIONS”) return res.status(200).end();

const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_ANON_KEY;
if (!sbUrl || !sbKey) return res.status(500).json({ error: “Supabase not configured” });

const baseUrl = `${sbUrl}/rest/v1/sync_data`;
const headers = {
“Content-Type”: “application/json”,
“apikey”: sbKey,
“Authorization”: `Bearer ${sbKey}`
};

try {
/* ── GET: pull data by sync_code ── */
if (req.method === “GET”) {
const code = req.query.code;
if (!code) return res.status(400).json({ error: “Missing sync code” });

```
  const r = await fetch(
    `${baseUrl}?sync_code=eq.${encodeURIComponent(code)}&select=favorites,stats,replays,updated_at`,
    { headers }
  );
  if (!r.ok) {
    const err = await r.text();
    return res.status(502).json({ error: "Supabase GET error: " + err.slice(0, 200) });
  }
  const rows = await r.json();
  if (!rows.length) return res.status(404).json({ error: "not_found" });
  return res.status(200).json(rows[0]);
}

/* ── POST: push (upsert) data ── */
if (req.method === "POST") {
  const { code, favorites, stats, replays } = req.body || {};
  if (!code || typeof code !== "string" || code.length < 3) {
    return res.status(400).json({ error: "Sync code must be at least 3 characters" });
  }

  const r = await fetch(baseUrl, {
    method: "POST",
    headers: { ...headers, "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      sync_code: code,
      favorites: favorites || [],
      stats: stats || {},
      replays: replays || {},
      updated_at: new Date().toISOString()
    })
  });

  if (!r.ok) {
    const err = await r.text();
    return res.status(502).json({ error: "Supabase POST error: " + err.slice(0, 200) });
  }
  return res.status(200).json({ ok: true });
}

return res.status(405).json({ error: "Method not allowed" });
```

} catch (e) {
return res.status(500).json({ error: “[Server] “ + (e.message || “Internal error”) });
}
}
