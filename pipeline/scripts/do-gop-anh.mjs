// do-gop-anh.mjs — hồ sơ _acceptance/gop-tin-chi-anh-o-transform (PL28) AC-6: thước trên bản chép dữ liệu thật (DB thử).
// Một giao dịch ROLLBACK trên DATABASE_URL (chỉ DB thử oneinvest_<dãy>_<việc>):
//   1. transform-media S03 bằng bản nền ghim NEN (trước PL28) → «trước»: số offer S03 có ảnh;
//   2. transform-media S03 bằng cây → «sau»; sau phải ≥ ngưỡng đọc từ opportunity.md (dòng «Kết quả nào là SỐNG»);
//   3. ngày mẫu NGAY (giờ VN): tập cặp (bài chỉ-ảnh, offer) tính độc lập bằng SQL = tập cặp đọc từ bảng media, hai chiều;
//   4. đối chứng (luôn chạy): bản sao lib/gop-anh.mjs bỏ điều kiện cùng người → phải lệch, không thì thước không đo gì.
// Sai → exit 1, in từng cặp lệch.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { KHOA } from "../transform-media.mjs";

const NEN = "c3751eab";
const NGAY = "2026-10-28";
const TIN_TOI_THIEU = 500;
const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  console.error("do-gop-anh: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …)");
  process.exit(2);
}
const PIPE = join(import.meta.dirname, "..");
const ROOT = join(PIPE, "..");

/** Ngưỡng % của dòng SỐNG trong ô cơ hội — không viết cứng, đổi theo câu trả lời ở Cổng Phạm vi. */
function docNguong() {
  const o = readFileSync(join(ROOT, "_acceptance/gop-tin-chi-anh-o-transform/opportunity.md"), "utf8");
  const dong = o.split("\n").find((l) => l.startsWith("- Kết quả nào là SỐNG")) ?? "";
  const m = /≥\s*(\d+(?:[.,]\d+)?)\s*%/.exec(dong);
  if (!m) throw new Error("do-gop-anh: không đọc được ngưỡng % ở dòng «Kết quả nào là SỐNG» của opportunity.md");
  return Number(m[1].replace(",", "."));
}

const tam = [];
function ghiTam(ten, src) {
  const f = join(ten.startsWith("lib/") ? join(PIPE, "lib") : PIPE, `.dga-${ten.replace("lib/", "")}-${process.pid}.mjs`);
  writeFileSync(f, src);
  tam.push(f);
  return f;
}
async function napNen() {
  const src = execFileSync("git", ["show", `${NEN}:pipeline/transform-media.mjs`], { cwd: PIPE, encoding: "utf8" });
  return import(pathToFileURL(ghiTam("nen", src)).href);
}
async function napDoiChung() {
  const ga = readFileSync(join(PIPE, "lib/gop-anh.mjs"), "utf8");
  const cu = "const khoa = (p) => `${p.conversation_id}|${p.sender_id}`;";
  if (!ga.includes(cu)) throw new Error("do-gop-anh: đột biến đối chứng không khớp lib/gop-anh.mjs");
  const fGa = ghiTam("lib/ga", ga.replace(cu, "const khoa = (p) => `${p.conversation_id}`;"));
  const tm = readFileSync(join(PIPE, "transform-media.mjs"), "utf8");
  const nhap = 'from "./lib/gop-anh.mjs"';
  if (!tm.includes(nhap)) throw new Error("do-gop-anh: transform-media.mjs không nhập lib/gop-anh.mjs");
  return import(pathToFileURL(ghiTam("tm", tm.replace(nhap, `from "./lib/${fGa.split("/").pop()}"`))).href);
}

const SQL_DEM = `
  SELECT count(*)::int AS tin,
         count(*) FILTER (WHERE EXISTS (SELECT 1 FROM media m WHERE m.resource_record_key = o.offer_id))::int AS co_anh
  FROM sale_offers o WHERE o.source = 'S03'`;

// Cặp mong đợi, viết độc lập với lib/gop-anh.mjs: bài S03 thật (gạt bài thử như lib/test-posts.mjs), bài chỉ-ảnh có cột ảnh
// đăng trong ngày mẫu (giờ VN), bài chữ gần nhất cùng người và nhóm dưới 120 giây (hoà → bài chữ đứng sau, rồi post_id nhỏ
// hơn), bài chữ ấy thuộc post_ids của một offer S03.
const SQL_MONG_DOI = `
  WITH p AS (
    SELECT DISTINCT ON (post_id) post_id, text, posted_at, sender_id, conversation_id, media, media_files
    FROM stg_zalo_posts
    WHERE (agent_id IS NULL OR agent_id <> 'apify-facebook')
    ORDER BY post_id, captured_at DESC
  ), s AS (
    SELECT p.*, regexp_replace(regexp_replace(text, '(https?://\\S+|www\\.\\S+)', '', 'g'), '\\s', '', 'g') = '' AS chi_anh
    FROM p JOIN (SELECT DISTINCT ON (post_id) post_id, snapshot_id, agent_id, group_name FROM stg_zalo_posts ORDER BY post_id, captured_at DESC) g USING (post_id)
    WHERE NOT (split_part(g.snapshot_id, '__', 2) ~* '(mock|test|e2e)' OR split_part(g.snapshot_id, '__', 2) = 'example'
               OR coalesce(g.agent_id, '') ~* '^(e2e|test|mock)' OR btrim(coalesce(g.group_name, '')) ~* '^test($|[^[:alpha:]])')
  ), anh AS (
    SELECT * FROM s WHERE chi_anh AND sender_id IS NOT NULL AND conversation_id IS NOT NULL
      AND (posted_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = $1::date
      AND (CASE WHEN jsonb_typeof(media) = 'array' THEN jsonb_array_length(media) ELSE 0 END
         + CASE WHEN jsonb_typeof(media_files) = 'array' THEN jsonb_array_length(media_files) ELSE 0 END) > 0
  ), chu AS (
    SELECT * FROM s WHERE NOT chi_anh AND sender_id IS NOT NULL AND conversation_id IS NOT NULL
  ), gan AS (
    SELECT DISTINCT ON (a.post_id) a.post_id AS anh_id, c.post_id AS chu_id
    FROM anh a JOIN chu c ON c.sender_id = a.sender_id AND c.conversation_id = a.conversation_id
     AND abs(extract(epoch FROM c.posted_at - a.posted_at)) < 120
    ORDER BY a.post_id, abs(extract(epoch FROM c.posted_at - a.posted_at)), (c.posted_at > a.posted_at) DESC, c.post_id
  )
  SELECT gan.anh_id, o.offer_id
  FROM gan JOIN LATERAL (SELECT offer_id FROM sale_offers WHERE source = 'S03' AND gan.chu_id = ANY(post_ids) LIMIT 1) o ON true`;

// Cặp thật đọc từ bảng media: dòng có bài nguồn là bài chỉ-ảnh của ngày mẫu; cộng bài mà mọi URL ảnh đã có sẵn ở offer
// (bỏ trùng của luật ghép NH1 — bài ảnh đăng lại không sinh dòng mới).
async function capThat(c, mongDoi) {
  const anhIds = mongDoi.map((x) => x.anh_id);
  const { rows: tu } = await c.query(
    `SELECT DISTINCT originating_system_resource_record_key AS anh_id, resource_record_key AS offer_id
     FROM media WHERE originating_system_name = 'S03' AND originating_system_resource_record_key IN (
       SELECT post_id FROM stg_zalo_posts
       WHERE (posted_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = $1::date
         AND regexp_replace(regexp_replace(text, '(https?://\\S+|www\\.\\S+)', '', 'g'), '\\s', '', 'g') = '')`,
    [NGAY],
  );
  const cap = new Set(tu.map((r) => `${r.anh_id}|${r.offer_id}`));
  const { rows: trung } = await c.query(
    `SELECT x.anh_id, x.offer_id FROM unnest($1::text[], $2::text[]) AS x(anh_id, offer_id)
     WHERE NOT EXISTS (SELECT 1 FROM media m WHERE m.originating_system_resource_record_key = x.anh_id AND m.resource_record_key = x.offer_id)
       AND NOT EXISTS (
         SELECT 1 FROM (SELECT DISTINCT ON (post_id) media FROM stg_zalo_posts WHERE post_id = x.anh_id ORDER BY post_id, captured_at DESC) p,
                jsonb_array_elements(CASE WHEN jsonb_typeof(p.media) = 'array' THEN p.media ELSE '[]'::jsonb END) e
         WHERE NOT EXISTS (SELECT 1 FROM media m WHERE m.resource_record_key = x.offer_id AND m.media_url = e->>'url'))`,
    [anhIds, mongDoi.map((x) => x.offer_id)],
  );
  for (const r of trung) cap.add(`${r.anh_id}|${r.offer_id}`);
  return cap;
}

function soCap(mongDoi, that) {
  const md = new Set(mongDoi.map((x) => `${x.anh_id}|${x.offer_id}`));
  return { thieu: [...md].filter((k) => !that.has(k)), thua: [...that].filter((k) => !md.has(k)) };
}

const loi = [];
const nguong = docNguong();
const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
try {
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
  const nen = await napNen();
  await nen.runTransformMedia(c, ["S03"]);
  const truoc = (await c.query(SQL_DEM)).rows[0];
  const cay = await import(pathToFileURL(join(PIPE, "transform-media.mjs")).href);
  await cay.runTransformMedia(c, ["S03"]);
  const sau = (await c.query(SQL_DEM)).rows[0];
  const pt = (x) => +(100 * x.co_anh / Math.max(1, x.tin)).toFixed(1);
  console.log(`offer S03: ${sau.tin} · có ảnh trước ${truoc.co_anh} (${pt(truoc)}%) → sau ${sau.co_anh} (${pt(sau)}%) · mới có ảnh ${sau.co_anh - truoc.co_anh} · ngưỡng ≥ ${nguong}%`);
  if (sau.tin < TIN_TOI_THIEU) loi.push(`bản chép chỉ có ${sau.tin} offer S03 (< ${TIN_TOI_THIEU}) — DB thử rỗng hay cũ`);
  if (!(sau.co_anh > truoc.co_anh)) loi.push(`số offer có ảnh không tăng (${truoc.co_anh} → ${sau.co_anh})`);
  if (pt(sau) < nguong) loi.push(`tỉ lệ sau ${pt(sau)}% < ngưỡng ${nguong}%`);

  const { rows: mongDoi } = await c.query(SQL_MONG_DOI, [NGAY]);
  const lech = soCap(mongDoi, await capThat(c, mongDoi));
  console.log(`ngày mẫu ${NGAY}: ${mongDoi.length} cặp mong đợi · thiếu ${lech.thieu.length} · thừa ${lech.thua.length}`);
  for (const k of lech.thieu) console.log(`  thiếu ${k}`);
  for (const k of lech.thua) console.log(`  thừa ${k}`);
  if (mongDoi.length === 0) loi.push(`ngày mẫu ${NGAY} không có cặp nào — so vô nghĩa`);
  if (lech.thieu.length || lech.thua.length) loi.push(`ngày mẫu lệch ${lech.thieu.length + lech.thua.length} cặp`);

  const dc = await napDoiChung();
  await dc.runTransformMedia(c, ["S03"]);
  const lechDc = soCap(mongDoi, await capThat(c, mongDoi));
  const nDc = lechDc.thieu.length + lechDc.thua.length;
  console.log(`đối chứng (bỏ điều kiện cùng người): lệch ${nDc} cặp → ${nDc > 0 ? "TRƯỢT (đúng)" : "KHÔNG lệch — thước không đo điều kiện cùng người"}`);
  if (nDc === 0) loi.push("đối chứng không lệch — thước không đo điều kiện cùng người");
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
  for (const f of tam) rmSync(f, { force: true });
}
if (loi.length) {
  console.error(`do-gop-anh: ${loi.length} lỗi — ${loi.join("; ")}`);
  process.exit(1);
}
console.log("do-gop-anh: ĐẠT — offer có ảnh tăng và đạt ngưỡng; ngày mẫu khớp hai chiều; đối chứng lệch");
