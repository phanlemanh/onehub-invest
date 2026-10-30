#!/usr/bin/env node
// do-kev-phat-bieu.mjs — hồ sơ _acceptance/meta-kev-thanh-phat-bieu (PL5) AC-7: thước KV3 trên bản chép dữ liệu thật (DB thử).
// Một giao dịch ROLLBACK trên DATABASE_URL (chỉ DB thử oneinvest_<dãy>_<việc>; mặc định oneinvest_p1_n1):
//   1. nạp 045 + 057; lượt A: transform-zalo khi cột Kev trống → giây + tập offer S03;
//   2. điền điểm Kev tổng hợp (bảy cột, phân phối cố định theo băm post_id) cho mọi bài S03 thật;
//   3. lượt B: giây, số phát biểu kev thêm (listing_intent = số bài có điểm, kind = số bài có kev_kind — đếm độc lập bằng
//      SQL), byte/bài của bảy cột, tập offer phải giống lượt A;
//   4. field_assertions và stg_zalo_posts không có trong FILL / CLOUD_ALLOW của sync-cloud.mjs (cloud không phình);
//   5. đối chứng (luôn chạy): bản sao transform-zalo bỏ bài Kev chấm not_listing khỏi luồng offer → phải lệch.
// Sai → exit 1.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napKev } from "../lib/nap-057.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { VOCAB } from "../lib/vocab.generated.mjs";
import { CLOUD_ALLOW, FILL } from "../sync-cloud.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const BAI_TOI_THIEU = 500;
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) { console.error("do-kev-phat-bieu: chỉ chạy trên DB thử oneinvest_<dãy>_<việc>"); process.exit(1); }

const COT = ["kev_p", "kev_intent", "kev_intent_p", "kev_kind", "kev_kind_p", "kev_model", "kev_at"];
const lap = async (fn) => { const log = console.log; console.log = () => {}; try { return await fn(); } finally { console.log = log; } };

async function tapOffer(c) {
  const { rows } = await c.query(`SELECT offer_id, post_ids, kind, price_vnd::text, ${VOCAB.enrich_field.join(", ")}
     FROM sale_offers WHERE source = 'S03' ORDER BY offer_id`);
  return rows.map((r) => JSON.stringify({ ...r, post_ids: [...(r.post_ids ?? [])].sort() }));
}
const lech = (a, b) => { const A = new Set(a), B = new Set(b); return [...a.filter((x) => !B.has(x)), ...b.filter((x) => !A.has(x))]; };

/** Điểm tổng hợp theo băm post_id: 3% gate down; ý định 60% offer · 25% inquiry · 15% not_listing; bán/thuê xen kẽ. */
const SQL_DIEN = `WITH h AS (SELECT post_id, ('x' || substr(md5(post_id), 1, 8))::bit(32)::int & 2147483647 AS v
                              FROM stg_zalo_posts WHERE post_id = ANY($1::text[]))
  UPDATE stg_zalo_posts s SET
    kev_p        = CASE WHEN h.v % 100 < 3 THEN NULL ELSE (h.v % 97) / 100.0 END,
    kev_intent   = CASE WHEN h.v % 100 < 3 THEN NULL WHEN h.v % 100 < 63 THEN 'offer' WHEN h.v % 100 < 88 THEN 'inquiry' ELSE 'not_listing' END,
    kev_intent_p = CASE WHEN h.v % 100 < 3 THEN NULL ELSE 0.5 + (h.v % 50) / 100.0 END,
    kev_kind     = CASE WHEN h.v % 100 < 3 OR h.v % 100 >= 88 THEN NULL WHEN h.v % 2 = 0 THEN 'sale' ELSE 'rent' END,
    kev_kind_p   = CASE WHEN h.v % 100 < 3 OR h.v % 100 >= 88 THEN NULL ELSE 0.5 + (h.v % 40) / 100.0 END,
    kev_model    = CASE WHEN h.v % 100 < 3 THEN NULL ELSE 'kev-4b@v5-tong-hop' END,
    kev_at       = CASE WHEN h.v % 100 < 3 THEN NULL ELSE now() END
  FROM h WHERE s.post_id = h.post_id`;

/** Một lượt đo trên giao dịch riêng; trả số đo. `run` là transform (thật hoặc bản sao đột biến). */
async function doMotLuot(c, run) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    await napKev(c);
    const { posts } = await loadStgPosts(c, "zalo");
    const ids = posts.map((p) => p.post_id);
    await c.query(`UPDATE stg_zalo_posts SET ${COT.map((x) => `${x} = NULL`).join(", ")} WHERE post_id = ANY($1::text[])`, [ids]);
    let t = Date.now();
    await lap(() => run(c));
    const giayA = (Date.now() - t) / 1000;
    const A = await tapOffer(c);
    const truoc = (await c.query(`SELECT field, count(*)::int AS n FROM field_assertions WHERE method = 'kev' AND retracted_at IS NULL GROUP BY field`)).rows;
    await c.query(SQL_DIEN, [ids]);
    const dem = (await c.query(`SELECT count(*) FILTER (WHERE kev_at IS NOT NULL)::int AS co_diem,
        count(*) FILTER (WHERE kev_kind IS NOT NULL)::int AS co_kind, count(*) FILTER (WHERE kev_at IS NULL)::int AS gate_down,
        avg(${COT.map((x) => `coalesce(pg_column_size(${x}), 0)`).join(" + ")})::numeric(8,1) AS byte_bai
      FROM stg_zalo_posts WHERE post_id = ANY($1::text[])`, [ids])).rows[0];
    t = Date.now();
    const r = await lap(() => run(c));
    const giayB = (Date.now() - t) / 1000;
    const B = await tapOffer(c);
    const sau = (await c.query(`SELECT field, count(*)::int AS n FROM field_assertions WHERE method = 'kev' AND retracted_at IS NULL GROUP BY field`)).rows;
    const n = (ds, f) => ds.find((x) => x.field === f)?.n ?? 0;
    return { bai: ids.length, giayA, giayB, A, B, dem, kev: r.kev,
      themIntent: n(sau, "listing_intent") - n(truoc, "listing_intent"), themKind: n(sau, "kind") - n(truoc, "kind") };
  } finally {
    await c.query("ROLLBACK");
  }
}

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
let code = 0;
try {
  const d = await doMotLuot(c, runTransformZalo);
  console.log(`bài S03 thật: ${d.bai} (tối thiểu ${BAI_TOI_THIEU})`);
  if (d.bai < BAI_TOI_THIEU) { console.error("do-kev-phat-bieu: quá ít bài S03 — DB thử không phải bản chép dữ liệu thật"); code = 1; }
  console.log(`giây transform-zalo: không Kev ${d.giayA.toFixed(2)} → có Kev ${d.giayB.toFixed(2)} (+${(d.giayB - d.giayA).toFixed(2)})`);
  console.log(`bài có điểm: ${d.dem.co_diem} · gate down: ${d.dem.gate_down} · có kev_kind: ${d.dem.co_kind}`);
  console.log(`phát biểu kev thêm: listing_intent ${d.themIntent} (= bài có điểm ${d.dem.co_diem}) · kind ${d.themKind} (= bài có kev_kind ${d.dem.co_kind}) · ngoài bộ ${d.kev?.ngoaiBo}`);
  if (d.themIntent !== d.dem.co_diem || d.themKind !== d.dem.co_kind) { console.error("do-kev-phat-bieu: số phát biểu lệch số bài có điểm"); code = 1; }
  console.log(`cỡ thêm bảy cột: ${d.dem.byte_bai} byte/bài`);
  const l = lech(d.A, d.B);
  console.log(`offer S03: không Kev ${d.A.length} · có Kev ${d.B.length} · lệch ${l.length}`);
  if (l.length) { for (const x of l.slice(0, 10)) console.error(`  lệch ${x}`); code = 1; }
  const tren = [...FILL, ...Object.keys(CLOUD_ALLOW)].filter((t) => t === "field_assertions" || t === "stg_zalo_posts");
  console.log(`sync cloud: field_assertions/stg_zalo_posts trong FILL hay CLOUD_ALLOW: ${tren.length ? tren.join(", ") : "không"}`);
  if (tren.length) code = 1;

  // Đối chứng: transform bỏ bài not_listing khỏi luồng offer phải làm lệch tập offer — không thì thước không đo gì.
  const src = readFileSync(join(PIPE, "transform-zalo.mjs"), "utf8")
    .replace('import { ghiPhatBieuKev } from "./lib/kev-phat-bieu.mjs";', 'import { docDiemKev, ghiPhatBieuKev } from "./lib/kev-phat-bieu.mjs";')
    .replace('const { posts, rejected } = await loadStgPosts(client, "zalo");',
      'const { posts: _p, rejected } = await loadStgPosts(client, "zalo"); const _k = new Map(((await docDiemKev(client, _p.map((p) => p.post_id))) ?? []).map((r) => [r.post_id, r.kev_intent])); const posts = _p.filter((p) => _k.get(p.post_id) !== "not_listing");');
  const sao = join(PIPE, `.do-kev-dot-bien-${process.pid}.mjs`);
  writeFileSync(sao, src);
  try {
    const m = await import(pathToFileURL(sao).href);
    const dc = await doMotLuot(c, m.runTransformZalo);
    const ldc = lech(dc.A, dc.B).length;
    console.log(`đối chứng (bỏ bài not_listing khỏi luồng offer): lệch ${ldc}`);
    if (!ldc) { console.error("do-kev-phat-bieu: đối chứng không lệch — thước offer không đo gì"); code = 1; }
  } finally {
    rmSync(sao, { force: true });
  }
} finally {
  await c.end();
}
console.log(code ? "do-kev-phat-bieu: ĐỎ" : "do-kev-phat-bieu: xanh");
process.exit(code);
