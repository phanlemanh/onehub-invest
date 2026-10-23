#!/usr/bin/env node
// Smoke HTTP /listing/[id] (Invest, công khai) theo AGENTS.md luật 5 — cần app đang chạy
// + DB local. Chọn mẫu từ DB rồi đọc HTML thật:
//   - listing có ảnh tự thu VÀ có ảnh AirDNA: chỉ hiện ảnh tự thu, không ảnh nào của AirDNA;
//   - listing chưa có ảnh tự thu: không có ảnh nào (trạng thái trống), ưu tiên căn có ảnh AirDNA
//     — đúng ca cũ mượn ảnh AirDNA; DB không có ca đó thì báo rõ và dùng căn không ảnh bất kỳ.
//   - cả hai trang: không có chữ "AirDNA"; còn nút "Mở trên Airbnb" dựng từ id (không từ AirDNA).
// Dùng: BASE_URL=http://localhost:3456 node scripts/smoke-listing-no-airdna.mjs  (exit 0 = đạt)
import { createRequire } from "node:module";

// Root repo không có node_modules — mượn pg từ app/.
const require = createRequire(new URL("../app/package.json", import.meta.url));
const pg = require("pg");

const base = process.env.BASE_URL ?? "http://localhost:3456";
const url = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const pool = new pg.Pool({ connectionString: url });

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};
// Đường dẫn ảnh CDN không scheme/query — so khớp giữa DB và src trong HTML.
const norm = (u) => String(u).replace(/^https?:\/\//, "").split("?")[0];
const noPhoto = "(l.photo_urls IS NULL OR jsonb_array_length(l.photo_urls) = 0)";
const hasAirdnaPhoto = "a.photo_urls IS NOT NULL AND jsonb_array_length(a.photo_urls) > 0";

// Link Airbnb gốc dựng từ id abnb_<số> (airbnbUrlOf), không cần bảng AirDNA.
const airbnbLink = (id, html) => html.includes(`href="https://www.airbnb.com/rooms/${id.replace(/^abnb_/, "")}"`);

async function page(id) {
  const res = await fetch(`${base}/listing/${encodeURIComponent(id)}`);
  return { status: res.status, html: await res.text() };
}

try {
  // 1. Căn có cả ảnh tự thu lẫn ảnh AirDNA: ảnh hiện ra phải là của tự thu.
  const { rows: both } = await pool.query(
    `SELECT l.id, l.photo_urls AS self, a.photo_urls AS airdna
       FROM listings l JOIN airdna_listings a ON a.id = l.id
      WHERE NOT ${noPhoto} AND ${hasAirdnaPhoto}`,
  );
  check(both.length > 0, `DB có listing mang cả ảnh tự thu lẫn ảnh AirDNA (${both.length})`);
  // Chọn căn có nhiều ảnh AirDNA KHÁC bộ tự thu nhất — bộ trùng nhau thì phép thử vô nghĩa.
  const pick = both
    .map(({ id, self, airdna }) => {
      const selfSet = new Set(self.map(norm));
      return { id, selfSet, airdnaOnly: airdna.map(norm).filter((u) => !selfSet.has(u)) };
    })
    .sort((a, b) => b.airdnaOnly.length - a.airdnaOnly.length || a.id.localeCompare(b.id))[0];
  if (pick) {
    const { id, selfSet, airdnaOnly } = pick;
    check(airdnaOnly.length > 0, `${id}: có ${airdnaOnly.length} ảnh AirDNA khác bộ tự thu (mẫu phân biệt được)`);
    const { status, html } = await page(id);
    const srcs = [...html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)].map((m) => norm(m[1].replace(/&amp;/g, "&")));
    const shown = srcs.filter((s) => selfSet.has(s) || airdnaOnly.includes(s));
    check(status === 200, `${id}: trả 200 (${status})`);
    check(shown.length > 0 && shown.every((s) => selfSet.has(s)), `${id}: hiện ${shown.length} ảnh, tất cả từ tự thu`);
    check(!srcs.some((s) => airdnaOnly.includes(s)), `${id}: 0 ảnh chỉ AirDNA có`);
    check(!/airdna/i.test(html), `${id}: HTML không có chữ AirDNA`);
    check(airbnbLink(id, html), `${id}: còn link Mở trên Airbnb dựng từ id`);
  }

  // 2. Căn chưa có ảnh tự thu: không ảnh nào, không chữ AirDNA.
  const { rows: fb } = await pool.query(
    `SELECT l.id FROM listings l JOIN airdna_listings a ON a.id = l.id
      WHERE ${noPhoto} AND ${hasAirdnaPhoto} ORDER BY l.id LIMIT 1`,
  );
  let target = fb[0]?.id;
  if (target) {
    console.log(`info ca cũ mượn ảnh AirDNA có trong DB: ${target}`);
  } else {
    const { rows } = await pool.query(`SELECT l.id FROM listings l WHERE ${noPhoto} ORDER BY l.id LIMIT 1`);
    target = rows[0]?.id;
    console.log("info DB không có listing chỉ có ảnh AirDNA — dùng listing không ảnh bất kỳ");
  }
  check(Boolean(target), "DB có listing chưa có ảnh tự thu");
  if (target) {
    const { status, html } = await page(target);
    check(status === 200, `${target}: trả 200 (${status})`);
    check(!/Ảnh chính/.test(html) && !/muscache\.com/.test(html), `${target}: không có ảnh (trạng thái trống)`);
    check(!/airdna/i.test(html), `${target}: HTML không có chữ AirDNA`);
    check(airbnbLink(target, html), `${target}: còn link Mở trên Airbnb dựng từ id`);
  }
} finally {
  await pool.end();
}

console.log(fails.length === 0 ? "\nlisting-smoke: ĐẠT" : `\nlisting-smoke: ${fails.length} vi phạm`);
process.exit(fails.length === 0 ? 0 : 1);
