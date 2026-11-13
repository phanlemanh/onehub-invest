// do-can-gia-cung-loai.mjs — hồ sơ can-gia-tot-cung-loai (CG8), AC-7: trên bản chép DB máy thu (DB thử), chạy refreshBaitGap trong
// giao dịch rồi đếm bằng SQL viết riêng; gọi hai API (app /api/v1/deals, data-api /v1/deals) với limit tối đa trên từng thị
// trường, so số giảm với thước v_ruler_p2 cùng phường × loại. ROLLBACK cuối — không để lại gì trên DB thử.
// Chạy qua `bash pipeline/scripts/can-gia-cung-loai-db.sh do` (cd app, node --import tsx, DATABASE_URL = DB thử).
// Thoát 1 khi một điều kiện hỏng hay mẫu số 0, nêu điều kiện.
import pg from "pg";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL || !/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) throw new Error("DATABASE_URL phải trỏ DB thử oneinvest_<dãy>_<việc>, không phải DB dùng chung");
process.env.OPS_API_TOKEN = "cg8-do-token";

const { refreshBaitGap } = await import("../refresh-bait-gap.mjs");
const { pool } = await import("../../app/src/lib/db.ts");
const { GET } = await import("../../app/src/app/api/v1/deals/route.ts");
const { pool: poolApi } = await import("../../data-api/src/db/client.ts");
const { dealsRoute } = await import("../../data-api/src/routes/deals.ts");

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
const loi = [];
const kiem = (dk, ten) => { if (!dk) loi.push(ten); };
try {
  await c.query("BEGIN");
  const goc = console.log;
  console.log = () => {};
  try { await refreshBaitGap(c); } finally { console.log = goc; }

  const p = (await c.query(`
    WITH r AS (SELECT area_id, property_type, m FROM v_ruler_p2)
    SELECT count(*) FILTER (WHERE o.bait_gap_pct IS NOT NULL)::int AS co_so,
           count(*) FILTER (WHERE o.bait_gap_pct IS NOT NULL AND (r.m IS NULL
             OR abs(o.bait_gap_pct - ROUND((1 - o.price_perm2::numeric / r.m::numeric) * 100, 1)) > 0.1))::int AS lech_pipeline,
           count(*) FILTER (WHERE o.bait_gap_pct IS NOT NULL AND (o.property_type IS NULL OR o.property_type = 'unknown'))::int AS unknown_co_so
      FROM sale_offers o LEFT JOIN r ON r.area_id = o.area_id AND r.property_type = o.property_type
     WHERE o.price_tier = 'P1' AND o.kind = 'sale'`)).rows[0];
  const thue = Number((await c.query(`SELECT count(*) AS n FROM sale_offers WHERE kind <> 'sale' AND bait_gap_pct IS NOT NULL`)).rows[0].n);
  console.log(`pipeline: mau_so=${p.co_so} lech_pipeline=${p.lech_pipeline} unknown_co_so=${p.unknown_co_so} thue_co_so=${thue}`);
  kiem(p.co_so > 0, "mẫu số pipeline = 0");
  kiem(p.lech_pipeline === 0, "lech_pipeline ≠ 0");
  kiem(p.unknown_co_so === 0, "unknown_co_so ≠ 0");
  kiem(thue === 0, "thue_co_so ≠ 0");

  const tv = (await c.query(`
    WITH ap AS (SELECT o.price_perm2, o.bait_gap_pct, o.area_id FROM sale_offers o
                 WHERE o.price_tier = 'P1' AND o.kind = 'sale' AND o.property_type = 'apartment' AND o.bait_gap_pct IS NOT NULL)
    SELECT count(*)::int AS n,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY ap.bait_gap_pct) AS moi,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY ROUND((1 - ap.price_perm2::numeric / a.m::numeric) * 100, 1)) AS cu
      FROM ap LEFT JOIN v_ruler_p2_area a ON a.area_id = ap.area_id`)).rows[0];
  console.log(`trung vị số giảm căn hộ: thước cùng loại=${Number(tv.moi).toFixed(1)}% · thước cả phường=${tv.cu === null ? "—" : Number(tv.cu).toFixed(1)}% · mẫu số=${tv.n}`);
  kiem(tv.n > 0 && Math.abs(Number(tv.moi)) <= 10, "trung vị số giảm căn hộ ngoài ±10%");

  // Hai API trên từng thị trường có tin P1 bán chấm được.
  const thuoc = new Map((await c.query(`SELECT area_id, property_type, m FROM v_ruler_p2`)).rows.map((r) => [`${r.area_id}|${r.property_type}`, Number(r.m)]));
  const tin = new Map((await c.query(`SELECT offer_id, area_id, property_type, kind, price_perm2 FROM sale_offers`)).rows
    .map((r) => [r.offer_id, { area: r.area_id, type: r.property_type, kind: r.kind, perm2: Number(r.price_perm2) }]));
  const thiTruong = (await c.query(`SELECT DISTINCT a.parent_id AS id FROM sale_offers o JOIN areas a ON a.id = o.area_id
    WHERE o.bait_gap_pct IS NOT NULL AND a.parent_id IS NOT NULL ORDER BY 1`)).rows.map((r) => r.id);
  const q = (...a) => c.query(...a);
  const [gocApp, gocApi] = [pool.query, poolApi.query];
  pool.query = q; poolApi.query = q;
  const dem = { app: { n: 0, lech: 0, thue: 0, unknown: 0 }, api: { n: 0, lech: 0, thue: 0, unknown: 0 } };
  const cham = (d, offerId, pct) => {
    d.n++;
    const t = tin.get(offerId);
    if (!t || t.kind !== "sale") d.thue++;
    if (!t?.type || t.type === "unknown") d.unknown++;
    const m = t && thuoc.get(`${t.area}|${t.type}`);
    if (!m || Math.abs(pct - Math.round((1 - t.perm2 / m) * 1000) / 10) > 0.1) d.lech++;
  };
  try {
    for (const mk of thiTruong) {
      const ra = await GET(new Request(`http://x/api/v1/deals?market=${encodeURIComponent(mk)}&limit=100&min_discount=0`, {
        headers: { authorization: "Bearer cg8-do-token" } }));
      for (const d of (await ra.json()).data) cham(dem.app, d.offerId, d.discountPct);
      const rb = await dealsRoute.request(`/?market=${encodeURIComponent(mk)}&limit=100&min_discount=0`);
      for (const d of (await rb.json()).data) cham(dem.api, d.offerId, d.discountPct);
    }
  } finally {
    pool.query = gocApp; poolApi.query = gocApi;
  }
  console.log(`thị trường: ${thiTruong.length}`);
  console.log(`api app: mau_so=${dem.app.n} lech_api_app=${dem.app.lech} thue_api=${dem.app.thue} unknown_api=${dem.app.unknown}`);
  console.log(`data-api: mau_so=${dem.api.n} lech_data_api=${dem.api.lech} thue_api=${dem.api.thue} unknown_api=${dem.api.unknown}`);
  for (const [ten, d] of Object.entries(dem)) {
    kiem(d.n > 0, `mẫu số ${ten} = 0`);
    kiem(d.lech === 0, `lệch ${ten} ≠ 0`);
    kiem(d.thue === 0, `tin thuê ở ${ten}`);
    kiem(d.unknown === 0, `tin chưa rõ loại ở ${ten}`);
  }
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
  await pool.end().catch(() => {});
  await poolApi.end().catch(() => {});
}
for (const l of loi) console.log(`HỎNG ${l}`);
console.log(loi.length ? "KẾT: hỏng" : "KẾT: đạt");
process.exitCode = loi.length ? 1 : 0;
