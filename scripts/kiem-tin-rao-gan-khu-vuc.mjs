#!/usr/bin/env node
// Đường đo `tin-rao-gan-khu-vuc-dung` AC-8 trên DB local THẬT: ba transform tin rao (S03, S05, S06) không gán tin vào
// khu vực không hợp lệ (khu vực lạc, khu vực không phải phường OSM), và không gỡ nhãn tin đang có phường hợp lệ.
//   --thu   một transaction: chèn khu vực lạc mồi dưới vn-hanoi mang tên một phường hợp lệ thật → chụp 0 → chèn hai bài
//           mồi (S03, S05) nhắc phường mồi → lượt A (runTransformZalo + runTransformFb + runTransformChotot) → chụp 1 →
//           đánh dấu lac phường mồi → lượt B → chụp 2 → ROLLBACK. Thước lệch nối theo bài (scripts/lib/doi-phuong.mjs):
//           chụp 0 → 1 phải 0 lệch; chụp 1 → 2 phải đúng hai bài mồi (đối chứng qua cùng hàm, hàng tin-rao-doi-phuong-noi-post-ids).
//   (mặc định) chỉ đọc: in số tin đang trỏ khu vực không hợp lệ theo nguồn.
// Từ chối DB không phải localhost. Chạy: node scripts/kiem-tin-rao-gan-khu-vuc.mjs [--thu]
import { createRequire } from "node:module";
import path from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { phuongHopLe } from "../pipeline/lib/osm.mjs";
import { runTransformChotot } from "../pipeline/transform-chotot.mjs";
import { runTransformFb } from "../pipeline/transform-fb.mjs";
import { runTransformZalo } from "../pipeline/transform-zalo.mjs";
import { chenMoi, danhDauLac, lechTheoBai } from "./lib/doi-phuong.mjs";

// Root repo không có node_modules — mượn pg từ app/ (AGENTS.md bẫy 6).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg");

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const THU = process.argv.includes("--thu");
const NGUON = ["S03", "S05", "S06"];
const MOI_LAC = "vn-hanoi-trg-moi-lac";

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

/** offer_id → { source, area_id, hop_le } cho ba nguồn tin rao; hop_le = area_id là phường hợp lệ (null khi không có phường). */
async function chup(c) {
  const { rows } = await c.query(
    `SELECT o.offer_id, o.source, o.area_id, o.post_ids,
            CASE WHEN o.area_id IS NULL THEN NULL
                 ELSE EXISTS (SELECT 1 FROM areas a WHERE a.id = o.area_id AND a.region_type = 'submarket' AND ${phuongHopLe("a.")})
            END AS hop_le
     FROM sale_offers o WHERE o.source = ANY($1)`,
    [NGUON],
  );
  return new Map(rows.map((r) => [r.offer_id, r]));
}

/** Tin trỏ khu vực không phải phường hợp lệ — gồm tin gắn thẳng vào thị trường thì không tính (area_id là market). */
const khongHopLe = async (c, snap) => {
  const { rows } = await c.query(`SELECT id FROM areas WHERE region_type = 'submarket'`);
  const sub = new Set(rows.map((r) => r.id));
  return [...snap.values()].filter((o) => o.area_id && sub.has(o.area_id) && !o.hop_le);
};

/** Thước cũ (hàng tin-rao-gan-khu-vuc-dung): nối theo offer_id — mù với tin S03/S05 đổi mã. Giữ làm chiều đỏ của test. */
export const lech = (truoc, sau) =>
  [...truoc.values()]
    .filter((o) => o.hop_le && sau.has(o.offer_id) && sau.get(o.offer_id).area_id !== o.area_id)
    .map((o) => o.offer_id);

/** Bài trong khongCon mà vẫn còn ở stg — trong transaction chỉ chạy transform thì đó là nối hỏng. */
const noiHong = async (c, khongCon) => {
  const bai = khongCon.map((k) => k.post_id).filter(Boolean);
  if (!bai.length) return [];
  const { rows } = await c.query(`SELECT DISTINCT post_id FROM stg_zalo_posts WHERE post_id = ANY($1)`, [bai]);
  return rows.map((r) => r.post_id);
};
const chayBa = async (c) => {
  await runTransformZalo(c);
  await runTransformFb(c);
  await runTransformChotot(c);
};

async function main() {
  const u = new URL(DB_URL);
  if (!["localhost", "127.0.0.1", "::1"].includes(u.hostname)) {
    console.error(`kiem-tin-rao-gan: từ chối DB không phải localhost (${u.hostname})`);
    process.exit(2);
  }
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    if (!THU) {
      const bad = await khongHopLe(c, await chup(c));
      for (const s of NGUON) console.log(`${s}: ${bad.filter((o) => o.source === s).length} tin trỏ khu vực không hợp lệ`);
      check(bad.length === 0, `${bad.length} tin trỏ khu vực không hợp lệ (chỉ đọc)`);
      return;
    }
    const soDong = async () => Number((await c.query(`SELECT count(*) n FROM sale_offers`)).rows[0].n);
    const dongNgoai = await soDong();
    await c.query("BEGIN");
    try {
      await c.query("SELECT pg_advisory_xact_lock(33033)");
      // Khu vực lạc mồi mang tên phường hợp lệ được tin S03/S05/S06 gắn nhiều nhất ở Hà Nội — chữ tin thật khớp được nó
      const { rows: [ten] } = await c.query(
        `SELECT a.name FROM sale_offers o JOIN areas a ON a.id = o.area_id
         WHERE a.parent_id = 'vn-hanoi' AND ${phuongHopLe("a.")} AND o.source = ANY($1)
         GROUP BY a.name ORDER BY count(*) DESC, a.name LIMIT 1`,
        [NGUON],
      );
      await c.query(
        `INSERT INTO areas (id, parent_id, region_type, name, country_code, meta)
         VALUES ($1, 'vn-hanoi', 'submarket', $2, 'vn', '{"source":"osm-phuong","lac":true}'::jsonb)`,
        [MOI_LAC, ten.name],
      );
      console.log(`khu vực lạc mồi: ${MOI_LAC} «${ten.name}»`);

      const truoc = await chup(c); // chụp 0
      const sai = await khongHopLe(c, truoc);
      console.log(`trước: ${truoc.size} tin S03/S05/S06 · ${[...truoc.values()].filter((o) => o.hop_le).length} có phường hợp lệ`);
      check(sai.length > 0, `trạng thái trước có ${sai.length} tin trỏ khu vực không hợp lệ (đối chứng dương)`);

      const baiMoi = await chenMoi(c);
      await chayBa(c); // lượt A
      const sau = await chup(c); // chụp 1
      const saiSau = await khongHopLe(c, sau);
      const vaoMoi = [...sau.values()].filter((o) => o.area_id === MOI_LAC);
      console.log("\nsau:");
      check(saiSau.length === 0 && vaoMoi.length === 0,
        `${saiSau.length + vaoMoi.length === 0 ? 0 : `${saiSau.length} + ${vaoMoi.length}`} tin trỏ khu vực không hợp lệ hay khu vực lạc mồi`);
      const a = lechTheoBai(truoc, sau);
      check(a.lech.length === 0,
        `${a.lech.length} tin có phường hợp lệ trước lượt bị gỡ hay đổi khu vực (nối theo bài cho S03/S05, theo offer_id cho S06)` +
          (a.lech.length ? `: ${a.lech.slice(0, 10).map((l) => `${l.loai} ${l.offer_id}${l.post_id ? ` · bài ${l.post_id}` : ""}`).join(", ")}` : ""));

      // Đối chứng qua CÙNG hàm: phường mồi thành khu vực lạc → hai bài mồi phải mất phường ở lượt B, tin thật không lệch
      await danhDauLac(c);
      await chayBa(c); // lượt B
      const sau2 = await chup(c); // chụp 2
      const b = lechTheoBai(sau, sau2);
      const baiLech = b.lech.map((l) => l.post_id);
      const dungMoi = baiLech.length === baiMoi.length && baiMoi.every((p) => baiLech.includes(p)) && b.lech.every((l) => l.loai === "mat-phuong");
      check(dungMoi, `đối chứng qua cùng hàm: ${b.lech.filter((l) => baiMoi.includes(l.post_id)).length} bài mồi mất phường, ${b.lech.filter((l) => !baiMoi.includes(l.post_id)).length} tin thật`);

      const hong = [...(await noiHong(c, a.khongCon)), ...(await noiHong(c, b.khongCon))];
      check(hong.length === 0, `${hong.length} bài «không còn sau lượt» còn trong stg (${hong.length ? `nối hỏng: ${hong.slice(0, 10).join(", ")}` : "không nối hỏng"})`);
      for (const s of NGUON) console.log(`${s}: ${a.khongCon.filter((k) => k.source === s).length} không còn sau lượt`);

      for (const s of NGUON) {
        const ds = sai.filter((o) => o.source === s);
        if (!ds.length) continue;
        const sang = ds.filter((o) => sau.get(o.offer_id)?.hop_le).length;
        const nul = ds.filter((o) => sau.has(o.offer_id) && sau.get(o.offer_id).area_id === null).length;
        // Tin S03/S05 băm cả phường vào offer_id: đổi phường = tin cũ bị đối soát, tin mới từ cùng bài thay chỗ
        const mat = ds.filter((o) => !sau.has(o.offer_id));
        const moi = [...sau.values()].filter((n) => !truoc.has(n.offer_id) && mat.some((o) => (o.post_ids ?? []).some((p) => (n.post_ids ?? []).includes(p))));
        const moiCo = moi.filter((n) => n.hop_le).length;
        console.log(`${s}: ${ds.length} tin trước trỏ khu vực không hợp lệ → ${sang} sang phường hợp lệ, ${nul} thành NULL` +
          (mat.length ? `, ${mat.length} thay bằng ${moi.length} tin mới cùng bài (${moiCo} có phường hợp lệ, ${moi.length - moiCo} không phường)` : ""));
      }
    } finally {
      await c.query("ROLLBACK");
    }
    const sauLuot = await soDong();
    check(sauLuot === dongNgoai, `ROLLBACK — sale_offers ${dongNgoai} → ${sauLuot}`);
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  await main();
  console.log(fails.length === 0 ? "\nkiem-tin-rao-gan: PASS" : `\nkiem-tin-rao-gan: FAIL (${fails.length})`);
  process.exit(fails.length === 0 ? 0 : 1);
}
