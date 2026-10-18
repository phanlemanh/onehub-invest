import type { Collector, RawItem } from "../core/types.js";

/**
 * Ranh giới hành chính từ OpenStreetMap (Overpass API, dữ liệu mở ODbL).
 * Fetch các relation admin_level=6 (quận/huyện) trong một thành phố.
 * Không cần browser — HTTP thuần; rate limit lịch sự với Overpass.
 */
const OVERPASS = "https://overpass-api.de/api/interpreter";

export const osmBoundaries: Collector = {
  id: "osm-boundaries",
  description: "OSM admin boundaries (Overpass) — quận/huyện level 6 theo tên thành phố",
  requestsPerSecond: 0.2, // Overpass nhờ dùng tiết kiệm
  async collect(ctx) {
    const { city, rateLimit, log } = ctx;
    // Tên area OSM có thể kèm prefix hành chính ("Thành phố Hà Nội") — dùng regex
    const query = `[out:json][timeout:120];
area["name"~"^(Thành phố |Tỉnh )?${city.name}$", i]["admin_level"="4"]->.city;
relation(area.city)["admin_level"="6"]["boundary"="administrative"];
out geom;`;

    await rateLimit.take();
    log("query Overpass:", city.name);
    const res = await fetch(OVERPASS, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "one-invest-collector/0.1 (personal research)",
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    const data = (await res.json()) as { elements: unknown[] };
    log(`nhận ${data.elements.length} ranh giới`);

    const items: RawItem[] = data.elements.map((el, i) => {
      const e = el as { id: number; tags?: Record<string, string>; members?: unknown[] };
      return {
        source: "osm-boundaries",
        sourceId: String(e.id ?? i),
        kind: "admin-boundary",
        fetchedAt: new Date().toISOString(),
        payload: el, // nguyên vẹn element Overpass (tags + members[].geometry)
        meta: { name: e.tags?.name ?? null, adminLevel: e.tags?.admin_level ?? null },
      };
    });
    return {
      items,
      coverage: {
        discovered: items.length,
        captured: items.length,
        failed: 0,
        methods: { overpassAdminLevel6: items.length },
        notes: [`source: OpenStreetMap (ODbL) — ${city.name}`],
      },
    };
  },
};
