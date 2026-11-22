#!/usr/bin/env node
// bi-danh-viet-tat-phan-khu S1 — bảng phủ ca (CHỈ ĐỌC, phiên default_transaction_read_only). Không chép chữ bài: chỉ in số.
// Tập: tin S03 đang sống (sale_offer_records retired_at IS NULL) có một dự án (offer_project status mot_du_an), chữ = mọi bài của tin
// (stg_zalo_posts, bản mới nhất mỗi post_id). Tên phân khu theo cùng luật GT5 (gom-tin-phan-khu.mjs trên feat/khoa-gom-hai-tang):
// nút subzone con trực tiếp của dự án, tên + aliases, gập dấu, bỏ «the», khớp dài trước theo ranh giới từ, cụm đã khớp bị xoá.
// Bốn kịch bản: hôm nay · sau DA46 (mô phỏng bảy cặp nối của thẻ 25e150a5…, nút mới thành con của nút giữ lại, bí danh dồn về
// nút giữ lại) · mỗi kịch bản cộng bí danh viết tắt trên nút đích dự kiến.
// Dùng: node bang-phu-ca.mjs [--db <url>]
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const { default: pg } = await import(join(ROOT, "pipeline/node_modules/pg/lib/index.js")).then((m) => ({ default: m.default ?? m }));
const { fold } = await import(join(ROOT, "pipeline/lib/mask-source-names.mjs"));

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const DB = arg("--db", process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest");
// Bảng của GT5 (probes/dong-bang-phan-khu.mjs, bảng phủ ca 19/11): tên tắt → tên phân khu đã gập, bỏ «the».
const VIET_TAT = { ori: "origami", rb: "rainbow", bs: "beverly solari", gh: "glory heights" };
// Nút đích dự kiến (thiết kế §2): nút chưa nghỉ cả trước lẫn sau DA46; hai nút cùng tên thì lấy nút không do luật S16 đúc.
const DICH = { ori: 44, rb: 48, bs: 387, gh: 43 };
// Thẻ nối DA46 (_acceptance/noi-phan-khu-trung-s16/the-noi.md): nút mới → nút giữ lại.
const NOI_DA46 = { 382: 23, 388: 43, 391: 40, 392: 42, 394: 41, 395: 33, 397: 27 };

const gon = (s) => fold(String(s ?? "").normalize("NFC")).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const khoaTen = (t) => gon(t).split(" ").filter((w) => w && w !== "the").join(" ");
const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function tap(text, tuDien) {
  let t = ` ${gon(text)} `;
  const ra = new Set();
  for (const { cum, khoa } of tuDien) {
    if (!new RegExp(` ${thoat(cum)} `).test(t)) continue;
    ra.add(khoa);
    t = t.replace(new RegExp(` ${thoat(cum)}(?= )`, "g"), " ");
  }
  return ra;
}

const c = new pg.Client({ connectionString: DB });
await c.connect();
await c.query("SET default_transaction_read_only = on");
const tatCa = (await c.query(`SELECT n.id::int id, n.parent_id::int parent_id, n.node_type, n.name, n.aliases,
                                     coalesce((n.meta->>'nghi')::boolean, false) nghi, p.node_type ptype, p.name pten
                                FROM asset_nodes n LEFT JOIN asset_nodes p ON p.id = n.parent_id`)).rows;
const tin = (await c.query(`SELECT r.offer_id, r.post_ids, op.project_node_id::int du_an FROM sale_offer_records r
                              JOIN offer_project op ON op.offer_id = r.offer_id AND op.status = 'mot_du_an'
                             WHERE r.source = 'S03' AND r.retired_at IS NULL AND cardinality(r.post_ids) > 0`)).rows;
const can = [...new Set(tin.flatMap((t) => t.post_ids))];
const chu = new Map((await c.query(`SELECT DISTINCT ON (post_id) post_id, text FROM stg_zalo_posts
                                     WHERE post_id = ANY($1::text[]) ORDER BY post_id, captured_at DESC`, [can])).rows.map((r) => [r.post_id, r.text ?? ""]));
await c.end();
const theoId = new Map(tatCa.map((n) => [n.id, n]));

/** Nút subzone con trực tiếp của dự án sau khi áp (tuỳ chọn) DA46 và bí danh viết tắt. */
function nutPhanKhu({ da46, biDanh }) {
  const nut = tatCa.map((n) => ({ ...n, aliases: [...(n.aliases ?? [])] }));
  const m = new Map(nut.map((n) => [n.id, n]));
  if (da46) for (const [moi, cu] of Object.entries(NOI_DA46)) {
    const a = m.get(Number(moi)), b = m.get(cu);
    b.aliases.push(...a.aliases.filter((x) => !b.aliases.includes(x)));
    a.parent_id = cu; a.nghi = true;
  }
  if (biDanh) for (const [vt, id] of Object.entries(DICH)) m.get(id).aliases.push(vt);
  return nut.filter((n) => n.node_type === "subzone" && theoId.get(n.parent_id)?.node_type === "project");
}
function tuDien(nut) {
  const theoDuAn = new Map();
  for (const r of nut) {
    const d = theoDuAn.get(r.parent_id) ?? new Map();
    const k = khoaTen(r.name);
    for (const t of [r.name, ...r.aliases]) for (const cum of new Set([gon(t), khoaTen(t)])) if (cum.length >= 2 && !d.has(cum)) d.set(cum, k);
    theoDuAn.set(r.parent_id, d);
  }
  return new Map([...theoDuAn].map(([d, m]) => [d, [...m].map(([cum, khoa]) => ({ cum, khoa })).sort((a, b) => b.cum.length - a.cum.length)]));
}

const chuTin = tin.map((t) => ({ ...t, text: t.post_ids.map((p) => chu.get(p) ?? "").join("\n") }));
function dem(td) {
  let coTuDien = 0, coPhanKhu = 0;
  const ra = new Map();
  for (const t of chuTin) {
    const d = td.get(t.du_an);
    if (!d) continue;
    coTuDien++;
    const s = tap(t.text, d);
    if (s.size) coPhanKhu++;
    ra.set(t.offer_id, s);
  }
  return { coTuDien, coPhanKhu, ra };
}

console.log(`## Tập: ${tin.length} tin S03 đang sống, một dự án`);
console.log("\n## Tên tắt × nút phân khu (khoá tên đã gập bỏ «the»; * = nút đích dự kiến)");
for (const [vt, dich] of Object.entries(VIET_TAT)) {
  const ds = tatCa.filter((n) => n.node_type === "subzone" && khoaTen(n.name) === dich);
  console.log(`${vt} → «${dich}»: ${ds.map((n) => `${DICH[vt] === n.id ? "*" : ""}${n.id} ${n.name} @${n.pten}${n.nghi ? " (nghỉ)" : ""}${NOI_DA46[n.id] ? ` (DA46: nghỉ, về ${NOI_DA46[n.id]})` : ""}`).join("; ") || "KHÔNG có nút"}`);
}
const reTat = Object.fromEntries(Object.keys(VIET_TAT).map((k) => [k, new RegExp(` ${k} `)]));
console.log("\n## Theo tên tắt: tin chứa token (ranh giới từ) · trong đó thuộc dự án có nút đích");
for (const k of Object.keys(VIET_TAT)) {
  const co = chuTin.filter((t) => reTat[k].test(` ${gon(t.text)} `));
  console.log(`${k}: ${co.length} · ${co.filter((t) => t.du_an === theoId.get(DICH[k]).parent_id).length}`);
}

console.log("\n## Số tin GT5 đọc được ít nhất một phân khu (tin thuộc dự án có từ điển · tin có phân khu)");
const kq = {};
for (const [ten, o] of [["hom-nay", { da46: false, biDanh: false }], ["hom-nay+bi-danh", { da46: false, biDanh: true }],
                        ["sau-da46", { da46: true, biDanh: false }], ["sau-da46+bi-danh", { da46: true, biDanh: true }]]) {
  kq[ten] = dem(tuDien(nutPhanKhu(o)));
  console.log(`${ten}: ${kq[ten].coTuDien} · ${kq[ten].coPhanKhu}`);
}
for (const goc of ["hom-nay", "sau-da46"]) {
  const a = kq[goc].ra, b = kq[`${goc}+bi-danh`].ra;
  let them = 0, doi = 0, mat = 0;
  for (const [id, s] of b) {
    const t = a.get(id) ?? new Set();
    if (!t.size && s.size) them++;
    else if (t.size && [...t].some((x) => !s.has(x))) mat++;
    else if (t.size && s.size > t.size) doi++;
  }
  console.log(`${goc} → +bí danh: tin mới có phân khu ${them} · tin thêm phân khu thứ hai ${doi} · tin mất phân khu cũ ${mat}`);
}
