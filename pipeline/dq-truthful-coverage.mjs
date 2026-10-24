// dq-truthful-coverage.mjs — E2 C2/D: ghi check "truthful-coverage" vào
// dq_check_results (DQO pillar 4). Chạy sau mỗi lần transform-airdna.
// pass  = crosswalk S02 có số AirDNA (listing_count) và capture ≤45 ngày
// fail  = có crosswalk nhưng thiếu số AirDNA hoặc capture quá stale
// skip  = chưa có crosswalk S02 cho thị trường nào tự thu
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const STALE_DAYS = 45;

async function main() {
const client = new pg.Client({ connectionString: DB_URL });
await client.connect();
try {
  // Sáp nhập 2025: 1 area ← nhiều market AirDNA cũ → cộng gộp (địa lý rời)
  const { rows: xw } = await client.query(
    `SELECT x.area_id, x.source_area_key FROM area_sources x WHERE x.source = 'S02'`,
  );
  const { rows: active } = await client.query(
    `SELECT DISTINCT ON (airdna_id) airdna_id, value, period
       FROM airdna_market_metrics WHERE metric='listing_count'
      ORDER BY airdna_id, period DESC`,
  );
  const { rows: uni } = await client.query(
    `SELECT airdna_market_id, count(*)::int n FROM airdna_listings GROUP BY 1`,
  );
  const { rows: hist } = await client.query(
    `SELECT airdna_id, count(DISTINCT period)::int m FROM airdna_market_metrics GROUP BY 1`,
  );
  const { rows: capRows } = await client.query(
    `SELECT airdna_id, captured_at FROM airdna_markets`,
  );
  const { rows: oursRows } = await client.query(
    `SELECT coalesce(sa.parent_id, sa.id) AS area_id, count(*)::int n
       FROM listings l JOIN areas sa ON sa.id = l.area_id
      WHERE sa.id LIKE 'vn-%' GROUP BY 1`,
  );
  const activeBy = new Map(active.map((r) => [r.airdna_id, r]));
  const uniBy = new Map(uni.map((r) => [r.airdna_market_id, r.n]));
  const histBy = new Map(hist.map((r) => [r.airdna_id, r.m]));
  const oursBy = new Map(oursRows.map((r) => [r.area_id, r.n]));
  const capBy = new Map(capRows.map((r) => [r.airdna_id, r.captured_at]));
  const byArea = new Map();
  for (const r of xw) {
    if (!byArea.has(r.area_id)) byArea.set(r.area_id, []);
    byArea.get(r.area_id).push(r.source_area_key);
  }
  const rows = [...byArea.entries()]
    .map(([area_id, keys]) => {
      const wd = keys.map((k) => activeBy.get(k)).filter(Boolean);
      if (wd.length === 0) return null;
      return {
        area_id,
        our_listings: oursBy.get(area_id) ?? 0,
        airdna_active: wd.reduce((s2, r) => s2 + Number(r.value), 0),
        airdna_period: wd.reduce((m, r) => (r.period > m ? r.period : m), ""),
        airdna_universe: keys.reduce((s2, k) => s2 + (uniBy.get(k) ?? 0), 0),
        history_months: keys.reduce((m, k) => Math.max(m, histBy.get(k) ?? 0), 0),
        captured_at: keys.reduce((m, k) => {
          const c = capBy.get(k);
          return !c || new Date(c) > new Date(m ?? 0) ? c : m;
        }, null),
      };
    })
    .filter(Boolean);
  if (rows.length === 0) {
    await client.query(
      `INSERT INTO dq_check_results (check_name, entity, status, detail)
       VALUES ('truthful-coverage', 'all', 'skip', 'chưa có crosswalk S02 nào')`,
    );
    console.log("skip: chưa có crosswalk S02");
    return;
  }
  for (const r of rows) {
    const ageDays = r.captured_at
      ? Math.floor((Date.now() - new Date(r.captured_at).getTime()) / 86400000)
      : null;
    const ok = r.airdna_active !== null && ageDays !== null && ageDays <= STALE_DAYS;
    const ratio = r.airdna_active ? (r.our_listings / Number(r.airdna_active)) * 100 : null;
    const detail =
      `our=${r.our_listings} s02_active=${r.airdna_active}(${r.airdna_period}) ` +
      `universe=${r.airdna_universe} history=${r.history_months}m ` +
      `coverage=${ratio === null ? "n/a" : ratio.toFixed(2) + "%"} ` +
      `captured_age=${ageDays ?? "n/a"}d`;
    await client.query(
      `INSERT INTO dq_check_results (check_name, entity, status, detail)
       VALUES ('truthful-coverage', $1, $2, $3)`,
      [r.area_id, ok ? "pass" : "fail", detail],
    );
    console.log(`${ok ? "pass" : "fail"} ${r.area_id}: ${detail}`);
  }
} finally {
  await client.end();
}
}

main().catch((e) => { console.error(e); process.exit(1); });
