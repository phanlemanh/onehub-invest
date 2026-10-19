import type { Collector, RawItem } from "../core/types.js";

/**
 * Ranh giới hành chính từ OpenStreetMap (Overpass API, dữ liệu mở ODbL).
 * Fetch các relation admin_level=6 (quận/huyện) trong một thành phố.
 * Không cần browser — HTTP thuần; rate limit lịch sự với Overpass.
 */
const OVERPASS = "https://overpass-api.de/api/interpreter";

export const osmBoundaries: Collector = {
  id: "osm-boundaries",
  description:
    "OSM admin boundaries (Overpass) — quận/huyện level 6 theo tên thành phố; OSM_MODE=provinces → cấp tỉnh toàn quốc (level 4)",
  requestsPerSecond: 0.2, // Overpass nhờ dùng tiết kiệm
  async collect(ctx) {
    const { city, rateLimit, log } = ctx;
    // OSM_MODE=provinces: mọi relation admin_level=4 trong Việt Nam (34 tỉnh
    // sau sáp nhập 2025) — nền cho bản đồ quốc gia (G2, ADR-0008 scope VN).
    const provinces = process.env.OSM_MODE === "provinces";
    const query = provinces
      ? `[out:json][timeout:180];
area["name"="Việt Nam"]["admin_level"="2"]["boundary"="administrative"]->.vn;
relation(area.vn)["admin_level"="4"]["boundary"="administrative"];
out geom;`
      : `[out:json][timeout:120];
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
