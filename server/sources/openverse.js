import { SEARCH, ISLAND } from '../place.js';
// Openverse — CC-licensed images tagged with the island, aggregated from
// Flickr, museums and archives. No key at modest rates.

import { get } from './util.js';

export default {
  name: 'openverse',
  async fetch() {
    const data = await get(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent('"' + (SEARCH.quoted ?? ISLAND.name) + '"')}&page_size=20&license_type=all-cc`,
      { as: 'json' },
    );
    return (data.results ?? []).map((r) => ({
      adapter: 'openverse',
      title: r.title || `Photo near ${ISLAND.name}`,
      link: r.foreign_landing_url ?? r.url,
      summary: [r.creator ? `by ${r.creator}` : null, r.license ? `CC ${r.license.toUpperCase()}` : null]
        .filter(Boolean).join(' · ') || null,
      image: r.thumbnail ?? r.url,
      author: r.creator ?? null,
      publishedAt: r.indexed_on ?? null,
      category: 'photo',
      importance: 0.3,
      topics: (r.tags ?? []).slice(0, 5).map((t) => t.name).filter(Boolean),
    }));
  },
};
