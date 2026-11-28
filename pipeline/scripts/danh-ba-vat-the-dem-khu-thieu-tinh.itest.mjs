// danh-ba-vat-the-dem-khu-thieu-tinh.itest.mjs — hồ sơ giu-tuoi-vat-the-khu-thieu-tinh (DA72): lượt đêm giữ tươi danh bạ vật
// thể (buocVatTheDem → dung với MỌI khu đã có toà, khuDaDung) không gãy vì một khu không suy được tỉnh mà ISO của nó không ai
// dùng. Sự cố 28/11 00:00: lượt dựng DA42 tạo 145 nút khu S09 area_ids rỗng có toà → «khu s09-…: khong-co-tinh» → cả giao dịch
// giữ tươi lùi, refresh-bait-gap thoát 1 mỗi lượt. Ca cấy khu như thế (không phụ thuộc DB chép có dữ liệu DA42 hay không).
// Chạy trên DB của riêng lượt chép từ máy thu, không bao giờ ghi `oneinvest`:
//   bash db/db-thu.sh oneinvest_suite_da72 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-dem-khu-thieu-tinh.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import pg from "pg";
import { buocVatTheDem, dung } from "../danh-ba-vat-the.mjs";
import { khuDaDung, moiKhoa, upiToa } from "../lib/danh-ba-vat-the.mjs";
import { chotDbThu } from "../lib/db-thu-chot.mjs";

const PIPE = join(import.meta.dirname, "..");
const URL_LUOT = chotDbThu({ ten: "danh-ba-vat-the-dem-khu-thieu-tinh.itest", khiThieu: "tu-choi" });
const SLUG = "q-da72-khu-thieu-tinh";

let c;
before(async () => {
  c = new pg.Client({ connectionString: URL_LUOT });
  await c.connect();
  if (!(await c.query("SELECT to_regclass('public.iso_regions') AS t")).rows[0].t) throw new Error("DA72 itest: DB chưa áp 088");
  // Cấy một khu dự án KHÔNG có khu vực (area_ids rỗng) kèm một toà — đúng hình dạng 145 nút khu S09 của lượt dựng DA42.
  let { rows: [n] } = await c.query("SELECT id::int AS id FROM asset_nodes WHERE slug = $1", [SLUG]);
  if (!n) {
    n = (await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
      VALUES ('project', 'Q DA72 Khu Thiếu Tỉnh', $1, '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`, [SLUG])).rows[0];
    const k = moiKhoa("bld");
    await c.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                   VALUES ($1, $2, $3, 'VN-HN', 'mot_loi_khai')`, [k, n.id, upiToa("VN-HN", k)]);
  }
});
after(async () => { await c?.end(); });

const demToa = async () => Number((await c.query("SELECT count(*) AS n FROM buildings")).rows[0].n);

test("DA72-AC-1 lượt đêm có khu thiếu tỉnh (không dòng S08): không ném, in dòng đếm khu bỏ ISO, «đêm {khu: N}» đủ mọi khu", async () => {
  const khu = await khuDaDung(c);
  assert.ok(khu.includes(SLUG), "DA72-AC-1 khu cấy không có trong khuDaDung — ca không đo được đường đêm");
  const dong = [];
  const truoc = await demToa();
  const tk = await buocVatTheDem(c, { log: (s) => dong.push(String(s)) });
  assert.ok(tk && !tk.bo_qua, `DA72-AC-1 lượt đêm bỏ qua: ${JSON.stringify(tk)}`);
  const dem = dong.find((s) => s.startsWith("danh-ba-vat-the: đêm "));
  assert.ok(dem, `DA72-AC-1 thiếu dòng «đêm»: ${dong.slice(-5).join(" | ")}`);
  assert.equal(JSON.parse(dem.slice("danh-ba-vat-the: đêm ".length)).khu, khu.length, "DA72-AC-1 «đêm {khu}» không bằng số khu đã có toà");
  const bo = dong.find((s) => /khu không suy được tỉnh, bỏ ISO \(không dòng S08\): \d+/.test(s));
  assert.ok(bo, `DA72-AC-1 thiếu dòng đếm khu bỏ ISO: ${dong.join(" | ").slice(0, 400)}`);
  assert.ok(Number(bo.match(/: (\d+)/)[1]) >= 1, "DA72-AC-1 dòng đếm khu bỏ ISO bằng 0 dù có khu cấy");
  assert.ok((await demToa()) >= truoc, "DA72-AC-1 số toà giảm sau lượt đêm");
});

test("DA72-AC-2 khu CÓ dòng S08 mà thiếu tỉnh vẫn dừng gọi tên, không ghi (luật cũ giữ cho chỗ ISO được dùng)", async () => {
  const { rows: [g] } = await c.query("SELECT area_ids FROM asset_nodes WHERE slug = 'vinhomes-grand-park'");
  const { rows: [s] } = await c.query(`SELECT count(*)::int AS n FROM stg_s08_inventory i JOIN s08_project_links l
      ON l.project_id = i.project_id AND l.status = 'noi' JOIN asset_nodes a ON a.id = l.asset_node_id
     WHERE a.slug = 'vinhomes-grand-park' AND i.project_type = 'high_rise'`);
  assert.ok(s.n > 0, "DA72-AC-2 Grand Park không có dòng S08 trên DB chép — ca không đo được");
  const truoc = await demToa();
  await c.query("UPDATE asset_nodes SET area_ids = '{}' WHERE slug = 'vinhomes-grand-park'");
  try {
    await assert.rejects(dung(c, { khuSlugs: ["vinhomes-grand-park", SLUG], log: () => {} }), /khu vinhomes-grand-park: khong-co-tinh/);
    assert.equal(await demToa(), truoc, "DA72-AC-2 đã ghi khi khu có S08 thiếu tỉnh");
  } finally {
    await c.query("UPDATE asset_nodes SET area_ids = $1 WHERE slug = 'vinhomes-grand-park'", [g.area_ids]);
  }
});

test("DA72-AC-3 refresh-bait-gap thật trên DB lượt thoát 0, có dòng «đêm», không «khong-co-tinh»", () => {
  const env = { ...process.env, DATABASE_URL: URL_LUOT };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ["refresh-bait-gap.mjs"], { cwd: PIPE, env, encoding: "utf8", timeout: 600_000 });
  const ra = (r.stdout || "") + (r.stderr || "");
  assert.doesNotMatch(ra, /khong-co-tinh/, "DA72-AC-3 vẫn gãy vì khu thiếu tỉnh");
  assert.match(ra, /danh-ba-vat-the: đêm \{"khu":\d+/, `DA72-AC-3 thiếu dòng «đêm»: ${ra.slice(-400)}`);
  assert.equal(r.status, 0, `DA72-AC-3 refresh-bait-gap thoát ${r.status}: ${ra.slice(-400)}`);
});
