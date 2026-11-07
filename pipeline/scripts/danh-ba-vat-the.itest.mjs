// danh-ba-vat-the.itest.mjs — hồ sơ danh-ba-toa-truc-can (DB1): ca «DBV-AC-*» trên DB thử dựng từ db/migrations.
// DB thử oneinvest_dbv_<pid> (đủ migration) và oneinvest_dbv_<pid>_truoc (tới 081, trước 082) ở :5433, tạo đầu tệp, xoá
// cuối tệp; không đọc, không ghi DB `oneinvest`. Fixture là dữ liệu tổng hợp (mã tiền tố Q), không mã S08 thật.
// Ngoài glob test của CI (cần :5433); chạy: node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
// Chiều đỏ: DBV_MIG_THAY=<bản chép 082> thay migration khi dựng DB thử.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { GOC, apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";
import { SQL as SQL_NGUOI } from "../lib/danh-ba-nguoi.mjs";

const TEN = `oneinvest_dbv_${process.pid}`;
const TEN_TRUOC = `${TEN}_truoc`;
const CAU_DAU = readFileSync(join(GOC, "db/dau-luoc-do.sql"), "utf8");
const K = (tienTo, n) => `${tienTo}_${String(n).padStart(26, "0")}`;

let db;
let dbTruoc;
before(async () => {
  const [u, uTruoc] = await Promise.all([taoDbThu(TEN), taoDbThu(TEN_TRUOC, { hetSo: 81 })]);
  db = new pg.Client({ connectionString: u });
  dbTruoc = new pg.Client({ connectionString: uTruoc });
  await Promise.all([db.connect(), dbTruoc.connect()]);
});
after(async () => {
  await Promise.all([db?.end().catch(() => {}), dbTruoc?.end().catch(() => {})]);
  await Promise.all([xoaDbThu(TEN), xoaDbThu(TEN_TRUOC)]);
});

const bam = (rows) => createHash("sha256").update(JSON.stringify(rows)).digest("hex");
const dau = async (c) => Object.values((await c.query(CAU_DAU)).rows[0])[0];

/** Mồi tin S03 + phát biểu, chạy phân xử thật (resolve_offer_fields), trả băm cột chuẩn + xuất xứ. */
async function phanXuTin(c) {
  await c.query(`INSERT INTO ops_audit (actor, action, env, detail) SELECT 'dbv', 'phat-bieu:cat-chuyen', 'local', '{}'
                  WHERE NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen')`);
  await c.query(`INSERT INTO sale_offer_records (offer_id, source, originating_system_key, kind, first_seen, last_seen)
                 VALUES ('offer_dbv_1', 'S03', 'qp1', 'sale', '2026-11-01', '2026-11-02') ON CONFLICT DO NOTHING`);
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at, run_id)
                 VALUES ('S03:qp1', 'property_type', 'apartment', 'observed', 'parser', '2026-11-01', 'dbv'),
                        ('S03:qp1', 'block_raw', 'QA6', 'observed', 'parser', '2026-11-01', 'dbv')
                 ON CONFLICT DO NOTHING`);
  await c.query(`SELECT resolve_offer_fields(ARRAY['offer_dbv_1'])`);
  const { rows } = await c.query(
    `SELECT offer_id, property_type, block_raw, field_provenance FROM sale_offer_records WHERE offer_id = 'offer_dbv_1'`,
  );
  return bam(rows);
}

/** Ghi một người qua câu ghi thật của danh bạ Người (pipeline/lib/danh-ba-nguoi.mjs), trả băm người + bí danh. */
async function caNguoi(c) {
  const p = K("pty", 1);
  await c.query(`${SQL_NGUOI.themNguoi} ON CONFLICT DO NOTHING`, [[p], ["S03"]]);
  await c.query(`${SQL_NGUOI.themDinhDanh} ON CONFLICT DO NOTHING`, [[p], ["S03"], ["sdt_bam"], ["qbam1"]]);
  await c.query(SQL_NGUOI.themTen, [[p], ["S03"], ["ten"], ["Q Người"]]);
  const a = await c.query(`SELECT party_key, status, source FROM parties ORDER BY 1`);
  const b = await c.query(SQL_NGUOI.biDanh);
  return bam([a.rows, b.rows.sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)))]);
}

async function moiVung(c) {
  await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
                 VALUES ('project', 'Q Khu Một', 'q-khu-mot', '{}', '{}', 'SubdivisionName', '{}') ON CONFLICT (slug) DO NOTHING`);
  return (await c.query(`SELECT id FROM asset_nodes WHERE slug = 'q-khu-mot'`)).rows[0].id;
}

test("DBV-AC-1 lược đồ 082: chỉ thêm, khoá đúng khuôn, phát biểu vật thể; danh bạ Người và phân xử tin không đổi", async () => {
  // Dấu lược đồ: áp 082 lần hai không đổi lược đồ.
  const dau1 = await dau(db);
  apTep(TEN, process.env.DBV_MIG_THAY ?? join(GOC, "db/migrations/082_danh_ba_vat_the.sql"));
  assert.equal(await dau(db), dau1, "DBV-AC-1 áp 082 lần hai đổi lược đồ");

  // Quan hệ: ca Người và phân xử tin cho cùng tập dòng trước và sau 082.
  const nguoiTruoc = await caNguoi(dbTruoc);
  const tinTruoc = await phanXuTin(dbTruoc);
  assert.equal(await caNguoi(db), nguoiTruoc, "DBV-AC-1 ca Người đổi sau 082");
  assert.equal(await phanXuTin(db), tinTruoc, "DBV-AC-1 phân xử tin đổi sau 082");

  // Vật thể mồi.
  const khu = await moiVung(db);
  const bld = K("bld", 1);
  const stk = K("stk", 1);
  const unt = K("unt", 1);
  await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                  VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh') ON CONFLICT DO NOTHING`, [bld, khu]);
  await db.query(`INSERT INTO stacks (stack_key, building_key, catalog_tier) VALUES ($1, $2, 'xac_minh') ON CONFLICT DO NOTHING`, [stk, bld]);
  await db.query(`INSERT INTO units (unit_key, building_key, stack_key, floor, sub_id, catalog_tier)
                  VALUES ($1, $2, $3, '7', $3 || ':7', 'xac_minh') ON CONFLICT DO NOTHING`, [unt, bld, stk]);

  // Ma trận viết trước: mọi thao tác phá phải bị từ chối với «chỉ thêm».
  const MA_TRAN = [
    ["buildings", `DELETE FROM buildings WHERE building_key = '${bld}'`],
    ["buildings", `TRUNCATE buildings CASCADE`],
    ["buildings", `UPDATE buildings SET building_key = '${K("bld", 2)}' WHERE building_key = '${bld}'`],
    ["buildings", `UPDATE buildings SET upi = 'urn:onehub:upi:1:VN:VN-SG:${bld}', iso_region = 'VN-SG' WHERE building_key = '${bld}'`],
    ["buildings", `UPDATE buildings SET created_at = now() - interval '1 day' WHERE building_key = '${bld}'`],
    ["stacks", `DELETE FROM stacks WHERE stack_key = '${stk}'`],
    ["stacks", `TRUNCATE stacks CASCADE`],
    ["stacks", `UPDATE stacks SET building_key = building_key, stack_key = '${K("stk", 2)}' WHERE stack_key = '${stk}'`],
    ["units", `DELETE FROM units WHERE unit_key = '${unt}'`],
    ["units", `TRUNCATE units`],
    ["units", `UPDATE units SET sub_id = '${unt}', stack_key = NULL WHERE unit_key = '${unt}'`],
    ["units", `UPDATE units SET floor = '8', sub_id = '${stk}:8' WHERE unit_key = '${unt}'`],
  ];
  let soCa = 0;
  for (const [bang, cau] of MA_TRAN) {
    await assert.rejects(db.query(cau), /chỉ thêm/, `DBV-AC-1 xoá được vật thể: ${bang} · ${cau.slice(0, 40)}`);
    soCa++;
  }
  assert.equal(soCa, MA_TRAN.length);
  // Đổi trạng thái là lối duy nhất mở.
  await db.query(`UPDATE units SET status = 'retired' WHERE unit_key = $1`, [unt]);

  // Khoá sai khuôn, UPI lệch khoá: CHECK từ chối.
  await assert.rejects(db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                                 VALUES ('bld_sai', $1, 'urn:onehub:upi:1:VN:VN-HN:bld_sai', 'VN-HN', 'xac_minh')`, [khu]), /check/i);
  await assert.rejects(db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                                 VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $3::text, 'VN-HN', 'xac_minh')`,
                                [K("bld", 3), khu, K("bld", 4)]), /buildings_upi_khop_khoa/);

  // Bí danh mã tại nguồn nhận; trùng (cùng nguồn, cùng giá trị) bị từ chối.
  await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'q9/QA6', 'S08')`, [bld]);
  await assert.rejects(db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'q9/QA6', 'S08')`,
                                [K("bld", 5)]), /registry_aliases_ma_nguon_uq/);
  // Bí danh Người trùng vẫn bị từ chối sau 082.
  await assert.rejects(
    db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'sdt_bam', 'qbam1', 'S03')`, [K("pty", 2)]),
    /registry_aliases_dinh_danh_uq/,
    "DBV-AC-1 bí danh Người trùng",
  );

  // Phát biểu vật thể: nhận Building + khoá bld; từ chối ghép lệch.
  await db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, observed_at, run_id)
                  VALUES ('Building', $1, 'builder_name', 'Q Chủ Đầu Tư', 'fact', 'hitl', now(), 'dbv')`, [bld]);
  await assert.rejects(db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, observed_at, run_id)
                                 VALUES ('Property', $1, 'block_raw', 'QA6', 'observed', 'parser', now(), 'dbv')`, [bld]),
                       /resource không khớp khoá/, "DBV-AC-1 nhận phát biểu resource không khớp khoá");
  await assert.rejects(db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, observed_at, run_id)
                                 VALUES ('Building', 'S03:qp1', 'builder_name', 'x', 'fact', 'hitl', now(), 'dbv')`),
                       /resource không khớp khoá/, "DBV-AC-1 nhận phát biểu resource không khớp khoá");
  await assert.rejects(db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, observed_at, run_id)
                                 VALUES ('Building', $1, 'builder_name', 'y', 'fact', 'registry_inherit', now(), 'dbv')`, [bld]),
                       /registry_inherit chỉ đi với lớp inferred/);
  await assert.rejects(db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, observed_at, run_id)
                                 VALUES ('Property', 'S03:qp1', 'builder_name', 'y', 'fact', 'hitl', now(), 'dbv')`),
                       /không thuộc resource/);

  // Sau khi có phát biểu vật thể, phân xử tin vẫn cho đúng tập dòng như trước 082.
  assert.equal(await phanXuTin(db), tinTruoc, "DBV-AC-1 phân xử tin thấy phát biểu vật thể");
});

// ---------------- Lệnh dựng trên fixture tổng hợp (DBV-AC-3…12) ----------------
import { execFile } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

const chay = promisify(execFile);
const LENH = process.env.DBV_LENH ?? join(GOC, "pipeline/danh-ba-vat-the.mjs");
const KHU_FIX = "q-khu-mot,q-khu-hai";
const TAM = mkdtempSync(join(tmpdir(), "dbv-"));

/** Chạy lệnh dựng thật qua đường lệnh; trả tổng kết. */
async function dungLenh(url, { tuDien = null } = {}) {
  const args = [LENH, "--db", url, "--khu", KHU_FIX];
  if (tuDien) args.push("--tu-dien", tuDien);
  const { stdout } = await chay(process.execPath, args, { cwd: join(GOC, "pipeline") });
  const dong = stdout.trim().split("\n").find((l) => l.startsWith("tong_ket "));
  assert.ok(dong, `lệnh không in tong_ket: ${stdout}`);
  return JSON.parse(dong.slice("tong_ket ".length));
}

const S08 = (snap, p, ma, sub = null) => ({ snap, p, ma, sub });
// q1, q2: khu một (Hà Nội), cùng mã ở hai dự án; q1 có lưới 3 trục × 10 tầng chỉ 7 mã + một mã lạ.
// q3: khu hai (TP.HCM), phân khu QPK; q4: khu hai, toà Q12 trùng tên toà của khu một.
const FIX_S08 = [
  ...["Q12-01-01", "Q12-02-01", "Q12-03-02", "Q12-04-02", "Q12-05-03", "Q12-09-03", "Q12-10-03", "Q12A-QQQQ-02"].map((m) => S08("s1", "q1", m)),
  S08("s1", "q2", "Q12-01-01"),
  S08("s1", "q3", "QX102.01", "QPK"), S08("s1", "q3", "QX1002.17", "QPK"),
  S08("s1", "q4", "Q12-03-01"),
];

async function napFixture(c) {
  await c.query(`INSERT INTO areas (id, region_type, name, country_code) VALUES
    ('q-p1', 'submarket', 'Q Phường Một', 'VN'), ('q-p2', 'submarket', 'Q Phường Hai', 'VN'),
    ('q-p3', 'submarket', 'Q Phường Ba', 'VN'), ('q-m1', 'market', 'Q Thị Trường', 'VN') ON CONFLICT DO NOTHING`);
  await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta) VALUES
    ('project', 'Q Khu Một', 'q-khu-mot', '{}', '{q-m1,q-p1}', 'SubdivisionName', '{"city":"hanoi"}'),
    ('project', 'Q Khu Hai', 'q-khu-hai', '{}', '{q-p2,q-p3}', 'SubdivisionName', '{"city":"hcmc"}') ON CONFLICT (slug) DO NOTHING`);
  const id = Object.fromEntries((await c.query(`SELECT slug, id::int AS id FROM asset_nodes WHERE slug LIKE 'q-%'`)).rows.map((r) => [r.slug, r.id]));
  await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta, parent_id)
                 VALUES ('building', 'Q Phân Khu', 'q-phan-khu', '{qpk}', '{q-p3}', 'ComplexName', '{}', $1) ON CONFLICT (slug) DO NOTHING`, [id["q-khu-hai"]]);
  id["q-phan-khu"] = (await c.query(`SELECT id::int AS id FROM asset_nodes WHERE slug = 'q-phan-khu'`)).rows[0].id;
  await c.query(`INSERT INTO s08_project_links (project_id, asset_node_id, status) VALUES ('q1', $1, 'noi'), ('q2', $1, 'noi'),
                 ('q3', $2, 'noi'), ('q4', $2, 'noi') ON CONFLICT DO NOTHING`, [id["q-khu-mot"], id["q-khu-hai"]]);
  for (const r of FIX_S08) await themS08(c, r);
  return id;
}
// stg_s08_inventory: khoá chính (source_id, snapshot_id), snapshot_id trỏ airbnb_snapshots (040) — lần chụp tổng hợp q-s1, q-s2.
async function themS08(c, r) {
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'q', 'S08', '{}') ON CONFLICT DO NOTHING`, [`q-${r.snap}`]);
  await c.query(
    `INSERT INTO stg_s08_inventory (source_id, snapshot_id, project_id, project_type, state, product_code, subdivision_name, payload)
     VALUES ($1, $2, $3, 'high_rise', 'notSold', $4, $5, '{}')`, [`${r.p}:${r.ma}`, `q-${r.snap}`, r.p, r.ma, r.sub]);
}

/** DB thử mới cho một ca, nạp fixture. */
async function dbCa(hau) {
  const ten = `${TEN}_${hau}`;
  const url = await taoDbThu(ten);
  const c = new pg.Client({ connectionString: url });
  const dong = async () => { await c.end().catch(() => {}); await xoaDbThu(ten); };
  try {
    await c.connect();
    const id = await napFixture(c);
    return { ten, url, c, id, dong };
  } catch (e) {
    await dong();
    throw e;
  }
}
const tapKhoa = async (c) => (await c.query(
  `SELECT 'b' AS cap, building_key AS k FROM buildings UNION ALL SELECT 's', stack_key FROM stacks UNION ALL SELECT 'u', unit_key FROM units ORDER BY 1, 2`)).rows;

test("DBV-AC-3 toà, trục, căn từ S08: khoá, UPI theo khu, cha vùng, SubId; phạm vi dự án", async () => {
  const d = await dbCa("a3");
  try {
    const tk = await dungLenh(d.url);
    const { rows: toa } = await d.c.query(
      `SELECT b.building_key, b.upi, b.iso_region, b.region_node_id::int AS vung, a.value
         FROM buildings b JOIN registry_aliases a ON a.object_key = b.building_key AND a.kind = 'ma_nguon' ORDER BY a.value`);
    assert.deepEqual(toa.map((t) => t.value), ["q1/Q12", "q2/Q12", "q3/QX1", "q3/QX10", "q4/Q12"], "DBV-AC-3 hai dự án chung khoá");
    for (const t of toa) {
      assert.match(t.building_key, /^bld_[0-9A-HJKMNP-TV-Z]{26}$/);
      assert.equal(t.upi, `urn:onehub:upi:1:VN:${t.iso_region}:${t.building_key}`);
    }
    const theo = Object.fromEntries(toa.map((t) => [t.value, t]));
    assert.equal(theo["q1/Q12"].iso_region, "VN-HN");
    assert.equal(theo["q4/Q12"].iso_region, "VN-SG");
    assert.notEqual(theo["q1/Q12"].building_key, theo["q4/Q12"].building_key, "DBV-AC-3 toà hai khu chung khoá");
    assert.equal(theo["q3/QX1"].vung, d.id["q-phan-khu"]);
    assert.equal(theo["q4/Q12"].vung, d.id["q-khu-hai"]);
    assert.equal(theo["q1/Q12"].vung, d.id["q-khu-mot"]);
    const { rows: can } = await d.c.query(`SELECT u.sub_id, u.stack_key, u.floor FROM units u`);
    for (const u of can) assert.equal(u.sub_id, `${u.stack_key}:${u.floor}`);
    assert.equal(can.length, 7 + 1 + 2 + 1);
    assert.deepEqual(tk.khu["q-khu-mot"], { toa: 2, truc: 4, can: 8, ti_le_tach: 0.8889, ma: 9 });
    assert.deepEqual(tk.ly_do, { "khong-khop-khuon": 1 });
    const { rows: [{ n }] } = await d.c.query(
      `SELECT count(DISTINCT project_id)::int AS n FROM s08_project_links l WHERE status = 'noi' AND NOT EXISTS (
         SELECT 1 FROM registry_aliases a WHERE a.kind = 'ma_nguon' AND a.value LIKE l.project_id || '/%')`);
    assert.equal(n, 0, "DBV-AC-3 dự án không có toà");
  } finally { await d.dong(); }
});

test("DBV-AC-4 dựng lại hai lần: 0 khoá mới, tập khoá và bí danh không đổi", async () => {
  const d = await dbCa("a4");
  try {
    const t1 = await dungLenh(d.url);
    assert.ok(t1.khoa_moi > 0);
    const k1 = await tapKhoa(d.c);
    const b1 = (await d.c.query(`SELECT count(*)::int AS n FROM registry_aliases`)).rows[0].n;
    const t2 = await dungLenh(d.url);
    assert.equal(t2.khoa_moi, 0, "DBV-AC-4 dựng lại đổi khoá");
    assert.deepEqual(await tapKhoa(d.c), k1, "DBV-AC-4 dựng lại đổi khoá");
    assert.equal((await d.c.query(`SELECT count(*)::int AS n FROM registry_aliases`)).rows[0].n, b1);
    assert.deepEqual(t2.khu, t1.khu);
  } finally { await d.dong(); }
});

test("DBV-AC-4 hai tiến trình dựng cùng lúc không đúc trùng khoá", async () => {
  const d = await dbCa("a4b");
  try {
    const [x, y] = await Promise.all([dungLenh(d.url), dungLenh(d.url)]);
    assert.equal(Math.min(x.khoa_moi, y.khoa_moi), 0);
    const { rows: [{ n }] } = await d.c.query(`SELECT count(*)::int AS n FROM buildings`);
    assert.equal(n, 5);
  } finally { await d.dong(); }
});

test("DBV-AC-5 lưới 3 trục × 10 tầng chỉ 7 mã: đúng 7 căn, mọi căn có bí danh, ô trống không có khoá", async () => {
  const d = await dbCa("a5");
  try {
    await dungLenh(d.url);
    const { rows } = await d.c.query(
      `SELECT u.unit_key FROM units u JOIN registry_aliases a ON a.object_key = u.building_key AND a.value = 'q1/Q12'`);
    assert.equal(rows.length, 7, `DBV-AC-5 đúc căn không bằng chứng: ${rows.length - 7}`);
    const { rows: [{ n }] } = await d.c.query(`SELECT count(*)::int AS n FROM units u WHERE NOT EXISTS (
      SELECT 1 FROM registry_aliases a WHERE a.object_key = u.unit_key AND a.kind = 'ma_nguon' AND a.retired_at IS NULL)`);
    assert.equal(n, 0, "DBV-AC-5 căn không có bí danh");
  } finally { await d.dong(); }
});

test("DBV-AC-6 lần chụp sau thiếu một mã, thêm một mã: căn vắng giữ khoá và trạng thái, mã mới có khoá mới", async () => {
  const d = await dbCa("a6");
  try {
    await dungLenh(d.url);
    const truoc = (await d.c.query(`SELECT a.object_key FROM registry_aliases a WHERE a.value = 'q1/Q12-10-03'`)).rows[0].object_key;
    const nTruoc = (await d.c.query(`SELECT (SELECT count(*) FROM units)::int + (SELECT count(*) FROM registry_aliases)::int AS n`)).rows[0].n;
    // Lần chụp sau: staging nạp lại chỉ còn lần chụp mới (thiếu Q12-10-03, thêm Q12-11-03).
    await d.c.query(`DELETE FROM stg_s08_inventory WHERE project_id = 'q1'`);
    for (const m of ["Q12-01-01", "Q12-02-01", "Q12-03-02", "Q12-04-02", "Q12-05-03", "Q12-09-03", "Q12-11-03"]) await themS08(d.c, S08("s2", "q1", m));
    const tk = await dungLenh(d.url);
    assert.equal(tk.khoa_moi, 1);
    const { rows: [u] } = await d.c.query(`SELECT u.status, a.retired_at FROM units u JOIN registry_aliases a ON a.object_key = u.unit_key
                                            WHERE u.unit_key = $1 AND a.kind = 'ma_nguon'`, [truoc]);
    assert.deepEqual(u, { status: "active", retired_at: null }, "DBV-AC-6 căn vắng bị nghỉ");
    assert.equal((await d.c.query(`SELECT count(*)::int AS n FROM registry_aliases WHERE value = 'q1/Q12-11-03'`)).rows[0].n, 1);
    const nSau = (await d.c.query(`SELECT (SELECT count(*) FROM units)::int + (SELECT count(*) FROM registry_aliases)::int AS n`)).rows[0].n;
    assert.ok(nSau > nTruoc);
  } finally { await d.dong(); }
});

test("DBV-AC-8 phát biểu toà trên tin: ma trận năm ca qua field_assertions và sổ nhóm thật", async () => {
  const d = await dbCa("a8");
  try {
    // Nhóm g1 khai đúng khu một; nhóm g9 không khai khu.
    await d.c.query(`INSERT INTO collection_units (source_code, group_key, name, unit_type, project_node_ids, status, enabled)
                     VALUES ('S03', 'g1', 'Q nhóm một', 'nhom', $1, 'active', true),
                            ('S03', 'g2', 'Q nhóm hai', 'nhom', $1, 'active', true),
                            ('S03', 'g3', 'Q nhóm ba', 'nhom', $1, 'active', true),
                            ('S03', 'g9', 'Q nhóm chín', 'nhom', '{}', 'active', true)`, [[String(d.id["q-khu-mot"])]]);
    const BAI = [ // [post, nhóm, người, tên toà]
      ["b1", "g1", "n1", "q12"],   // (a) khớp đúng một toà Q12 của khu một… nhưng khu một có Q12 ở hai dự án
      ["b2", "g1", "n1", "QZ9"],   // (c) không khớp, hai người
      ["b3", "g1", "n2", "QZ9"],
      ["b4", "g1", "n1", "QY9"],   // (d) không khớp, ba người ba nhóm
      ["b5", "g2", "n2", "QY9"],
      ["b6", "g3", "n3", "QY9"],
      ["b7", "g9", "n1", "Q12"],   // (e) nhóm không có khu
    ];
    await d.c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('z1', 'q', 'S03', '{}') ON CONFLICT DO NOTHING`);
    for (const [post, nhom, nguoi, ten] of BAI) {
      await d.c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, sender_id, conversation_id, captured_at)
                       VALUES ($1, 'z1', 'q', $2, $3, now())`, [post, nguoi, nhom]);
      await d.c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at, run_id)
                       VALUES ('S03:' || $1, 'block_raw', $2, 'observed', 'parser', now(), 'dbv')`, [post, ten]);
    }
    const tk = await dungLenh(d.url);
    // (b) Q12 ở khu một khớp hai toà (q1, q2) → ứng viên, không bí danh từ tin.
    const { rows: tuTin } = await d.c.query(`SELECT count(*)::int AS n FROM registry_aliases WHERE kind = 'ten' AND source = 'S03'`);
    assert.equal(tuTin[0].n, 0, "DBV-AC-8 nhận bí danh khi khớp hai toà");
    assert.equal(tk.ung_vien, 3, "DBV-AC-8 số ứng viên");
    assert.equal(tk.bi_danh_ten_tu_tin, 0);
    const { rows: [{ n }] } = await d.c.query(`SELECT count(*)::int AS n FROM buildings`);
    assert.equal(n, 5, "DBV-AC-8 đúc toà từ tin");
    // (a) thêm một nhóm khai khu hai: «q12» khớp đúng một toà Q12 (q4) → bí danh tên nguồn S03.
    await d.c.query(`INSERT INTO collection_units (source_code, group_key, name, unit_type, project_node_ids, status, enabled)
                     VALUES ('S03', 'g4', 'Q nhóm bốn', 'nhom', $1, 'active', true)`, [[String(d.id["q-khu-hai"])]]);
    await d.c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, sender_id, conversation_id, captured_at) VALUES ('b8', 'z1', 'q', 'n4', 'g4', now())`);
    await d.c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at, run_id)
                     VALUES ('S03:b8', 'block_raw', 'q 12', 'observed', 'parser', now(), 'dbv')`);
    const tk2 = await dungLenh(d.url);
    assert.equal(tk2.bi_danh_ten_tu_tin, 1);
    const { rows: bd } = await d.c.query(`SELECT a.object_key, x.value AS ma FROM registry_aliases a
      JOIN registry_aliases x ON x.object_key = a.object_key AND x.kind = 'ma_nguon' WHERE a.kind = 'ten' AND a.source = 'S03'`);
    assert.deepEqual(bd.map((r) => r.ma), ["q4/Q12"]);
    // Cách viết trùng tên S08 («Q12») không thành bí danh mới — ràng buộc duy nhất của bí danh tên.
    await d.c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, sender_id, conversation_id, captured_at) VALUES ('b9', 'z1', 'q', 'n5', 'g4', now())`);
    await d.c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at, run_id)
                     VALUES ('S03:b9', 'block_raw', 'Q12', 'observed', 'parser', now(), 'dbv')`);
    assert.equal((await dungLenh(d.url)).bi_danh_ten_tu_tin, 0);
    assert.equal(tk2.khoa_moi, 0, "DBV-AC-8 đúc toà từ tin");
  } finally { await d.dong(); }
});

test("DBV-AC-9 chủ đầu tư từ từ điển: một phát biểu fact/hitl mỗi toà có dòng, chạy lại không nhân, đổi giá trị thì thêm", async () => {
  const d = await dbCa("a9");
  try {
    const tep = join(TAM, "chu-dau-tu.json");
    writeFileSync(tep, JSON.stringify({ _ghi_chu: "q", q1: "Q CĐT Một", q3: "Q CĐT Ba" }));
    const bamTep = createHash("sha256").update(readFileSync(tep)).digest("hex");
    await dungLenh(d.url, { tuDien: tep });
    const doc = async () => (await d.c.query(
      `SELECT x.value AS toa, f.value, f.evidence_tier, f.method, f.evidence->>'ban' AS ban, f.retracted_at
         FROM field_assertions f JOIN registry_aliases x ON x.object_key = f.subject_key AND x.kind = 'ma_nguon'
        WHERE f.resource_name = 'Building' AND f.field = 'builder_name' ORDER BY 1, 2`)).rows;
    const r1 = await doc();
    assert.deepEqual(r1.map((r) => [r.toa, r.value]), [["q1/Q12", "Q CĐT Một"], ["q3/QX1", "Q CĐT Ba"], ["q3/QX10", "Q CĐT Ba"]]);
    for (const r of r1) assert.deepEqual([r.evidence_tier, r.method, r.ban], ["fact", "hitl", bamTep]);
    await dungLenh(d.url, { tuDien: tep });
    assert.equal((await doc()).length, 3, "DBV-AC-9 nhân phát biểu");
    writeFileSync(tep, JSON.stringify({ q1: "Q CĐT Khác", q3: "Q CĐT Ba" }));
    await dungLenh(d.url, { tuDien: tep });
    const r3 = await doc();
    assert.equal(r3.length, 4);
    assert.ok(r3.some((r) => r.value === "Q CĐT Một" && r.retracted_at === null), "phát biểu cũ còn nguyên (chỉ thêm)");
    const { rows: cot } = await d.c.query(`SELECT table_name, column_name FROM information_schema.columns
      WHERE table_name IN ('buildings', 'stacks', 'units') AND (column_name ~ 'name|ten|builder|chu_dau_tu')`);
    assert.deepEqual(cot, [], "bảng vật thể không có cột tên hay chủ đầu tư");
  } finally { await d.dong(); }
});

test("DBV-AC-10 ba dòng asset_nodes phân khu giữ nguyên; câu đọc của agent/src/enrich/run.ts vẫn trả ba dòng", async () => {
  const d = await dbCa("a10");
  try {
    const CAU = readFileSync(join(GOC, "agent/src/enrich/run.ts"), "utf8").match(/`(SELECT slug, name, aliases FROM asset_nodes WHERE node_type = 'building')`/)?.[1];
    assert.ok(CAU, "không rút được câu đọc phân khu từ run.ts");
    const ba = async () => (await d.c.query(`SELECT * FROM asset_nodes WHERE slug LIKE 'gpk-%' ORDER BY id`)).rows;
    const truoc = await ba();
    const truocRun = (await d.c.query(CAU)).rows;
    assert.equal(truoc.length, 3);
    await dungLenh(d.url);
    assert.deepEqual(await ba(), truoc, "DBV-AC-10 ba dòng phân khu đổi");
    const sauRun = (await d.c.query(CAU)).rows.filter((r) => r.slug.startsWith("gpk-"));
    assert.deepEqual(sauRun, truocRun.filter((r) => r.slug.startsWith("gpk-")), "DBV-AC-10 enrich mất từ điển phân khu");
    assert.equal(sauRun.length, 3, "DBV-AC-10 enrich mất từ điển phân khu");
  } finally { await d.dong(); }
});

test("DBV-AC-12 phường của toà: khu một phường, khu hai phường, phân khu một phường, cấp market bỏ qua; tin không đổi", async () => {
  const d = await dbCa("a12");
  try {
    const bamTin = async () => bam((await d.c.query(`SELECT * FROM field_assertions WHERE resource_name = 'Property' ORDER BY id`)).rows);
    await d.c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at, run_id)
                     VALUES ('S03:qq', 'block_raw', 'Q12', 'observed', 'parser', now(), 'dbv')`);
    const tin0 = await bamTin();
    const tk = await dungLenh(d.url);
    const { rows } = await d.c.query(`SELECT x.value AS toa, f.value AS phuong, f.evidence_tier, f.method, f.evidence->>'nut_vung' AS nut
      FROM field_assertions f JOIN registry_aliases x ON x.object_key = f.subject_key AND x.kind = 'ma_nguon'
      WHERE f.field = 'area_id' ORDER BY 1`);
    assert.deepEqual(rows.map((r) => [r.toa, r.phuong]),
      [["q1/Q12", "q-p1"], ["q2/Q12", "q-p1"], ["q3/QX1", "q-p3"], ["q3/QX10", "q-p3"]],
      "DBV-AC-12 đoán phường khu nhiều phường");
    for (const r of rows) assert.deepEqual([r.evidence_tier, r.method], ["inferred", "registry_inherit"]);
    assert.equal(Number(rows.find((r) => r.toa === "q3/QX1").nut), d.id["q-phan-khu"]);
    assert.deepEqual(tk.ly_do_phuong, { "khu-nhieu-phuong": 1 });
    await dungLenh(d.url);
    assert.equal((await d.c.query(`SELECT count(*)::int AS n FROM field_assertions WHERE field = 'area_id'`)).rows[0].n, 4);
    assert.equal(await bamTin(), tin0, "phát biểu tin đổi");
  } finally { await d.dong(); }
});
