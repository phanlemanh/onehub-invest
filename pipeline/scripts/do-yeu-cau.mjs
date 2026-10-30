#!/usr/bin/env node
// do-yeu-cau.mjs — hồ sơ _acceptance/bang-yeu-cau AC-9 (E9): thước bảng Yêu cầu trên bản chép dữ liệu thật (DB thử).
// Một giao dịch ROLLBACK trên DATABASE_URL (chỉ DB thử oneinvest_<dãy>_<việc>; mặc định oneinvest_p1_n1):
//   1. nạp 045 + 057 + 058; điểm Kev tổng hợp cho mọi bài S03 thật (chữ «cần/tìm mua|thuê», «khách tìm» → inquiry, còn lại
//      offer — chỉ để có đầu vào, không phải bộ phân loại);
//   2. lượt A (SAVEPOINT, bỏ bảng Yêu cầu): giây + tập offer; lượt B (có bảng): giây, tập offer phải giống lượt A;
//   3. quan hệ bài ↔ Yêu cầu: mỗi bài có phát biểu inquiry thắng nằm trong post_ids của đúng một Yêu cầu sống; mỗi Yêu cầu
//      một bộ (nguồn · người · chữ chuẩn hoá), không hai Yêu cầu chung bộ; lượt nạp lại thêm 0, nghỉ 0;
//   4. từng tiêu chí: số bài có dấu hiệu chữ và tỉ lệ đọc ra giá trị trên mẫu số ấy (chỉ in);
//   5. inquiry_records / inquiries không có trong FILL / CLOUD_ALLOW của sync-cloud.mjs;
//   6. đối chứng (luôn chạy): bản sao lib/yeu-cau.mjs bỏ người khỏi khoá gom → quan hệ «một bộ mỗi Yêu cầu» phải đỏ.
// Sai → exit 1.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napKev } from "../lib/nap-057.mjs";
import { napYeuCau } from "../lib/nap-058.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { docPhatBieuThang, khoaNguoi, tieuChiYeuCau } from "../lib/yeu-cau.mjs";
import { CLOUD_ALLOW, FILL } from "../sync-cloud.mjs";
import { normText, runTransformZalo, taoNguCanhPhuong } from "../transform-zalo.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const BAI_TOI_THIEU = 500;
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) { console.error("do-yeu-cau: chỉ chạy trên DB thử oneinvest_<dãy>_<việc>"); process.exit(1); }

const lap = async (fn) => { const log = console.log; console.log = () => {}; try { return await fn(); } finally { console.log = log; } };
const giay = async (fn) => { const t = Date.now(); const kq = await lap(fn); return { kq, s: (Date.now() - t) / 1000 }; };

async function tapOffer(c) {
  const { rows } = await c.query(`SELECT offer_id, post_ids, kind, price_vnd::text FROM sale_offers WHERE source = 'S03' ORDER BY offer_id`);
  return rows.map((r) => JSON.stringify({ ...r, post_ids: [...(r.post_ids ?? [])].sort() }));
}
const lech = (a, b) => { const A = new Set(a), B = new Set(b); return [...a.filter((x) => !B.has(x)), ...b.filter((x) => !A.has(x))]; };

const SQL_DIEN = `UPDATE stg_zalo_posts SET
    kev_p = 0.9, kev_model = 'kev-tong-hop', kev_at = now(),
    kev_intent = CASE WHEN text ~* '(cần|tìm)\\s+(mua|thuê)|khách\\s+tìm' THEN 'inquiry' ELSE 'offer' END, kev_intent_p = 0.8,
    kev_kind = CASE WHEN text ~* 'thuê' THEN 'rent' ELSE 'sale' END, kev_kind_p = 0.8
  WHERE post_id = ANY($1::text[])`;

/** Quan hệ bài ↔ Yêu cầu sống: [{ten, sai, vi_du}] — sai > 0 là đỏ. */
async function quanHe(c, posts) {
  const thang = await docPhatBieuThang(c, "S03", posts.map((p) => p.post_id));
  const theoId = new Map(posts.map((p) => [p.post_id, p]));
  const inq = posts.filter((p) => thang.get(p.post_id)?.listing_intent?.value === "inquiry");
  const { rows } = await c.query("SELECT inquiry_id, post_ids FROM inquiries WHERE source = 'S03'");
  const lan = new Map();
  for (const r of rows) for (const id of r.post_ids) lan.set(id, (lan.get(id) ?? 0) + 1);
  const vang = inq.filter((p) => !lan.has(p.post_id));
  const lap2 = [...lan].filter(([, n]) => n > 1);
  const bo = (p) => `${khoaNguoi(p) ?? `post:${p.post_id}`}|${normText(p.text)}`;
  const tronBo = [], boCuaYc = new Map();
  for (const r of rows) {
    const bs = new Set(r.post_ids.map((id) => (theoId.has(id) ? bo(theoId.get(id)) : `?${id}`)));
    if (bs.size !== 1) tronBo.push(r.inquiry_id);
    for (const b of bs) boCuaYc.set(b, [...(boCuaYc.get(b) ?? []), r.inquiry_id]);
  }
  const chungBo = [...boCuaYc].filter(([, ids]) => ids.length > 1);
  return {
    inq, thang, yeuCau: rows.length,
    loi: [
      { ten: "bài inquiry vắng mọi post_ids sống", sai: vang.length, vi_du: vang[0]?.post_id },
      { ten: "bài nằm trong hơn một post_ids sống", sai: lap2.length, vi_du: lap2[0]?.[0] },
      { ten: "Yêu cầu gồm bài khác nguồn · người · chữ", sai: tronBo.length, vi_du: tronBo[0] },
      { ten: "hai Yêu cầu chung một bộ nguồn · người · chữ", sai: chungBo.length, vi_du: chungBo[0]?.[1]?.join(",") },
    ],
  };
}

// Dấu hiệu chữ của từng tiêu chí (mẫu số tỉ lệ đọc) và trường đọc ra của tieuChiYeuCau.
const TIEU_CHI = [
  ["dịch vụ", /(cần|tìm)\s+(mua|thuê)/i, (t) => t.kind],
  ["loại hình", /chung cư|căn hộ|nhà|đất|phòng trọ|phòng khép kín|văn phòng|mặt bằng|shophouse/i, (t) => t.property_type],
  ["phòng ngủ", /\d+\s*(pn|phòng ngủ|br)/i, (t) => t.bedrooms],
  ["diện tích", /\d+(?:[.,]\d+)?\s*m(?:2|²)?(?!\p{L})/iu, (t) => t.area_m2],
  ["ngân sách", /\d\s*(tỷ|tỉ|ty|triệu|tr|củ)(?!\p{L})/iu, (t) => t.budget_min_vnd ?? t.budget_max_vnd],
  ["khu vực", /phường|quận|huyện|\bp\.|\bq\./i, (t) => t.area_id],
];

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
let code = 0;
try {
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  await napPhatBieu(c);
  await napKev(c);
  await napYeuCau(c);
  const { posts } = await loadStgPosts(c, "zalo");
  const ids = posts.map((p) => p.post_id);
  console.log(`bài S03 thật: ${ids.length} (tối thiểu ${BAI_TOI_THIEU})`);
  if (ids.length < BAI_TOI_THIEU) { console.error("do-yeu-cau: quá ít bài S03 — DB thử không phải bản chép dữ liệu thật"); code = 1; }
  await c.query(SQL_DIEN, [ids]);

  // Lượt A: không bảng Yêu cầu.
  await c.query("SAVEPOINT khong_bang");
  await c.query("DROP VIEW IF EXISTS inquiries");
  await c.query("DROP TABLE IF EXISTS inquiry_records");
  const A = await giay(() => runTransformZalo(c));
  const offerA = await tapOffer(c);
  await c.query("ROLLBACK TO SAVEPOINT khong_bang");

  // Lượt B: có bảng.
  const B = await giay(() => runTransformZalo(c));
  const offerB = await tapOffer(c);
  console.log(`giây transform-zalo: không bảng ${A.s.toFixed(2)} → có bảng ${B.s.toFixed(2)} (+${(B.s - A.s).toFixed(2)})`);
  const l = lech(offerA, offerB);
  console.log(`offer S03: không bảng ${offerA.length} · có bảng ${offerB.length} · lệch ${l.length}`);
  if (l.length) { for (const x of l.slice(0, 10)) console.error(`  lệch ${x}`); code = 1; }

  const q = await quanHe(c, posts);
  console.log(`bài có phát biểu inquiry thắng: ${q.inq.length} · Yêu cầu sống: ${q.yeuCau} · ghi lượt B: ${JSON.stringify(B.kq.yeuCau)}`);
  for (const x of q.loi) {
    console.log(`  ${x.ten}: ${x.sai}${x.sai ? ` (ví dụ ${x.vi_du})` : ""}`);
    if (x.sai) code = 1;
  }
  if (!q.inq.length) { console.error("do-yeu-cau: không bài inquiry nào — đầu vào tổng hợp hỏng"); code = 1; }

  const lai = await giay(() => runTransformZalo(c));
  console.log(`nạp lại: thêm ${lai.kq.yeuCau.them} · cập nhật ${lai.kq.yeuCau.capNhat} · sống lại ${lai.kq.yeuCau.songLai} · nghỉ ${lai.kq.yeuCau.nghi}`);
  if (lai.kq.yeuCau.them || lai.kq.yeuCau.nghi) code = 1;

  const ctx = await taoNguCanhPhuong(c);
  console.log("tiêu chí (bài inquiry có dấu hiệu chữ → đọc ra; chỉ in):");
  for (const [ten, dau, lay] of TIEU_CHI) {
    const co = q.inq.filter((p) => dau.test(p.text ?? ""));
    const ra = co.filter((p) => lay(tieuChiYeuCau(p, q.thang.get(p.post_id), ctx)) != null).length;
    console.log(`  ${ten}: ${co.length} bài có dấu hiệu · đọc ra ${ra} (${co.length ? ((ra / co.length) * 100).toFixed(1) : "—"}%)`);
  }

  const tren = [...FILL, ...Object.keys(CLOUD_ALLOW)].filter((t) => t === "inquiry_records" || t === "inquiries");
  console.log(`sync cloud: inquiry_records/inquiries trong FILL hay CLOUD_ALLOW: ${tren.length ? tren.join(", ") : "không"}`);
  if (tren.length) code = 1;

  // Đối chứng: khoá gom bỏ người → các bài cùng chữ của nhiều người dồn một Yêu cầu → quan hệ phải đỏ.
  await c.query("SAVEPOINT doi_chung");
  const goc = readFileSync(join(PIPE, "lib/yeu-cau.mjs"), "utf8");
  const dotBien = goc.replace("const nguoi = khoaNguoi(post) ?? `post:${post.post_id}`;", 'const nguoi = "x";');
  if (dotBien === goc) { console.error("do-yeu-cau: bản sao đối chứng không đổi gì"); code = 1; }
  const sao = join(PIPE, "lib", `yeu-cau.do-dot-bien-${process.pid}.mjs`);
  writeFileSync(sao, dotBien);
  try {
    const m = await import(pathToFileURL(sao).href);
    await lap(() => runTransformZalo(c, { buocYeuCau: m.ghiYeuCau }));
    const dc = await quanHe(c, posts);
    const sai = dc.loi.find((x) => x.ten === "Yêu cầu gồm bài khác nguồn · người · chữ").sai;
    console.log(`đối chứng (khoá gom bỏ người): Yêu cầu trộn bộ ${sai}`);
    if (!sai) { console.error("do-yeu-cau: đối chứng không đỏ — thước quan hệ không đo gì"); code = 1; }
  } finally {
    rmSync(sao, { force: true });
    await c.query("ROLLBACK TO SAVEPOINT doi_chung");
  }
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
}
console.log(code ? "do-yeu-cau: ĐỎ" : "do-yeu-cau: xanh");
process.exit(code);
