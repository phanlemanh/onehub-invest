// transform-airdna.mjs — parse airdna-research snapshot → airdna_ref tables
import { readdir, readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

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

    // 1. Market list (country VN) → airdna_markets
    for (const it of items) {
      if (it.kind !== "airdna-markets") continue;
      const data = it.payload.data;
      const markets = data?.payload?.markets ?? data?.payload ?? [];
      if (!Array.isArray(markets)) continue;

      for (const m of markets) {
        if (!m?.id) continue;
        const clean = {};
        for (const [k, v] of Object.entries(m)) {
          if (k !== "geospatial" && v !== null) clean[k] = v;
        }
        await client.query(
          `INSERT INTO airdna_markets (airdna_id, name, country_code, meta, captured_at, snapshot_id)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (airdna_id) DO UPDATE SET meta = EXCLUDED.meta, captured_at = EXCLUDED.captured_at`,
          [String(m.id), m.name ?? null, m.country_code ?? "vn",
           JSON.stringify(clean), it.fetchedAt, null],
        );
        nMarkets++;
      }
      console.log(`markets: ${nMarkets}`);
    }

    // 2. Market score → airdna_scores
    for (const it of items) {
      const url = it.payload.url ?? "";
      if (!url.includes("market_score")) continue;
      const buckets = it.payload.data?.payload?.buckets ?? [];
      if (!buckets.length) continue;
      const marketId = String(it.payload.data?.payload?.market_id ?? "");
      if (!marketId) continue;
      const get = (cat) => buckets.find(b => b.category === cat)?.value ?? null;
      await client.query(
        `INSERT INTO airdna_scores (airdna_id, total, seasonality, revenue_growth, regulation, rental_demand, investability, captured_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (airdna_id) DO UPDATE SET total=EXCLUDED.total, seasonality=EXCLUDED.seasonality,
           revenue_growth=EXCLUDED.revenue_growth, regulation=EXCLUDED.regulation,
           rental_demand=EXCLUDED.rental_demand, investability=EXCLUDED.investability, captured_at=EXCLUDED.captured_at`,
        [marketId, get("total_score"), get("seasonality"), get("revenue_growth"),
         get("regulation"), get("rental_demand"), get("investability"), it.fetchedAt],
      );
      // Đảm bảo market tồn tại (INSERT nếu chưa có từ market list)
      await client.query(
        `INSERT INTO airdna_markets (airdna_id, name, country_code) VALUES ($1, $2, 'vn')
         ON CONFLICT (airdna_id) DO NOTHING`,
        [marketId, `Market ${marketId}`],
      );
      nScores++;
    }
    console.log(`scores: ${nScores}`);

    // 3. Timeseries → airdna_market_metrics
    // Cấu trúc: data.payload.metrics = [{date: '2025-10-01', avg_daily_rate: 33.32}, ...]
    const METRIC_KEYS = {
      adr: "avg_daily_rate", occupancy: "occupancy_rate",
      revenue: "revenue", revpar: "revpar", listing_count: "listing_count",
    };
    for (const it of items) {
      if (it.kind !== "airdna-timeseries") continue;
      const url = it.payload.url ?? "";
      const match = url.match(/\/(\w+)\/(\d+)\/metrics\/(\w+)/);
      if (!match) continue;
      const [, , marketId, metric] = match;
      const valueKey = METRIC_KEYS[metric] ?? metric;
      const points = it.payload.data?.payload?.metrics ?? [];
      if (!Array.isArray(points)) continue;
      for (const p of points) {
        const date = p?.date ?? p?.period;
        const value = p?.[valueKey] ?? p?.value;
        if (!date || value === undefined || value === null) continue;
        const period = date.slice(0, 7); // '2025-10'
        await client.query(
          `INSERT INTO airdna_market_metrics (airdna_id, metric, period, value)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (airdna_id, metric, period) DO UPDATE SET value = EXCLUDED.value`,
          [marketId, metric, period, value],
        );
        nMetrics++;
      }
    }
    console.log(`metrics: ${nMetrics}`);

    // 4. Submarkets → airdna_submarket_metrics
    // Cấu trúc: data.payload.submarkets = [...]
    for (const it of items) {
      if (it.kind !== "airdna-detail") continue;
      const url = it.payload.url ?? "";
      if (!url.includes("/submarkets")) continue;
      const marketMatch = url.match(/\/market\/(\d+)/);
      if (!marketMatch) continue;
      const marketId = marketMatch[1];
      const subs = it.payload.data?.payload?.submarkets ?? [];
      if (!Array.isArray(subs)) continue;
      for (const s of subs) {
        if (!s?.id) continue;
        await client.query(
          `INSERT INTO airdna_submarket_metrics (airdna_sub_id, airdna_market_id, name, meta)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (airdna_sub_id) DO UPDATE SET meta = EXCLUDED.meta, name = EXCLUDED.name`,
          [String(s.id), marketId, s.name ?? null, JSON.stringify(s)],
        );
        nSubs++;
      }
    }
    console.log(`submarkets: ${nSubs}`);

    // 5. Crosswalk: map AirDNA Hà Nội (id=47) → areas vn-hanoi
    await client.query(
      `INSERT INTO area_sources (area_id, source, source_area_key, meta)
       VALUES ('vn-hanoi', 'airdna', '47', '{"note":"AirDNA market ID for Hanoi"}'::jsonb)
       ON CONFLICT DO NOTHING`,
    );
    console.log("crosswalk: vn-hanoi ↔ airdna:47");
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
