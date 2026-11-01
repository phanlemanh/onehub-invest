#!/usr/bin/env node
// do-seller-ref.mjs — hồ sơ _acceptance/seller-ref-theo-nguoi-gui (HD4) AC-7, AC-8: thước «Bật khi» trên bản chép dữ liệu
// thật. Hai lượt, mỗi lượt BEGIN…ROLLBACK trên DATABASE_URL (chỉ DB thử oneinvest_<dãy>_<việc>), không xoá tin có sẵn,
// gọi đúng runTransformZalo + runTransformFb mà lượt đêm gọi:
//   lượt cây — transform của cây: mọi thước phải ĐẠT ở S03 và S05;
//   lượt nền — transform của commit ED0 (main trước HD4): mỗi nguồn phải TRƯỢT ít nhất một thước.
// Người gửi bài neo tính bằng SQL RIÊNG của thước trên stg_zalo_posts, không mượn hàm của transform đang bị đo.
// AC-8: so mọi cột sale_offers (information_schema) giữa hai lượt trừ seller_ref → 0 ô khác; đối chứng đổi n_reposts của
// một tin lượt cây trong giao dịch → thước phải gọi đúng tên cột ấy. Sai một điều → exit 1, gọi tên thước.
import { execFileSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { napPhatBieu } from "../lib/nap-045.mjs";
import { runTransformFb } from "../transform-fb.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const ED0 = "ed0ff2cd05fbb50b214d03fa6de426060a51d6da";
const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  console.error("do-seller-ref: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …)");
  process.exit(2);
}
const PIPE = join(import.meta.dirname, "..");
const NGUON = ["S03", "S05"];
const SAI_SO = 0.01; // ±1% số người gửi bài neo
const TRAN_PHAN = 0.05; // một seller_ref quá 5% số tin của nguồn chỉ khi đúng người gửi
// Cột loại khỏi phép so AC-8 ngoài seller_ref — cột ghi theo giờ chạy lượt. Rỗng: sale_offers không có cột ấy.
const LOAI_SO = ["seller_ref"];

// Người gửi bài neo của mỗi tin: bài mới nhất mỗi post_id (cùng cách loadStgPosts đọc), bỏ người gửi rỗng,
// thứ tự neo posted_at rồi post_id.
const SQL_NEO = `
  WITH bai AS (
    SELECT DISTINCT ON (post_id) post_id, posted_at, nullif(btrim(sender_id), '') AS ai
    FROM stg_zalo_posts ORDER BY post_id, captured_at DESC
  )
  SELECT o.offer_id, o.source, o.seller_ref,
         (SELECT b.ai FROM unnest(o.post_ids) p(id) JOIN bai b ON b.post_id = p.id
          WHERE b.ai IS NOT NULL ORDER BY b.posted_at, b.post_id LIMIT 1) AS neo
  FROM sale_offers o WHERE o.source = ANY($1)`;

/** Ba vế «Bật khi» + vế ghi đè hằng cũ cho một nguồn. Trả { dat, vi_pham[], so }. */
function thuoc(dong, hangCu) {
  const ref = new Set(dong.filter((d) => d.seller_ref !== null).map((d) => d.seller_ref));
  const neo = new Set(dong.filter((d) => d.neo !== null).map((d) => d.neo));
  const lech = dong.filter((d) => (d.seller_ref ?? null) !== (d.neo ?? null));
  const dem = new Map();
  for (const d of dong) if (d.seller_ref !== null) dem.set(d.seller_ref, (dem.get(d.seller_ref) ?? 0) + 1);
  const [refLon, nLon] = [...dem].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  const phanLon = dong.length ? nLon / dong.length : 0;
  const conHang = dong.filter((d) => hangCu.has(d.seller_ref)).length;
  const vi_pham = [];
  if (Math.abs(ref.size - neo.size) > SAI_SO * neo.size) vi_pham.push(`so-ref ${ref.size} lệch so-nguoi-gui-neo ${neo.size} quá ±1%`);
  if (lech.length) vi_pham.push(`ref-khac-nguoi-gui-neo ${lech.length} tin`);
  if (phanLon > TRAN_PHAN && dong.some((d) => d.seller_ref === refLon && d.neo !== refLon)) vi_pham.push(`ref-qua-5% ${(phanLon * 100).toFixed(1)}%`);
  if (conHang) vi_pham.push(`con-hang-cu ${conHang} tin`);
  const cloudNull = dong.filter((d) => d.seller_ref !== null && !/[0-9]+$/.test(d.seller_ref)).length;
  return { dat: vi_pham.length === 0, vi_pham, so: { tin: dong.length, ref: ref.size, nguoi_gui_neo: neo.size, ref_null: dong.filter((d) => d.seller_ref === null).length, phan_lon_nhat_pct: +(phanLon * 100).toFixed(2), con_hang_cu: conHang, cloud_null: cloudNull } };
}

/** Một lượt trong giao dịch ROLLBACK: chạy hai transform, đo, chụp mọi cột; `sauChup` chạy sau ảnh chụp đầu. */
async function luot(ten, zalo, fb, sauChup) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    // Hằng cũ = mọi author_hash của bài (mã agent thu): sau lượt không tin nào còn mang nó.
    const hangCu = new Set((await c.query("SELECT DISTINCT author_hash FROM stg_zalo_posts WHERE author_hash IS NOT NULL")).rows.map((r) => r.author_hash));
    const truoc = (await c.query("SELECT source, count(*)::int n FROM sale_offers WHERE source = ANY($1) AND seller_ref = ANY($2) GROUP BY 1", [NGUON, [...hangCu]])).rows;
    await zalo(c);
    await fb(c);
    const dong = (await c.query(SQL_NEO, [NGUON])).rows;
    const ket = Object.fromEntries(NGUON.map((s) => [s, thuoc(dong.filter((d) => d.source === s), hangCu)]));
    const cot = (await c.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'sale_offers' ORDER BY ordinal_position`)).rows.map((r) => r.column_name);
    const chup = async () => new Map((await c.query(`SELECT * FROM sale_offers WHERE source = ANY($1)`, [NGUON])).rows.map((r) => [r.offer_id, r]));
    const anh = await chup();
    const anh2 = sauChup ? (await sauChup(c), await chup()) : null;
    console.log(`lượt ${ten}: tin mang hằng cũ trước lượt ${JSON.stringify(truoc)}`);
    for (const s of NGUON) console.log(`lượt ${ten} ${s}: ${ket[s].dat ? "ĐẠT" : "TRƯỢT"} ${JSON.stringify(ket[s].so)}${ket[s].vi_pham.length ? " · " + ket[s].vi_pham.join(" · ") : ""}`);
    return { ket, cot, anh, anh2 };
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

// field_provenance mang mã dòng phát biểu (`ids`, bigserial): sequence không lùi khi ROLLBACK nên hai lượt y hệt vẫn ra mã
// khác (đo 01/11: 192 tin lệch giữa hai lượt CÂY). So mọi khoá khác của nó (giá trị, tầng, cách đọc, mốc quan sát).
const boIds = (v) => (Array.isArray(v) ? v.map(boIds) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== "ids").map(([k, x]) => [k, boIds(x)])) : v);
const giaTri = (v, cot) => (v instanceof Date ? v.toISOString() : JSON.stringify(cot === "field_provenance" ? boIds(v ?? null) : v ?? null));
/** AC-8: các cột khác nhau giữa hai ảnh chụp (trừ LOAI_SO). Trả { cot_so, khac: Map<cột, số ô> , tin_lech }. */
function soCot(cot, a, b) {
  const soSanh = cot.filter((x) => !LOAI_SO.includes(x));
  const khac = new Map();
  const tinLech = [...a.keys()].filter((k) => !b.has(k)).length + [...b.keys()].filter((k) => !a.has(k)).length;
  for (const [id, ra] of a) {
    const rb = b.get(id);
    if (!rb) continue;
    for (const x of soSanh) if (giaTri(ra[x], x) !== giaTri(rb[x], x)) khac.set(x, (khac.get(x) ?? 0) + 1);
  }
  return { cot_so: soSanh.length, khac, tin_lech: tinLech };
}

async function transformNen() {
  const tep = [];
  try {
    const nap = async (ten) => {
      const f = join(PIPE, `${ten}.nen-dsr-${process.pid}.mjs`);
      writeFileSync(f, execFileSync("git", ["show", `${ED0}:pipeline/${ten}.mjs`], { cwd: PIPE }));
      tep.push(f);
      return import(pathToFileURL(f).href);
    };
    return { zalo: (await nap("transform-zalo")).runTransformZalo, fb: (await nap("transform-fb")).runTransformFb };
  } finally {
    for (const f of tep) unlinkSync(f);
  }
}

const loi = [];
const cay = await luot("cây", runTransformZalo, runTransformFb, (c) =>
  c.query(`UPDATE sale_offer_records SET n_reposts = n_reposts + 1 WHERE offer_id = (SELECT min(offer_id) FROM sale_offers WHERE source = 'S03')`));
const nenFn = await transformNen();
const nen = await luot("nền", nenFn.zalo, nenFn.fb);

for (const s of NGUON) {
  if (!cay.ket[s].dat) loi.push(`AC-7 ${s} lượt cây trượt: ${cay.ket[s].vi_pham.join(" · ")}`);
  if (nen.ket[s].dat) loi.push(`AC-7 đối chứng ${s}: lượt nền ED0 không trượt — thước không phân biệt`);
  if (cay.ket[s].so.tin === 0) loi.push(`AC-7 ${s}: không có tin nào — thước không đo gì`);
}
const so = soCot(cay.cot, cay.anh, nen.anh);
console.log(`AC-8: so ${so.cot_so} cột · tin lệch giữa hai lượt ${so.tin_lech} · ô khác ${JSON.stringify(Object.fromEntries(so.khac))}`);
if (so.tin_lech) loi.push(`AC-8 số tin hai lượt khác: ${so.tin_lech}`);
if (so.khac.size) loi.push(`AC-8 cột khác ngoài seller_ref: ${[...so.khac.keys()].join(", ")}`);
const dc = soCot(cay.cot, cay.anh2, nen.anh);
console.log(`AC-8 đối chứng (đổi n_reposts một tin lượt cây): ô khác ${JSON.stringify(Object.fromEntries(dc.khac))}`);
if (!(dc.khac.size === 1 && dc.khac.get("n_reposts") === 1)) loi.push("AC-8 đối chứng: thước không gọi đúng cột n_reposts");

if (loi.length) {
  for (const l of loi) console.error(`do-seller-ref: ${l}`);
  process.exit(1);
}
console.log("do-seller-ref: ĐẠT — lượt cây đạt mọi thước, lượt nền trượt ở S03 và S05, AC-8 0 ô khác, đối chứng gọi đúng cột");
