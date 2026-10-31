// bait-gap.mjs — hồ sơ sdt-luu-goc-e164 (SD3) E6 (AC-6): trên DB thử ĐÃ áp 060 (bait-gap.sh dựng), chạy refresh-bait-gap.mjs
// thật bằng tiến trình con; sellers là view tổng hợp nên mọi câu ghi vào nó đều lỗi — exit 0 chứng không ghi. Bait gap so câu
// tính độc lập từ thước; quét mã refresh-bait-gap.mjs tìm câu ghi nhắm sellers, đối chứng đỏ 'GHI VAO SELLERS'.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg");
const DB_URL = process.env.DB_URL;
assert.match(DB_URL ?? "", /\/oneinvest_p4_sd3_[a-z_]+$/, "chỉ chạy trên DB thử");

/** Câu ghi (INSERT/UPDATE/DELETE/TRUNCATE) nhắm bảng `sellers` trong mã. */
export function quetGhiSellers(ma) {
  const hit = ma.match(/\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM|TRUNCATE(?:\s+TABLE)?)\s+(?:public\.)?sellers\b/gi) ?? [];
  if (hit.length) throw new Error(`GHI VAO SELLERS: ${hit.length} câu`);
  return 0;
}

const ma = readFileSync(path.join(ROOT, "pipeline/refresh-bait-gap.mjs"), "utf8");
quetGhiSellers(ma);
assert.throws(() => quetGhiSellers(ma + "\nawait c.query(`DELETE FROM sellers WHERE true`);\n"), /GHI VAO SELLERS/);
console.log("ok quét mã refresh-bait-gap.mjs: 0 câu ghi nhắm sellers; đối chứng chèn 'DELETE FROM sellers' bắt 'GHI VAO SELLERS'");

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
try {
  const { rows: [rk] } = await c.query(`SELECT relkind FROM pg_class WHERE relname = 'sellers' AND relnamespace = 'public'::regnamespace`);
  assert.equal(rk.relkind, "v", "DB thử chưa áp 060");
  const r = spawnSync(process.execPath, ["pipeline/refresh-bait-gap.mjs"], { cwd: ROOT, encoding: "utf8", env: { ...process.env, DATABASE_URL: DB_URL }, timeout: 600_000 });
  assert.equal(r.status, 0, `refresh-bait-gap thoát ${r.status}: ${r.stderr.slice(-400)}`);
  const loai = Number(/loại tin phi lý: (\d+) tin/.exec(r.stdout)?.[1]);
  assert.ok(Number.isInteger(loai), "không đọc được dòng loại tin phi lý");
  console.log(`ok refresh-bait-gap.mjs thật thoát 0 trên view (${/sellers \(view\): \d+/.exec(r.stdout)?.[0]})`);
  const { rows: [g] } = await c.query(`
    WITH d AS (SELECT o.offer_id, o.bait_gap_pct gap,
                      round((1 - o.price_perm2::numeric / r.m::numeric) * 100, 1) doc_lap
               FROM sale_offers o JOIN v_ruler_p2_area r ON r.area_id = o.area_id
               WHERE o.price_tier = 'P1' AND o.kind = 'sale' AND o.price_perm2 > 0)
    SELECT count(*) FILTER (WHERE gap IS NOT NULL)::int co, count(*)::int doc_lap,
           count(*) FILTER (WHERE gap IS NOT NULL AND gap <> doc_lap)::int lech,
           (SELECT count(*) FROM sale_offers WHERE bait_gap_pct IS NOT NULL)::int tong FROM d`);
  assert.equal(g.lech, 0, `${g.lech} tin bait gap lệch câu độc lập`);
  assert.equal(g.co, g.tong, "có bait gap ngoài tập P1 bán có thước");
  assert.equal(g.co + loai, g.doc_lap, `bait gap ${g.co} + loại phi lý ${loai} ≠ ${g.doc_lap} tin có thước`);
  console.log(`ok bait gap: ${g.co} tin trùng câu độc lập, ${loai} tin loại phi lý, tổng = ${g.doc_lap} tin P1 có thước`);
  console.log("BAIT GAP OK");
} finally {
  await c.end();
}
