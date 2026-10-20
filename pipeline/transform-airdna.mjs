// transform-airdna.mjs — parse airdna-research snapshot → airdna_ref tables
// v2 (E2 C1): collector active API emit kind "airdna-v2-*" với payload
// {url, method, reqBody, data} — cây market → submarket → listing.
import { readdir, readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** KhốI value theo tên metric — occupancy trả {date, rate} (survey 9). */
const METRIC_KEYS = {
  adr: ["avg_daily_rate"],
  occupancy: ["rate", "occupancy_rate"],
  revenue: ["revenue"],
  revpar: ["revpar"],
  listing_count: ["listing_count", "value", "count"],
};
const valueOf = (metric, p) => {
  for (const k of METRIC_KEYS[metric] ?? [metric]) {
    const v = p?.[k];
    if (typeof v === "number" && !isNaN(v)) return v;
  }
  const v = p?.value;
  return typeof v === "number" && !isNaN(v) ? v : null;
};

const cleanSans = (obj, drop = ["geospatial"]) => {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) if (!drop.includes(k) && v !== null) out[k] = v;
  return out;
};

async function main() {
  const snapDir = process.argv[2];
  if (!snapDir) { console.error("thiếu: node transform-airdna.mjs <snapshot-dir>"); process.exit(1); }

  // Read items
  const items = [];
  for (const f of (await readdir(snapDir)).filter(f => f.startsWith("items-")).sort()) {
    items.push(...JSON.parse(gunzipSync(await readFile(join(snapDir, f))).toString("utf8")));
  }
  console.log(`items: ${items.length}`);

  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();

  try {
    let nMarkets = 0, nMetrics = 0, nScores = 0, nSubs = 0;
    let nSubMonthly = 0, nFuture = 0, nListings = 0, nEnrich = 0;
    const marketsList = []; // (airdna_id, name) cho auto-crosswalk

    // ===================== v2 (active API) =====================
    for (const it of items) {
      if (!it.kind?.startsWith("airdna-v2-")) continue;
      const { url, data } = it.payload;
      const payload = data?.payload;
      const fetchedAt = it.fetchedAt;

      // ---- market detail → airdna_markets
      if (it.kind === "airdna-v2-market" && payload?.id) {
        marketsList.push({ airdna_id: String(payload.id), name: payload.name ?? "" });
        await client.query(
          `INSERT INTO airdna_markets (airdna_id, name, country_code, meta, captured_at)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (airdna_id) DO UPDATE SET meta = EXCLUDED.meta,
             name = COALESCE(EXCLUDED.name, airdna_markets.name), captured_at = EXCLUDED.captured_at`,
          [String(payload.id), payload.name ?? null, payload.country_code ?? "vn",
           JSON.stringify(cleanSans(payload)), fetchedAt],
        );
        nMarkets++;
      }

      // ---- market score buckets → airdna_scores (chỉ cấp market — FK airdna_markets)
      if (it.kind === "airdna-v2-score" && Array.isArray(payload?.buckets)) {
        const marketId = String(payload.market_id ?? "");
        if (marketId) {
          const get = (cat) => payload.buckets.find(b => b.category === cat)?.value ?? null;
          await client.query(
            `INSERT INTO airdna_scores (airdna_id, total, seasonality, revenue_growth, regulation, rental_demand, investability, captured_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             ON CONFLICT (airdna_id) DO UPDATE SET total=EXCLUDED.total, seasonality=EXCLUDED.seasonality,
               revenue_growth=EXCLUDED.revenue_growth, regulation=EXCLUDED.regulation,
               rental_demand=EXCLUDED.rental_demand, investability=EXCLUDED.investability, captured_at=EXCLUDED.captured_at`,
            [marketId, get("total_score"), get("seasonality"), get("revenue_growth"),
             get("regulation"), get("rental_demand"), get("investability"), fetchedAt],
          );
          nScores++;
        }
      }

      // ---- submarket list / detail → registry
      if ((it.kind === "airdna-v2-submarkets" || it.kind === "airdna-v2-submarket") && payload) {
        const rows = it.kind === "airdna-v2-submarkets"
          ? (payload.submarkets ?? []).map(s => [s, url?.match(/\/market\/(\d+)/)?.[1]])
          : [[payload, String(payload.parent_market_id ?? "")]];
        for (const [s, marketId] of rows) {
          if (!s?.id || !marketId) continue;
          await client.query(
            `INSERT INTO airdna_submarket_metrics (airdna_sub_id, airdna_market_id, name, meta)
             VALUES ($1,$2,$3,$4)
             ON CONFLICT (airdna_sub_id) DO UPDATE SET meta = EXCLUDED.meta, name = EXCLUDED.name`,
            [String(s.id), marketId, s.name ?? null, JSON.stringify(cleanSans(s))],
          );
          nSubs++;
        }
      }

      // ---- timeseries → airdna_market_metrics | airdna_sub_monthly
      if (it.kind === "airdna-v2-timeseries") {
        const match = url?.match(/(?:\/v2)?\/(market|submarket)\/(\d+)\/metrics\/(\w+)/);
        if (match) {
          const [, scope, scopeId, metric] = match;
          const table = scope === "market" ? "airdna_market_metrics" : "airdna_sub_monthly";
          const idCol = scope === "market" ? "airdna_id" : "airdna_sub_id";
          const points = payload?.metrics ?? [];
          for (const p of points) {
            const date = p?.date ?? p?.period;
            const value = valueOf(metric, p);
            if (!date || value === null) continue;
            await client.query(
              `INSERT INTO ${table} (${idCol}, metric, period, value) VALUES ($1,$2,$3,$4)
               ON CONFLICT (${idCol}, metric, period) DO UPDATE SET value = EXCLUDED.value`,
              [scopeId, metric, date.slice(0, 7), value],
            );
            if (scope === "market") nMetrics++; else nSubMonthly++;
          }
        }
      }

      // ---- future rates (payload = MẢNG daily) → airdna_future_daily
      if (it.kind === "airdna-v2-future-rates") {
        const sid = url?.match(/\/submarket\/(\d+)\/future\/rates/)?.[1];
        if (sid && Array.isArray(payload)) {
          for (const d of payload) {
            if (!d?.date) continue;
            await client.query(
              `INSERT INTO airdna_future_daily (airdna_sub_id, date, booked_count, available_count,
                 mean_booked_rate, median_booked_rate, mean_available_rate, median_available_rate,
                 occupancy, revpar, total_revenue)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
               ON CONFLICT (airdna_sub_id, date) DO UPDATE SET
                 booked_count=EXCLUDED.booked_count, available_count=EXCLUDED.available_count,
                 mean_booked_rate=EXCLUDED.mean_booked_rate, median_booked_rate=EXCLUDED.median_booked_rate,
                 mean_available_rate=EXCLUDED.mean_available_rate, median_available_rate=EXCLUDED.median_available_rate,
                 occupancy=EXCLUDED.occupancy, revpar=EXCLUDED.revpar, total_revenue=EXCLUDED.total_revenue`,
              [sid, d.date, d.booked_count ?? null, d.available_count ?? null,
               d.mean_booked_rate ?? null, d.median_booked_rate ?? null,
               d.mean_available_rate ?? null, d.median_available_rate ?? null,
               d.occupancy ?? null, d.revpar ?? null, d.total_revenue ?? null],
            );
            nFuture++;
          }
        }
      }

      // ---- map_listings → airdna_listings (universe + LTM)
      if (it.kind === "airdna-v2-map-listings" && Array.isArray(payload?.listings)) {
        const marketId = url?.match(/\/market\/(\d+)\/map_listings/)?.[1] ?? null;
        for (const l of payload.listings) {
          const id = l?.property_id; // 'abnb_<airbnb_id>' — cùng khóa listings.id
          if (!id) continue;
          const m = l.metrics ?? {};
          await client.query(
            `INSERT INTO airdna_listings (id, airdna_market_id, combined_market_id, bedrooms, bathrooms,
               rating_overall, rating_location, revenue_ltm, revenue_potential_ltm, occupancy, adr,
               price_tier, latitude, longitude, metrics, captured_at, snapshot_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
             ON CONFLICT (id) DO UPDATE SET
               airdna_market_id=EXCLUDED.airdna_market_id, combined_market_id=EXCLUDED.combined_market_id,
               bedrooms=EXCLUDED.bedrooms, bathrooms=EXCLUDED.bathrooms,
               rating_overall=EXCLUDED.rating_overall, rating_location=EXCLUDED.rating_location,
               revenue_ltm=EXCLUDED.revenue_ltm, revenue_potential_ltm=EXCLUDED.revenue_potential_ltm,
               occupancy=EXCLUDED.occupancy, adr=EXCLUDED.adr, price_tier=EXCLUDED.price_tier,
               latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude, metrics=EXCLUDED.metrics,
               captured_at=EXCLUDED.captured_at, snapshot_id=EXCLUDED.snapshot_id`,
            [id, marketId, l.combined_market_id ? String(l.combined_market_id) : null,
             m.bedrooms ?? null, m.bathrooms ?? null,
             m.rating_overall ?? null, m.rating_location ?? null,
             m.revenue ?? null, m.revenue_potential ?? null,
             m.occupancy ?? null, m.adr ?? null,
             m.price_tier ?? null,
             l.location?.lat ?? null, l.location?.lng ?? null,
             JSON.stringify(m), fetchedAt, it.meta?.snapshotId ?? null],
          );
          nListings++;
        }
      }

      // ---- submarket listings (top 50 theo revenue) → upsert: id ở đây là
      // abnb_<airbnb_id THẬT> (khác id mờ của map_listings) → hàng mới được
      // tạo để join được với listings của Inside Airbnb.
      if (it.kind === "airdna-v2-sub-listings" && Array.isArray(payload?.listings)) {
        const sid = url?.match(/\/submarket\/(\d+)\/listings/)?.[1];
        for (const l of payload.listings) {
          const id = l?.property_id ?? (l?.airbnb_property_id ? `abnb_${l.airbnb_property_id}` : null);
          if (!id) continue;
          await client.query(
            `INSERT INTO airdna_listings (id, combined_market_id, title, rating_overall,
               review_count, revenue_ltm, revenue_potential_ltm, occupancy, photo_urls, listing_url,
               metrics, captured_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12)
             ON CONFLICT (id) DO UPDATE SET
               title = COALESCE(EXCLUDED.title, airdna_listings.title),
               rating_overall = COALESCE(EXCLUDED.rating_overall, airdna_listings.rating_overall),
               review_count = COALESCE(EXCLUDED.review_count, airdna_listings.review_count),
               revenue_ltm = COALESCE(EXCLUDED.revenue_ltm, airdna_listings.revenue_ltm),
               revenue_potential_ltm = COALESCE(EXCLUDED.revenue_potential_ltm, airdna_listings.revenue_potential_ltm),
               occupancy = COALESCE(EXCLUDED.occupancy, airdna_listings.occupancy),
               photo_urls = COALESCE(EXCLUDED.photo_urls, airdna_listings.photo_urls),
               listing_url = COALESCE(EXCLUDED.listing_url, airdna_listings.listing_url),
               metrics = airdna_listings.metrics || EXCLUDED.metrics,
               captured_at = EXCLUDED.captured_at`,
            [id, sid ?? null, l.title ?? null, l.rating ?? null, l.reviews ?? null,
             l.revenue_ltm ?? null, l.revenue_potential_ltm ?? null, l.occupancy ?? null,
             JSON.stringify(Array.isArray(l.images) ? l.images.slice(0, 10) : null),
             l.airbnb_listing_url ?? l.vrbo_listing_url ?? null,
             JSON.stringify(cleanSans(l, ["geospatial"])), fetchedAt],
          );
          nEnrich++;
        }
        if (sid) console.log(`  sub-listings ${sid}: ${payload.listings.length}`);
      }
    }

    console.log(`v2: markets=${nMarkets} scores=${nScores} subs=${nSubs} marketMetrics=${nMetrics}`);
    console.log(`v2: subMonthly=${nSubMonthly} futureDaily=${nFuture} listings=${nListings} enrich=${nEnrich}`);

    // ===================== v1 (passive XHR — giữ tương thích) =====================
    for (const it of items) {
      if (it.kind === "airdna-markets") {
        const data = it.payload.data;
        const markets = data?.payload?.markets ?? data?.payload ?? [];
        if (!Array.isArray(markets)) continue;
        for (const m of markets) {
          if (!m?.id) continue;
          await client.query(
            `INSERT INTO airdna_markets (airdna_id, name, country_code, meta, captured_at, snapshot_id)
             VALUES ($1,$2,$3,$4,$5,$6)
             ON CONFLICT (airdna_id) DO UPDATE SET meta = EXCLUDED.meta, captured_at = EXCLUDED.captured_at`,
            [String(m.id), m.name ?? null, m.country_code ?? "vn",
             JSON.stringify(cleanSans(m)), it.fetchedAt, null],
          );
          nMarkets++;
        }
      }
      if (it.kind === "airdna-timeseries") {
        const url = it.payload.url ?? "";
        const match = url.match(/\/(\w+)\/(\d+)\/metrics\/(\w+)/);
        if (!match) continue;
        const [, , marketId, metric] = match;
        for (const p of it.payload.data?.payload?.metrics ?? []) {
          const date = p?.date ?? p?.period;
          const value = valueOf(metric, p);
          if (!date || value === null) continue;
          await client.query(
            `INSERT INTO airdna_market_metrics (airdna_id, metric, period, value)
             VALUES ($1,$2,$3,$4)
             ON CONFLICT (airdna_id, metric, period) DO UPDATE SET value = EXCLUDED.value`,
            [marketId, metric, date.slice(0, 7), value],
          );
          nMetrics++;
        }
      }
    }

    // ---- Crosswalk tự động AirDNA → areas OSM (E2: thẻ độ phủ tự sáng khi
    // rotation thu tỉnh mới). Chuẩn hoá: bỏ dấu + strip "Tỉnh/Thành phố" +
    // bỏ " city" + alias cho lỗi chính tả AirDNA / tỉnh đổi tên sau sáp nhập.
    const norm = (t) =>
      (t ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/đ/g, "d")
        .replace(/^(tinh|thanh pho)\s+/, "")
        .replace(/\s+city$/, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    // alias: key = norm(tên AirDNA) → value = norm(tên area đích).
    // Bảng sáp nhập 202/2025/QH15 (12/6/2025, 63→34 tỉnh) + lỗi chính tả AirDNA.
    // Nhiều market cũ → 1 area mới là ĐÚNG (địa lý không giao → mẫu số độ
    // phủ = tổng các market thành phần, queries.ts đã cộng gộp).
    const ALIAS = {
      "quang tr": "quang tri", // AirDNA cắt tên (Quảng Trị)
      "thua thien hue": "hue", // đổi tên → TP Huế
      "quang nam": "da nang",
      "binh duong": "ho chi minh",
      "vung tau": "ho chi minh", // Bà Rịa–Vũng Tàu (norm đã strip " city")
      "con dao": "ho chi minh", // huyện Côn Đảo thuộc BR-VT cũ
      "binh thu": "lam dong", // AirDNA cắt "Bình Thuận"
      "dak nong": "lam dong",
      "phu yen": "dak lak",
      "binh dinh": "gia lai",
      "phan rangathap cham": "khanh hoa", // Ninh Thuận (Phan Rang–Tháp Chàm)
      "ben tre": "vinh long",
      "tra vinh": "vinh long",
      "quang binh": "quang tri",
      "hoa binh": "phu tho",
      "bac giang": "bac ninh",
      "binh phuoc": "dong nai",
      "ha giang": "tuyen quang",
      "kon tum": "quang ngai",
      "soc trang": "can tho",
      "kien giang": "an giang",
    };
    const { rows: areaRows } = await client.query(
      `SELECT id, name FROM areas WHERE region_type='market' AND country_code='vn'`,
    );
    const byNorm = new Map(areaRows.map((a) => [norm(a.name), a.id]));
    const { rows: existing } = await client.query(
      `SELECT area_id, source_area_key FROM area_sources WHERE source='S02'`,
    );
    const mappedKeys = new Set(existing.map((r) => r.source_area_key));
    let nCross = 0;
    const unmatched = [];
    // Nguồn candidate: mọi market VN đã biết (bảng airdna_markets) — backfill
    // được cả province E1 chưa thu, snapshot hằng đêm chỉ bổ sung tên mới.
    const { rows: allMarkets } = await client.query(
      `SELECT airdna_id::text AS id, name FROM airdna_markets WHERE country_code='vn'`,
    );
    const seenM = new Set(marketsList.map((m) => m.airdna_id));
    const candidates = [...marketsList, ...allMarkets.filter((m) => !seenM.has(m.id))
      .map((m) => ({ airdna_id: m.id, name: m.name ?? "" }))];
    for (const m of candidates) {
      if (mappedKeys.has(m.airdna_id)) continue;
      let target = byNorm.get(ALIAS[norm(m.name)] ?? norm(m.name));
      if (!target) { unmatched.push(m.name); continue; }
      await client.query(
        `INSERT INTO area_sources (area_id, source, source_area_key, meta)
         VALUES ($1,'S02',$2,'{"note":"auto crosswalk tên chuẩn hoá"}'::jsonb)
         ON CONFLICT DO NOTHING`,
        [target, m.airdna_id],
      );
      mappedKeys.add(m.airdna_id);
      nCross++;
      console.log(`  crosswalk: ${m.name} (#${m.airdna_id}) → ${target}`);
    }
    console.log(`crosswalk auto: +${nCross}; chưa khớp ${unmatched.length}: ${unmatched.join(", ") || "—"}`);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
