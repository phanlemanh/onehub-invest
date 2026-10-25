#!/usr/bin/env node
// Đường đo AU9 `ranh-gioi-khu-vuc-dung` AC-6/AC-7 trên DB local THẬT: «ST_Extent các con của vn-hanoi nằm trong Hà Nội;
// 0 khu vực tên «Tỉnh…» dưới vn-hanoi; metrics tính lại theo ranh giới đúng».
//   --thu   một transaction: chụp trước (phải đỏ) → runReassign + 300_metrics + 400_breakdowns → chụp sau → ROLLBACK.
//           Áp thật chỉ sau chữ ký Cổng Bằng chứng (Hỏi-4: cloud-sync đưa areas lên cloud 15 phút một lần).
//   (mặc định) chỉ đọc trạng thái hiện tại — bằng chứng sau khi áp thật.
// Từ chối DB không phải localhost. Chạy: node scripts/kiem-ranh-gioi-khu-vuc.mjs [--thu]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DUNG_SAI, runReassign } from "../pipeline/reassign-areas.mjs";

// Root repo không có node_modules — mượn pg từ app/ (AGENTS.md bẫy 6).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg");

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const THU = process.argv.includes("--thu");
const TEN_TINH = "^(Tỉnh|Thành phố) ";

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

/** Ảnh chụp trạng thái ranh giới + metrics của hai thị trường tự thu. */
async function chup(c) {
  const one = async (sql, p = []) => (await c.query(sql, p)).rows[0];
  const ext = await one(
    `SELECT ST_XMin(e) x0, ST_YMin(e) y0, ST_XMax(e) x1, ST_YMax(e) y1, n FROM
       (SELECT ST_Extent(geom) e, count(*)::int n FROM areas WHERE parent_id = 'vn-hanoi' AND geom IS NOT NULL) t`,
  );
  const cha = await one(
    `SELECT ST_XMin(geom) x0, ST_YMin(geom) y0, ST_XMax(geom) x1, ST_YMax(geom) y1 FROM areas WHERE id = 'vn-hanoi'`,
  );
  const tenTinh = (
    await c.query(`SELECT id FROM areas WHERE parent_id = 'vn-hanoi' AND name ~ $1 ORDER BY id`, [TEN_TINH])
  ).rows.map((r) => r.id);
  const ngoai = (
    await c.query(
      `SELECT c.id FROM areas c JOIN areas p ON p.id = c.parent_id
       WHERE c.parent_id IN ('vn-hanoi', 'vn-hcmc') AND c.geom IS NOT NULL AND p.geom IS NOT NULL
         AND NOT ST_DWithin(p.geom, ST_PointOnSurface(c.geom), $1) ORDER BY c.id`,
      [DUNG_SAI],
    )
  ).rows.map((r) => r.id);
  const hcmc = Number(
    (await one(`SELECT count(*) n FROM areas WHERE parent_id = 'vn-hcmc' AND meta->>'source' = 'osm-phuong'`)).n,
  );
  const trong =
    ext.n > 0 && cha &&
    ext.x0 >= cha.x0 - DUNG_SAI && ext.y0 >= cha.y0 - DUNG_SAI && ext.x1 <= cha.x1 + DUNG_SAI && ext.y1 <= cha.y1 + DUNG_SAI;
  const box = (b) => `${Number(b.x0).toFixed(2)} ${Number(b.y0).toFixed(2)}, ${Number(b.x1).toFixed(2)} ${Number(b.y1).toFixed(2)}`;
  return { ext, cha, trong, box: `con [${box(ext)}] · cha [${box(cha)}]`, tenTinh, ngoai, hcmc };
}

/** Dòng ở bảng tham chiếu trỏ id không còn trong areas, hoặc trỏ khu vực lạc (trừ khu vực được giữ). */
async function tro(c, lac) {
  const out = {};
  for (const tb of ["listings", "sale_offers", "market_metrics", "area_breakdowns", "market_asset_stats"]) {
    const { rows } = await c.query(
      `SELECT count(*)::int n FROM ${tb} t
       WHERE t.area_id IS NOT NULL AND (NOT EXISTS (SELECT 1 FROM areas a WHERE a.id = t.area_id) OR t.area_id = ANY($1))`,
      [lac],
    );
    out[tb] = rows[0].n;
  }
  return out;
}

/** Số tháng mà dòng cấp market của vn-hanoi lệch tổng các dòng con hiện có. */
async function rollup(c) {
  const { rows } = await c.query(
    `WITH con AS (
       SELECT mm.month, sum(mm.booked_nights) b, sum(mm.revenue) r FROM market_metrics mm
       JOIN areas a ON a.id = mm.area_id AND a.parent_id = 'vn-hanoi' AND a.region_type = 'submarket' GROUP BY 1)
     SELECT count(*)::int thang,
            count(*) FILTER (WHERE m.booked_nights IS DISTINCT FROM con.b OR m.revenue IS DISTINCT FROM con.r)::int lech
     FROM con FULL JOIN (SELECT * FROM market_metrics WHERE area_id = 'vn-hanoi') m USING (month)`,
  );
  return rows[0];
}

function inSau(s, lac, hcmcTruoc) {
  check(s.trong, `extent con vn-hanoi trong bbox vn-hanoi — ${s.box}`);
  check(s.tenTinh.length === 0, `${s.tenTinh.length} con vn-hanoi tên Tỉnh…/Thành phố…${s.tenTinh.length ? ` (${s.tenTinh.join(", ")})` : ""}`);
  check(s.ngoai.length === 0, `${s.ngoai.length} con có tâm ngoài polygon cha (vn-hanoi, vn-hcmc)${s.ngoai.length ? ` (${s.ngoai.join(", ")})` : ""}`);
  if (hcmcTruoc !== undefined) check(s.hcmc === hcmcTruoc, `vn-hcmc số phường trước = sau (${hcmcTruoc} → ${s.hcmc})`);
}

const u = new URL(DB_URL);
if (!["localhost", "127.0.0.1", "::1"].includes(u.hostname)) {
  console.error(`kiem-ranh-gioi: từ chối DB không phải localhost (${u.hostname})`);
  process.exit(2);
}
const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
try {
  if (!THU) {
    const s = await chup(c);
    inSau(s);
    const t = await tro(c, s.ngoai);
    check(Object.values(t).every((n) => n === 0), `0 dòng trỏ khu vực không còn hoặc khu vực lạc (${Object.entries(t).map(([k, n]) => `${k} ${n}`).join(", ")})`);
    const r = await rollup(c);
    check(r.thang > 0 && r.lech === 0, `rollup vn-hanoi bằng tổng con mỗi tháng (${r.thang} tháng, lệch ${r.lech})`);
  } else {
    const soAreas = async () => Number((await c.query(`SELECT count(*) n FROM areas`)).rows[0].n);
    const areasNgoai = await soAreas();
    await c.query("BEGIN");
    try {
      const t = await chup(c);
      console.log("— trước (trạng thái hiện tại của DB local)");
      console.log(`${t.trong ? "ok  " : "đỏ "} extent con vn-hanoi ${t.trong ? "trong" : "vượt"} bbox — ${t.box}`);
      console.log(`${t.tenTinh.length ? "đỏ " : "ok  "} ${t.tenTinh.length} con vn-hanoi tên Tỉnh…/Thành phố…`);
      console.log(`     ${t.ngoai.length} con có tâm ngoài polygon cha · vn-hcmc ${t.hcmc} phường`);
      // Khu vực lạc lấy từ trạng thái TRƯỚC, độc lập với bên ghi: tên tỉnh hoặc tâm ngoài cha
      const lac = [...new Set([...t.tenTinh, ...t.ngoai])];
      console.log(`khu vực lạc (trước): ${lac.length} id`);
      check(!t.trong && t.tenTinh.length > 0 && lac.length > 0, "trạng thái trước đỏ đúng chỗ (đối chứng dương: extent vượt + có con tên tỉnh)");

      const tam = { log() {}, warn() {} };
      const r = await runReassign(c, ["hanoi", "hcmc"], { log: tam });
      for (const f of ["300_metrics.sql", "400_breakdowns.sql"])
        await c.query(readFileSync(path.join(ROOT, "pipeline/sql", f), "utf8"));
      console.log(`— áp thử: gỡ ${r.removed.length} khu vực, giữ ${r.kept.length} (có saved_markets), bỏ ${r.dropped.length} listing ngoài mọi phường`);

      const s = await chup(c);
      console.log("— sau");
      inSau(s, lac, t.hcmc);
      const giu = r.kept.map((k) => k.id);
      const tr = await tro(c, lac.filter((id) => !giu.includes(id)));
      check(Object.values(tr).every((n) => n === 0), `0 dòng trỏ khu vực không còn hoặc khu vực lạc (${Object.entries(tr).map(([k, n]) => `${k} ${n}`).join(", ")})`);
      const ru = await rollup(c);
      check(ru.thang > 0 && ru.lech === 0, `rollup vn-hanoi bằng tổng con mỗi tháng (${ru.thang} tháng, lệch ${ru.lech})`);
    } finally {
      await c.query("ROLLBACK");
    }
    const sau = await soAreas();
    check(sau === areasNgoai, `ROLLBACK — DB local không đổi (areas ${areasNgoai} → ${sau})`);
  }
} finally {
  await c.end();
}
console.log(fails.length === 0 ? "\nkiem-ranh-gioi: PASS" : `\nkiem-ranh-gioi: FAIL (${fails.length})`);
process.exit(fails.length === 0 ? 0 : 1);
