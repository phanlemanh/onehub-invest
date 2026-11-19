#!/usr/bin/env node
// GT5 Task 7a (AC-9): rút MẪU GIỮ RIÊNG cho thước gộp nhầm — chỉ đọc DB, ghi ra thư mục research-local (gitignored).
// Đơn vị: tin S03 đang sống có ≥ 2 bản chữ (bài cùng người đăng, cùng normText(gatSo(chữ))) và có bài đăng từ 12/11; loại tin của
// 120 nhãn audit 09–10/11. Chọn tất định theo seed. Payload gửi model: chữ đã gatSo (gạt SĐT, URL) rồi CHE TÊN NGUỒN bằng
// maskSourceNames (danh sách tên từ source_registry local — rỗng thì dừng), cắt 600 ký tự, tối đa 6 bản chữ mỗi tin; KHÔNG offer_id,
// post_id, người đăng. Quét lại toàn payload bằng findSourceNames: phải 0, không thì thoát 1 ghim mã bản chữ.
// Hỏi-2 (Mạnh duyệt 20/11): Opus, Sonnet, tối đa 3 USD; không gọi model ở lệnh này.
// Dùng: node mau-giu-rieng.mjs --audit <thư mục audit> --out <thư mục ra> [--so 75] [--seed gt5-giu-rieng-2011] [--loai-map <map.json>…]
//   --loai-map (lặp được): loại mọi tin đã dùng ở mẫu trước (offer_id trong map.json) — mẫu hai tách rời mẫu một (GS phán 20/11).
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = (await import(join(ROOT, "pipeline/node_modules/pg/lib/index.js"))).default;
const { normText } = await import(join(ROOT, "pipeline/lib/norm-text.mjs"));
const { gatSo, extractPhones } = await import(join(ROOT, "pipeline/transform-zalo.mjs"));
const { maskSourceNames, findSourceNames } = await import(join(ROOT, "pipeline/lib/mask-source-names.mjs"));

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const AUDIT = arg("--audit"), OUT = arg("--out"), SO = Number(arg("--so", "75")), SEED = arg("--seed", "gt5-giu-rieng-2011");
const TU = "2026-11-12", CAT = 600, TOI_DA_BAN = 6;
if (!AUDIT || !OUT || !existsSync(AUDIT)) { console.error("thiếu --audit (thư mục audit) hoặc --out"); process.exit(2); }

const cot = (tep, ten) => { const [h, ...d] = readFileSync(join(AUDIT, tep), "utf8").trim().split("\n"); const i = h.split(",").indexOf(ten);
  return d.map((l) => l.split(",")[i]); };
const loai = new Set([...cot("sample_gop.csv", "offer_id"), ...cot("sample_tach.csv", "a"), ...cot("sample_tach.csv", "b"), ...cot("mau-gom-meta.csv", "offer")]);
const loaiMap = process.argv.flatMap((x, i) => (process.argv[i - 1] === "--loai-map" ? [x] : []));
for (const m of loaiMap) for (const r of JSON.parse(readFileSync(m, "utf8"))) loai.add(r.offer_id);
if (loaiMap.length) console.log(`loại thêm tin của ${loaiMap.length} mẫu trước: tổng loại ${loai.size} offer_id`);

const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await c.connect();
await c.query("SET default_transaction_read_only = on");
const ten = (await c.query(`SELECT code, real_name FROM source_registry WHERE real_name IS NOT NULL AND real_name <> ''`)).rows
  .map((r) => ({ code: r.code, realName: r.real_name }));
if (!ten.length) { console.error("ĐỎ: source_registry không có tên nguồn — không che được, dừng (đóng chặt)"); process.exit(2); }
const tin = (await c.query(`SELECT offer_id, post_ids FROM sale_offer_records WHERE source = 'S03' AND retired_at IS NULL AND cardinality(post_ids) > 1`)).rows
  .filter((t) => !loai.has(t.offer_id));
const ids = [...new Set(tin.flatMap((t) => t.post_ids))];
const bai = new Map((await c.query(`SELECT DISTINCT ON (post_id) post_id, sender_id, text, posted_at FROM stg_zalo_posts
                                     WHERE post_id = ANY($1::text[]) ORDER BY post_id, captured_at DESC`, [ids])).rows.map((r) => [r.post_id, r]));
await c.end();

const ungVien = [];
for (const t of tin) {
  const ban = new Map();
  let moi = false;
  for (const pid of t.post_ids) {
    const b = bai.get(pid); if (!b) continue;
    if (new Date(b.posted_at) >= new Date(`${TU}T00:00:00Z`)) moi = true;
    const chu = gatSo(b.text);
    const nguoi = b.sender_id ? `s:${b.sender_id}` : extractPhones(b.text)[0] ? `p:${extractPhones(b.text)[0]}` : `t:${pid}`;
    const k = `${nguoi}|${normText(chu)}`;
    if (!ban.has(k)) ban.set(k, { chu, post_ids: [], dau: b.posted_at });
    ban.get(k).post_ids.push(pid);
  }
  if (moi && ban.size >= 2) ungVien.push({ offer_id: t.offer_id, ban: [...ban.values()].sort((a, b) => new Date(a.dau) - new Date(b.dau)) });
}
const bam = (s) => createHash("sha256").update(`${SEED}|${s}`).digest("hex");
const chon = ungVien.sort((a, b) => bam(a.offer_id).localeCompare(bam(b.offer_id))).slice(0, SO);

const payload = [], map = [];
let soBan = 0, soKyTu = 0;
chon.forEach((t, i) => {
  const ma = `T${String(i + 1).padStart(2, "0")}`;
  const ds = t.ban.slice(0, TOI_DA_BAN).map((b, j) => {
    const id = `${ma}-${"abcdef"[j]}`;
    const chu = maskSourceNames(b.chu, ten).replace(/\s+/g, " ").trim().slice(0, CAT);
    map.push({ id, offer_id: t.offer_id, post_ids: b.post_ids });
    soBan++; soKyTu += chu.length;
    return { id, chu };
  });
  payload.push({ tin: ma, ban_chu: ds, so_ban_chu_that: t.ban.length });
});
const lo = payload.flatMap((t) => t.ban_chu.filter((b) => findSourceNames(b.chu, ten).length).map((b) => b.id));
if (lo.length) { console.error(`ĐỎ: còn tên nguồn trong payload: ${lo.join(", ")}`); process.exit(1); }
const jp = JSON.stringify(payload, null, 1) + "\n";
writeFileSync(join(OUT, "payload.json"), jp);
writeFileSync(join(OUT, "map.json"), JSON.stringify(map, null, 1) + "\n");
const h = createHash("sha256").update(jp).digest("hex");
writeFileSync(join(OUT, "payload.sha256"), `${h}  payload.json\n`);
console.log(`ứng viên ${ungVien.length} tin · chọn ${payload.length} tin · ${soBan} bản chữ · ${soKyTu} ký tự · quét tên nguồn: 0 · sha256 ${h}`);
