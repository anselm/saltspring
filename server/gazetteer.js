// Gazetteer — place lookup for the configured place profile (places/*.json).
// Coordinates are approximate (good to ~100m, which is all a floating card
// needs). Everything place-specific comes from the profile, not this file.

import { PLACE, ISLAND, PLACES, SEARCH, rx } from './place.js';

export { ISLAND, PLACES };
export const FERRY_ROUTE = (PLACE.ferries?.[0]?.route ?? []).map(([lat, lon]) => ({ lat, lon }));
export const FERRIES = PLACE.ferries ?? [];

const norm = (s) => (s ?? '').toLowerCase();

// Find the most specific place mentioned in a piece of text.
// Returns { lat, lon, place } or null.
export function locateInText(text) {
  const t = norm(text);
  if (!t) return null;
  let best = null;
  for (const p of PLACES) {
    for (const candidate of [p.name.toLowerCase(), ...p.aliases]) {
      if (candidate && t.includes(candidate)) {
        // longer matches win (e.g. "smelt bay provincial park" over "smelt bay")
        if (!best || candidate.length > best.len) best = { lat: p.lat, lon: p.lon, place: p.name, len: candidate.length };
      }
    }
  }
  if (best) return { lat: best.lat, lon: best.lon, place: best.place };
  return null;
}

export function mentionsIsland(text) {
  const t = norm(text);
  const m = rx(SEARCH.match);
  return (m && m.test(t))
    || SEARCH.hashtags?.some((h) => t.includes('#' + h))
    || t.includes(String(ISLAND.name).toLowerCase())
    || locateInText(t) != null;
}

export function insideBbox(lat, lon) {
  const b = ISLAND.bbox;
  return lat >= b.south && lat <= b.north && lon >= b.west && lon <= b.east;
}

// Deterministic scatter for items that only geolocate to "the island".
// Placeless items land near one of the settlements rather than the centroid
// (which is often water) — hash-picked so each item keeps a stable spot.
const LAND_ANCHORS = PLACE.landAnchors ?? PLACES.slice(0, 8).map((p) => p.name);

function hashId(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function scatterAround(id) {
  const h = hashId(id);
  const anchor = PLACES.find((p) => p.name === LAND_ANCHORS[h % LAND_ANCHORS.length]) ?? ISLAND;
  const a = (h % 3600) / 3600 * Math.PI * 2;
  const r = 0.0012 + ((h >> 8) % 1000) / 1000 * 0.0035; // ~130–520 m inland spread
  return { lat: anchor.lat + Math.sin(a) * r, lon: anchor.lon + Math.cos(a) * r * 1.55 };
}
