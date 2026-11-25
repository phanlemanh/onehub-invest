// noi-du-an-s08-luat.itest.mjs — DA55 soat-noi-s08-danh-ba E2–E5: thẻ luật S08, áp, đảo, lệnh kiểm trên DB thử oneinvest_dbv_ns8_<pid>
// dựng từ db/migrations (db-thu-dbv.mjs), xoá khi xong. Fixture viết tay tổng hợp (mã dự án tiền tố S08PRJ, không payload thật).
// Mỗi ca có chiều đỏ trên chính fixture của nó. Chạy: node --test --test-concurrency=1 pipeline/scripts/noi-du-an-s08-luat.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import pg from "pg";
import { GOC, MAY_CHU, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";
import { apTheLuat, daoTheLuat, dungTheLuat, kiemLuot } from "../noi-du-an-s08-luat.mjs";

const TEN = `oneinvest_dbv_ns8_${process.pid}`;
const SNAP = "ns8__s08__ds";
const MA = { tay: "S08PRJ0000", gc: "S08PRJ0001", sp: "S08PRJ0002", spTT: "S08PRJ0003", md: "S08PRJ0004", ktinh: "S08PRJ0005", nt: "S08PRJ0006" };
let db, N = {};

/** Ô vuông quanh (x, y) cạnh 2d độ, dạng MultiPolygon WKT. */
const vuong = (x, y, d) => `MULTIPOLYGON(((${x - d} ${y - d},${x + d} ${y - d},${x + d} ${y + d},${x - d} ${y + d},${x - d} ${y - d})))`;
const iframe = (lng, lat) => ({ project_info: { iframe_location: `<iframe src="https://maps.example/embed?pb=!1m18!2d${lng}!3d${lat}!2m3"></iframe>` } });

before(async () => {
  db = new pg.Client({ connectionString: await taoDbThu(TEN) });
  await db.connect();
  await db.query("INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S08', '{}')", [SNAP]);
  await db.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code, geom) VALUES
    ('ns8-hn', NULL, 'market', 'Hà Nội thử', 'VN', ST_GeomFromText($1, 4326)),
    ('ns8-hcm', NULL, 'market', 'HCM thử', 'VN', ST_GeomFromText($2, 4326)),
    ('ns8-hn-x1', 'ns8-hn', 'submarket', 'Xã thử 1', 'VN', ST_GeomFromText($3, 4326))`,
  [vuong(105.8, 21.0, 0.5), vuong(106.7, 10.8, 0.5), vuong(105.8, 21.0, 0.05)]);
  const nut = async (ten, area, meta = {}, tier = "xac_minh") => (await db.query(
    `INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, catalog_tier, meta)
     VALUES ('project', $1, $2, ARRAY[lower($1)], $3, $4, $5) RETURNING id::int AS id`,
    [ten, `ns8-${ten.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, area, tier, meta])).rows[0].id;
  N.gc = await nut("Thanh Pho Thu Nghiem", ["ns8-hcm"]);
  N.sc = await nut("Khu Thu Thong Minh", ["ns8-hn-x1"]);
  N.md = await nut("Mỹ Đình Thử Ngọc", [], { nguon_ung_vien: "S09" }, "mot_loi_khai");
  await db.query("INSERT INTO s08_project_links (project_id, asset_node_id, status) VALUES ($1, $2, 'noi')", [MA.tay, N.sc]);
  const da = [
    [MA.tay, "KHU THU THONG MINH", [105.8, 21.0]],
    [MA.gc, "THANH PHO THU NGHIEM", [106.7, 10.8]],
    [MA.sp, "CONG VIEN THU", [105.81, 21.01]],
    [MA.spTT, "CONG VIEN THU_TT", [105.82, 21.02]],
    [MA.md, "MỸ ĐÌNH THỬ NGỌC", [105.7, 21.1]],
    [MA.ktinh, "XA XOI", null],
    [MA.nt, "THAP MOI THU", [106.75, 10.85]],
  ];
  for (const [ma, ten, p] of da) {
    await db.query("INSERT INTO stg_s08_project (snapshot_id, project_id, catalog_payload, detail_payload, fetched_at) VALUES ($1, $2, $3, $4, now())",
      [SNAP, ma, { project_name: ten, project_code: "X" }, p ? iframe(p[0], p[1]) : null]);
  }
  for (const [ma, n] of [[MA.gc, 3], [MA.sp, 2], [MA.nt, 1]]) {
    for (let i = 0; i < n; i++) await db.query(
      "INSERT INTO stg_s08_inventory (source_id, snapshot_id, project_id, state, product_code, payload) VALUES ($3, $1, $2, 'notSold', $3, '{}')",
      [SNAP, ma, `${ma}-C${i}`]);
  }
});
after(async () => { await db?.end().catch(() => {}); await xoaDbThu(TEN); });

const vanTay = async (sql) => (await db.query(`SELECT md5(coalesce(string_agg(row_to_json(t)::text, '' ORDER BY 1), '')) AS h FROM (${sql}) t`)).rows[0].h;
const vanTayNutCoSan = () => vanTay(`SELECT * FROM asset_nodes WHERE id = ANY(ARRAY[${N.gc}, ${N.sc}, ${N.md}]) ORDER BY id`);
const vanTayBang = async () => ({
  nut: await vanTay("SELECT * FROM asset_nodes ORDER BY id"),
  link: await vanTay("SELECT source, source_project_id, asset_node_id, status, ly_do, rule_id FROM project_links ORDER BY 1, 2"),
  tay: await vanTay("SELECT project_id, asset_node_id, status, ly_do FROM s08_project_links ORDER BY 1"),
  bd: await vanTay("SELECT id, object_key, value, retired_at FROM registry_aliases ORDER BY id"),
  luat: await vanTay("SELECT id, source, dao_at FROM project_link_rules ORDER BY id"),
});
/** Nút có sẵn nào đổi dòng asset_nodes giữa hai lần chụp (chiều đỏ của AC-3 đọc hàm này). */
const nutDoi = async (truoc) => {
  const { rows } = await db.query(`SELECT id::int, md5(row_to_json(a)::text) AS h FROM asset_nodes a WHERE id = ANY($1)`, [Object.keys(truoc).map(Number)]);
  return rows.filter((r) => r.h !== truoc[r.id]).map((r) => r.id);
};
const chupNut = async () => Object.fromEntries((await db.query(
  `SELECT id::int, md5(row_to_json(a)::text) AS h FROM asset_nodes a WHERE id = ANY($1)`, [[N.gc, N.sc, N.md]])).rows.map((r) => [r.id, r.h]));
const loMa = (md) => Object.values(MA).filter((m) => md.includes(m));
const ngaCua = (the, ma) => the.ds.find((d) => d.ma === ma).kq;

test("NS8-2: thẻ ghi loại căn cứ, in đủ ngả, không lộ mã, băm ổn định, chỉ đọc; đổi tỉnh hay nút đích thì băm đổi", async () => {
  const truoc = await vanTayBang();
  const a = await dungTheLuat(db);
  const b = await dungTheLuat(db);
  assert.equal(a.bam, b.bam, "dựng hai lần phải cùng băm");
  assert.deepEqual(await vanTayBang(), truoc, "dựng thẻ không được ghi vào DB");
  const dem = (k) => a.ds.filter((d) => (k === "the_cap" ? d.kq.status === "chua_noi" && d.kq.ung_vien : d.kq.status === k)).length;
  assert.deepEqual({ giu: dem("giu_tay"), noi: dem("noi"), duc: dem("duc"), the_cap: dem("the_cap") }, { giu: 1, noi: 1, duc: 3, the_cap: 1 });
  assert.deepEqual(ngaCua(a, MA.md), { status: "chua_noi", ly_do: "nut-khong-tinh", ung_vien: [N.md] }, "nút ứng viên S09 chưa biết tỉnh ra thẻ từng cặp");
  assert.equal(ngaCua(a, MA.sp).nhom, ngaCua(a, MA.spTT).nhom, "CONG VIEN THU và _TT chung nhóm đúc");
  assert.equal(a.soNutMoi, 2);
  for (const chu of ["S08-ten-chuan-cung-tinh", "S08-nut-ung-vien", "Cần người chọn — thẻ từng cặp", "khong-tinh", "THANH PHO THU NGHIEM", "MỸ ĐÌNH THỬ NGỌC", "XA XOI"]) {
    assert.ok(a.markdown.includes(chu), `thẻ thiếu «${chu}»`);
  }
  assert.deepEqual(loMa(a.markdown), [], "thẻ không được in mã dự án S08");
  assert.deepEqual(loMa(`${a.markdown}\n${MA.gc}`), [MA.gc], "chiều đỏ: bộ soát mã phải bắt mã cấy vào thẻ");
  // Đổi tỉnh một dự án thì băm đổi; đổi nút đích (giữ ngả nối) thì băm đổi và áp băm cũ bị từ chối.
  await db.query("BEGIN");
  try {
    await db.query("UPDATE stg_s08_project SET detail_payload = $2 WHERE project_id = $1", [MA.nt, iframe(105.9, 21.1)]);
    assert.notEqual((await dungTheLuat(db)).bam, a.bam, "đổi tỉnh phải đổi băm");
  } finally { await db.query("ROLLBACK"); }
  await db.query("BEGIN");
  try {
    await db.query("UPDATE asset_nodes SET name = 'GC cũ', aliases = '{}' WHERE id = $1", [N.gc]);
    const moi = (await db.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, catalog_tier, meta)
      VALUES ('project', 'Thanh Pho Thu Nghiem', 'ns8-gc-moi', '{}', '{ns8-hcm}', 'xac_minh', '{}') RETURNING id::int AS id`)).rows[0].id;
    const c = await dungTheLuat(db);
    assert.deepEqual(ngaCua(c, MA.gc), { status: "noi", node_id: moi, can_cu: "S08-ten-chuan-cung-tinh" });
    assert.notEqual(c.bam, a.bam, "đổi nút đích phải đổi băm");
    await db.query("SAVEPOINT s");
    await assert.rejects(apTheLuat(db, { bam: a.bam, nguoi: "itest", giaoDich: "ngoai" }), /bam-lech/);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM project_links WHERE source = 'S08'")).rows[0].n, 0, "băm cũ không được ghi");
  } finally { await db.query("ROLLBACK"); }
});

let RULE;
test("NS8-3: băm lệch không ghi; băm đúng ghi luật, dòng nối, bí danh, nút đúc; nút có sẵn và bảng tay không đổi; áp lần hai không đổi", async () => {
  const truoc = await vanTayBang();
  const nutTruoc = await chupNut();
  const tayTruoc = truoc.tay;
  await assert.rejects(apTheLuat(db, { bam: "0".repeat(64), nguoi: "itest" }), /bam-lech/);
  assert.deepEqual(await vanTayBang(), truoc, "băm lệch: 0 dòng đổi");
  const the = await dungTheLuat(db);
  const kq = await apTheLuat(db, { bam: the.bam, nguoi: "itest" });
  RULE = kq.rule_id;
  assert.equal(kq.soNutMoi, 2);
  const { rows: [luat] } = await db.query("SELECT source, can_cu, so_ma, decided_by FROM project_link_rules WHERE id = $1", [RULE]);
  assert.deepEqual(luat, { source: "S08", can_cu: "S08-danh-muc", so_ma: 6, decided_by: "itest" });
  const { rows: link } = await db.query("SELECT source_project_id AS ma, asset_node_id::int AS nut, status, can_cu, ly_do, rule_id::int AS r FROM project_links WHERE source = 'S08' ORDER BY 1");
  assert.equal(link.length, 6, "mỗi dự án ngoài nối tay một dòng");
  assert.ok(link.every((l) => l.r === RULE), "mọi dòng mang rule_id");
  const lk = Object.fromEntries(link.map((l) => [l.ma, l]));
  assert.equal(lk[MA.gc].nut, N.gc);
  assert.equal(lk[MA.gc].can_cu, "S08-ten-chuan-cung-tinh");
  assert.equal(lk[MA.sp].nut, lk[MA.spTT].nut, "nhóm đúc chung nút");
  assert.deepEqual([lk[MA.md].status, lk[MA.md].ly_do], ["chua_noi", "nut-khong-tinh"]);
  assert.deepEqual([lk[MA.ktinh].status, lk[MA.ktinh].ly_do], ["chua_noi", "khong-tinh"]);
  const { rows: bd } = await db.query("SELECT object_key, value FROM registry_aliases WHERE source = 'S08' AND retired_at IS NULL ORDER BY value");
  assert.deepEqual(bd.map((b) => b.value), [MA.gc, MA.sp, MA.spTT, MA.nt].sort().map((m) => `du_an/${m}`), "bí danh đúng các dự án nối");
  const { rows: duc } = await db.query("SELECT id::int, name, area_ids, catalog_tier, meta FROM asset_nodes WHERE meta ->> 'nguon' = 'S08' ORDER BY name");
  assert.deepEqual(duc.map((n) => [n.name, n.area_ids, n.catalog_tier]), [["CONG VIEN THU", ["ns8-hn-x1"], "mot_loi_khai"], ["THAP MOI THU", ["ns8-hcm"], "mot_loi_khai"]]);
  for (const n of duc) {
    assert.equal(n.meta.rule_id, RULE);
    assert.ok(Number.isFinite(n.meta.diem?.lng) && Number.isFinite(n.meta.diem?.lat), "nút đúc mang điểm bản đồ");
    assert.deepEqual(loMa(JSON.stringify(n.meta)), [], "meta không mang mã dự án S08");
  }
  assert.deepEqual(await nutDoi(nutTruoc), [], "dòng asset_nodes có sẵn không đổi");
  assert.equal((await vanTayBang()).tay, tayTruoc, "s08_project_links không đổi");
  const lan2 = await apTheLuat(db, { bam: (await dungTheLuat(db)).bam, nguoi: "itest" });
  assert.equal(lan2.khongDoi, true, "áp lần hai không đổi gì");
  // Chiều đỏ: một bản áp ghi bí danh vào cột aliases của nút có sẵn thì bộ soát nêu id nút.
  await db.query("BEGIN");
  try {
    await db.query("UPDATE asset_nodes SET aliases = aliases || ARRAY['du_an/x'] WHERE id = $1", [N.gc]);
    assert.deepEqual(await nutDoi(nutTruoc), [N.gc], "chiều đỏ: sửa nút có sẵn phải bị bắt, nêu id");
  } finally { await db.query("ROLLBACK"); }
});

test("NS8-4: đảo nghỉ bí danh, dòng nối về dao-luat, giữ nút, ghi người đảo; đảo lần hai báo da-dao", async () => {
  const soNut = async () => (await db.query("SELECT count(*)::int AS n FROM asset_nodes")).rows[0].n;
  const truoc = await soNut();
  const songCuaLuot = async () => (await db.query(`SELECT count(*)::int AS n FROM registry_aliases a JOIN project_links pl
      ON pl.source = 'S08' AND a.value = 'du_an/' || pl.source_project_id
     WHERE a.source = 'S08' AND a.retired_at IS NULL AND pl.rule_id = $1`, [RULE])).rows[0].n;
  // Đối chứng dương trên cùng fixture: trước đảo phép đếm thấy đủ 4 bí danh sống — phép đếm 0 sau đảo không phải thước chết.
  assert.equal(await songCuaLuot(), 4, "trước đảo phải đếm được 4 bí danh sống của lượt");
  const kq = await daoTheLuat(db, { ruleId: RULE, nguoi: "itest-dao" });
  assert.equal(kq.soBiDanh, 4);
  assert.equal(await songCuaLuot(), 0, "mọi bí danh của lượt phải nghỉ");
  const { rows: st } = await db.query("SELECT status, ly_do, count(*)::int AS n FROM project_links WHERE source = 'S08' AND asset_node_id IS NOT NULL GROUP BY 1, 2");
  assert.deepEqual(st, [{ status: "chua_noi", ly_do: "dao-luat", n: 4 }]);
  assert.equal(await soNut(), truoc, "đảo giữ nút ứng viên");
  const { rows: [l] } = await db.query("SELECT dao_by, dao_at IS NOT NULL AS co FROM project_link_rules WHERE id = $1", [RULE]);
  assert.deepEqual(l, { dao_by: "itest-dao", co: true });
  await assert.rejects(daoTheLuat(db, { ruleId: RULE, nguoi: "itest-dao" }), /da-dao/);
});

test("NS8-5: lệnh kiểm thoát 0 sau áp; cấy lệch tỉnh, thiếu trạng thái thì thoát 1; hai nút bị DB chặn nêu loại lỗi, không in mã", async () => {
  // Áp lại sau đảo: dự án đã có nút đúc giữ nút ấy (không đúc nút thứ hai).
  const soNut = (await db.query("SELECT count(*)::int AS n FROM asset_nodes")).rows[0].n;
  const kq = await apTheLuat(db, { bam: (await dungTheLuat(db)).bam, nguoi: "itest" });
  assert.equal(kq.soNutMoi, 0, "áp lại không đúc nút mới");
  assert.equal((await db.query("SELECT count(*)::int AS n FROM asset_nodes")).rows[0].n, soNut);
  const cli = () => spawnSync(process.execPath, [join(GOC, "pipeline/noi-du-an-s08-luat.mjs"), "--kiem", String(kq.rule_id)],
    { encoding: "utf8", env: { ...process.env, DATABASE_URL: `${MAY_CHU}/${TEN}` } });
  // Một mã trỏ hai nút: chỉ mục duy nhất registry_aliases_ma_nguon_uq (source, kind, value) chặn ngay ở DB — cấy bị từ chối.
  await assert.rejects(db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ('node:${N.sc}', 'ma_nguon', 'du_an/${MA.gc}', 'S08')`),
    /registry_aliases_ma_nguon_uq/);
  const r0 = cli();
  assert.equal(r0.status, 0, r0.stdout + r0.stderr);
  assert.match(r0.stdout, /đạt/);
  const cay = [
    ["lech_tinh", `UPDATE project_links SET asset_node_id = ${N.sc} WHERE source = 'S08' AND source_project_id = '${MA.gc}'`,
      `UPDATE project_links SET asset_node_id = ${N.gc} WHERE source = 'S08' AND source_project_id = '${MA.gc}'`],
    ["thieu_trang_thai", `DELETE FROM project_links WHERE source = 'S08' AND source_project_id = '${MA.ktinh}'`,
      `INSERT INTO project_links (source, source_project_id, status, can_cu, ly_do, rule_id) VALUES ('S08', '${MA.ktinh}', 'chua_noi', 'S08-danh-muc', 'khong-tinh', ${kq.rule_id})`],
  ];
  for (const [loai, lam, hoan] of cay) {
    await db.query(lam);
    try {
      const k = await kiemLuot(db);
      assert.equal(k[loai], 1, `cấy ${loai} phải đếm 1`);
      const r = cli();
      assert.equal(r.status, 1, `cấy ${loai}: lệnh kiểm phải thoát 1`);
      assert.match(r.stdout, new RegExp(`${loai} 1`));
      assert.deepEqual(loMa(r.stdout + r.stderr), [], "lệnh kiểm không in mã");
    } finally { await db.query(hoan); }
  }
  assert.equal(cli().status, 0, "hoàn lại thì lệnh kiểm về đạt");
});
