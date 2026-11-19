#!/usr/bin/env node
// GT5 E5 (AC-5): kiểm từng tin trong danh sách đóng băng (dong-bang/phan-khu.json, băm kiểm trước) trên bản chép DB đã chạy một lượt
// BẬT: bài của tin cũ nêu hai tập phân khu khác nhau phải nằm ở ≥ 2 tin; không tin mới nào chứa hai bài có tập phân khu (theo tệp đóng
// băng) khác nhau, cả hai không rỗng. Bài mà bộ đọc tapPhanKhu (danh bạ hiện tại) trả rỗng dù tệp ghi có cụm phân khu → ĐỎ ghim cụm
// chữ; nhóm viet-tat đếm riêng «danh bạ chưa có bí danh» (Hỏi-1: viết tắt do dãy danh bạ thêm).
//   node gt5-phan-khu.mjs <phan-khu.json>          (DATABASE_URL = DB thử oneinvest_gt5_*)
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = (await import(join(ROOT, "pipeline/node_modules/pg/lib/index.js"))).default;
const { docTuDienPhanKhu, tapPhanKhu } = await import(join(ROOT, "pipeline/lib/gom-tin-phan-khu.mjs"));
const TEP = process.argv[2];
const URL_ = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_gt5_[a-z0-9_]+$/.test(URL_.replace(/\?.*$/, ""))) { console.error("ĐỎ: DATABASE_URL phải là DB thử oneinvest_gt5_*"); process.exit(2); }
const raw = readFileSync(TEP, "utf8");
const ghi = readFileSync(`${TEP}.sha256`, "utf8").split(/\s+/)[0];
const bam = createHash("sha256").update(raw).digest("hex");
if (bam !== ghi) { console.error(`ĐỎ: ${basename(TEP)} đổi sau khi đóng băng (băm ${bam.slice(0, 12)} ≠ ${ghi.slice(0, 12)})`); process.exit(2); }
const db = JSON.parse(raw);
const c = new pg.Client({ connectionString: URL_ });
await c.connect();
const tuDien = await docTuDienPhanKhu(c);
const ids = db.tin.flatMap((t) => t.bai.map((b) => b.post_id));
const tinMoi = new Map((await c.query(`SELECT unnest(post_ids) AS post_id, offer_id FROM sale_offer_records
                                        WHERE source = 'S03' AND retired_at IS NULL AND post_ids && $1::text[]`, [ids])).rows.map((r) => [r.post_id, r.offer_id]));
const chu = new Map((await c.query(`SELECT DISTINCT ON (post_id) post_id, text FROM stg_zalo_posts WHERE post_id = ANY($1::text[])
                                     ORDER BY post_id, captured_at DESC`, [ids])).rows.map((r) => [r.post_id, r.text]));
await c.end();
let dat = 0, do_ = 0;
const doRong = { ten: 0, "viet-tat": 0 };
const cumRong = new Map();
for (const t of db.tin) {
  const theoTin = new Map(); // offer_id mới → tập khoá phân khu (theo tệp) của các bài trong nó
  for (const b of t.bai) {
    const o = tinMoi.get(b.post_id) ?? `(không còn: ${b.post_id})`;
    theoTin.set(o, [...(theoTin.get(o) ?? []), b.khoa.join("+")]);
    if (!tapPhanKhu(chu.get(b.post_id) ?? "", tuDien).length) {
      doRong[t.nhom]++;
      for (const x of b.chu_phan_khu) cumRong.set(x, (cumRong.get(x) ?? 0) + 1);
    }
  }
  const gop = [...theoTin].filter(([, ks]) => new Set(ks).size > 1);
  const soTin = theoTin.size;
  if (soTin >= 2 && !gop.length) { dat++; continue; }
  do_++;
  console.log(`ĐỎ: ${t.offer_id} (${t.nhom}) → ${soTin} tin mới${gop.length ? `, tin ${gop[0][0]} còn chung hai phân khu ${[...new Set(gop[0][1])].join(" / ")}` : ""}`);
}
console.log(`phân khu: ${db.tin.length} tin đóng băng (tên ${db.dem.ten}, viết tắt ${db.dem["viet-tat"]}) · tách đúng ${dat} · đỏ ${do_}`);
console.log(`bộ đọc trả rỗng: nhóm tên ${doRong.ten} bài · nhóm viết tắt ${doRong["viet-tat"]} bài (danh bạ chưa có bí danh: ${[...cumRong].map(([k, n]) => `${k}×${n}`).join(", ") || "không"})`);
const rongTen = doRong.ten > 0;
if (rongTen) console.log("ĐỎ: bộ đọc trả tập phân khu rỗng cho bài nhóm tên danh bạ");
if (doRong["viet-tat"] > 0) console.log("ĐỎ: bộ đọc chưa nhận viết tắt — danh bạ chưa có bí danh (Hỏi-1)");
process.exit(do_ || rongTen || doRong["viet-tat"] ? 1 : 0);
