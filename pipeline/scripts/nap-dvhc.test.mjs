// nap-dvhc.test.mjs — PX1 danh-ba-phuong-xa-toan-quoc E1–E7: bộ nạp danh bạ xã trên DB thử (bản chép DB máy thu,
// db/db-thu.sh --chay). Ca trong BEGIN…ROLLBACK nạp 084 trong giao dịch khi DB chưa áp; ca đường lệnh (E1 chiều đỏ, E5)
// ghi thật vào DB thử — test từ chối chạy trên DB `oneinvest` dùng chung. Không có bản chép thật (CI dựng từ
// migration, 0 thị trường) → bỏ qua có lý do.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

import pg from "pg";

import { DATA_DIR, docDanhBa, thiTruongCuaTinh } from "../lib/dvhc.mjs";
import { napDvhc } from "../nap-dvhc.mjs";
import { docBiDanhAnToan, docPhuongHopLe, docThiTruongCoPhuong, docThiTruongCoXa, phuongHopLe } from "../lib/osm.mjs";
import { ganPhuongS06 } from "../transform-chotot.mjs";
import { ganPhuongS03 } from "../transform-zalo.mjs";
import { chuanTen } from "../lib/dvhc.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const ROOT = join(import.meta.dirname, "../..");
const MIG_084 = readFileSync(join(ROOT, "db/migrations/084_danh_ba_dvhc.sql"), "utf8");
const CLI = join(ROOT, "pipeline/nap-dvhc.mjs");
const D = docDanhBa();
const IM = { log() {}, warn() {} };

let boQua = null;

before(async () => {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const { rows: [r] } = await c.query(
      `SELECT current_database() AS db, (SELECT count(*)::int FROM areas WHERE region_type = 'market' AND country_code = 'vn') AS n`,
    );
    if (r.n < 34) boQua = `DB ${r.db} không có 34 thị trường thật (CI dựng từ migration)`;
  } finally {
    await c.end();
  }
});

async function withTx(t, fn) {
  if (boQua) return t.skip(boQua);
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await c.query(MIG_084);
    await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

async function dbRieng(t) {
  if (boQua) { t.skip(boQua); return null; }
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  const { rows: [r] } = await c.query("SELECT current_database() AS db");
  if (r.db === "oneinvest") { await c.end(); throw new Error("PX1 test ghi thật: từ chối DB dùng chung oneinvest — chạy qua db/db-thu.sh --chay"); }
  return c;
}

const chayCli = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", env: { ...process.env, DATABASE_URL: DB_URL } });

test("PX1-AC-1 NGUON.json khai đủ băm, băm thật khớp", () => {
  const n = JSON.parse(readFileSync(join(DATA_DIR, "NGUON.json"), "utf8"));
  for (const f of ["xa.json", "xa-cu.json", "tinh-cu.json", "tinh.json"]) assert.match(n.sha256[f] ?? "", /^[0-9a-f]{64}$/, f);
  assert.match(n.commit, /^[0-9a-f]{40}$/);
  assert.ok(n.van_ban?.xa && n.van_ban?.xa_cu && n.van_ban?.tinh);
  assert.doesNotThrow(() => docDanhBa());
});

test("PX1-AC-1 chiều đỏ: một byte lệch → bộ nạp thoát 2, 0 dòng ghi", async (t) => {
  const c = await dbRieng(t);
  if (!c) return;
  const tmp = mkdtempSync(join(tmpdir(), "px1-dvhc-"));
  try {
    cpSync(DATA_DIR, tmp, { recursive: true });
    const p = join(tmp, "xa.json");
    const s = readFileSync(p, "utf8");
    writeFileSync(p, s.replace('"Ba Đình"', '"Ba Dình"'));
    const dem = async () => (await c.query(
      `SELECT (SELECT count(*) FROM areas) AS a, (SELECT md5(string_agg(id, ',' ORDER BY id)) FROM areas) AS h`,
    )).rows[0];
    const truoc = await dem();
    const r = chayCli("--data", tmp);
    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stderr, /PX1 băm lệch: xa\.json/);
    assert.deepEqual(await dem(), truoc);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
    await c.end();
  }
});

test("PX1-AC-2 đủ 3.321 xã dưới đúng 34 tỉnh, mã duy nhất", (t) => withTx(t, async (c) => {
  await napDvhc(c, { log: IM });
  const { rows: mk } = await c.query(`SELECT id, admin_code FROM areas WHERE region_type = 'market' AND admin_code IS NOT NULL`);
  assert.equal(mk.length, 34);
  for (const r of mk) assert.equal(thiTruongCuaTinh(r.admin_code), r.id);
  const { rows: [n] } = await c.query(
    `SELECT count(*)::int AS n, count(DISTINCT admin_code)::int AS d FROM areas WHERE region_type = 'submarket' AND admin_code IS NOT NULL`,
  );
  assert.deepEqual(n, { n: 3321, d: 3321 });
  // bảng kỳ vọng theo tỉnh rút từ xa.json
  const ky = new Map();
  for (const x of D.xa) ky.set(thiTruongCuaTinh(x.maTinh), (ky.get(thiTruongCuaTinh(x.maTinh)) ?? 0) + 1);
  const { rows: g } = await c.query(
    `SELECT parent_id, count(*)::int AS n FROM areas WHERE region_type = 'submarket' AND admin_code IS NOT NULL GROUP BY 1`,
  );
  assert.equal(g.length, 34);
  for (const r of g) assert.equal(r.n, ky.get(r.parent_id), r.parent_id);
  const { rows: sai } = await c.query(`SELECT id, parent_id, admin_code FROM areas WHERE region_type = 'submarket' AND admin_code IS NOT NULL`);
  const tinhCua = new Map(D.xa.map((x) => [x.ma, thiTruongCuaTinh(x.maTinh)]));
  for (const r of sai) assert.equal(r.parent_id, tinhCua.get(r.admin_code), r.id);
}));

test("PX1-AC-2 chiều đỏ: thiếu thị trường, tên thị trường lệch → dừng có tên, không ghi", (t) => withTx(t, async (c) => {
  await c.query("SAVEPOINT s");
  await c.query(`UPDATE areas SET region_type = 'tam' WHERE id = 'vn-hue'`);
  await assert.rejects(napDvhc(c, { log: IM }), /PX1 thiếu thị trường 46/);
  await c.query("ROLLBACK TO SAVEPOINT s");
  await c.query(`UPDATE areas SET name = 'Tỉnh Gia Lai Cũ' WHERE id = 'vn-gia-lai'`);
  await assert.rejects(napDvhc(c, { log: IM }), /PX1 tên thị trường lệch 52/);
  await c.query("ROLLBACK TO SAVEPOINT s");
  const { rows: [r] } = await c.query(`SELECT count(*)::int AS n FROM areas WHERE admin_code IS NOT NULL`);
  assert.equal(r.n, 0);
}));

const AIRBNB_11 = [
  "vn-hanoi-quan-thanh-xuan", "vn-hanoi-quan-hai-ba-trung", "vn-hanoi-quan-hoan-kiem", "vn-hanoi-quan-cau-giay",
  "vn-hanoi-quan-hoang-mai", "vn-hanoi-quan-dong-da", "vn-hanoi-quan-tay-ho",
  "vn-hanoi-bac-tu-liem", "vn-hanoi-hang-trong", "vn-hanoi-ngoc-lam", "vn-hanoi-xuan-la",
];

test("PX1-AC-3 giữ id cũ, gắn mã phường OSM, chèn xã thiếu đúng khuôn", (t) => withTx(t, async (c) => {
  const chup = `SELECT id, name, md5(coalesce(geom::text, '')) AS g, meta->>'source' AS s FROM areas WHERE region_type = 'submarket' ORDER BY id`;
  const truoc = (await c.query(chup)).rows;
  const log = [];
  await napDvhc(c, { log: { log: (m) => log.push(m), warn: (m) => log.push(m) } });
  const sau = new Map((await c.query(chup)).rows.map((r) => [r.id, r]));
  for (const r of truoc) assert.deepEqual(sau.get(r.id), r, `khu vực cũ đổi: ${r.id}`);
  const { rows: [osm] } = await c.query(
    `SELECT count(*)::int AS n, count(admin_code)::int AS co FROM areas WHERE meta->>'source' = 'osm-phuong' AND region_type = 'submarket'`,
  );
  assert.equal(osm.co, osm.n);
  const { rows: ab } = await c.query(`SELECT id, admin_code FROM areas WHERE id = ANY($1)`, [AIRBNB_11]);
  assert.equal(ab.length, 11);
  for (const r of ab) assert.equal(r.admin_code, null, `PX1-AC-3 khu tên quận nhận mã: ${r.id}`);
  for (const id of AIRBNB_11) assert.ok(log.some((m) => m.includes(id)), `báo cáo thiếu ${id}`);
  // hai phường OSM mang hậu tố mã bưu chính khớp đúng xã CÓ dấu
  const { rows: hau } = await c.query(`SELECT name, admin_code FROM areas WHERE name IN ('Cẩm Giàng (03626)', 'Thạnh An (73308)')`);
  for (const r of hau) {
    const ten = r.name.replace(/ \(.*\)$/, "");
    const x = D.xa.find((y) => y.ma === r.admin_code);
    assert.equal(x?.ten, ten, r.name);
  }
  // xã chèn mới
  const { rows: moi } = await c.query(
    `SELECT id, parent_id, name, admin_code, meta, geom IS NULL AS rong FROM areas WHERE meta->>'source' = 'dvhc'`,
  );
  assert.equal(moi.length, 3321 - osm.n);
  const theoMa = new Map(D.xa.map((x) => [x.ma, x]));
  for (const r of moi) {
    const x = theoMa.get(r.admin_code);
    assert.equal(r.name, x.ten, r.id);
    assert.equal(r.meta.loai, x.loai, r.id);
    assert.ok(r.rong, r.id);
    assert.match(r.id, new RegExp(`^${r.parent_id}-[a-z0-9-]+$`));
  }
  assert.ok(moi.some((r) => r.parent_id === "vn-hcmc" && r.name === "Hưng Long"));
  assert.ok(moi.some((r) => r.parent_id === "vn-da-nang" && r.name === "Hoàng Sa"));
  assert.ok(log.some((m) => /^vn-nghe-an: 130 xã · khớp sẵn 0 · chèn mới 130/.test(m)));
}));

test("PX1-AC-3 chiều đỏ: hai phường OSM cùng tên một xã → dừng có tên", (t) => withTx(t, async (c) => {
  await c.query(
    `INSERT INTO areas (id, parent_id, region_type, name, country_code, meta)
     VALUES ('vn-hanoi-ba-dinh-thu', 'vn-hanoi', 'submarket', 'Phường Ba Đình', 'vn', '{"source":"osm-phuong"}')`,
  );
  await assert.rejects(napDvhc(c, { log: IM }), /PX1 khớp hai khu vực: 00004/);
}));

test("PX1-AC-4 10.033 bí danh, 441 tách, đích nằm trong danh bạ", (t) => withTx(t, async (c) => {
  await napDvhc(c, { log: IM });
  const { rows: [n] } = await c.query(
    `SELECT count(*)::int AS n, count(*) FILTER (WHERE split)::int AS tach,
            count(*) FILTER (WHERE name = '' OR old_district = '' OR province_code = '')::int AS rong FROM area_aliases`,
  );
  assert.deepEqual(n, { n: 10033, tach: 441, rong: 0 });
  const { rows: [l] } = await c.query(
    `SELECT count(*)::int AS n FROM area_aliases a, unnest(a.targets) t(ma)
     WHERE NOT EXISTS (SELECT 1 FROM areas x WHERE x.admin_code = t.ma)`,
  );
  assert.equal(l.n, 0);
}));

test("PX1-AC-5 084 áp hai lần không đổi lược đồ", (t) => withTx(t, async (c) => {
  const dau = `SELECT md5(string_agg(table_name || '.' || column_name || ':' || data_type || ':' || is_nullable, ',' ORDER BY table_name, column_name))
               || (SELECT md5(string_agg(indexname || indexdef, ',' ORDER BY indexname)) FROM pg_indexes WHERE tablename IN ('areas', 'area_aliases')) AS d
               FROM information_schema.columns WHERE table_name IN ('areas', 'area_aliases')`;
  const a = (await c.query(dau)).rows[0].d;
  await c.query(MIG_084);
  assert.equal((await c.query(dau)).rows[0].d, a);
}));

test("PX1-AC-7-db bộ đọc tên thật sau bộ nạp thật: S06, S03 khai và chưa khai", (t) => withTx(t, async (c) => {
  const phuongTruoc = await docThiTruongCoPhuong(c);
  await napDvhc(c, { log: IM });
  const coXa = await docThiTruongCoXa(c);
  assert.equal(coXa.length, 34);
  assert.deepEqual(await docThiTruongCoPhuong(c), phuongTruoc);
  const { rows: [pip] } = await c.query(`SELECT count(*)::int AS n FROM areas WHERE meta->>'source' = 'dvhc' AND ${phuongHopLe()}`);
  assert.equal(pip.n, 0, "point-in-polygon không được nhận xã danh bạ");
  const areas = await docPhuongHopLe(c, coXa);
  const biDanhCua = await docBiDanhAnToan(c, coXa);
  const entries = (ms) => areas.filter((a) => ms.includes(a.parent_id)).map((a) => ({ id: a.id, name: a.name, market: a.parent_id }));
  // xã Nghệ An tên duy nhất cả nước
  const dem = new Map();
  for (const x of D.xa) dem.set(chuanTen(x.ten), (dem.get(chuanTen(x.ten)) ?? 0) + 1);
  const xa = D.xa.find((x) => x.maTinh === "40" && dem.get(chuanTen(x.ten)) === 1 && x.ten.length > 6
    && !D.xa.some((y) => y !== x && (chuanTen(y.ten).includes(chuanTen(x.ten)) || chuanTen(x.ten).includes(chuanTen(y.ten)))));
  const { rows: [dich] } = await c.query(`SELECT id FROM areas WHERE admin_code = $1`, [xa.ma]);
  const mk = "vn-nghe-an";
  const conMk = areas.filter((a) => a.parent_id === mk);
  const wardMap = new Map(conMk.map((a) => [a.name.normalize("NFC").toLowerCase(), a.id]));
  const slugList = conMk.map((a) => [a.id.slice(mk.length + 1), a.name]);
  const g = ganPhuongS06({ city_code: mk, ward_name_v3: `Xã ${xa.ten}`, ward_name: null, subject: "Bán đất thổ cư" },
    { mk, wardMap, biDanh: biDanhCua.get(mk), slugList });
  assert.equal(g.areaId, dich.id);
  const bai = `Bán nhà xã ${xa.ten}, sổ đỏ chính chủ`;
  assert.equal(ganPhuongS03(bai, [mk], { entries, moiThiTruong: phuongTruoc, biDanhCua }).ph?.id, dich.id);
  const chuaKhai = ganPhuongS03(bai, null, { entries, moiThiTruong: phuongTruoc, biDanhCua });
  assert.notEqual(chuaKhai.ph?.market, mk, "PX1-AC-7 nhóm chưa khai gắn tỉnh khác");
  const hong = ganPhuongS03(bai, null, { entries, moiThiTruong: coXa, biDanhCua });
  assert.equal(hong.ph?.market, mk, "chiều đỏ: tập chưa khai = mọi tỉnh có xã thì gắn sang Nghệ An");
}));

// Ca ghi thật đặt CUỐI tệp: các ca trên cần DB chưa nạp.
test("PX1-AC-5 bộ nạp thật hai lần: lần hai doi=0, nội dung bằng hệt", async (t) => {
  const c = await dbRieng(t);
  if (!c) return;
  const { rows: [tr] } = await c.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'areas' AND column_name = 'admin_code') AS co`,
  );
  try {
    await c.query(MIG_084);
    const bam = async () => (await c.query(
      `SELECT (SELECT md5(string_agg(concat_ws('|', id, parent_id, name, admin_code, meta::text), ',' ORDER BY id)) FROM areas)
           || (SELECT md5(string_agg(concat_ws('|', old_code, name, kind, targets::text, split, source_sha), ',' ORDER BY old_code)) FROM area_aliases) AS h`,
    )).rows[0].h;
    const r1 = chayCli();
    assert.equal(r1.status, 0, r1.stderr);
    const h1 = await bam();
    const r2 = chayCli();
    assert.equal(r2.status, 0, r2.stderr);
    assert.match(r2.stdout, /^doi=0$/m, "PX1-AC-5 lần hai đổi dòng");
    assert.equal(await bam(), h1);
    // Chiều đỏ: đổi tay một giá trị giữa hai lần → lần ba phải thấy và sửa (doi=1)
    await c.query(`UPDATE areas SET meta = meta || '{"loai":"Sai"}' WHERE admin_code = '00004'`);
    const r3 = chayCli();
    assert.match(r3.stdout, /^doi=1$/m);
    assert.equal(await bam(), h1);
  } finally {
    // Trả DB của lượt về trạng thái trước ca (bộ npm test của pipeline chạy các tệp khác trên cùng DB sau tệp này);
    // bản chép đã có 084 từ trước (máy thu đã áp) thì giữ nguyên — lần chạy chỉ ghi lại đúng giá trị đã có.
    if (!tr.co) await c.query(`BEGIN;
      DELETE FROM areas WHERE meta->>'source' = 'dvhc';
      UPDATE areas SET meta = meta - 'loai' WHERE admin_code IS NOT NULL;
      DROP TABLE IF EXISTS area_aliases;
      DROP INDEX IF EXISTS areas_admin_code_uq;
      ALTER TABLE areas DROP COLUMN IF EXISTS admin_code;
      COMMIT;`).catch(() => {});
    await c.end();
  }
});

after(() => {});
