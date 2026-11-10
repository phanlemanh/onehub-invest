#!/usr/bin/env node
// do-nhanh-bai-s03.mjs — thước DF6 `bai-nhan-tru-bai-chi-anh` (E10) trên dữ liệu thật: làm tươi «Dòng chảy dữ liệu» bằng
// 600 của merge-base với origin/main (chạy trần) rồi bằng bộ chạy mới (refresh-data-flow.mjs: nhánh bài + 600 mới) trên
// CÙNG DB, so khối `facts`, và đối chiếu nhánh với hai phép đếm độc lập:
//   - ảnh: imageMerged + imageUnmerged = bài S03 thật chưa thành tin mà chữ chỉ còn khoảng trắng sau khi gạt URL — đếm
//     bằng SQL, không qua lib/gop-anh.mjs;
//   - ảnh đã ghép: imageMerged = bài ảnh ấy có bài chữ cùng người, cùng nhóm, cách dưới 120 giây, và bài chữ GẦN NHẤT (hoà:
//     bài đứng sau ảnh, rồi post_id nhỏ) nằm trong post_ids của một tin S03 — luật PL28 viết lại bằng SQL;
//   - Yêu cầu: inquiry = bài chưa thành tin mà `suyLoai` của transform trả nguồn `yeu-cau` (gọi thẳng suyLoai, không qua
//     lib/nhanh-bai-s03.mjs).
// Ghi data_flow_snapshot nên CHỈ chạy trên DB thử (db/db-thu.sh … --chay): DB đích tên `oneinvest` → thoát 2.
// Đỏ → thoát 1 với thông điệp ghim. `--doi-chung-hong=anh|ghep|yeu-cau` ép đúng một nhánh lệch để chứng chiều đỏ của
// đúng thước ấy (phải thoát 1 với thông điệp của nó).
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { chayLamTuoi } from "../refresh-data-flow.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { parsePost, suyLoai } from "../transform-zalo.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const HONG = (process.argv.find((a) => a.startsWith("--doi-chung-hong=")) ?? "").split("=")[1] ?? null;
if (HONG !== null && !["anh", "ghep", "yeu-cau"].includes(HONG)) {
  console.error("do-nhanh-bai-s03: --doi-chung-hong=anh|ghep|yeu-cau");
  process.exit(2);
}
const NHANH = ["imageMerged", "inquiry", "imageUnmerged"];

const tenDb = new globalThis.URL(URL).pathname.replace(/^\//, "");
if (tenDb === "oneinvest") {
  console.error("do-nhanh-bai-s03: DB đích là oneinvest (dùng chung) — chạy qua db/db-thu.sh <tên> --chay");
  process.exit(2);
}

const loi = [];
const do_ = (dk, msg) => {
  if (!dk) loi.push(msg);
};

function banNen() {
  try {
    const mb = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: ROOT, encoding: "utf8" }).trim();
    return execFileSync("git", ["show", `${mb}:pipeline/sql/600_data_flow.sql`], { cwd: ROOT, encoding: "utf8" });
  } catch {
    return null;
  }
}

async function docFacts(c) {
  const { rows } = await c.query("SELECT time_window, facts FROM data_flow_snapshot ORDER BY time_window");
  return Object.fromEntries(rows.map((r) => [r.time_window, r.facts]));
}

/** Bỏ ba khoá nhánh khỏi một phần tử để so phần cũ. */
const boNhanh = (x) => Object.fromEntries(Object.entries(x).filter(([k]) => !NHANH.includes(k)));
const json = (v) => JSON.stringify(v);

const cu = banNen();
if (!cu) {
  console.error("KHONG CO BAN NEN: không đọc được 600_data_flow.sql của merge-base với origin/main");
  process.exit(1);
}
const moi = await readFile(path.join(ROOT, "pipeline/sql/600_data_flow.sql"), "utf8");

const c1 = new pg.Client({ connectionString: URL });
await c1.connect();
await c1.query(cu);
const factsCu = await docFacts(c1);
await c1.end();

const c2 = new pg.Client({ connectionString: URL });
await c2.connect();
const t0 = performance.now();
const dem = await chayLamTuoi(c2, moi);
const giay = ((performance.now() - t0) / 1000).toFixed(1);
const factsMoi = await docFacts(c2);

// Đếm độc lập trên cùng DB (SQL, không gọi lib/gop-anh.mjs hay lib/nhanh-bai-s03.mjs).
const { rows: [anh] } = await c2.query(`
  WITH p AS (SELECT DISTINCT ON (post_id) post_id, snapshot_id, agent_id, group_name, text, sender_id, conversation_id, posted_at
             FROM stg_zalo_posts ORDER BY post_id, captured_at DESC),
  real AS (SELECT *, regexp_replace(coalesce(text, ''), '(https?://[^[:space:]]+|www\\.[^[:space:]]+)', ' ', 'gi') ~ '^[[:space:]]*$' AS chi_anh
           FROM p
           WHERE coalesce(agent_id, '') <> 'apify-facebook'
             AND NOT (split_part(snapshot_id, '__', 2) ~* '(mock|test|e2e)' OR split_part(snapshot_id, '__', 2) = 'example'
                      OR coalesce(agent_id, '') ~* '^(e2e|test|mock)' OR btrim(coalesce(group_name, '')) ~* '^test($|[^[:alpha:]])')),
  used AS (SELECT DISTINCT unnest(post_ids) AS post_id FROM sale_offers WHERE source = 'S03'),
  img AS (SELECT * FROM real WHERE chi_anh AND post_id NOT IN (SELECT post_id FROM used)),
  cand AS (
    SELECT a.post_id AS a_id, c.post_id AS c_id,
           row_number() OVER (PARTITION BY a.post_id
                              ORDER BY abs(extract(epoch FROM c.posted_at - a.posted_at)), (c.posted_at > a.posted_at) DESC,
                                       c.post_id COLLATE "C") AS rn
    FROM img a JOIN real c ON NOT c.chi_anh AND c.sender_id = a.sender_id AND c.conversation_id = a.conversation_id
    WHERE a.sender_id <> '' AND a.conversation_id <> ''
      AND abs(extract(epoch FROM c.posted_at - a.posted_at)) < 120)
  SELECT (SELECT count(*) FROM img) AS n,
         (SELECT count(*) FROM cand WHERE rn = 1 AND c_id IN (SELECT post_id FROM used)) AS ghep`);
const { rows: tin } = await c2.query("SELECT DISTINCT unnest(post_ids) AS post_id FROM sale_offers WHERE source = 'S03'");
const daDoc = new Set(tin.map((r) => r.post_id));
const { posts } = await loadStgPosts(c2, "zalo");
let yc = 0;
for (const p of posts) if (!daDoc.has(p.post_id) && suyLoai(parsePost(p.text), p.text, undefined).nguon === "yeu-cau") yc++;
await c2.end();

for (const w of ["7d", "30d", "all"]) {
  const a = factsCu[w], b = factsMoi[w];
  do_(a && b, `SO CU DOI: thiếu cửa sổ ${w}`);
  if (!a || !b) continue;
  const h = b.sources.find((s) => s.source === "S03");
  if (HONG === "anh") h.imageUnmerged += 1;
  if (HONG === "ghep") { h.imageMerged += 1; h.imageUnmerged -= 1; }
  if (HONG === "yeu-cau") h.inquiry += 1;
  for (const k of ["shortStay", "mix", "enrichPending"]) do_(json(a[k]) === json(b[k]), `SO CU DOI: ${w}.${k}`);
  do_(json(a.sources) === json(b.sources.map(boNhanh)), `SO CU DOI: ${w}.sources (khoá cũ)`);
  do_(json(a.days) === json(b.days.map(boNhanh)), `SO CU DOI: ${w}.days (khoá cũ)`);
  do_(json(a.groups) === json(b.groups.map(boNhanh)), `SO CU DOI: ${w}.groups (khoá cũ)`);
  for (const s of b.sources) {
    const tong = NHANH.reduce((acc, k) => acc + s[k], 0);
    do_(NHANH.every((k) => Number.isInteger(s[k])), `NHANH VANG: ${w}.${s.source}`);
    do_(s.readable + tong <= s.received, `TONG NHANH VUOT: ${w}.${s.source} readable ${s.readable} + nhánh ${tong} > nhận ${s.received}`);
    if (s.source !== "S03") do_(tong === 0, `SO CU DOI: ${w}.${s.source} có nhánh ${tong}`);
  }
  const s3 = b.sources.find((s) => s.source === "S03");
  const canDoc = s3.received - s3.imageMerged;
  console.log(
    `${w} S03: nhận ${s3.received} · đọc được ${s3.readable} · ảnh đã ghép ${s3.imageMerged} · Yêu cầu ${s3.inquiry} · ảnh chưa ghép ${s3.imageUnmerged} · cần đọc ${canDoc} · «Đọc được» (tin rao + Yêu cầu) ${canDoc > 0 ? ((100 * (s3.readable + s3.inquiry)) / canDoc).toFixed(1) : "—"}% (trước DF6: tin rao trên bài nhận ${((100 * s3.readable) / Math.max(1, s3.received)).toFixed(1)}%)`,
  );
  if (w === "all") {
    const nAnh = Number(anh.n);
    do_(s3.imageMerged + s3.imageUnmerged === nAnh, `ANH LECH DEM SQL: nhánh ảnh ${s3.imageMerged + s3.imageUnmerged} ≠ đếm SQL ${nAnh}`);
    do_(s3.imageMerged === Number(anh.ghep), `ANH GHEP LECH DEM SQL: imageMerged ${s3.imageMerged} ≠ đếm SQL ${anh.ghep}`);
    do_(s3.inquiry === yc, `YEU CAU LECH: inquiry ${s3.inquiry} ≠ suyLoai yeu-cau ${yc}`);
  }
}
console.log(`bộ chạy: ${giay} giây · nhánh ${JSON.stringify(dem)} · đếm SQL ảnh chưa thành tin ${anh.n}, đã ghép ${anh.ghep} · suyLoai yeu-cau chưa thành tin ${yc}`);
if (loi.length) {
  for (const l of loi) console.error(l);
  process.exit(1);
}
console.log("do-nhanh-bai-s03: xanh");
