// danh-ba-vat-the.itest.mjs — hồ sơ danh-ba-toa-truc-can (DB1): ca «DBV-AC-*» trên DB thử dựng từ db/migrations.
// DB thử oneinvest_dbv_<pid> (đủ migration), oneinvest_dbv_<pid>_truoc (tới 081) và oneinvest_dbv_<pid>_082 (tới 082) ở :5433, tạo đầu tệp, xoá
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
// DB dừng ở 082: phép đo «áp 082 lần hai không đổi lược đồ» chỉ đúng nghĩa ở đây — migration sau (095) đổi CHECK mà 082 đặt.
const TEN_082 = `${TEN}_082`;
const CAU_DAU = readFileSync(join(GOC, "db/dau-luoc-do.sql"), "utf8");
const K = (tienTo, n) => `${tienTo}_${String(n).padStart(26, "0")}`;

let db;
let dbTruoc;
let db082;
before(async () => {
  const [u, uTruoc, u082] = await Promise.all([taoDbThu(TEN), taoDbThu(TEN_TRUOC, { hetSo: 81 }), taoDbThu(TEN_082, { hetSo: 82 })]);
  db = new pg.Client({ connectionString: u });
  dbTruoc = new pg.Client({ connectionString: uTruoc });
  db082 = new pg.Client({ connectionString: u082 });
  await Promise.all([db.connect(), dbTruoc.connect(), db082.connect()]);
});
after(async () => {
  await Promise.all([db?.end().catch(() => {}), dbTruoc?.end().catch(() => {}), db082?.end().catch(() => {})]);
  await Promise.all([xoaDbThu(TEN), xoaDbThu(TEN_TRUOC), xoaDbThu(TEN_082)]);
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
  // Dấu lược đồ: áp 082 lần hai không đổi lược đồ — đo trên DB dừng ở 082.
  const dau1 = await dau(db082);
  apTep(TEN_082, process.env.DBV_MIG_THAY ?? join(GOC, "db/migrations/082_danh_ba_vat_the.sql"));
  assert.equal(await dau(db082), dau1, "DBV-AC-1 áp 082 lần hai đổi lược đồ");

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
  // Luật một tỉnh (DA1, isoCuaKhu): phường quy về thị trường qua parent_id, thị trường ra ISO qua admin_code → iso_regions
  // (088: 01 → VN-HN, 79 → VN-SG). Khu một: q-m1 + phường của q-m1; khu hai: hai phường của q-m2.
  await c.query(`INSERT INTO areas (id, region_type, name, country_code, admin_code) VALUES
    ('q-m1', 'market', 'Q Thị Trường', 'VN', '01'), ('q-m2', 'market', 'Q Thị Trường Hai', 'VN', '79') ON CONFLICT DO NOTHING`);
  await c.query(`INSERT INTO areas (id, region_type, name, country_code, parent_id) VALUES
    ('q-p1', 'submarket', 'Q Phường Một', 'VN', 'q-m1'), ('q-p2', 'submarket', 'Q Phường Hai', 'VN', 'q-m2'),
    ('q-p3', 'submarket', 'Q Phường Ba', 'VN', 'q-m2') ON CONFLICT DO NOTHING`);
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
    // method theo hợp đồng DA1 đã ký: tệp từ điển là nguồn, không phải người duyệt → source_field.
    for (const r of r1) assert.deepEqual([r.evidence_tier, r.method, r.ban], ["fact", "source_field", bamTep]);
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

// ================= DB1b dung-danh-ba-may-thu (DBM-AC-*) =================
// Mọi ca chạy trên DB thử ở :5433. Chiều đỏ dùng BẢN CHÉP tệp lệnh đặt cạnh tệp thật (import tương đối giữ nguyên), không
// biến môi trường nào trong tệp chạy thật. Mỗi ca: hàm soát trả danh sách thông điệp ghim; tệp thật → rỗng, bản chép → có.
import { spawnSync } from "node:child_process";
import { rmSync, symlinkSync, unlinkSync } from "node:fs";
import { MAY_CHU, thuMucMigration } from "./db-thu-dbv.mjs";
import { demTheoKhu, moiKhoa, nhanSo, soDem } from "../lib/danh-ba-vat-the.mjs";

const RBG = join(GOC, "pipeline/refresh-bait-gap.mjs");
const BAN_CHEP = [];
after(() => { for (const f of BAN_CHEP) { try { unlinkSync(f); } catch { /* đã xoá */ } } });

/** Bản chép tệp lệnh cạnh tệp thật, thay từng cặp (phải khớp đúng một lần). */
function banChep(ten, thay) {
  let src = readFileSync(LENH, "utf8");
  for (const [a, b] of thay) {
    assert.ok(src.includes(a), `bản chép ${ten}: không thấy «${a.slice(0, 50)}»`);
    src = src.replace(a, b);
  }
  const f = join(GOC, "pipeline", `.dbm-${ten}-${process.pid}.mjs`);
  writeFileSync(f, src);
  BAN_CHEP.push(f);
  return f;
}

/** Chạy một tệp node, không ném khi thoát ≠ 0. */
function chayTep(tep, args = [], env = {}) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [tep, ...args], { cwd: join(GOC, "pipeline"), env: { ...process.env, ...env }, encoding: "utf8", timeout: 300000 });
  return { code: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "", ms: Date.now() - t0 };
}
const tongKet = (out) => {
  const d = out.split("\n").find((l) => l.startsWith("tong_ket "));
  return d ? JSON.parse(d.slice("tong_ket ".length)) : null;
};
// v = số dòng ba bảng vật thể; b = bí danh của vật thể (không tính bí danh Người — bước đêm dựng Người hợp lệ).
const demBang = async (c) => (await c.query(`SELECT (SELECT count(*) FROM buildings) + (SELECT count(*) FROM stacks)
  + (SELECT count(*) FROM units) AS v, (SELECT count(*) FROM registry_aliases WHERE object_key ~ '^(bld|stk|unt)_') AS b`)).rows[0];

/** DB trên máy này, tên KHÔNG khớp oneinvest_<việc> (đóng vai máy thu), đủ migration + fixture. */
async function dbKhac(hau) {
  const ten = `dbvm_${process.pid}_${hau}`;
  const qt = async (sql) => { const a = new pg.Client({ connectionString: `${MAY_CHU}/postgres` }); await a.connect(); try { await a.query(sql); } finally { await a.end(); } };
  await qt(`DROP DATABASE IF EXISTS ${ten} WITH (FORCE)`);
  await qt(`CREATE DATABASE ${ten}`);
  const url = `${MAY_CHU}/${ten}`;
  const dir = thuMucMigration();
  try {
    execFileSyncNode([join(GOC, "scripts/ci-db-init.mjs"), "--migrations", dir], { DATABASE_URL: url });
  } finally { rmSync(dir, { recursive: true, force: true }); }
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  const id = await napFixture(c);
  return { url, c, id, dong: async () => { await c.end().catch(() => {}); await qt(`DROP DATABASE IF EXISTS ${ten} WITH (FORCE)`); } };
}
function execFileSyncNode(args, env) {
  const r = spawnSync(process.execPath, args, { env: { ...process.env, ...env }, encoding: "utf8" });
  assert.equal(r.status, 0, `ci-db-init: ${r.stderr}`);
}

// ---------- DBM-AC-1 lệnh thật: cờ --db-that, rào --sao-luu ----------
async function soatAC1(lenh) {
  const loi = [];
  const tam = mkdtempSync(join(tmpdir(), "dbm-sl-"));
  const tepDung = join(tam, "dump.sql"); writeFileSync(tepDung, "-- sao lưu tổng hợp\n");
  const tepRong = join(tam, "rong.sql"); writeFileSync(tepRong, "");
  const a = await dbCa("m1a");
  const k = await dbKhac("m1");
  try {
    const ra = chayTep(lenh, ["--db", a.url, "--khu", KHU_FIX]);
    if (ra.code !== 0 || !(tongKet(ra.stdout)?.khoa_moi > 0)) loi.push(`DBM-AC-1 DB thử không ghi được: ${ra.code} ${ra.stderr}`);
    const truoc = await demBang(k.c);
    const rb = chayTep(lenh, ["--db", k.url, "--khu", KHU_FIX]);
    const sauB = await demBang(k.c);
    if (rb.code !== 2 || JSON.stringify(sauB) !== JSON.stringify(truoc)) loi.push("DBM-AC-1 ghi không cờ");
    else if (!rb.stderr.includes("--db-that")) loi.push("DBM-AC-1 thông điệp thiếu --db-that");
    const rc = chayTep(lenh, ["--db", k.url, "--khu", KHU_FIX, "--db-that"]);
    if (rc.code !== 2 || JSON.stringify(await demBang(k.c)) !== JSON.stringify(truoc)) loi.push("DBM-AC-1 lần đầu không sao lưu");
    else if (!rc.stderr.includes("--sao-luu")) loi.push("DBM-AC-1 thông điệp thiếu --sao-luu");
    for (const t of [join(tam, "khong-co.sql"), tepRong, tam]) {
      const rd = chayTep(lenh, ["--db", k.url, "--khu", KHU_FIX, "--db-that", "--sao-luu", t]);
      if (rd.code !== 2 || JSON.stringify(await demBang(k.c)) !== JSON.stringify(truoc)) loi.push(`DBM-AC-1 tệp sao lưu hỏng vẫn ghi: ${t}`);
    }
    const re = chayTep(lenh, ["--db", k.url, "--khu", KHU_FIX, "--db-that", "--sao-luu", tepDung]);
    if (re.code !== 0 || !(tongKet(re.stdout)?.khoa_moi > 0)) loi.push(`DBM-AC-1 có cờ và sao lưu mà không ghi: ${re.stderr}`);
    const rf = chayTep(lenh, ["--db", k.url, "--khu", KHU_FIX, "--db-that"]);
    if (rf.code !== 0 || tongKet(rf.stdout)?.khoa_moi !== 0) loi.push(`DBM-AC-1 đã có toà mà vẫn đòi sao lưu: ${rf.stderr}`);
  } finally {
    await a.dong(); await k.dong(); rmSync(tam, { recursive: true, force: true });
  }
  return loi;
}

test("DBM-AC-1 lệnh thật: DB thử không cờ; DB khác chỉ với --db-that; lần đầu đòi --sao-luu có thật, không rỗng", async () => {
  assert.deepEqual(await soatAC1(LENH), []);
  const boDich = banChep("bo-dich", [["const kq = kiemDich(thamSoTuUrl(url), { dbThat });", "const kq = { ok: true, loai: \"thu\" };"]]);
  assert.ok((await soatAC1(boDich)).includes("DBM-AC-1 ghi không cờ"), "DBM-AC-1 thước không bắt được bản bỏ kiểm đích");
  const boSaoLuu = banChep("bo-sao-luu", [["if (soToa === 0 && !(tep && tepSaoLuuDung(tep))) {", "if (false) {"]]);
  assert.ok((await soatAC1(boSaoLuu)).includes("DBM-AC-1 lần đầu không sao lưu"), "DBM-AC-1 thước không bắt được bản bỏ rào sao lưu");
});

// ---------- DBM-AC-2 lệnh + đêm: đích ngoài máy ----------
test("DBM-AC-2 lệnh và bước đêm từ chối đích ngoài máy trước khi kết nối, không lộ mật khẩu", async () => {
  const mk = "matkhau" + "-bi-mat";
  const ngoai = "postgres://u:" + mk + "@db.abcd.supabase.co:5432/postgres";
  for (const [args, env] of [[["--db", ngoai, "--db-that"], {}], [["--db-that"], { DATABASE_URL: ngoai }]]) {
    const r = chayTep(LENH, args, env);
    assert.equal(r.code, 2, `DBM-AC-2 lệnh không thoát 2: ${r.stderr}`);
    assert.ok(r.ms < 5000, `DBM-AC-2 lệnh chờ kết nối: ${r.ms}ms`);
    assert.match(r.stderr, /đích ngoài máy này/);
    assert.ok(!r.stderr.includes(mk) && !r.stdout.includes(mk), "DBM-AC-2 lộ mật khẩu");
  }
  const { buocVatTheDem } = await import(LENH);
  const c = new pg.Client({ connectionString: "postgres://db.abcd.supabase.co:5432/postgres" });
  let soCau = 0;
  c.query = async () => { soCau++; return { rows: [] }; };
  await assert.rejects(buocVatTheDem(c, { log: () => {} }), /đích ngoài máy này/);
  assert.equal(soCau, 0, "DBM-AC-2 bước đêm truy vấn trước khi kiểm đích");
});

// ---------- DBM-AC-3 slug khu ----------
async function soatAC3(lenh) {
  const loi = [];
  const d = await dbCa("m3");
  try {
    const ra = chayTep(lenh, ["--db", d.url, "--khu", "q-khu-mot,q-khu-sai"]);
    const v = await demBang(d.c);
    if (ra.code !== 2 || Number(v.v) !== 0) loi.push("DBM-AC-3 slug sai mà xong");
    else if (!ra.stderr.includes("q-khu-sai") || /q-khu-mot/.test(ra.stderr)) loi.push(`DBM-AC-3 thông điệp không gọi đúng slug sai: ${ra.stderr}`);
    await d.c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
                     VALUES ('project', 'Q Khu Trống', 'q-khu-trong', '{}', '{q-p1}', 'SubdivisionName', '{"city":"hanoi"}')`);
    const rb = chayTep(lenh, ["--db", d.url, "--khu", "q-khu-mot,q-khu-trong"]);
    const tk = tongKet(rb.stdout);
    if (rb.code !== 0 || JSON.stringify(tk?.khu_khong_s08) !== JSON.stringify(["q-khu-trong"])) loi.push(`DBM-AC-3 khu không S08 không được gọi tên: ${rb.code} ${rb.stdout}`);
    else if (rb.stderr.split("\n").filter((l) => l.includes("q-khu-trong")).length !== 1) loi.push("DBM-AC-3 thiếu dòng cảnh báo khu không S08");
    else if (JSON.stringify(tk.khu["q-khu-mot"]) !== JSON.stringify({ toa: 2, truc: 4, can: 8, ti_le_tach: 0.8889, ma: 9 })) loi.push("DBM-AC-3 khu đúng dựng sai");
  } finally { await d.dong(); }
  return loi;
}

test("DBM-AC-3 slug khu sai: thoát 2 gọi tên, không ghi; khu không S08: dựng khu khác, cảnh báo một dòng", async () => {
  assert.deepEqual(await soatAC3(LENH), []);
  const boSlug = banChep("bo-slug", [["if (thieu.length) throw", "if (false) throw"]]);
  assert.ok((await soatAC3(boSlug)).includes("DBM-AC-3 slug sai mà xong"), "DBM-AC-3 thước không bắt được bản bỏ kiểm slug");
});

// ---------- DBM-AC-4 bước đêm: chưa áp 082, chưa dựng lần đầu ----------
async function soatAC4c(chayDem) {
  const loi = [];
  const d = await dbCa("m4c");
  try {
    await d.c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'q9/Q99', 'S08'), ($2, 'ma_nguon', 'q-ngoai', 'S03')`,
      [K("bld", 9), K("pty", 9)]);
    const b0 = await demBang(d.c);
    const out = await chayDem(d);
    const b1 = await demBang(d.c);
    if (Number(b1.v) !== 0) loi.push("DBM-AC-4 đêm tự dựng lần đầu");
    else if (b1.b !== b0.b) loi.push("DBM-AC-4 đêm đổi bí danh");
    else if (out.split("\n").filter((l) => l.includes("bỏ qua — chưa dựng lần đầu")).length !== 1) loi.push(`DBM-AC-4 thiếu dòng bỏ qua: ${out}`);
  } finally { await d.dong(); }
  return loi;
}
const demQuaRbg = async (d) => { const r = chayTep(RBG, [], { DATABASE_URL: d.url }); assert.equal(r.code, 0, `refresh-bait-gap: ${r.stderr}`); return r.stdout; };
const demTrucTiep = (tep) => async (d) => {
  const { buocVatTheDem } = await import(tep);
  const dong = [];
  await buocVatTheDem(d.c, { log: (s) => dong.push(s) }).catch((e) => dong.push(String(e)));
  return dong.join("\n");
};

/** Bộ dựng nhận danh sách khu rỗng: phải ném lỗi gọi tên «danh sách khu rỗng» và KHÔNG ghi dòng nào (đếm trước/sau). */
async function soatDungRong(tep) {
  const loi = [];
  const d = await dbCa("m4r");
  try {
    const { dung } = await import(tep);
    const b0 = await demBang(d.c);
    let nem = null;
    try { await dung(d.c, { khuSlugs: [] }); } catch (e) { nem = e; }
    const b1 = await demBang(d.c);
    if (Number(b1.v) !== Number(b0.v) || b1.b !== b0.b) loi.push(`DBM-AC-4 đêm rơi khu mặc định: ghi ${Number(b1.v) - Number(b0.v)} dòng vật thể`);
    else if (!nem) loi.push("DBM-AC-4 bộ dựng nhận danh sách khu rỗng mà không báo");
    else if (!String(nem.message).includes("danh sách khu rỗng")) loi.push(`DBM-AC-4 thông điệp khu rỗng sai: ${nem.message}`);
  } finally { await d.dong(); }
  return loi;
}

test("DBM-AC-4 bước đêm: chưa áp 082 hay chưa có toà thì bỏ qua một dòng, không ghi; danh sách khu rỗng bị từ chối", async () => {
  // (a) DB trước 082.
  const tenA = `${TEN}_m4a`;
  const urlA = await taoDbThu(tenA, { hetSo: 81 });
  try {
    const r = chayTep(RBG, [], { DATABASE_URL: urlA });
    assert.equal(r.code, 0, `DBM-AC-4 refresh-bait-gap đỏ trên DB trước 082: ${r.stderr}`);
    assert.equal(r.stdout.split("\n").filter((l) => l.includes("bỏ qua — DB chưa áp 082")).length, 1, "DBM-AC-4 thiếu dòng chưa áp 082");
  } finally { await xoaDbThu(tenA); }
  // (b) đủ migration, fixture S08, chưa dựng.
  const d = await dbCa("m4b");
  try {
    const out = await demQuaRbg(d);
    assert.equal(out.split("\n").filter((l) => l.includes("bỏ qua — chưa dựng lần đầu")).length, 1, "DBM-AC-4 thiếu dòng bỏ qua");
    const v = await demBang(d.c);
    assert.equal(Number(v.v), 0, "DBM-AC-4 đêm tự dựng lần đầu");
    assert.equal((await d.c.query(`SELECT count(*)::int AS n FROM registry_aliases WHERE kind = 'ma_nguon'`)).rows[0].n, 0);
  } finally { await d.dong(); }
  // Ca hàm: danh sách khu rỗng bị từ chối, không ghi (đo bằng đếm dòng trước/sau).
  assert.deepEqual(await soatDungRong(LENH), []);
  // (c) có bí danh ma_nguon, 0 toà — qua refresh-bait-gap thật.
  assert.deepEqual(await soatAC4c(demQuaRbg), []);
  // Chiều đỏ: rào đếm bí danh thay vì toà; dung nhận [] rơi về khu mặc định.
  const demBiDanh = banChep("dem-bi-danh", [["const khuSlugs = await khuDaDung(c);",
    "const khuSlugs = (await c.query(\"SELECT count(*)::int AS n FROM registry_aliases WHERE kind = 'ma_nguon'\")).rows[0].n ? [\"q-khu-mot\", \"q-khu-hai\"] : [];"]]);
  assert.ok((await soatAC4c(demTrucTiep(demBiDanh))).includes("DBM-AC-4 đêm tự dựng lần đầu"), "DBM-AC-4 thước không bắt được rào đếm bí danh");
  // Bản chép chỉ đổi rào khu rỗng của bộ dựng (rào đêm giữ nguyên) — đo bằng số dòng bộ dựng ghi ra.
  const roiMacDinh = banChep("roi-mac-dinh", [
    ["if (!Array.isArray(khuSlugs) || khuSlugs.length === 0) throw new LoiGoi(\"danh sách khu rỗng — không dựng gì\");",
      "if (!khuSlugs.length) khuSlugs = [\"q-khu-mot\", \"q-khu-hai\"];"]]);
  assert.ok((await soatDungRong(roiMacDinh)).some((l) => l.startsWith("DBM-AC-4 đêm rơi khu mặc định")), "DBM-AC-4 thước không bắt được rơi khu mặc định");
});

// ---------- DBM-AC-5 bước đêm giữ tươi khu đã dựng (kể cả phân khu) ----------
async function soatAC5(chayDem) {
  const loi = [];
  const d = await dbCa("m5");
  const tam = mkdtempSync(join(tmpdir(), "dbm-td-"));
  try {
    const td = join(tam, "chu-dau-tu.json"); writeFileSync(td, JSON.stringify({ q3: "Q Chủ Đầu Tư" }));
    // Khu hai chỉ còn dự án gắn phân khu (q3): bỏ nối q4 để đường «cha của phân khu» là đường DUY NHẤT tới khu hai.
    await d.c.query(`DELETE FROM s08_project_links WHERE project_id = 'q4'`);
    const r0 = chayTep(LENH, ["--db", d.url, "--khu", "q-khu-hai", "--tu-dien", td]);
    assert.equal(r0.code, 0, r0.stderr);
    const cdt = async () => (await d.c.query(`SELECT count(*)::int AS n FROM field_assertions WHERE field = 'builder_name'`)).rows[0].n;
    const cdt0 = await cdt();
    for (const r of [S08("s2", "q3", "QX103.01", "QPK"), S08("s2", "q1", "Q12-06-01")]) await themS08(d.c, r);
    const k0 = new Set((await tapKhoa(d.c)).map((r) => r.k));
    await chayDem(d);
    const k1 = await tapKhoa(d.c);
    const moi = k1.filter((r) => !k0.has(r.k));
    const { rows: [{ n: khuMot }] } = await d.c.query(
      `SELECT count(*)::int AS n FROM buildings WHERE region_node_id = $1`, [d.id["q-khu-mot"]]);
    const { rows: canMoi } = await d.c.query(
      `SELECT u.unit_key FROM units u JOIN registry_aliases a ON a.object_key = u.unit_key AND a.kind = 'ma_nguon' AND a.value = 'q3/QX103.01'`);
    // Kỳ vọng viết trước: mã mới q3/QX103.01 (toà QX1, trục có sẵn, tầng mới) → đúng MỘT khoá mới là căn của nó.
    const kyVong = canMoi.map((u) => `u:${u.unit_key}`).sort();
    const thuc = moi.map((r) => `${r.cap}:${r.k}`).sort();
    if (khuMot > 0) loi.push("DBM-AC-5 đêm lan sang khu chưa dựng");
    else if (canMoi.length !== 1) loi.push("DBM-AC-5 phân khu không được giữ tươi");
    else if (JSON.stringify(thuc) !== JSON.stringify(kyVong)) loi.push(`DBM-AC-5 tập khoá mới khác kỳ vọng: ${thuc.length} so với ${kyVong.length}`);
    else {
      const { rows: [v] } = await d.c.query(`SELECT b.region_node_id::int AS r FROM units u JOIN buildings b ON b.building_key = u.building_key
                                              WHERE u.unit_key = $1`, [canMoi[0].unit_key]);
      if (v.r !== d.id["q-phan-khu"]) loi.push("DBM-AC-5 căn mới không thuộc toà của phân khu");
    }
    await chayDem(d);
    if (JSON.stringify(await tapKhoa(d.c)) !== JSON.stringify(k1)) loi.push("DBM-AC-5 đêm lần hai đúc khoá");
    if ((await cdt()) !== cdt0) loi.push("DBM-AC-5 đêm ghi chủ đầu tư");
  } finally { await d.dong(); rmSync(tam, { recursive: true, force: true }); }
  return loi;
}

test("DBM-AC-5 bước đêm chỉ đúc mã mới của khu đã dựng (qua phân khu), lần hai 0 khoá, không ghi chủ đầu tư", async () => {
  assert.deepEqual(await soatAC5(demQuaRbg), []);
  const lan = banChep("lan-khu", [["const khuSlugs = await khuDaDung(c);", "const khuSlugs = [\"q-khu-mot\", \"q-khu-hai\"];"]]);
  assert.ok((await soatAC5(demTrucTiep(lan))).includes("DBM-AC-5 đêm lan sang khu chưa dựng"), "DBM-AC-5 thước không bắt được đêm lan khu");
  const thua = banChep("duc-thua", [["  const tk = await dung(c, { khuSlugs, runId: `dbv-dem-${Date.now()}`, log });",
    "  const tk = await dung(c, { khuSlugs, runId: `dbv-dem-${Date.now()}`, log });\n  { const s = (await c.query(\"SELECT building_key FROM buildings LIMIT 1\")).rows[0]; if (s) await c.query(\"INSERT INTO stacks (stack_key, building_key, catalog_tier) VALUES ($1, $2, 'xac_minh')\", [`stk_${'Z'.repeat(26)}`, s.building_key]); }"]]);
  assert.ok((await soatAC5(demTrucTiep(thua))).some((l) => l.startsWith("DBM-AC-5 tập khoá mới khác kỳ vọng")), "DBM-AC-5 thước không bắt được khoá thừa");
  const boCha = banChep("bo-cha-phan-khu", [["const khuSlugs = await khuDaDung(c);",
    "const khuSlugs = (await c.query(\"SELECT DISTINCT n.slug FROM buildings b JOIN asset_nodes n ON n.id = b.region_node_id WHERE n.node_type = 'project'\")).rows.map((r) => r.slug);"]]);
  assert.ok((await soatAC5(demTrucTiep(boCha))).includes("DBM-AC-5 phân khu không được giữ tươi"), "DBM-AC-5 thước không bắt được bỏ đường cha phân khu");
});

// ---------- DBM-AC-6 bước đêm hỏng giữa giao dịch ----------
async function moiNguoi(c) {
  await c.query(`INSERT INTO sale_offer_records (offer_id, source, originating_system_key, kind, first_seen, last_seen, seller_name, seller_phone)
                 VALUES ('offer_dbm_1', 'S05', 'q-dbm-1', 'sale', '2026-11-01', '2026-11-02', 'Q Người Bán', '+84900000001') ON CONFLICT DO NOTHING`);
}

async function soatAC6(rbg) {
  const loi = [];
  const [h, dc] = [await dbCa("m6h"), await dbCa("m6d")];
  try {
    for (const d of [h, dc]) {
      assert.equal(chayTep(LENH, ["--db", d.url, "--khu", "q-khu-mot"]).code, 0);
      await moiNguoi(d.c);
      await themS08(d.c, S08("s2", "q1", "Q15-01-01"));
    }
    await h.c.query(`CREATE FUNCTION dbm_ep_hong() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'ep-hong-dbm'; END $$`);
    await h.c.query(`CREATE TRIGGER dbm_ep_hong BEFORE INSERT ON units FOR EACH ROW EXECUTE FUNCTION dbm_ep_hong()`);
    const kH0 = await tapKhoa(h.c);
    const bH0 = (await demBang(h.c)).b;
    const rh = chayTep(rbg, [], { DATABASE_URL: h.url });
    const rd = chayTep(rbg, [], { DATABASE_URL: dc.url });
    const nguoi = async (c) => (await c.query(`SELECT count(*)::int AS n FROM parties`)).rows[0].n;
    const [nh, nd] = [await nguoi(h.c), await nguoi(dc.c)];
    if (rd.code !== 0) loi.push(`DBM-AC-6 đối chứng đỏ: ${rd.stderr}`);
    if (nd === 0) loi.push("DBM-AC-6 đối chứng không dựng người nào — ca không đo được");
    if (rh.code === 0 || !rh.stderr.includes("danh-ba-vat-the") || !rh.stderr.includes("ep-hong-dbm")) loi.push(`DBM-AC-6 lỗi không gọi tên bước: ${rh.code} ${rh.stderr}`);
    if (nh !== nd) loi.push("DBM-AC-6 lỗi vật thể lùi danh bạ Người");
    if (JSON.stringify(await tapKhoa(h.c)) !== JSON.stringify(kH0) || (await demBang(h.c)).b !== bH0) loi.push("DBM-AC-6 dòng nửa chừng");
  } finally { await h.dong(); await dc.dong(); }
  return loi;
}

test("DBM-AC-6 bước vật thể hỏng giữa giao dịch: job đỏ gọi tên bước, danh bạ Người vẫn commit, không dòng nửa chừng", async () => {
  assert.deepEqual(await soatAC6(RBG), []);
  const nguon = readFileSync(RBG, "utf8");
  assert.ok(!nguon.includes("process.env.DBV_"), "DBM-AC-6 refresh-bait-gap đọc biến thay mô-đun");
  assert.ok(!/import\(\s*process\.env/.test(nguon), "DBM-AC-6 refresh-bait-gap import động theo biến môi trường");
  // Chiều đỏ: bước vật thể trong cùng giao dịch với buocDem (savepoint) → lỗi lùi cả Người.
  let src = nguon.replace(/\n  try \{\n    await buocDem\(c\);[\s\S]*?\n  \} finally \{/,
    "\n  try {\n    await c.query(\"BEGIN\");\n    await buocDem(c, { savepoint: true });\n    await buocVatTheDem(c);\n    await c.query(\"COMMIT\");\n  } catch (e) {\n    await c.query(\"ROLLBACK\").catch(() => {});\n    console.error(`danh-ba-vat-the: ${e.message}`);\n    process.exitCode = 1;\n  } finally {");
  assert.notEqual(src, nguon, "bản chép refresh-bait-gap: không thay được khối main");
  const f = join(GOC, "pipeline", `.dbm-rbg-chung-${process.pid}.mjs`);
  writeFileSync(f, src); BAN_CHEP.push(f);
  assert.ok((await soatAC6(f)).includes("DBM-AC-6 lỗi vật thể lùi danh bạ Người"), "DBM-AC-6 thước không bắt được bản chung giao dịch");
});

// ---------- DBM-AC-7 lối vào qua symlink ----------
async function soatAC7(tenTep) {
  const loi = [];
  const tam = mkdtempSync(join(tmpdir(), "dbm-ln-"));
  const link = join(tam, "repo");
  symlinkSync(GOC, link);
  const [a, b] = [await dbCa("m7a"), await dbCa("m7b")];
  try {
    const ra = chayTep(join(link, "pipeline", tenTep), ["--db", a.url, "--khu", KHU_FIX]);
    chayTep(LENH, ["--db", b.url, "--khu", KHU_FIX]);
    if (!tongKet(ra.stdout) || !(tongKet(ra.stdout).khoa_moi > 0)) loi.push("DBM-AC-7 lối vào câm qua symlink");
    else if (JSON.stringify([...(await demTheoKhu(a.c))]) !== JSON.stringify([...(await demTheoKhu(b.c))])) loi.push("DBM-AC-7 qua symlink dựng khác đường thật");
  } finally { await a.dong(); await b.dong(); rmSync(tam, { recursive: true, force: true }); }
  return loi;
}

test("DBM-AC-7 gọi qua symlink trỏ gốc kho: lệnh chạy thật, dựng như đường thật", async () => {
  assert.deepEqual(await soatAC7("danh-ba-vat-the.mjs"), []);
  const tho = banChep("loi-vao-tho", [["if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {",
    "if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {"]]);
  assert.ok((await soatAC7(tho.split("/").pop())).includes("DBM-AC-7 lối vào câm qua symlink"), "DBM-AC-7 thước không bắt được lối vào so chuỗi thô");
});

// ---------- DBM-AC-8 đếm độc lập, so, chọn nhánh ----------
async function soatAC8(dem, chon = nhanSo) {
  const loi = [];
  const [a, b, rong] = [await dbCa("m8a"), await dbCa("m8b"), await dbCa("m8r")];
  try {
    const ta = tongKet(chayTep(LENH, ["--db", a.url, "--khu", KHU_FIX]).stdout);
    tongKet(chayTep(LENH, ["--db", b.url, "--khu", KHU_FIX]).stdout);
    const da = await dem(a.c, ta);
    const kyVong = { "q-khu-mot": { toa: 2, truc: 4, can: 8 } };
    if (JSON.stringify(da.get("q-khu-mot")) !== JSON.stringify(kyVong["q-khu-mot"])) loi.push(`DBM-AC-8 đếm khu một sai: ${JSON.stringify(da.get("q-khu-mot"))}`);
    if (da.get("q-khu-hai")?.toa !== 3 || da.get("q-khu-hai")?.can !== 3) loi.push(`DBM-AC-8 đếm khu hai sai: ${JSON.stringify(da.get("q-khu-hai"))}`);
    if (soDem(da, await dem(b.c, ta)).length) loi.push("DBM-AC-8 lệch khi cùng dữ liệu");
    const u = (await b.c.query(`SELECT u.building_key, u.stack_key FROM units u JOIN buildings x ON x.building_key = u.building_key
                                 WHERE x.region_node_id = $1 LIMIT 1`, [b.id["q-khu-mot"]])).rows[0];
    await b.c.query(`INSERT INTO units (unit_key, building_key, stack_key, floor, sub_id, catalog_tier) VALUES ($1, $2, $3, '99', $3 || ':99', 'xac_minh')`,
      [moiKhoa("unt"), u.building_key, u.stack_key]);
    const lech = soDem(da, await dem(b.c, ta));
    if (!lech.length) loi.push("DBM-AC-8 đếm không độc lập");
    else if (JSON.stringify(lech) !== JSON.stringify([{ khu: "q-khu-mot", cap: "can", may: 8, ban: 9 }])) loi.push(`DBM-AC-8 lệch sai: ${JSON.stringify(lech)}`);
    if (chon(da) !== "so") loi.push("DBM-AC-8 bỏ so khi máy thu đã dựng");
    if (chon(await dem(rong.c, null)) !== "chua-so") loi.push("DBM-AC-8 so khi máy thu chưa dựng");
  } finally { await a.dong(); await b.dong(); await rong.dong(); }
  return loi;
}

test("DBM-AC-8 đếm độc lập theo khu, so hai DB, căn thừa ra đúng một dòng lệch, chọn nhánh hai chiều", async () => {
  assert.deepEqual(await soatAC8((c) => demTheoKhu(c)), []);
  const tuTongKet = async (_c, tk) => new Map(Object.entries(tk?.khu ?? {}).map(([k, v]) => [k, { toa: v.toa, truc: v.truc, can: v.can }]));
  assert.ok((await soatAC8(tuTongKet)).includes("DBM-AC-8 đếm không độc lập"), "DBM-AC-8 thước không bắt được đếm từ tổng kết");
  assert.ok((await soatAC8((c) => demTheoKhu(c), () => "chua-so")).includes("DBM-AC-8 bỏ so khi máy thu đã dựng"), "DBM-AC-8 thước không bắt được bỏ nhánh so");
});
