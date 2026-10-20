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
  const { rows } = await client.query(
    `SELECT x.area_id,
            (SELECT count(*)::int FROM listings l
               JOIN areas sa ON sa.id = l.area_id
              WHERE coalesce(sa.parent_id, sa.id) = x.area_id) AS our_listings,
            lc.value AS airdna_active,
            lc.period AS airdna_period,
            (SELECT count(*)::int FROM airdna_listings al
              WHERE al.airdna_market_id = x.source_area_key) AS airdna_universe,
            (SELECT count(DISTINCT period)::int FROM airdna_market_metrics mm
              WHERE mm.airdna_id = x.source_area_key) AS history_months,
            am.captured_at
       FROM area_sources x
       JOIN areas a ON a.id = x.area_id
       JOIN LATERAL (SELECT value, period FROM airdna_market_metrics m
                      WHERE m.airdna_id = x.source_area_key AND m.metric = 'listing_count'
                      ORDER BY period DESC LIMIT 1) lc ON TRUE
       LEFT JOIN airdna_markets am ON am.airdna_id = x.source_area_key
      WHERE x.source = 'S02'`,
  );
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
      `our=${r.our_listings} airdna_active=${r.airdna_active}(${r.airdna_period}) ` +
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
