// Island carve-out mask: a canvas texture in local XZ space, white where
// the island (and its satellites) are, black elsewhere. Tile fragments
// sample it and discard outside — the island floats alone in the sea.

import * as THREE from 'three';

export const MASK_EXTENT = 44000; // meters covered by the mask, centered on origin

// Fallback ring used only when no OSM perimeter is available.
const FALLBACK_RING = [
  [50.178, -124.958], [50.170, -124.930], [50.150, -124.910], [50.128, -124.900],
  [50.110, -124.898], [50.085, -124.893], [50.060, -124.898], [50.045, -124.902],
  [50.028, -124.940], [50.016, -124.978], [50.030, -124.999], [50.052, -124.997],
  [50.068, -124.992], [50.082, -125.008], [50.090, -125.030], [50.100, -125.048],
  [50.108, -125.060], [50.122, -125.045], [50.140, -125.024], [50.152, -125.010],
  [50.164, -124.995], [50.174, -124.978],
];

// satellite islands as [lat, lon, radius m]


// `perimeter` is the real OSM coastline set from /api/config
// ([{name, ring: [[lat,lon],…]}]); the hand-drawn polygon above is only the
// fallback when that data is missing. `padM` is the carve padding in meters.
export function buildMask(frame, perimeter = [], padM = 600, BLOBS = []) {
  const SIZE = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, SIZE, SIZE);

  const px = (v) => (v / MASK_EXTENT + 0.5) * SIZE;
  const toXY = (lat, lon) => {
    const p = frame.toLocal(lat, lon, 0);
    return [px(p.x), px(p.z)];
  };
  const mPerPx = MASK_EXTENT / SIZE;

  g.filter = 'blur(6px)';
  g.fillStyle = '#fff';
  g.strokeStyle = '#fff';
  g.lineJoin = 'round';

  const drawRing = (ring, pad) => {
    g.lineWidth = Math.max(1, (pad * 2) / mPerPx);
    g.beginPath();
    ring.forEach(([lat, lon], i) => {
      const [x, y] = toXY(lat, lon);
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    });
    g.closePath();
    g.fill();
    g.stroke();
  };

  const rings = perimeter.filter((p) => p.ring?.length >= 4);
  if (rings.length) {
    for (const p of rings) drawRing(p.ring, padM);
    // any islets the perimeter fetch missed can be listed in the profile as
    // [lat, lon, radiusMetres] blobs; skipped when OSM already gave us a ring
    const have = new Set(rings.map((p) => p.name));
    for (const [lat, lon, r, name] of BLOBS) {
      if (name && have.has(name)) continue;
      const [x, y] = toXY(lat, lon);
      g.beginPath();
      g.arc(x, y, (r + padM) / mPerPx, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    if (FALLBACK_RING.length) drawRing(FALLBACK_RING, 1200);
    for (const [lat, lon, r] of BLOBS) {
      const [x, y] = toXY(lat, lon);
      g.beginPath();
      g.arc(x, y, (r + 400) / mPerPx, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.filter = 'none';

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; // outside extent = black = carved
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}
