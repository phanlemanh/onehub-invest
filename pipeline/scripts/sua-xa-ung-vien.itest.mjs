// sua-xa-ung-vien.itest.mjs — hồ sơ _acceptance/sua-xa-bo-nut-ung-vien (Ngoài-1 của DA32): lệnh --sua-xa (suaXaNut) bỏ qua
// nút dự án ứng viên do thẻ luật S06 đúc (catalog_tier mot_loi_khai). Chỉ chạy trên DB của riêng lượt chép máy thu
// (db/db-thu.sh oneinvest_suite_sxu --chay); DB ấy xoá khi lệnh dừng. Tự áp 100 (idempotent) vì DB thử có thể chép từ máy thu
// chưa áp. Chiều đỏ: bản sao danh-ba-vat-the.mjs bỏ điều kiện lọc, chép ra tệp tạm, import tuyệt đối.
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test, before, after } from "node:test";

import pg from "pg";

import { suaXaNut, SQL_NUT_SUA_XA } from "../danh-ba-vat-the.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("sua-xa-ung-vien.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}
const PIPE = join(import.meta.dirname, "..");
const GOC = join(PIPE, "..");
const MIG = readFileSync(join(GOC, "db/migrations/100_ma_du_an_s06_nut.sql"), "utf8");
const DIEU_KIEN = "AND (to_jsonb(n) ->> 'catalog_tier') IS DISTINCT FROM 'mot_loi_khai'";

const TAM = mkdtempSync(join(tmpdir(), "sxu-"));
let c;
before(async () => {
  c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  await c.query(MIG);
});
after(async () => {
  await c?.end();
  rmSync(TAM, { recursive: true, force: true });
});

/** Bản sao lệnh bỏ điều kiện lọc catalog_tier (import trỏ tuyệt đối, tệp ngoài cây). */
async function suaXaKhongLoc() {
  const src = readFileSync(join(PIPE, "danh-ba-vat-the.mjs"), "utf8");
  assert.ok(src.includes(DIEU_KIEN), "loc-ung-vien-sua-xa: lệnh không còn mang điều kiện lọc — chiều đỏ mất nghĩa");
  const pha = src.replace(DIEU_KIEN, "")
    .replace(/from "\.\/lib\/([a-z0-9-]+\.mjs)"/g, (_, f) => `from "${pathToFileURL(join(PIPE, "lib", f)).href}"`)
    .replace(/from "pg"/, `from "${import.meta.resolve("pg")}"`)
    .replaceAll("import.meta.dirname", JSON.stringify(PIPE));
  const tep = join(TAM, `pha-${Date.now()}.mjs`);
  writeFileSync(tep, pha);
  return (await import(pathToFileURL(tep).href)).suaXaNut;
}

const anhXa = async () => Object.fromEntries((await c.query(
  "SELECT slug, area_ids FROM asset_nodes WHERE node_type = 'project' ORDER BY slug")).rows.map((r) => [r.slug, r.area_ids]));
const bamXa = async () => (await c.query(
  "SELECT md5(string_agg(id || ':' || area_ids::text, ',' ORDER BY id)) h FROM asset_nodes")).rows[0].h;
const im = { log: () => {} };

async function themNut(slug, hang) {
  await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, catalog_tier, meta)
                 VALUES ('project', $1, $1, ARRAY[$1], ARRAY['vn-hcmc-an-khanh'], $2, '{"nguon":"sxu-test"}')`, [slug, hang]);
}
const xoaNut = (slug) => c.query("DELETE FROM asset_nodes WHERE slug = $1", [slug]);

test("SXU-AC-1 --sua-xa chạy khi có nút ứng viên, sửa nút xác minh bị lệch, không đụng nút ứng viên", { timeout: 600_000 }, async () => {
  await suaXaNut(c, im); // lần đầu: đưa mọi nút xác minh về đúng tệp xã (mốc so)
  const moc = await anhXa();
  assert.ok(moc["vinhomes-grand-park"], "SXU-AC-1: DB thử thiếu nút vinhomes-grand-park");
  await themNut("sxu-ung-vien", "mot_loi_khai");
  try {
    await c.query("UPDATE asset_nodes SET area_ids = ARRAY['vn-hcmc-an-khanh'] WHERE slug = 'vinhomes-grand-park'");
    assert.notDeepEqual((await anhXa())["vinhomes-grand-park"], moc["vinhomes-grand-park"], "SXU-AC-1: ghi lệch không ăn");
    await suaXaNut(c, im);
    const sau = await anhXa();
    assert.deepEqual(sau["vinhomes-grand-park"], moc["vinhomes-grand-park"], "SXU-AC-1: nút xác minh bị lệch không được sửa về tệp xã");
    assert.deepEqual(sau["sxu-ung-vien"], ["vn-hcmc-an-khanh"], "SXU-AC-1: lệnh đổi xã của nút ứng viên");
    for (const [slug, xa] of Object.entries(moc)) assert.deepEqual(sau[slug], xa, `SXU-AC-1: nút ${slug} lệch tệp xã`);
    // Đối chứng đỏ: bỏ điều kiện lọc → lỗi gọi tên nút ứng viên, không ghi gì.
    const truoc = await bamXa();
    const pha = await suaXaKhongLoc();
    await assert.rejects(pha(c, im), /sxu-ung-vien/, "loc-ung-vien-sua-xa: bản bỏ lọc vẫn chạy — ca không phân biệt được");
    assert.equal(await bamXa(), truoc, "loc-ung-vien-sua-xa: bản bỏ lọc ném lỗi mà đã ghi");
  } finally {
    await xoaNut("sxu-ung-vien");
  }
});

test("SXU-AC-2 nút xác minh thiếu mục tệp xã vẫn là lỗi, không ghi gì", { timeout: 600_000 }, async () => {
  await themNut("sxu-xac-minh", "xac_minh");
  try {
    const truoc = await bamXa();
    await assert.rejects(suaXaNut(c, im), /thiếu nút sxu-xac-minh/, "SXU-AC-2: luật DV1 bị nới cho nút xác minh");
    assert.equal(await bamXa(), truoc, "SXU-AC-2: báo lỗi mà vẫn ghi");
  } finally {
    await xoaNut("sxu-xac-minh");
  }
});

test("SXU-AC-3 câu đọc nút chạy trên bảng không có cột catalog_tier; trên bảng có cột chỉ bỏ nút mot_loi_khai", async () => {
  await c.query("BEGIN");
  try {
    await c.query(`CREATE SCHEMA sxu_tam;
      CREATE TABLE sxu_tam.asset_nodes AS SELECT id, node_type, slug, area_ids FROM public.asset_nodes;
      SET LOCAL search_path = sxu_tam, public`);
    const nProject = Number((await c.query("SELECT count(*) n FROM sxu_tam.asset_nodes WHERE node_type = 'project'")).rows[0].n);
    assert.ok(nProject > 0);
    assert.equal((await c.query(SQL_NUT_SUA_XA)).rowCount, nProject, "SXU-AC-3: bảng chưa có cột thì phải trả đủ nút project");
    await c.query(`CREATE SCHEMA sxu_tam2;
      CREATE TABLE sxu_tam2.asset_nodes (id bigint, node_type text, slug text, area_ids text[], catalog_tier text);
      INSERT INTO sxu_tam2.asset_nodes VALUES (1, 'project', 'ung-vien', '{}', 'mot_loi_khai'), (2, 'project', 'rong', '{}', NULL),
        (3, 'project', 'xac-minh', '{}', 'xac_minh'), (4, 'subzone', 'phan-khu', '{}', 'xac_minh');
      SET LOCAL search_path = sxu_tam2, public`);
    const kq = (await c.query(SQL_NUT_SUA_XA)).rows.map((r) => r.slug);
    assert.deepEqual(kq, ["rong", "xac-minh"], "SXU-AC-3: câu lọc bỏ nhầm nút NULL hay xac_minh, hoặc giữ nút mot_loi_khai");
  } finally {
    await c.query("ROLLBACK");
  }
});
