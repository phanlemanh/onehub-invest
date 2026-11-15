// context-resolver-ung-vien.test.ts — hồ sơ _acceptance/ma-du-an-s06-thanh-nut (DA32) E11, ca MS6-AC-10b: bộ phân giải ngữ
// cảnh (tên nhóm → dự án) bỏ nút ứng viên do thẻ luật S06 đúc (catalog_tier mot_loi_khai), vẫn khớp nút xac_minh.
// Chạy trên DB của riêng lượt (db/db-thu.sh oneinvest_suite_* --chay): test tự áp migration 100 (DB thử của suite chưa có nó),
// chèn hai nút tên riêng, xoá ở after. loadNodes mở client riêng nên phải commit thật — DB ấy xoá khi lệnh dừng.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

import { resolveContext, resetContextCache } from "../src/agents/context-resolver.js";

const DB_URL = process.env.DATABASE_URL ?? "";
const CHAY = /\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL);
const MIG = readFileSync(join(import.meta.dirname, "..", "..", "db/migrations/100_ma_du_an_s06_nut.sql"), "utf8");
const TEN_UNG_VIEN = "Khu Thử Ứng Viên Ms6";
const TEN_XAC_MINH = "Khu Thử Xác Minh Ms6";
let c: pg.Client;
const ids: number[] = [];

before(async () => {
  if (!CHAY) return;
  c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  await c.query(MIG);
  for (const [ten, hang] of [[TEN_UNG_VIEN, "mot_loi_khai"], [TEN_XAC_MINH, "xac_minh"]]) {
    const r = await c.query(
      `INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, catalog_tier, meta)
       VALUES ('project', $1, $2, ARRAY[lower($1)], ARRAY['vn-hcmc-long-binh'], $3, '{"nguon":"ms6-test"}') RETURNING id`,
      [ten, `ms6-test-${hang}`, hang]);
    ids.push(Number(r.rows[0].id));
  }
  resetContextCache();
});

after(async () => {
  if (!CHAY) return;
  if (ids.length) await c.query("DELETE FROM asset_nodes WHERE id = ANY($1)", [ids]);
  resetContextCache();
  await c.end();
});

test("MS6-AC-10b context-resolver bỏ nút mot_loi_khai, vẫn khớp nút xac_minh", { skip: !CHAY && "cần DB của riêng lượt" }, async () => {
  const ungVien = await resolveContext(`Hội mua bán ${TEN_UNG_VIEN}`, "căn hộ 2PN");
  assert.notEqual(ungVien.projectSlug, "ms6-test-mot_loi_khai", "loc-ung-vien-agent: tên nhóm gán vào nút ứng viên");
  assert.ok(!ungVien.projectCandidates.includes("ms6-test-mot_loi_khai"), "loc-ung-vien-agent: nút ứng viên trong danh sách ứng viên");

  const xacMinh = await resolveContext(`Hội mua bán ${TEN_XAC_MINH}`, "căn hộ 2PN");
  assert.equal(xacMinh.projectSlug, "ms6-test-xac_minh", "MS6-AC-10b: nút xac_minh không còn khớp (đối chứng dương)");
});

test("MS6-AC-10b đối chứng đỏ: câu đọc bỏ điều kiện catalog_tier thì thấy nút ứng viên", { skip: !CHAY && "cần DB của riêng lượt" }, async () => {
  const pha = await c.query(`SELECT n.slug FROM asset_nodes n WHERE n.name = $1`, [TEN_UNG_VIEN]);
  const that = await c.query(
    `SELECT n.slug FROM asset_nodes n WHERE n.name = $1 AND (to_jsonb(n) ->> 'catalog_tier') IS DISTINCT FROM 'mot_loi_khai'`,
    [TEN_UNG_VIEN]);
  assert.equal(pha.rowCount, 1, "loc-ung-vien-agent: bản bỏ điều kiện không thấy nút ứng viên — ca không phân biệt được");
  assert.equal(that.rowCount, 0, "loc-ung-vien-agent: câu lọc thật vẫn thấy nút ứng viên");
  const src = readFileSync(join(import.meta.dirname, "..", "src/agents/context-resolver.ts"), "utf8");
  assert.match(src, /\(to_jsonb\(n\) ->> 'catalog_tier'\) IS DISTINCT FROM 'mot_loi_khai'/,
    "loc-ung-vien-agent: loadNodes không mang điều kiện lọc");
});

test("MS6-AC-10b câu lọc chạy được trên bảng chưa có cột catalog_tier", { skip: !CHAY && "cần DB của riêng lượt" }, async () => {
  await c.query("BEGIN");
  try {
    await c.query("CREATE TEMP TABLE asset_nodes_cu AS SELECT id, name FROM asset_nodes LIMIT 3");
    const r = await c.query(`SELECT n.id FROM asset_nodes_cu n WHERE (to_jsonb(n) ->> 'catalog_tier') IS DISTINCT FROM 'mot_loi_khai'`);
    assert.equal(r.rowCount, 3, "MS6-AC-10b: bảng chưa có cột thì câu lọc phải trả mọi nút");
  } finally {
    await c.query("ROLLBACK");
  }
});
