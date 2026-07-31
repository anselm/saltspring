# Fork: cortes-island → island-portrait, deployed as Salt Spring

**Devlog · 2026-07-31**
**Live: https://saltspring.exe.xyz** (VM `saltspring`, mongo + node in compose)

Anselm is on Salt Spring and wanted the Cortes living-portrait app pointed at
this island — with the sensible instinct that the right move was to
*generalize first, then express a dataset*, rather than fork-and-sed.

## What was actually specialized

Less than feared. The client was already config-driven (`/api/config` feeds it
island, places, perimeter), so the specialization was concentrated in:
gazetteer constants, per-source search terms, the enrichment prompt, a
hardcoded fallback coastline, ferry schedules, night-light settlements, the
perimeter fetch script, and UI strings.

## The generalization

**`places/<id>.json` is now the whole personality.** `server/place.js` picks
the profile (`PLACE_ID`, else the only one present) and everything reads from
it: gazetteer places/aliases/anchors, RSS feeds + filters, hashtags and
per-service query strings, trust weights, ferry routes and sailing times,
settlement lights, islets, radio, tide station, OSM island refs. The enrich
prompt is templated on the island name (`about_cortes` → `about_place`). The
HTML shell has `data-island-*` slots the client fills at boot.

Both profiles ship: `places/cortes.json` (extracted from the old constants,
so the original deployment is reproducible) and `places/saltspring.json`.

## The Salt Spring dataset

30 gazetteer places (Ganges, Fulford, Vesuvius, Fernwood, Mount Maxwell,
Erskine, Tuam, Ruckle, Burgoyne Bay, St. Mary and Cusheon lakes, Beddis,
Southey Point, Musgrave Landing, the Saturday Market, GISS, …), five feeds
(Gulf Islands Driftwood, Salt Spring Exchange, Times Colonist and CHEK
filtered to the island, Google News), two real ferry runs (Fulford↔Swartz Bay,
Vesuvius↔Crofton) with sailing times, CFSI 107.9 for radio, and settlements
for night lights.

**Real coastline**: OSM tags the island "Saltspring Island" (one word), so the
name query found nothing — added a Nominatim polygon fallback plus mirror
rotation and backoff for Overpass's moods. Result: a 456-point Salt Spring
ring plus Prevost, Wallace, Portland and Piers.

## Verified

First production aggregation: **351 geolocated items** — Driftwood news (the
olive farm auction, water quality, obituaries), Salt Spring Exchange, 60
iNaturalist observations, 121 OSM landmarks, Wikipedia/Commons, Mastodon,
Flickr, Openverse. Headless render: 121 cards floating over real terrain,
clean console.

## Notes

- `config.json` is now per-deploy visuals only (carve/ocean/exaggeration/sound);
  identity moved to the profile.
- Reddit 403s from datacentre IPs (unchanged from Cortes); Wikipedia/Commons
  429 under back-to-back fetches and recover on the next tick.
- Bug caught in review: the night-lights settlement list had been left
  referencing a constant that no longer existed — silent black island at dusk.
