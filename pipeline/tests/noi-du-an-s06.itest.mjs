// noi-du-an-s06.itest.mjs — hồ sơ _acceptance/ma-du-an-s06-thanh-nut (DA32, T3): migration 100 + lệnh dựng/áp/đảo thẻ luật
// mã dự án S06 + bộ dự án trên tin S03 bỏ nút ứng viên. Chỉ chạy trên DB của riêng lượt chép DB máy thu
// (db/db-thu.sh oneinvest_suite_ms6 --chay); DB ấy xoá khi lệnh dừng. DB thử của suite không áp migration của nhánh, nên ca
// đầu tự áp 100. Fixture: schema ms6_fx che hai bảng nguồn (sale_offer_records, stg_chotot_ads) bằng search_path — lệnh đọc
// đúng câu SQL thật nhưng chỉ thấy mã của fixture; bảng danh bạ (asset_nodes, registry_aliases, project_links…) vẫn ở public.
// Mỗi ca dữ liệu chạy trong BEGIN … ROLLBACK, lệnh được gọi với giaoDich 'ngoai' (SAVEPOINT).
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, before, after } from "node:test";

import pg from "pg";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("noi-du-an-s06.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}
const GOC = join(import.meta.dirname, "..", "..");
export const MIG = readFileSync(join(GOC, "db/migrations/100_ma_du_an_s06_nut.sql"), "utf8");

const ketNoi = async () => { const c = new pg.Client({ connectionString: DB_URL }); await c.connect(); return c; };
const so = async (c, sql, p = []) => Number(Object.values((await c.query(sql, p)).rows[0])[0]);

/** Dấu lược đồ của các bảng 100 chạm + định nghĩa view — so giữa hai lần áp. */
const bamLuocDo = async (c) => (await c.query(
  `SELECT md5(coalesce(string_agg(x, E'\\n' ORDER BY x), '')) h FROM (
     SELECT table_name || '.' || column_name || ':' || data_type || ':' || is_nullable || ':' || coalesce(column_default, '') x
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('asset_nodes', 'registry_aliases', 'registry_events', 'project_links', 'project_link_rules')
     UNION ALL SELECT conrelid::regclass || '.' || conname || ':' || pg_get_constraintdef(oid) FROM pg_constraint
      WHERE conrelid IN ('asset_nodes'::regclass, 'registry_aliases'::regclass, 'registry_events'::regclass,
                         'project_links'::regclass, 'project_link_rules'::regclass)
     UNION ALL SELECT 'view:' || pg_get_viewdef('public.s06_offer_project'::regclass)) s`)).rows[0].h;

let c;
before(async () => { c = await ketNoi(); });
after(async () => { await c?.end(); });

test("MS6-AC-1 migration 100: chạy hai lần, lược đồ không đổi, khoá nút, CHECK và rào chỉ-thêm", { timeout: 600_000 }, async () => {
  await c.query(MIG);
  const lan1 = await bamLuocDo(c);
  await c.query(MIG);
  assert.equal(await bamLuocDo(c), lan1, "MS6-AC-1: lần áp thứ hai đổi lược đồ (idempotent)");

  assert.equal(await so(c, `SELECT count(*) FROM asset_nodes WHERE catalog_tier IS DISTINCT FROM 'xac_minh'`), 0,
    "MS6-AC-1: nút có sẵn không mang xac_minh");

  const nut = await so(c, `SELECT min(id) FROM asset_nodes WHERE node_type = 'project'`);
  await c.query("BEGIN");
  try {
    await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'du_an/ms6-thu-1', 'S06')`,
      [`node:${nut}`]);
    await c.query("SAVEPOINT s");
    await assert.rejects(c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ('node:abc', 'ma_nguon', 'du_an/x', 'S06')`),
      /registry_aliases_object_key_check/, "MS6-AC-1: node:abc lọt CHECK object_key");
    await c.query("ROLLBACK TO SAVEPOINT s");
    await assert.rejects(c.query(`INSERT INTO project_links (source, source_project_id, status) VALUES ('S06', 'x1', 'noi')`),
      /project_links_noi_co_nut/, "MS6-AC-1: dòng noi không nút lọt");
    await c.query("ROLLBACK TO SAVEPOINT s");
    await assert.rejects(c.query(`INSERT INTO project_links (source, source_project_id, status) VALUES ('S06', 'x2', 'chua_noi')`),
      /project_links_chua_noi_co_ly_do/, "MS6-AC-1: dòng chua_noi không lý do lọt");
    await c.query("ROLLBACK TO SAVEPOINT s");
    await assert.rejects(c.query(`DELETE FROM registry_aliases WHERE value = 'du_an/ms6-thu-1'`), /chỉ thêm/,
      "MS6-AC-1: xoá được bí danh — rào chỉ-thêm hỏng");
  } finally {
    await c.query("ROLLBACK");
  }

  // Đối chứng đỏ: bản sao 100 bỏ mục mở CHECK object_key (trả CHECK về khuôn 082) → 'node:<id>' bị từ chối.
  const banPha = MIG.replace(/\|node:\[0-9\]\+\)\$'\)/g, () => ")$')"); // hàm: «$'» trong chuỗi thay thế là mẫu đặc biệt
  assert.notEqual(banPha, MIG, "MS6-AC-1: không phá được bản sao 100 (khuôn CHECK đổi?)");
  await c.query("BEGIN");
  try {
    await c.query(banPha);
    await assert.rejects(
      c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'du_an/ms6-thu-2', 'S06')`, [`node:${nut}`]),
      /registry_aliases_object_key_check/, "node-key: bản phá vẫn nhận node:<id> — ca không phân biệt được");
  } finally {
    await c.query("ROLLBACK");
  }
});

// ---------------------------------------------------------------------------------------------------------------------------
// Fixture viết trước: [mã, tên, [[xã, số tin], …], độ tản vĩ độ (độ)]. Kết cục kỳ vọng ở KY_VONG — ma trận toàn phần.
const XA = { lb: "vn-hcmc-long-binh", ak: "vn-hcmc-an-khanh", th: "vn-hcmc-tan-hung", gl: "vn-hanoi-gia-lam" };
const TEN_UV = "Khu Thử Ứng Viên Fx";
const FIXTURE = [
  ["fx-gp", "Vinhomes Grand Park", [[XA.lb, 15]], 0],
  ["fx-rong", "Đang cập nhật", [[XA.lb, 12]], 0],
  ["fx-2tinh", "Khu Hai Tỉnh Fx", [[XA.lb, 6], [XA.gl, 6]], 0],
  ["fx-sun", "Sunrise Riverside", [[XA.th, 11]], 0],
  ["fx-sun-t", "Sunrise Riverside Tower", [[XA.th, 11]], 0],
  ["fx-9", "Khu Chín Tin Fx", [[XA.lb, 9]], 0],
  ["fx-10", "Khu Mười Tin Fx", [[XA.lb, 10]], 0],
  ["fx-hoa", "Khu Hoà Xã Fx", [[XA.lb, 5], [XA.ak, 5]], 0],
  ["fx-trung-a", "Khu Trùng Tên Fx", [[XA.ak, 10]], 0],
  ["fx-trung-b", "Khu Trùng Tên Fx", [[XA.th, 10]], 0],
  ["fx-tan", "Khu Điểm Tản Fx", [[XA.lb, 10]], 0.03],
  ["fx-doi", "Tháp Khu Doi Chung Fx", [[XA.ak, 10]], 0],
  ...Array.from({ length: 28 }, (_, i) => [`fx-d${String(i + 1).padStart(2, "0")}`, `Dự án Lấp Fx ${i + 1}`, [[XA.ak, 10 + i]], 0]),
];
// Kết cục chuẩn kỳ vọng ở lần dựng đầu (mã fx-9 dưới ngưỡng: không có mặt).
const KY_VONG = Object.fromEntries([
  ["fx-gp", "noi:16"], ["fx-rong", "chua_noi:khong-ten"], ["fx-2tinh", "chua_noi:lech-tinh"], ["fx-sun", "duc"],
  ["fx-sun-t", "duc"], ["fx-10", "duc"], ["fx-hoa", "duc"], ["fx-trung-a", "duc"], ["fx-trung-b", "duc"], ["fx-tan", "duc"],
  ["fx-doi", "chua_noi:nhieu-ung-vien"], ...Array.from({ length: 28 }, (_, i) => [`fx-d${String(i + 1).padStart(2, "0")}`, "duc"]),
]);

/** Dựng fixture trong giao dịch đang mở: schema ms6_fx che hai bảng nguồn, view chép từ 100, hai nút «đôi» xác minh. */
export async function dungFixture(cl, ds = FIXTURE) {
  await cl.query(`DROP SCHEMA IF EXISTS ms6_fx CASCADE; CREATE SCHEMA ms6_fx;
    CREATE TABLE ms6_fx.sale_offer_records (offer_id text PRIMARY KEY, source text, property_type text, kind text,
      price_perm2 bigint, area_id text, originating_system_key text, retired_at timestamptz, superseded_by text, post_ids text[]);
    CREATE TABLE ms6_fx.stg_chotot_ads (list_id bigint PRIMARY KEY, payload jsonb);
    SET LOCAL search_path = ms6_fx, public;`);
  let id = 9_000_000_000;
  for (const [ma, ten, xa, tan] of ds) {
    let k = 0;
    for (const [area, n] of xa) {
      for (let i = 0; i < n; i++, k++) {
        id++;
        await cl.query(`INSERT INTO ms6_fx.sale_offer_records VALUES ($1, 'S06', 'apartment', 'sale', 50000000, $2, $3, NULL, NULL, NULL)`,
          [`S06:${id}`, area, String(id)]);
        await cl.query(`INSERT INTO ms6_fx.stg_chotot_ads VALUES ($1, $2)`,
          [id, { projectid: ma, pty_project_name: ten, latitude: 10.8 + (k === 0 ? tan : 0) }]);
      }
    }
  }
  // View s06_offer_project của 100, tạo lại trong ms6_fx để đọc bảng fixture (search_path đang trỏ ms6_fx trước).
  const view = MIG.slice(MIG.indexOf("CREATE OR REPLACE VIEW s06_offer_project"));
  await cl.query(view);
  for (const ten of ["Khu Đôi Fx A", "Khu Đôi Fx B"]) {
    await cl.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, catalog_tier)
                    VALUES ('project', $1, $2, ARRAY['khu doi chung fx'], ARRAY[$3], 'xac_minh')`,
      [ten, `ms6-fx-${ten.slice(-1).toLowerCase()}`, XA.ak]);
  }
}

const L = await import("../noi-du-an-s06.mjs");
const lop = await import("../lib/noi-du-an-s06-lop.mjs");
const kc = (ds) => Object.fromEntries(ds.map((d) => [d.ma, lop.ketCucChuan(d.kq)]));
const DEM4 = `SELECT (SELECT count(*) FROM asset_nodes) || '|' || (SELECT count(*) FROM registry_aliases) || '|' ||
  (SELECT count(*) FROM project_links) || '|' || (SELECT count(*) FROM project_link_rules) AS d`;
const dem4 = async () => (await c.query(DEM4)).rows[0].d;
async function trongGd(fn) {
  await c.query("BEGIN");
  try { await dungFixture(c); return await fn(); } finally { await c.query("ROLLBACK"); }
}

test("MS6-AC-2b phanLop trên dòng thật của câu đọc mã", { timeout: 300_000 }, () => trongGd(async () => {
  const ma = (await L.docMa(c)).find((m) => m.ma === "fx-gp");
  assert.ok(ma, "doc-ma-that: câu đọc mã không trả fx-gp");
  assert.deepEqual(lop.phanLop(ma, await L.docNut(c)), { status: "noi", node_id: 16, co_diem_tan: false }, "doc-ma-that: fx-gp không nối Grand Park");
}));

test("MS6-AC-3 dựng thẻ: tổng khớp đếm độc lập, mẫu đủ tầng, không mã nguồn, băm kết cục, không ghi DB", { timeout: 300_000 }, () => trongGd(async () => {
  const truoc = await dem4();
  const the = await L.dungTheLuat(c);
  assert.deepEqual(kc(the.ds), KY_VONG, "MS6-AC-3: kết cục lệch ma trận viết trước");
  const doc = (await c.query(`SELECT payload->>'projectid' ma, count(*) n FROM ms6_fx.stg_chotot_ads GROUP BY 1 HAVING count(*) >= 10`)).rows;
  assert.equal(the.ds.length, doc.length, "MS6-AC-3: số mã ≥10 lệch đếm độc lập");
  const tongTin = Object.values(the.tong).reduce((s, t) => s + t.tin, 0);
  assert.equal(tongTin, doc.reduce((s, r) => s + Number(r.n), 0), "MS6-AC-3: tổng tin lệch đếm độc lập");
  for (const tieuDe of ["Nối vào nút có sẵn (1)", "Từ chối có lý do (3)", "10 mã nhiều tin nhất (10)", "10 mã giữa (10)", "5 mã sát ngưỡng (5)"]) {
    assert.ok(the.markdown.includes(tieuDe), `MS6-AC-3: thiếu tầng mẫu «${tieuDe}»`);
  }
  // Thẻ không phụ thuộc mã: thay mọi mã bằng mã giả thì phần thân (trừ dòng băm) y hệt.
  const thuTu = new Map([...the.ds.map((d) => d.ma)].sort().map((m, i) => [m, `zz${String(i).padStart(6, "0")}`]));
  const gia = lop.dungThe(the.ds.map((d) => ({ ...d, ma: thuTu.get(d.ma) }))); // mã giả giữ thứ tự sắp của mã thật
  assert.equal(gia.markdown.replace(/băm: .*/, ""), the.markdown.replace(/băm: .*/, ""), "lo-ma-nguon: thẻ in mã nguồn");
  const chuan = the.ds.map((d) => [d.ma, lop.ketCucChuan(d.kq)]);
  assert.equal(the.bam, lop.bamKetCuc(chuan));
  assert.notEqual(lop.bamKetCuc(chuan.map(([m, k]) => [m, m === "fx-10" ? "chua_noi:khong-ten" : k])), the.bam, "bam-ket-cuc");
  assert.equal(await dem4(), truoc, "MS6-AC-3: dựng thẻ ghi DB");
}));

test("MS6-AC-4 áp đúng băm: luật, nút ứng viên, bí danh, trạng thái; dưới ngưỡng không có gì", { timeout: 300_000 }, () => trongGd(async () => {
  const the = await L.dungTheLuat(c);
  const { rule_id } = await L.apTheLuat(c, { bam: the.bam, nguoi: "thu", giaoDich: "ngoai" });
  assert.equal(await so(c, "SELECT count(*) FROM project_link_rules WHERE id = $1 AND mau_bam = $2", [rule_id, the.bam]), 1);
  const nut = (await c.query(`SELECT pl.source_project_id ma, n.id, n.slug, n.catalog_tier, n.area_ids, n.meta::text meta
      FROM project_links pl JOIN asset_nodes n ON n.id = pl.asset_node_id WHERE pl.source = 'S06' AND pl.status = 'noi'`)).rows;
  const theoMa = Object.fromEntries(nut.map((r) => [r.ma, r]));
  for (const [ma, k] of Object.entries(KY_VONG)) {
    if (k !== "duc") continue;
    assert.equal(theoMa[ma]?.catalog_tier, "mot_loi_khai", `MS6-AC-4: ${ma} không có nút ứng viên mot_loi_khai`);
    assert.ok(theoMa[ma].area_ids.length >= 1, `MS6-AC-4: ${ma} nút không có xã`);
    // Không mang mã nguồn: meta đúng hai khoá {nguon, rule_id}; slug chỉ suy từ tên (+ hậu tố -n khi trùng).
    assert.deepEqual(Object.keys(JSON.parse(theoMa[ma].meta)).sort(), ["nguon", "rule_id"], `MS6-AC-4: meta nút ${ma} có khoá lạ`);
    const ten = FIXTURE.find((f) => f[0] === ma)[1];
    assert.match(theoMa[ma].slug, new RegExp(`^${lop.chuanTen(ten).replace(/ /g, "-")}(-[0-9]+)?$`), `MS6-AC-4: slug nút ${ma} không suy từ tên`);
  }
  assert.deepEqual(theoMa["fx-hoa"].area_ids, [XA.ak], "MS6-AC-4: hoà xã không chọn id nhỏ nhất");
  assert.deepEqual([theoMa["fx-trung-a"].slug, theoMa["fx-trung-b"].slug].sort(), ["khu-trung-ten-fx", "khu-trung-ten-fx-2"], "MS6-AC-4: hai mã cùng tên");
  assert.equal(Number(theoMa["fx-gp"].id), 16, "MS6-AC-4: fx-gp không nối Grand Park");
  const bd = (await c.query(`SELECT substring(value FROM 7) ma, object_key FROM registry_aliases
      WHERE source = 'S06' AND kind = 'ma_nguon' AND retired_at IS NULL AND value LIKE 'du\\_an/fx-%'`)).rows;
  assert.equal(bd.length, Object.values(KY_VONG).filter((k) => !k.startsWith("chua_noi")).length, "MS6-AC-4: số bí danh lệch số mã nối");
  for (const b of bd) assert.equal(b.object_key, `node:${theoMa[b.ma].id}`, `MS6-AC-4: bí danh ${b.ma} trỏ sai nút`);
  assert.equal(await so(c, `SELECT count(*) FROM project_links WHERE source = 'S06' AND source_project_id LIKE 'fx-%'`), Object.keys(KY_VONG).length);
  assert.equal(await so(c, `SELECT count(*) FROM project_links WHERE source = 'S06' AND source_project_id LIKE 'fx-%' AND status = 'noi' AND rule_id IS DISTINCT FROM $1`, [rule_id]), 0);
  // Dưới ngưỡng: fx-9 không có gì; fx-10 (ranh) có.
  assert.equal(await so(c, `SELECT count(*) FROM registry_aliases WHERE value = 'du_an/fx-9'`), 0, "MS6-AC-4: mã 9 tin có bí danh");
  assert.equal(await so(c, `SELECT count(*) FROM project_links WHERE source_project_id = 'fx-9'`), 0, "MS6-AC-4: mã 9 tin có trạng thái");
  assert.equal(await so(c, `SELECT count(*) FROM project_links WHERE source_project_id = 'fx-10' AND status = 'noi'`), 1);
}));

test("MS6-AC-4b/4c băm sai hoặc dữ liệu trôi → bam-lech, 0 dòng đổi; lỗi giữa chừng → hoàn lại", { timeout: 300_000 }, () => trongGd(async () => {
  const truoc = await dem4();
  const the = await L.dungTheLuat(c);
  await assert.rejects(L.apTheLuat(c, { bam: "0".repeat(64), nguoi: "thu", giaoDich: "ngoai" }), /bam-lech/);
  assert.equal(await dem4(), truoc, "MS6-AC-4b: băm sai mà vẫn ghi");
  await c.query(`INSERT INTO ms6_fx.sale_offer_records VALUES ('S06:9100000001', 'S06', 'apartment', 'sale', 1, $1, '9100000001', NULL, NULL, NULL)`, [XA.ak]);
  await c.query(`INSERT INTO ms6_fx.stg_chotot_ads VALUES (9100000001, $1)`, [{ projectid: "fx-9", pty_project_name: "Khu Chín Tin Fx", latitude: 10.8 }]);
  await assert.rejects(L.apTheLuat(c, { bam: the.bam, nguoi: "thu", giaoDich: "ngoai" }), /bam-lech/, "MS6-AC-4c: dữ liệu trôi mà băm cũ vẫn áp");
  assert.equal(await dem4(), truoc, "MS6-AC-4c: ghi khi băm lệch");
  const the2 = await L.dungTheLuat(c);
  await assert.rejects(L.apTheLuat(c, { bam: the2.bam, nguoi: "thu", giaoDich: "ngoai", _sauNutDau: async () => { throw new Error("pha-giua-chung"); } }), /pha-giua-chung/);
  assert.equal(await dem4(), truoc, "MS6-AC-4: lỗi sau nút đầu mà nút còn lại — không một giao dịch");
}));

test("MS6-AC-5 ba câu kiểm bất biến = 0 sau áp, đỏ đúng tên khi phá", { timeout: 300_000 }, () => trongGd(async () => {
  const the = await L.dungTheLuat(c);
  await L.apTheLuat(c, { bam: the.bam, nguoi: "thu", giaoDich: "ngoai" });
  assert.deepEqual(await L.kiemHaiNut(c), [], "kiemHaiNut");
  assert.deepEqual(await L.kiemLechTinh(c), [], "kiemLechTinh");
  assert.deepEqual(await L.kiemThieuTrangThai(c), [], "kiemThieuTrangThai");
  assert.equal(await so(c, `SELECT count(*) FROM project_links WHERE source_project_id = 'fx-9'`), 0, "MS6-AC-5: mã dưới ngưỡng có dòng");
  const nut = await so(c, `SELECT asset_node_id FROM project_links WHERE source_project_id = 'fx-10'`);
  await c.query("SAVEPOINT p");
  await c.query("DROP INDEX registry_aliases_ma_nguon_uq");
  await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ('node:16', 'ma_nguon', 'du_an/fx-10', 'S06')`);
  assert.deepEqual(await L.kiemHaiNut(c), [{ ma: "fx-10" }], "kiemHaiNut: không đỏ khi mã có hai nút");
  await c.query("ROLLBACK TO SAVEPOINT p");
  await c.query(`UPDATE asset_nodes SET area_ids = ARRAY[$2] WHERE id = $1`, [nut, XA.gl]);
  assert.deepEqual(await L.kiemLechTinh(c), [{ ma: "fx-10" }], "kiemLechTinh: không đỏ khi nút khác tỉnh");
  await c.query("ROLLBACK TO SAVEPOINT p");
  await c.query(`DELETE FROM project_links WHERE source_project_id = 'fx-10'`);
  assert.deepEqual(await L.kiemThieuTrangThai(c), [{ ma: "fx-10" }], "kiemThieuTrangThai: không đỏ khi thiếu dòng");
  await c.query("ROLLBACK TO SAVEPOINT p");
}));

test("MS6-AC-6 chạy lại lần hai không đổi gì (kể cả tên lồng nhau, đổi tên ở nguồn)", { timeout: 300_000 }, () => trongGd(async () => {
  const the1 = await L.dungTheLuat(c);
  await L.apTheLuat(c, { bam: the1.bam, nguoi: "thu", giaoDich: "ngoai" });
  const tapBd = async () => (await c.query(`SELECT id, object_key, value, retired_at FROM registry_aliases WHERE value LIKE 'du\\_an/fx-%' ORDER BY id`)).rows;
  const bd1 = await tapBd();
  const n1 = await so(c, "SELECT count(*) FROM asset_nodes");
  const r1 = await so(c, "SELECT count(*) FROM project_link_rules");
  const the2 = await L.dungTheLuat(c);
  assert.equal(the2.bam, the1.bam, "nut-ung-vien-cham: băm lần hai khác lần một (tên lồng nhau đổi kết cục?)");
  const kq = await L.apTheLuat(c, { bam: the2.bam, nguoi: "thu", giaoDich: "ngoai" });
  assert.equal(kq.khongDoi, true, "MS6-AC-6: lần hai không báo «không đổi»");
  assert.deepEqual(await tapBd(), bd1);
  assert.equal(await so(c, "SELECT count(*) FROM asset_nodes"), n1, "nut-trung: lần hai đúc thêm nút");
  assert.equal(await so(c, "SELECT count(*) FROM project_link_rules"), r1);
  // Đối chứng đỏ: phanLop tính cả nút mot_loi_khai thì fx-sun-t chạm nút ứng viên của fx-sun → băm đổi.
  const nut = (await L.docNut(c)).map((n) => ({ ...n, catalog_tier: "xac_minh" }));
  const pha = (await L.docMa(c)).map((m) => [m.ma, lop.ketCucChuan(lop.phanLop(m, nut))]);
  assert.notEqual(lop.bamKetCuc(pha), the1.bam, "nut-ung-vien-cham: bản phá không đổi băm — ca không phân biệt được");
  // MS6-AC-6b: đổi tên ở nguồn sau khi áp → giữ nút cũ, băm không đổi.
  await c.query(`UPDATE ms6_fx.stg_chotot_ads SET payload = payload || '{"pty_project_name":"Khu Mười Tin Fx Mới"}' WHERE payload->>'projectid' = 'fx-10'`);
  assert.equal((await L.dungTheLuat(c)).bam, the1.bam, "MS6-AC-6b: đổi tên ở nguồn làm đổi băm");
}));

test("MS6-AC-7 đảo cả loạt rồi áp lại về đúng nút cũ; lỗi giữa chừng khi đảo → hoàn lại", { timeout: 300_000 }, () => trongGd(async () => {
  const the = await L.dungTheLuat(c);
  const { rule_id } = await L.apTheLuat(c, { bam: the.bam, nguoi: "thu", giaoDich: "ngoai" });
  const truocBd = (await c.query(`SELECT substring(value FROM 7) ma, object_key FROM registry_aliases WHERE value LIKE 'du\\_an/fx-%' AND retired_at IS NULL`)).rows;
  const nN = await so(c, "SELECT count(*) FROM asset_nodes");
  await assert.rejects(L.daoTheLuat(c, { ruleId: rule_id, nguoi: "thu", giaoDich: "ngoai", _giuaChung: async () => { throw new Error("pha-dao"); } }), /pha-dao/);
  assert.equal(await so(c, `SELECT count(*) FROM registry_aliases WHERE value LIKE 'du\\_an/fx-%' AND retired_at IS NULL`), truocBd.length, "MS6-AC-7: đảo dở mà bí danh đã nghỉ");
  await L.daoTheLuat(c, { ruleId: rule_id, nguoi: "thu", giaoDich: "ngoai" });
  assert.equal(await so(c, `SELECT count(*) FROM registry_aliases a JOIN project_links pl ON a.value = 'du_an/' || pl.source_project_id
      WHERE pl.rule_id = $1 AND a.source = 'S06' AND a.retired_at IS NULL`, [rule_id]), 0, "MS6-AC-7: còn bí danh sống của luật đã đảo");
  assert.equal(await so(c, `SELECT count(*) FROM project_links WHERE rule_id = $1 AND NOT (status = 'chua_noi' AND ly_do IN ('dao-luat','khong-ten','lech-tinh','nhieu-ung-vien'))`, [rule_id]), 0);
  assert.equal(await so(c, `SELECT count(*) FROM project_links WHERE rule_id = $1 AND ly_do = 'dao-luat'`, [rule_id]), truocBd.length);
  assert.equal(await so(c, `SELECT count(*) FROM project_link_rules WHERE id = $1 AND dao_at IS NOT NULL AND dao_by = 'thu'`, [rule_id]), 1);
  assert.equal(await so(c, "SELECT count(*) FROM asset_nodes"), nN, "MS6-AC-7: đảo xoá nút");
  const the2 = await L.dungTheLuat(c);
  await L.apTheLuat(c, { bam: the2.bam, nguoi: "thu", giaoDich: "ngoai" });
  const sauBd = (await c.query(`SELECT substring(value FROM 7) ma, object_key FROM registry_aliases WHERE value LIKE 'du\\_an/fx-%' AND retired_at IS NULL`)).rows;
  const map = (r) => Object.fromEntries(r.map((x) => [x.ma, x.object_key]));
  assert.deepEqual(map(sauBd), map(truocBd), "MS6-AC-7: áp lại không trỏ đúng nút cũ");
  assert.equal(await so(c, "SELECT count(*) FROM asset_nodes"), nN, "MS6-AC-7: áp lại đúc nút thứ hai");
}));

test("MS6-AC-8 view s06_offer_project khớp đếm độc lập, mỗi tin một nút", { timeout: 300_000 }, () => trongGd(async () => {
  const the = await L.dungTheLuat(c);
  await L.apTheLuat(c, { bam: the.bam, nguoi: "thu", giaoDich: "ngoai" });
  const DOC_LAP = `SELECT count(*) FROM ms6_fx.sale_offer_records r JOIN ms6_fx.stg_chotot_ads s ON s.list_id::text = r.originating_system_key
      JOIN public.registry_aliases a ON a.source = 'S06' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL AND a.value = 'du_an/' || (s.payload->>'projectid')
     WHERE r.source = 'S06' AND r.property_type = 'apartment' AND r.retired_at IS NULL AND r.superseded_by IS NULL`;
  const v = await so(c, "SELECT count(*) FROM ms6_fx.s06_offer_project");
  assert.ok(v > 0);
  assert.equal(v, await so(c, DOC_LAP), "MS6-AC-8: view lệch đếm độc lập");
  assert.equal(await so(c, "SELECT count(*) FROM (SELECT offer_id FROM ms6_fx.s06_offer_project GROUP BY 1 HAVING count(DISTINCT node_id) > 1) x"), 0);
  await c.query(`UPDATE registry_aliases SET retired_at = now() WHERE value = 'du_an/fx-gp' AND retired_at IS NULL`);
  assert.equal(await so(c, "SELECT count(*) FROM ms6_fx.s06_offer_project"), v - 15, "MS6-AC-8: nghỉ bí danh fx-gp mà view không giảm 15");
  assert.equal(await so(c, DOC_LAP), v - 15);
}));

test("MS6-AC-10a bộ dự án trên tin S03 bỏ nút ứng viên, vẫn khớp nút xác minh", { timeout: 600_000 }, () => trongGd(async () => {
  const { rows: [uv] } = await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, catalog_tier)
      VALUES ('project', $1, 'ms6-fx-ung-vien', ARRAY[lower($1)], ARRAY[$2], 'mot_loi_khai') RETURNING id::text`, [TEN_UV, XA.ak]);
  const s03 = await import("../lib/du-an-tren-tin-s03.mjs");
  const { nut } = await s03.docDuLieu(c);
  assert.ok(!nut.some((n) => String(n.id) === uv.id), "loc-ung-vien-s03: docDuLieu trả nút ứng viên");
  assert.ok(nut.some((n) => String(n.id) === "16"), "MS6-AC-10a: docDuLieu mất nút Grand Park (đối chứng dương)");
  const vao = (ds) => ({ nhom: [], bai: [], nut: ds, tin: [{ offer_id: "o1", post_ids: ["p1"] }, { offer_id: "o2", post_ids: ["p2"] }],
    nhan: [{ label_id: 1, post_id: "p1", v: TEN_UV, cc: "chu_bai", trich_ok: true },
           { label_id: 2, post_id: "p2", v: "Vinhomes Grand Park", cc: "chu_bai", trich_ok: true }] });
  const giaTri = (kq) => Object.fromEntries(kq.dong.map((d) => [d.subject_key, String(d.value)]));
  const that = giaTri(s03.tinhDuAn(vao(nut)));
  assert.ok(!Object.values(that).includes(uv.id), "loc-ung-vien-s03: tin S03 gán vào nút ứng viên");
  assert.ok(Object.values(that).includes("16"), "MS6-AC-10a: tin S03 nhãn Grand Park không còn gán (đối chứng dương)");
  // Đối chứng đỏ: câu đọc bỏ điều kiện catalog_tier thì bài p1 gán nút ứng viên.
  const nutPha = (await c.query(`SELECT id, name, aliases FROM asset_nodes WHERE node_type = 'project'`)).rows;
  assert.ok(Object.values(giaTri(s03.tinhDuAn(vao(nutPha)))).includes(uv.id), "loc-ung-vien-s03: bản phá không gán — ca không phân biệt được");
}));
