#!/usr/bin/env node
// label-ghep.mjs — hồ sơ ghep-anh-tren-the-gan-nhan: ghi cột `eval_label_items.ghep` của một lát.
// node pipeline/label-ghep.mjs --lat <lát> [--thu] [--lam-lai] [--db-that]
// Ghi một lần để hai người gắn cùng thấy một cụm dù sau đó thu thêm bài: lát đã có ghép thì giữ, muốn tính lại phải `--lam-lai`.
// Chỉ đọc và ghi cột này, không đổi dòng mẫu. Đích không phải DB thử thì phải khai `--db-that`.
import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { khoaTrung } from "./lib/eval-labels.mjs";
import { ghepChoMau } from "./lib/ghep-mau.mjs";
import { laChiAnh } from "./lib/gop-anh.mjs";
import { loadStgPosts } from "./lib/test-posts.mjs";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/**
 * Tin của pipeline cho từng bài S03 (lay-mau-khu-trung-theo-tin): post_id → offer_id từ `sale_offer_records.post_ids`, kể cả tin
 * đã nghỉ; bài có ở nhiều bản ghi thì bản ghi còn sống thắng, rồi offer_id nhỏ nhất. Chỉ đọc.
 * @returns {Promise<Map<string, string>>}
 */
export async function docTinCua(client) {
  // Lược đồ không có sổ tin (lược đồ tạm của test app chỉ dựng bảng nhãn): khử theo chữ đã gạt URL. DB máy thu luôn có bảng.
  const { rows: [{ co }] } = await client.query(`SELECT to_regclass('sale_offer_records') IS NOT NULL AS co`);
  if (!co) return new Map();
  const { rows } = await client.query(
    `SELECT DISTINCT ON (pid) pid, offer_id FROM sale_offer_records, unnest(post_ids) AS pid
     WHERE source = 'S03' ORDER BY pid, (retired_at IS NULL) DESC, offer_id`);
  return new Map(rows.map((r) => [r.pid, r.offer_id]));
}

/**
 * Dấu trùng theo khoá của lay-mau-khu-trung-theo-tin, chạy sau ghepChoMau. Khoá của thẻ = khoaTrung trên bài chữ (chu_ref của cụm,
 * hay chính bài khi không có cụm). Mỗi nhóm khoá còn đúng một thẻ hiện.
 * - Dòng có `an_tay` (Mạnh ẩn tay) giữ nguyên, không bao giờ bị gỡ hay đổi đích.
 * - Thẻ đã ẩn vì cụm ảnh không xét lại.
 * - Thẻ giữ: nhiều dòng nhãn nhất → được dấu ẩn tay trỏ tới → item_id nhỏ nhất.
 * - Thẻ còn lại nhận `trung_voi` = ref_id thẻ giữ và `khu_trung` "tin" | "chu".
 * @param {{ item_id: number|string, ref_id: string, ghep_cu?: object|null }[]} items
 * @param {Map<string, object|null>} ghep kết quả ghepChoMau
 * @param {{ posts: { post_id: string, text?: string|null }[], tinCua: Map<string, string>, soNhan: Map<string, number> }} opts
 * @returns {{ ghep: Map<string, object|null>, an_moi: number, an_tay_giu: number, an_them: { item_id: string, khoa: string }[] }}
 */
export function nhomTrung(items, ghep, { posts, tinCua, soNhan }) {
  const theoId = new Map(posts.map((p) => [p.post_id, p]));
  const out = new Map(ghep);
  const laAnTay = (it) => typeof it.ghep_cu?.an_tay === "string" && it.ghep_cu.an_tay !== "";
  const anTay = items.filter(laAnTay);
  for (const it of anTay) out.set(String(it.item_id), it.ghep_cu);
  const duocTro = new Set(anTay.map((it) => it.ghep_cu.trung_voi).filter(Boolean));
  const nhom = new Map();
  for (const it of [...items].sort((a, b) => Number(a.item_id) - Number(b.item_id))) {
    const g = out.get(String(it.item_id)) ?? null;
    if (!laAnTay(it) && g?.trung_voi) continue;
    const chuId = g ? g.chu_ref : it.ref_id;
    const bai = chuId ? theoId.get(chuId) : null;
    if (!bai || laChiAnh(bai.text)) continue;
    const khoa = khoaTrung(bai, tinCua);
    if (!khoa) continue;
    if (!nhom.has(khoa)) nhom.set(khoa, []);
    nhom.get(khoa).push(it);
  }
  const anThem = [];
  for (const [khoa, ds] of nhom) {
    const ung = ds.filter((it) => !laAnTay(it));
    if (ds.length < 2 || ung.length === 0) continue;
    const nhan = (it) => soNhan.get(String(it.item_id)) ?? 0;
    const [giu, ...con] = [...ung].sort((a, b) => nhan(b) - nhan(a)
      || Number(duocTro.has(b.ref_id)) - Number(duocTro.has(a.ref_id))
      || Number(a.item_id) - Number(b.item_id));
    // Nhóm có dấu ẩn tay mà mọi thẻ chưa ẩn đã là thẻ giữ duy nhất: không có gì để ẩn thêm.
    for (const it of con) {
      const id = String(it.item_id);
      const g = out.get(id) ?? { chu_ref: it.ref_id, anh_refs: [], so_chu_gan: 0, trung_voi: null };
      out.set(id, { ...g, trung_voi: giu.ref_id, khu_trung: khoa.startsWith("o:") ? "tin" : "chu" });
      anThem.push({ item_id: id, khoa });
    }
  }
  return { ghep: out, an_moi: anThem.length, an_tay_giu: anTay.length, an_them: anThem };
}

/** DB thử: máy này, tên `oneinvest_<việc>` (db/db-thu.sh). */
export function laDbThu(url) {
  const u = new URL(url);
  return ["localhost", "127.0.0.1"].includes(u.hostname) && /^\/oneinvest_\w+$/.test(u.pathname);
}

// jsonb không giữ thứ tự khoá.
const giongNhau = (a, b) => {
  if (a === null || b === null) return a === b;
  return Object.keys(b).every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k])) && Object.keys(a).length === Object.keys(b).length;
};

/** @returns {Promise<{ lat: string, dong: number, co_ghep: number, nhan_ghep: number, trung: number, an_moi: number, an_tay_giu: number, an_them: { item_id: string, khoa: string }[], ghi: number, giu?: boolean, thieu_cot?: boolean }>} */
export async function ghepLat(client, { lat, thu = false, lamLai = false }) {
  const { rows: cot } = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'eval_label_items' AND column_name = 'ghep'`);
  if (!cot.length) return { lat, dong: 0, co_ghep: 0, nhan_ghep: 0, trung: 0, an_moi: 0, an_tay_giu: 0, an_them: [], ghi: 0, thieu_cot: true };
  const { rows: items } = await client.query(`SELECT item_id, ref_id, ghep FROM eval_label_items WHERE lat = $1 ORDER BY item_id`, [lat]);
  const daCo = items.some((i) => i.ghep != null);
  const { posts } = await loadStgPosts(client, "zalo");
  const cum = ghepChoMau(items, posts);
  // lay-mau-khu-trung-theo-tin: dấu trùng theo tin và chữ đã gạt URL, giữ mọi dấu ẩn tay.
  const { rows: nhanRows } = await client.query(
    `SELECT item_id, count(*)::int AS so FROM eval_labels WHERE item_id = ANY ($1) GROUP BY item_id`, [items.map((i) => i.item_id)]);
  const soNhan = new Map(nhanRows.map((r) => [String(r.item_id), r.so]));
  const tinCua = await docTinCua(client);
  // Lát đã có ghép mà không --lam-lai: giữ cụm cũ (hai người cùng thấy một cụm), chỉ thêm dấu trùng theo khoá.
  const giu = daCo && !lamLai;
  const nen = giu ? new Map(items.map((i) => [String(i.item_id), i.ghep ?? null])) : cum;
  const { ghep, an_moi, an_tay_giu, an_them } = nhomTrung(items.map((i) => ({ ...i, ghep_cu: i.ghep })), nen, { posts, tinCua, soNhan });
  const gs = [...cum.values()].filter(Boolean);
  const kq = { lat, dong: items.length, co_ghep: gs.length, nhan_ghep: gs.filter((g) => g.chu_ref).length, trung: gs.filter((g) => g.trung_voi).length, an_moi, an_tay_giu, an_them, ghi: 0 };
  if (giu) kq.giu = true;
  if (thu) return kq;
  for (const it of items) {
    const g = ghep.get(String(it.item_id)) ?? null;
    if (giongNhau(it.ghep ?? null, g)) continue;
    await client.query(`UPDATE eval_label_items SET ghep = $2::jsonb WHERE item_id = $1`, [it.item_id, g ? JSON.stringify(g) : null]);
    kq.ghi++;
  }
  return kq;
}

async function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--lat");
  const lat = i >= 0 ? argv[i + 1] : null;
  if (!lat) throw new Error("label-ghep: thiếu --lat");
  const thu = argv.includes("--thu");
  if (!laDbThu(DATABASE_URL) && !thu && !argv.includes("--db-that")) {
    throw new Error("label-ghep: đích không phải DB thử — khai --db-that nếu chủ ý ghi DB thật");
  }
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const kq = await ghepLat(client, { lat, thu, lamLai: argv.includes("--lam-lai") });
    if (kq.thieu_cot) throw new Error("label-ghep: thiếu cột ghep — áp migration 076 trước");
    console.log(`label-ghep: lát ${kq.lat} · ${kq.dong} dòng · có ghép ${kq.co_ghep} · nhãn ghép ${kq.nhan_ghep} · trùng cụm ${kq.trung} · an_moi ${kq.an_moi} · an_tay_giu ${kq.an_tay_giu} · ghi ${kq.ghi}${thu ? " (--thu)" : ""}${kq.giu ? " · lát đã có ghép: giữ cụm cũ, chỉ thêm dấu trùng; tính lại cụm phải --lam-lai" : ""}`);
    // Khoá chữ chở chữ bài: chỉ in 8 ký tự băm, không in chữ.
    for (const x of kq.an_them) console.log(`an them ${x.item_id} ${x.khoa.startsWith("c:") ? `c:#${createHash("sha256").update(x.khoa).digest("hex").slice(0, 8)}` : x.khoa}`);
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
