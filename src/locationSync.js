// Location sync — fetch/cache/CRUD for location profiles
import { _db, idbGet, idbSet } from "./db.js";

const LOC_CACHE_KEY = "locations";

// Fetch all locations from server, cache in IDB
export async function pullLocations() {
  try {
    const res = await fetch("/api/locations");
    if (!res.ok) throw new Error("API error " + res.status);
    const data = await res.json();
    const locs = data.locations || [];
    if (_db) await idbSet(_db, LOC_CACHE_KEY, locs);
    return locs;
  } catch (e) {
    console.error("pullLocations error:", e);
    return null;
  }
}

// Get locations: IDB cache first, server fallback
export async function getLocations() {
  if (_db) {
    try {
      const cached = await idbGet(_db, LOC_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    } catch (e) {}
  }
  const pulled = await pullLocations();
  return pulled || [];
}

// Create a new location (admin, PIN required)
export async function createLocation(code, pin, data) {
  try {
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, pin, action: "create", ...data }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || "create_failed" };
    // Refresh cache
    await pullLocations();
    return { ok: true, location: json.location };
  } catch (e) {
    return { ok: false, error: "network" };
  }
}

// Update a location (admin, PIN required)
export async function updateLocation(code, pin, id, updates) {
  try {
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, pin, action: "update", id, ...updates }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || "update_failed" };
    await pullLocations();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "network" };
  }
}

// Delete a location (admin, PIN required)
export async function deleteLocation(code, pin, id) {
  try {
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, pin, action: "delete", id }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || "delete_failed" };
    await pullLocations();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "network" };
  }
}
