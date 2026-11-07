// danh-ba-vat-the-that.itest.mjs — hồ sơ danh-ba-toa-truc-can E7 (AC-7), E11b (AC-11): đo trên bản chép CHỈ ĐỌC của
// danh mục S08 cao tầng hai khu từ DB máy thu sang DB thử oneinvest_dbv_that_<pid>; không ghi DB máy thu. Chỉ in số —
// không in mã S08 nào (luật 5). Ngoài CI (cần DB máy thu :5433); chạy:
//   node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-that.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import pg from "pg";
import { GOC, MAY_CHU, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";

const chay = promisify(execFile);
const TEN = `oneinvest_dbv_that_${process.pid}`;
const KHU = ["vinhomes-ocean-park-1", "vinhomes-grand-park"];
const TU_DIEN = join(GOC, "state/danh-ba-vat-the/chu-dau-tu.json");
const NGUONG = 0.9;

let may; // máy thu, phiên chỉ đọc
let thu; // DB thử
let urlThu;
let maThat = new Set(); // mã căn đã chép (để soát đầu ra và kho)
let tenPhanKhu = new Set();

before(async () => {
  may = new pg.Client({ connectionString: `${MAY_CHU}/oneinvest`, options: "-c default_transaction_read_only=on" });
  await may.connect();
  urlThu = await taoDbThu(TEN);
  thu = new pg.Client({ connectionString: urlThu });
  await thu.connect();
  // Vùng: khu, phân khu, phường của máy thu → DB thử (cùng slug).
  const { rows: nut } = await may.query(
    `SELECT n.slug, n.node_type, n.name, n.aliases, n.area_ids, n.dd_field, n.meta, p.slug AS cha
       FROM asset_nodes n LEFT JOIN asset_nodes p ON p.id = n.parent_id
      WHERE n.slug = ANY($1) OR p.slug = ANY($1)`, [KHU]);
  for (const n of nut) {
    await thu.query(
      `INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT id FROM asset_nodes WHERE slug = $8))
       ON CONFLICT (slug) DO UPDATE SET area_ids = EXCLUDED.area_ids, aliases = EXCLUDED.aliases, meta = EXCLUDED.meta`,
      [n.node_type, n.name, n.slug, n.aliases, n.area_ids, n.dd_field, n.meta, n.cha]);
  }
  const areaIds = [...new Set(nut.flatMap((n) => n.area_ids ?? []))];
  const { rows: ar } = await may.query(`SELECT id, region_type, name, country_code FROM areas WHERE id = ANY($1)`, [areaIds]);
  for (const a of ar) {
    await thu.query(`INSERT INTO areas (id, region_type, name, country_code) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [a.id, a.region_type, a.name, a.country_code]);
  }
  // Danh mục S08 cao tầng của dự án đã nối hai khu.
  const { rows: lk } = await may.query(
    `SELECT l.project_id, l.status, n.slug FROM s08_project_links l JOIN asset_nodes n ON n.id = l.asset_node_id
      WHERE l.status = 'noi' AND n.slug = ANY($1)`, [KHU]);
  for (const l of lk) {
    await thu.query(`INSERT INTO s08_project_links (project_id, asset_node_id, status)
                     VALUES ($1, (SELECT id FROM asset_nodes WHERE slug = $2), $3)`, [l.project_id, l.slug, l.status]);
  }
  const { rows: s08 } = await may.query(
    `SELECT source_id, snapshot_id, project_id, project_type, state, product_code, subdivision_name
       FROM stg_s08_inventory WHERE project_id = ANY($1) AND project_type = 'high_rise'`, [lk.map((l) => l.project_id)]);
  for (const sn of new Set(s08.map((r) => r.snapshot_id))) {
    await thu.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'q', 'S08', '{}') ON CONFLICT DO NOTHING`, [sn]);
  }
  for (const r of s08) {
    await thu.query(
      `INSERT INTO stg_s08_inventory (source_id, snapshot_id, project_id, project_type, state, product_code, subdivision_name, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, '{}')`,
      [r.source_id, r.snapshot_id, r.project_id, r.project_type, r.state, r.product_code, r.subdivision_name]);
  }
  maThat = new Set(s08.map((r) => r.product_code).filter((m) => m && m.trim().length >= 6));
  // Tên công khai: mọi tên, bí danh của asset_nodes (danh mục vùng đã lên cloud) — không tính là tên chỉ có từ S08.
  const { rows: an } = await may.query(`SELECT name, aliases FROM asset_nodes`);
  const congKhai = new Set(an.flatMap((n) => [n.name, ...(n.aliases ?? [])]).map((x) => x.toLowerCase()));
  tenPhanKhu = new Set(s08.map((r) => r.subdivision_name).filter((s) => s && s.length >= 6 && !congKhai.has(s.toLowerCase())));
});
after(async () => {
  await may?.end().catch(() => {});
  await thu?.end().catch(() => {});
  await xoaDbThu(TEN);
});

async function dungLenh() {
  const args = [join(GOC, "pipeline/danh-ba-vat-the.mjs"), "--db", urlThu];
  if (existsSync(TU_DIEN)) args.push("--tu-dien", TU_DIEN);
  const { stdout } = await chay(process.execPath, args, { cwd: join(GOC, "pipeline") });
  for (const m of maThat) assert.ok(!stdout.includes(m), "DBV-AC-7 đầu ra lộ mã S08");
  return JSON.parse(stdout.trim().split("\n").find((l) => l.startsWith("tong_ket ")).slice("tong_ket ".length));
}

test("DBV-AC-7 bản chép thật: ≥ 90% mã tách được mỗi khu, dựng lại 0 khoá mới, mọi dự án có toà, 0 căn không bí danh", async () => {
  const t1 = await dungLenh();
  // Đối chứng độc lập: số mã khác nhau mỗi khu đếm thẳng trên máy thu (không qua bộ dựng).
  const { rows: dem } = await may.query(
    `SELECT n.slug, count(DISTINCT i.project_id || '/' || upper(btrim(i.product_code)))::int AS ma
       FROM stg_s08_inventory i JOIN s08_project_links l ON l.project_id = i.project_id AND l.status = 'noi'
       JOIN asset_nodes n ON n.id = l.asset_node_id
      WHERE i.project_type = 'high_rise' AND n.slug = ANY($1) AND btrim(coalesce(i.product_code, '')) <> ''
      GROUP BY 1`, [KHU]);
  const lyDo = Object.values(t1.ly_do).reduce((a, b) => a + b, 0);
  let tongMa = 0;
  let tongTach = 0;
  for (const { slug, ma } of dem) {
    const k = t1.khu[slug];
    assert.equal(k.ma, ma, `DBV-AC-7 số mã khu ${slug} lệch đếm độc lập`);
    assert.ok(k.ti_le_tach >= NGUONG, `DBV-AC-7 tỉ lệ tách ${slug} = ${k.ti_le_tach} < ${NGUONG}`);
    tongMa += k.ma;
    tongTach += Math.round(k.ti_le_tach * k.ma);
  }
  assert.equal(tongMa - tongTach, lyDo, "DBV-AC-7 số không tách khác sổ lý do");
  const t2 = await dungLenh();
  assert.equal(t2.khoa_moi, 0, "DBV-AC-4 dựng lại đổi khoá (dữ liệu thật)");
  const { rows: [chk] } = await thu.query(`SELECT
      (SELECT count(*) FROM s08_project_links l WHERE status = 'noi'
          AND EXISTS (SELECT 1 FROM stg_s08_inventory i WHERE i.project_id = l.project_id AND i.project_type = 'high_rise')
          AND NOT EXISTS (
         SELECT 1 FROM registry_aliases a JOIN buildings b ON b.building_key = a.object_key
          WHERE a.kind = 'ma_nguon' AND a.value LIKE l.project_id || '/%'))::int AS du_an_khong_toa,
      (SELECT count(*) FROM units u WHERE NOT EXISTS (SELECT 1 FROM registry_aliases a WHERE a.object_key = u.unit_key
          AND a.kind = 'ma_nguon' AND a.retired_at IS NULL))::int AS can_khong_bi_danh,
      (SELECT count(*) FROM (SELECT b.region_node_id, t.value FROM registry_aliases t JOIN buildings b ON b.building_key = t.object_key
          WHERE t.kind = 'ten' AND t.source = 'S08' GROUP BY 1, 2 HAVING count(*) > 1) x)::int AS ung_vien_gop`);
  assert.equal(chk.du_an_khong_toa, 0, "DBV-AC-3 dự án không có toà");
  assert.equal(chk.can_khong_bi_danh, 0, "DBV-AC-5 căn không có bí danh");
  console.log(`DBV-AC-7 ${JSON.stringify({ khu: t1.khu, ly_do: t1.ly_do, ung_vien_gop: chk.ung_vien_gop,
    builder_name: t1.builder_name_moi, phuong: t1.phuong_moi, ly_do_phuong: t1.ly_do_phuong })}`);
});

// Tệp đã chứa mã S08 thật từ TRƯỚC vòng này (migration đã commit, không sửa được — AGENTS luật 2); khớp ngoài danh sách là đỏ.
const DA_CO_TU_TRUOC = Object.freeze(["db/migrations/040_stg_s08_inventory.sql"]);

/** Tệp đang theo dõi của kho (hoặc một tệp) chứa một chuỗi trong tập; trả số tệp quét và danh sách tệp khớp. */
function quetKho(tap, tep = null) {
  const ds = tep ? [tep] : execFileSync("git", ["ls-files", "-z"], { cwd: GOC }).toString().split("\0").filter(Boolean);
  const khop = [];
  for (const f of ds) {
    const p = tep ?? join(GOC, f);
    if (!existsSync(p)) continue;
    let s;
    try { s = readFileSync(p, "utf8"); } catch { continue; }
    for (const m of tap) if (s.includes(m)) { khop.push(tep ?? f); break; }
  }
  return { tep: ds.length, khop };
}
const tepVongNay = () => execFileSync("git", ["diff", "--name-only", "origin/main...HEAD"], { cwd: GOC }).toString().split("\n").filter(Boolean);

test("DBV-AC-11b kho không chứa mã căn S08 thật hay tên phân khu chỉ có từ S08; đối chứng dương bắt được", () => {
  assert.ok(maThat.size > 0);
  const tap = new Set([...maThat, ...tenPhanKhu]);
  const kq = quetKho(tap);
  const vong = new Set(tepVongNay());
  console.log(`DBV-AC-11b tệp quét ${kq.tep} · khớp ${kq.khop.length} (có từ trước ${kq.khop.filter((f) => DA_CO_TU_TRUOC.includes(f)).length}) · tệp vòng này ${vong.size} · mã ${maThat.size} · tên phân khu ${tenPhanKhu.size}`);
  assert.deepEqual(kq.khop.filter((f) => vong.has(f)), [], "DBV-AC-11 mã S08 trong kho (tệp vòng này)");
  assert.deepEqual(kq.khop.filter((f) => !DA_CO_TU_TRUOC.includes(f)), [], "DBV-AC-11 mã S08 trong kho");
  const tam = join(mkdtempSync(join(tmpdir(), "dbv-quet-")), "x.txt");
  writeFileSync(tam, `q ${[...maThat][0]} q`);
  assert.equal(quetKho(tap, tam).khop.length, 1, "DBV-AC-11 mã S08 trong kho — đối chứng dương không bắt được");
});
