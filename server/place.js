// The place profile — everything that makes this instance about a specific
// island lives in places/<id>.json. PLACE_ID (env) picks it; default is the
// only profile present, or "cortes". Nothing else in the codebase should
// hardcode a coordinate, a feed, a hashtag or a ferry.
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../places/', import.meta.url);

function pick() {
  const want = process.env.PLACE_ID;
  const have = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  if (want && have.includes(want)) return want;
  if (have.length === 1) return have[0];
  return have.includes('saltspring') ? 'saltspring' : (have[0] ?? 'cortes');
}

export const PLACE_ID = pick();
export const PLACE = JSON.parse(readFileSync(new URL(`${PLACE_ID}.json`, dir), 'utf8'));

// convenience re-exports used across the server
export const ISLAND = PLACE.island;
export const PLACES = PLACE.places ?? [];
export const SEARCH = PLACE.search ?? {};
export const rx = (s, flags = 'i') => (s ? new RegExp(s, flags) : null);
