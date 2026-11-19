#!/usr/bin/env node
// GT5 Task 0 (AC-5): ĐÓNG BĂNG danh sách tin S03 đang sống mà hai bản chữ nêu hai phân khu khác nhau — TRƯỚC khi viết mã gom.
// Chỉ đọc DB (phiên đặt default_transaction_read_only). Không chép chữ bài: tệp ghi offer_id, post_id và CỤM TÊN phân khu khớp.
// Luật đếm (viết trước, cố định cho phép đo; không phải luật của bộ gom):
//  - tin: sale_offer_records S03 retired_at IS NULL, có dự án trong offer_project (status mot_du_an).
//  - bản chữ: bài cùng sender_id (rỗng → SĐT đầu tiên trong chữ → chính chữ) và cùng normText(gatSo(text)).
//  - tên phân khu: nút subzone con của dự án của tin; khoá chuẩn = fold(tên) bỏ «the » đầu mỗi vế (gộp cặp trùng chờ DA46,
//    ví dụ «Rainbow» và «The Rainbow»); khớp dài trước, ranh giới từ, cụm đã khớp bị xoá trước khi khớp cụm ngắn hơn.
//  - viết tắt (bảng của phép đo, bảng phủ ca 19/11): ori → origami, rb → rainbow, bs → beverly solari, gh → glory heights.
//  - nhóm «ten»: có hai bản chữ với tập theo tên không rỗng và khác nhau. Nhóm «viet-tat»: không thuộc «ten», nhưng khác nhau khi
//    tính cả viết tắt (cả hai tập không rỗng).
// Dùng: node dong-bang-phan-khu.mjs [--db <url>] --out <tệp.json>
//       node dong-bang-phan-khu.mjs [--db <url>] --kiem <tệp đóng băng.json>   (GS 20/11: không đóng băng lại)
//   --kiem: (1) băm tệp khớp <tệp>.sha256, lệch → thoát 1 «tệp đóng băng bị sửa»; (2) in BĂM NỘI DUNG = sha256 của danh sách
//   offer_id đã sắp + trường luat (không gồm sinh_luc); (3) tính lại danh sách theo cùng luật trên DB hiện tại, in số khớp và mục
//   riêng «đổi vì dữ liệu» (tin mới, tin mất do lượt nạp sau ngày đóng băng) — không tính là sai, thoát 0.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const { default: pg } = await import(join(ROOT, "pipeline/node_modules/pg/lib/index.js")).then((m) => ({ default: m.default ?? m }));
const { normText } = await import(join(ROOT, "pipeline/lib/norm-text.mjs"));
const { gatSo, extractPhones } = await import(join(ROOT, "pipeline/transform-zalo.mjs"));
const { fold } = await import(join(ROOT, "pipeline/lib/mask-source-names.mjs"));

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const DB = arg("--db", process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest");
const OUT = arg("--out");
const KIEM = arg("--kiem");
if (!OUT && !KIEM) { console.error("thiếu --out hoặc --kiem"); process.exit(2); }
/** Băm nội dung: danh sách offer_id đã sắp + luật đếm, không gồm giờ sinh. */
export const bamNoiDung = (o) => createHash("sha256").update(JSON.stringify({ luat: o.luat, offer_id: o.tin.map((t) => t.offer_id).sort() })).digest("hex");
let dongBang = null;
if (KIEM) {
  const raw = readFileSync(KIEM, "utf8");
  const ghi = readFileSync(`${KIEM}.sha256`, "utf8").split(/\s+/)[0];
  if (createHash("sha256").update(raw).digest("hex") !== ghi) { console.log(`ĐỎ: tệp đóng băng bị sửa (băm tệp lệch ${ghi.slice(0, 12)})`); process.exit(1); }
  dongBang = JSON.parse(raw);
  console.log(`tệp đóng băng: ${dongBang.tin.length} tin (tên ${dongBang.dem.ten}, viết tắt ${dongBang.dem["viet-tat"]}) · sinh lúc ${dongBang.sinh_luc} · băm nội dung ${bamNoiDung(dongBang)}`);
}

export const VIET_TAT = Object.freeze({ ori: "origami", rb: "rainbow", bs: "beverly solari", gh: "glory heights" });
export const khoaTen = (ten) => fold(String(ten)).replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter((w, i, a) => !(w === "the")).join(" ");

function khop(chu, mau) { // mau: [{cum, khoa}] sắp dài trước
  let t = ` ${fold(chu).replace(/[^\p{L}\p{N}]+/gu, " ")} `;
  const ra = new Map();
  for (const { cum, khoa } of mau) {
    const re = new RegExp(` ${cum.replace(/ /g, " ")} `, "g");
    if (re.test(t)) { ra.set(khoa, cum); t = t.replace(re, "  "); }
  }
  return ra;
}

const c = new pg.Client({ connectionString: DB });
await c.connect();
await c.query("SET default_transaction_read_only = on");
const sha = execFileSync("git", ["-C", ROOT, "rev-parse", "origin/main"], { encoding: "utf8" }).trim();
const nut = (await c.query(`SELECT p.id::text du_an, n.name, n.aliases FROM asset_nodes n JOIN asset_nodes p ON p.id = n.parent_id
                             WHERE p.node_type = 'project' AND n.node_type = 'subzone'`)).rows;
const tuDien = new Map(); // du_an -> {ten: [{cum,khoa}], tat: [{cum,khoa}]}
for (const r of nut) {
  const d = tuDien.get(r.du_an) ?? { ten: [], tat: [] };
  const k = khoaTen(r.name);
  for (const t of new Set([r.name, ...(r.aliases ?? [])])) {
    const cum = fold(t).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    d.ten.push({ cum, khoa: k });
    const boThe = khoaTen(t); if (boThe !== cum) d.ten.push({ cum: boThe, khoa: k });
  }
  tuDien.set(r.du_an, d);
}
for (const d of tuDien.values()) {
  const coKhoa = new Set(d.ten.map((x) => x.khoa));
  for (const [cum, dich] of Object.entries(VIET_TAT)) for (const k of coKhoa) if (k === dich || k.endsWith(` ${dich}`) && false || k === dich) d.tat.push({ cum, khoa: k });
  d.ten.sort((a, b) => b.cum.length - a.cum.length);
  d.tat = [...d.ten, ...d.tat].sort((a, b) => b.cum.length - a.cum.length);
}
const tin = (await c.query(`SELECT r.offer_id, r.post_ids, op.project_node_id::text du_an FROM sale_offer_records r
                             JOIN offer_project op ON op.offer_id = r.offer_id AND op.status = 'mot_du_an'
                            WHERE r.source = 'S03' AND r.retired_at IS NULL AND cardinality(r.post_ids) > 1`)).rows;
const can = [...new Set(tin.flatMap((t) => t.post_ids))];
const bai = new Map((await c.query(`SELECT DISTINCT ON (post_id) post_id, sender_id, text FROM stg_zalo_posts
                                     WHERE post_id = ANY($1::text[]) ORDER BY post_id, captured_at DESC`, [can])).rows.map((r) => [r.post_id, r]));
await c.end();

const tap = (m) => [...m.keys()].sort().join("|");
const ket = [];
let soTin = 0;
for (const t of tin) {
  const d = tuDien.get(t.du_an);
  if (!d) continue;
  soTin++;
  const banChu = new Map();
  for (const pid of t.post_ids) {
    const b = bai.get(pid); if (!b) continue;
    const chu = gatSo(b.text);
    const nguoi = b.sender_id ? `s:${b.sender_id}` : (extractPhones(b.text)[0] ? `p:${extractPhones(b.text)[0]}` : `t:${pid}`);
    const k = `${nguoi}|${normText(chu)}`;
    if (!banChu.has(k)) banChu.set(k, { bai: [], ten: khop(b.text, d.ten), tat: khop(b.text, d.tat) });
    banChu.get(k).bai.push(pid);
  }
  const ds = [...banChu.values()];
  const khac = (f) => { const s = new Set(ds.map((x) => tap(x[f])).filter(Boolean)); return s.size > 1; };
  const nhom = khac("ten") ? "ten" : khac("tat") ? "viet-tat" : null;
  if (!nhom) continue;
  const f = nhom === "ten" ? "ten" : "tat";
  ket.push({ offer_id: t.offer_id, nhom, bai: ds.filter((x) => x[f].size).flatMap((x) => x.bai.map((post_id) => ({ post_id, khoa: [...x[f].keys()].sort(), chu_phan_khu: [...x[f].values()].sort() }))) });
}
ket.sort((a, b) => a.offer_id.localeCompare(b.offer_id));
const dem = { ten: ket.filter((x) => x.nhom === "ten").length, "viet-tat": ket.filter((x) => x.nhom === "viet-tat").length };
const out = { sinh_luc: new Date().toISOString(), sha_main: sha, luat: "dong-bang-phan-khu.mjs (đầu tệp)", so_tin_xet: soTin, dem, tin: ket };
if (KIEM) {
  const cu = new Set(dongBang.tin.map((t) => t.offer_id)), moi = new Set(ket.map((t) => t.offer_id));
  const khop = [...cu].filter((k) => moi.has(k)).length;
  const mat = [...cu].filter((k) => !moi.has(k)), them = [...moi].filter((k) => !cu.has(k));
  console.log(`tính lại trên DB hiện tại: ${ket.length} tin · khớp ${khop}/${cu.size}`);
  console.log(`đổi vì dữ liệu (không tính là sai): tin mất ${mat.length}${mat.length ? ` (${mat.slice(0, 5).join(", ")})` : ""} · tin mới ${them.length}${them.length ? ` (${them.slice(0, 5).join(", ")})` : ""}`);
  console.log("đạt: tệp đóng băng nguyên vẹn; danh sách chấm vẫn là bản đóng băng");
  process.exit(0);
}
const json = JSON.stringify(out, null, 1) + "\n";
writeFileSync(OUT, json);
writeFileSync(`${OUT}.sha256`, `${createHash("sha256").update(json).digest("hex")}  ${OUT.split("/").pop()}\n`);
console.log(`xét ${soTin} tin nhiều bài có dự án · khác phân khu theo tên ${dem.ten} · theo viết tắt ${dem["viet-tat"]} · tổng ${ket.length} (bảng phủ ca 19/11: 12 + 160)`);
