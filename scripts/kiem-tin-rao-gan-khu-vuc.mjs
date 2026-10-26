#!/usr/bin/env node
// Đường đo `tin-rao-gan-khu-vuc-dung` AC-8 trên DB local THẬT: ba transform tin rao (S03, S05, S06) không gán tin vào
// khu vực không hợp lệ (khu vực lạc, khu vực không phải phường OSM), và không gỡ nhãn tin đang có phường hợp lệ.
//   --thu   một transaction: chèn khu vực lạc mồi dưới vn-hanoi mang tên một phường hợp lệ thật → chụp trước → chạy
//           runTransformZalo + runTransformFb + runTransformChotot → chụp sau → ROLLBACK.
//   (mặc định) chỉ đọc: in số tin đang trỏ khu vực không hợp lệ theo nguồn.
// Từ chối DB không phải localhost. Chạy: node scripts/kiem-tin-rao-gan-khu-vuc.mjs [--thu]
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { phuongHopLe } from "../pipeline/lib/osm.mjs";
import { runTransformChotot } from "../pipeline/transform-chotot.mjs";
import { runTransformFb } from "../pipeline/transform-fb.mjs";
import { runTransformZalo } from "../pipeline/transform-zalo.mjs";

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

/** Tin có phường hợp lệ trước lượt mà sau lượt còn tồn tại nhưng đổi area_id (NULL hoặc khu vực khác). */
export const lech = (truoc, sau) =>
  [...truoc.values()]
    .filter((o) => o.hop_le && sau.has(o.offer_id) && sau.get(o.offer_id).area_id !== o.area_id)
    .map((o) => o.offer_id);

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
  } else {
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

      const truoc = await chup(c);
      const sai = await khongHopLe(c, truoc);
      console.log(`trước: ${truoc.size} tin S03/S05/S06 · ${[...truoc.values()].filter((o) => o.hop_le).length} có phường hợp lệ`);
      check(sai.length > 0, `trạng thái trước có ${sai.length} tin trỏ khu vực không hợp lệ (đối chứng dương)`);

      await runTransformZalo(c);
      await runTransformFb(c);
      await runTransformChotot(c);

      const sau = await chup(c);
      const saiSau = await khongHopLe(c, sau);
      const vaoMoi = [...sau.values()].filter((o) => o.area_id === MOI_LAC);
      console.log("\nsau:");
      check(saiSau.length === 0 && vaoMoi.length === 0,
        `${saiSau.length + vaoMoi.length === 0 ? 0 : `${saiSau.length} + ${vaoMoi.length}`} tin trỏ khu vực không hợp lệ hay khu vực lạc mồi`);
      const l = lech(truoc, sau);
      check(l.length === 0, `${l.length} tin có phường hợp lệ trước lượt bị gỡ hay đổi khu vực (nối theo offer_id)${l.length ? `: ${l.slice(0, 10).join(", ")}` : ""}`);
      // Đối chứng dương của thước lệch: một tin mồi có phường hợp lệ bị gỡ nhãn → thước phải gọi đúng offer_id
      const mau = [...truoc.values()].find((o) => o.hop_le && sau.has(o.offer_id));
      const sauGo = new Map(sau);
      sauGo.set(mau.offer_id, { ...sau.get(mau.offer_id), area_id: null });
      check(lech(truoc, sauGo).includes(mau.offer_id), `tin mồi bị gỡ nhãn → thước báo đỏ (${mau.offer_id})`);
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
  }
} finally {
  await c.end();
}
console.log(fails.length === 0 ? "\nkiem-tin-rao-gan: PASS" : `\nkiem-tin-rao-gan: FAIL (${fails.length})`);
process.exit(fails.length === 0 ? 0 : 1);
