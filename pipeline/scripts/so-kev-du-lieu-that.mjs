#!/usr/bin/env node
// so-kev-du-lieu-that.mjs — hồ sơ _acceptance/meta-kev-thanh-phat-bieu (PL5) AC-9: một ngày dữ liệu thật v5 (sau khi ZCode
// giao phần thu: hook hỏi Kev hai câu, importer chở cột kev_*).
//   Phần đếm — CHỈ ĐỌC (BEGIN READ ONLY) trên DATABASE_URL (DB máy thu; mặc định như transform-zalo):
//     ngày v5 = ngày giờ VN lớn nhất có bài S03 thật mang kev_intent (posted_at); in khoá nhận diện, số bài, gate down,
//     số bài có kev_at mà thiếu kev_intent (≠ 0 → exit 1), tỉ lệ ra inquiry của bài «khách tìm/cần mua/cần thuê» (Hỏi-1:
//     chỉ in, không ngưỡng), số bài stg và số offer của ngày cạnh trung vị 7 ngày trước (chỉ in).
//   Phần transform — trên DB thử dựng lại từ DB máy thu (bash db/db-thu.sh oneinvest_p1_n1), BEGIN … ROLLBACK:
//     bài «khách tìm…» có điểm đều có phát biểu listing_intent (thiếu → exit 1); offer khi có Kev = khi xoá trắng cột Kev.
//   Chưa có ngày v5 (hoặc chưa áp 057) → in «chưa có dữ liệu v5», exit 2.
//   --doi-chung: trên DB thử, trong giao dịch, dựng một ngày v5 giả có một bài kev_at thiếu kev_intent → phải exit 1.
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napKev } from "../lib/nap-057.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { VOCAB } from "../lib/vocab.generated.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const DB_THU = "oneinvest_p1_n1";
const DB_THU_URL = DB_URL.replace(/\/[^/]+$/, `/${DB_THU}`);
const YEU_CAU = /khách tìm|cần mua|cần thuê/iu;
const NGAY_VN = "(posted_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date";
const DOI_CHUNG = process.argv.includes("--doi-chung");
const lap = async (fn) => { const log = console.log; console.log = () => {}; try { return await fn(); } finally { console.log = log; } };

/** Có cột Kev chưa (057). */
const coCotKev = async (c) => (await c.query(`SELECT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'stg_zalo_posts'::regclass
   AND attname = 'kev_intent' AND NOT attisdropped) AS co`)).rows[0].co;

/** Đếm ngày v5 gần nhất trên client đang ở trong giao dịch; null khi chưa có ngày v5. */
async function demNgayV5(c) {
  if (!(await coCotKev(c))) return null;
  const { posts } = await loadStgPosts(c, "zalo");
  const that = new Set(posts.map((p) => p.post_id));
  const { rows } = await c.query(`SELECT post_id, text, ${NGAY_VN}::text AS ngay, kev_intent, kev_at FROM stg_zalo_posts
     WHERE ${NGAY_VN} = (SELECT max(${NGAY_VN}) FROM stg_zalo_posts WHERE kev_intent IS NOT NULL AND post_id = ANY($1::text[]))
       AND post_id = ANY($1::text[])`, [[...that]]);
  if (!rows.length) return null;
  const ngay = rows[0].ngay;
  const coDiem = rows.filter((r) => r.kev_at != null);
  const yeuCau = rows.filter((r) => YEU_CAU.test(r.text ?? ""));
  const yeuCauCoDiem = yeuCau.filter((r) => r.kev_at != null);
  // Số bài stg và số offer S03 theo ngày (giờ VN) của 7 ngày trước — chỉ để in cạnh ngày v5.
  const theoNgay = async (sql) => (await c.query(sql, [ngay])).rows;
  const baiNgay = await theoNgay(`SELECT ${NGAY_VN}::text AS d, count(*)::int AS n FROM stg_zalo_posts
     WHERE ${NGAY_VN} BETWEEN $1::date - 7 AND $1::date AND (agent_id IS NULL OR agent_id <> 'apify-facebook') GROUP BY 1`);
  const offerNgay = await theoNgay(`SELECT (first_seen AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text AS d, count(*)::int AS n
     FROM sale_offers WHERE source = 'S03' AND (first_seen AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN $1::date - 7 AND $1::date GROUP BY 1`);
  const trungVi = (ds) => { const x = ds.filter((r) => r.d !== ngay).map((r) => r.n).sort((a, b) => a - b); return x.length ? x[Math.floor((x.length - 1) / 2)] : null; };
  return {
    ngay, bai: rows.length, gateDown: rows.length - coDiem.length,
    thieuIntent: coDiem.filter((r) => r.kev_intent == null).map((r) => r.post_id),
    yeuCau: yeuCau.length, yeuCauCoDiem: yeuCauCoDiem.map((r) => r.post_id),
    yeuCauInquiry: yeuCauCoDiem.filter((r) => r.kev_intent === "inquiry").length,
    baiStg: baiNgay.find((r) => r.d === ngay)?.n ?? 0, baiStgTv: trungVi(baiNgay),
    offer: offerNgay.find((r) => r.d === ngay)?.n ?? 0, offerTv: trungVi(offerNgay),
  };
}

function inDem(d) {
  console.log(`khoá nhận diện ngày v5: ngày giờ VN lớn nhất có bài S03 thật mang kev_intent → ${d.ngay}`);
  console.log(`bài: ${d.bai} · gate down (mọi điểm trống): ${d.gateDown} · có kev_at mà thiếu kev_intent: ${d.thieuIntent.length}`);
  const tl = d.yeuCauCoDiem.length ? ((d.yeuCauInquiry / d.yeuCauCoDiem.length) * 100).toFixed(1) : "—";
  console.log(`bài «khách tìm/cần mua/cần thuê»: ${d.yeuCau} (có điểm ${d.yeuCauCoDiem.length}) · ra inquiry ${d.yeuCauInquiry}/${d.yeuCauCoDiem.length} = ${tl}% (Hỏi-1: chỉ in)`);
  console.log(`bài stg S03 ngày ấy: ${d.baiStg} (trung vị 7 ngày trước ${d.baiStgTv ?? "—"}) · offer S03 mới ngày ấy: ${d.offer} (trung vị ${d.offerTv ?? "—"}) — chỉ in`);
}

async function tapOffer(c) {
  const { rows } = await c.query(`SELECT offer_id, post_ids, kind, price_vnd::text, ${VOCAB.enrich_field.join(", ")}
     FROM sale_offers WHERE source = 'S03' ORDER BY offer_id`);
  return rows.map((r) => JSON.stringify({ ...r, post_ids: [...(r.post_ids ?? [])].sort() }));
}

async function moi(url) { const c = new pg.Client({ connectionString: url }); await c.connect(); return c; }

let code = 0;
if (DOI_CHUNG) {
  // Ngày v5 giả trên DB thử: ba bài S03 có điểm, một bài kev_at thiếu kev_intent → đếm phải bắt (exit 1).
  const c = await moi(DB_THU_URL);
  try {
    await c.query("BEGIN");
    await napPhatBieu(c);
    await napKev(c);
    const snap = (await c.query(`SELECT snapshot_id FROM stg_zalo_posts WHERE split_part(snapshot_id, '__', 2) !~* '(mock|test|e2e)'
                       AND split_part(snapshot_id, '__', 2) <> 'example' LIMIT 1`)).rows[0].snapshot_id;
    const ngay = "2099-01-01T03:00:00Z";
    for (const [id, text, intent, at] of [["a", "Bán căn 2PN giá 3 tỷ", "offer", ngay], ["b", "Khách tìm thuê 1pn", "inquiry", ngay], ["c", "Bán đất 60m2", null, ngay]]) {
      await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, posted_at, kev_intent, kev_model, kev_at)
        VALUES ($1, $2, $3, $4, $5, 'kev-4b@v5', $6)`, [`kp-dc-${id}`, snap, text, ngay, intent, at]);
    }
    const d = await demNgayV5(c);
    inDem(d);
    if (d.thieuIntent.length) { console.error(`đối chứng: bắt được ${d.thieuIntent.length} bài có kev_at thiếu kev_intent → exit 1 (đúng)`); code = 1; }
    else console.error("đối chứng: KHÔNG bắt được bài thiếu kev_intent — thước hỏng");
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
  process.exit(code === 1 ? 1 : 3);
}

const c = await moi(DB_URL);
let d;
try {
  await c.query("BEGIN READ ONLY");
  d = await demNgayV5(c);
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
}
if (!d) { console.log("so-kev-du-lieu-that: chưa có dữ liệu v5 (chưa áp 057 hoặc chưa có bài S03 mang kev_intent)"); process.exit(2); }
inDem(d);
if (d.thieuIntent.length) { console.error(`bài có kev_at thiếu kev_intent: ${d.thieuIntent.slice(0, 10).join(", ")}`); code = 1; }

// Phần transform trên DB thử dựng lại từ DB máy thu (không giữ khoá trên DB dùng chung).
execFileSync("bash", [join(ROOT, "db/db-thu.sh"), DB_THU], { stdio: ["ignore", "ignore", "inherit"] });
const t = await moi(DB_THU_URL);
try {
  await t.query("BEGIN");
  await t.query("SELECT pg_advisory_xact_lock(33033)");
  await napPhatBieu(t);
  await lap(() => runTransformZalo(t));
  const coKev = await tapOffer(t);
  const { rows } = await t.query(`SELECT DISTINCT substr(subject_key, 5) AS p FROM field_assertions
     WHERE method = 'kev' AND field = 'listing_intent' AND retracted_at IS NULL AND subject_key = ANY($1::text[])`,
    [d.yeuCauCoDiem.map((p) => `S03:${p}`)]);
  const thieu = d.yeuCauCoDiem.filter((p) => !rows.some((r) => r.p === p));
  console.log(`bài «khách tìm…» có điểm có phát biểu listing_intent: ${rows.length}/${d.yeuCauCoDiem.length} (không bị bỏ)`);
  if (thieu.length) { console.error(`thiếu phát biểu: ${thieu.slice(0, 10).join(", ")}`); code = 1; }
  await t.query(`UPDATE stg_zalo_posts SET kev_p = NULL, kev_intent = NULL, kev_intent_p = NULL, kev_kind = NULL, kev_kind_p = NULL,
                   kev_model = NULL, kev_at = NULL`);
  await lap(() => runTransformZalo(t));
  const trang = await tapOffer(t);
  const B = new Set(trang), A = new Set(coKev);
  const lech = [...coKev.filter((x) => !B.has(x)), ...trang.filter((x) => !A.has(x))];
  console.log(`offer S03: có Kev ${coKev.length} · xoá trắng Kev ${trang.length} · lệch ${lech.length}`);
  if (lech.length) code = 1;
} finally {
  await t.query("ROLLBACK").catch(() => {});
  await t.end();
}
console.log(code ? "so-kev-du-lieu-that: ĐỎ" : "so-kev-du-lieu-that: xanh");
process.exit(code);
