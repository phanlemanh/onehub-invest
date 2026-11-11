// danh-ba-vat-the-iso.itest.mjs — hồ sơ danh-ba-vat-the-toan-quoc (DA1) E1–E3, E4b, E4c, E5, E5b, E6, E7: migration 088 và lệnh
// dựng trên DB của riêng lượt chép từ máy thu (db/db-thu.sh --chay — có PX1, 69 toà, CHƯA có 088). Ca chạy tuần tự trên DB
// dùng một lần; không bao giờ ghi `oneinvest`. Ngoài CI. Chạy:
//   bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import pg from "pg";
import { buocVatTheDem, dung, napBangIso, suaXaNut } from "../danh-ba-vat-the.mjs";
import { chuanTen, docDanhBa } from "../lib/dvhc.mjs";
import { demTheoKhu, isoCuaKhu, khuDaDung, moiKhoa, upiToa } from "../lib/danh-ba-vat-the.mjs";

const GOC = join(import.meta.dirname, "../..");
const SQL_088 = readFileSync(join(GOC, "db/migrations/088_iso_tinh.sql"), "utf8");
const ISO_CHUP = JSON.parse(readFileSync(join(GOC, "pipeline/data/iso-3166-2-vn.json"), "utf8"));
const NGOAI_TEN = { "huế": "thừa thiên-huế" }; // ngoại lệ tên duy nhất: tỉnh mới giữ mã của tỉnh cũ khác tên
const tenTinh = (s) => chuanTen(s).replace(/^(thành phố|tỉnh)\s+/u, "");
const TAM = mkdtempSync(join(tmpdir(), "da1-"));
const URL_LUOT = process.env.DATABASE_URL;

let c;
before(async () => {
  assert.ok(URL_LUOT, "cần DATABASE_URL của DB riêng lượt (db/db-thu.sh --chay)");
  c = new pg.Client({ connectionString: URL_LUOT });
  await c.connect();
  if ((await c.query("SELECT current_database() AS db")).rows[0].db === "oneinvest") throw new Error("DA1 itest: từ chối DB dùng chung");
});
after(async () => { await c?.end(); });

const anhToa = async () => (await c.query("SELECT building_key, upi, iso_region FROM buildings ORDER BY 1")).rows;
const demKhu = async () => Object.fromEntries([...(await demTheoKhu(c)).entries()]);
const coBang = async () => Boolean((await c.query("SELECT to_regclass('public.iso_regions') AS t")).rows[0].t);
const idNut = async (slug) => (await c.query("SELECT id::int AS id FROM asset_nodes WHERE slug = $1", [slug])).rows[0].id;
async function trongGd(fn) {
  await c.query("BEGIN");
  try { return await fn(); } finally { await c.query("ROLLBACK"); }
}
async function chenToa(iso, upi = null) {
  const k = moiKhoa("bld");
  await c.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                 VALUES ($1, $2, $3, $4, 'xac_minh')`, [k, await idNut("vinhomes-ocean-park-1"), upi ?? upiToa(iso, k), iso]);
}
async function bi(fn) {
  await c.query("SAVEPOINT s");
  try { await fn(); await c.query("RELEASE SAVEPOINT s"); return null; } catch (e) { await c.query("ROLLBACK TO SAVEPOINT s"); return e; }
}

/** Bảng vàng rút bằng máy: nối bản chụp ISO 3166-2:VN với 34 tỉnh PX1 theo tên chuẩn hoá. */
function bangVang(chup = ISO_CHUP, tinh = docDanhBa().tinh) {
  const theoTen = new Map(chup.ma.map((r) => [tenTinh(r.ten), r.iso]));
  const out = new Map();
  for (const t of tinh) {
    const ten = tenTinh(t.ten);
    const iso = theoTen.get(NGOAI_TEN[ten] ?? ten);
    if (!iso) throw new Error(`DA1-AC-1 ${t.ma} không khớp tên ISO`);
    out.set(t.ma, iso);
  }
  return out;
}

test("DA1-AC-7 chưa áp 088: bước đêm chạy như cũ theo meta.city; dựng lần đầu khu chưa có toà bị chặn; 082 còn khoá hai mã", async () => {
  assert.equal(await coBang(), false, "DA1-AC-7 DB của lượt phải chưa có 088");
  const truoc = await anhToa();
  const dong = [];
  await buocVatTheDem(c, { log: (s) => dong.push(String(s)) });
  assert.ok(dong.includes("danh-ba-vat-the: chưa áp 088 — ISO theo meta.city"), `DA1-AC-7 thiếu dòng: ${dong.join(" | ")}`);
  assert.deepEqual(await anhToa(), truoc, "DA1-AC-7 UPI đổi khi chưa áp 088");
  await assert.rejects(dung(c, { khuSlugs: ["vinhomes-ocean-park-2"], log: () => {} }), /chưa áp 088 — chỉ dựng lại khu đã có toà/);
  assert.deepEqual(await anhToa(), truoc, "DA1-AC-7 khu mới đã được dựng khi chưa áp 088");
  // Đối chứng cho E2: trên 082, toà Hưng Yên bị từ chối.
  await trongGd(async () => {
    const e = await bi(() => chenToa("VN-66"));
    assert.ok(e && /buildings_iso_region_check/.test(e.message), "DA1-AC-2 082 còn khoá hai mã");
  });
});

test("DA1-AC-3 áp 088 hai lần: lần hai không đổi lược đồ, dữ liệu; toà sẵn có nguyên vẹn; hai chiều đỏ", async () => {
  const truoc = await anhToa();
  const luocDo = async () => (await c.query(`SELECT conname, pg_get_constraintdef(oid) AS d FROM pg_constraint
      WHERE conrelid IN ('buildings'::regclass, 'iso_regions'::regclass) ORDER BY 1`)).rows;
  const duLieu = async () => (await c.query("SELECT * FROM iso_regions ORDER BY admin_code")).rows;
  await c.query(SQL_088);
  const ld1 = await luocDo(); const dl1 = await duLieu();
  await c.query(SQL_088);
  assert.deepEqual(await luocDo(), ld1, "DA1-AC-3 088 lần hai đổi lược đồ");
  assert.deepEqual(await duLieu(), dl1, "DA1-AC-3 088 lần hai đổi dữ liệu");
  assert.deepEqual(await anhToa(), truoc, "DA1-AC-3 toà sẵn có đổi");
  await trongGd(async () => {
    await c.query(SQL_088.replace("ON CONFLICT (admin_code) DO NOTHING;", ",\n  ('99', 'VN-99', 'Thử') ON CONFLICT (admin_code) DO NOTHING;"));
    assert.notDeepEqual(await duLieu(), dl1, "DA1-AC-3 088 lần hai đổi dữ liệu (đối chứng: phép so thấy dòng thứ 35)");
  });
  const boGuard = SQL_088.replace(/DO \$\$[\s\S]*?buildings_iso_region_fkey[\s\S]*?END \$\$;/,
    "ALTER TABLE buildings ADD CONSTRAINT buildings_iso_region_fkey FOREIGN KEY (iso_region) REFERENCES iso_regions (iso_region);");
  await trongGd(async () => {
    await assert.rejects(c.query(boGuard), /already exists/, "DA1-AC-3 088 không chạy lại được (đối chứng bỏ guard)");
  });
});

test("DA1-AC-1 bảng tra 34 dòng bằng bảng vàng rút từ bản chụp ISO; hai chiều đỏ", async () => {
  const vang = bangVang();
  assert.equal(vang.size, 34, "DA1-AC-1 bảng vàng phải 34 tỉnh");
  const { rows } = await c.query("SELECT admin_code, iso_region FROM iso_regions ORDER BY 1");
  const db = new Map(rows.map((r) => [r.admin_code, r.iso_region]));
  assert.equal(db.size, 34, "DA1-AC-1 iso_regions phải 34 dòng");
  for (const [ma, iso] of vang) assert.equal(db.get(ma), iso, `DA1-AC-1 ${ma} lệch bảng vàng`);
  assert.equal(new Set(db.values()).size, 34, "DA1-AC-1 iso_region trùng");
  const { rows: thieu } = await c.query(`SELECT a.id FROM areas a LEFT JOIN iso_regions r ON r.admin_code = a.admin_code
      WHERE a.region_type = 'market' AND a.admin_code ~ '^[0-9]{2}$' AND r.admin_code IS NULL`);
  assert.deepEqual(thieu, [], "DA1-AC-1 thị trường không có dòng ISO");
  const chupHong = structuredClone(ISO_CHUP);
  chupHong.ma.find((r) => r.ten === "Hưng Yên").ten = "Hưng Yên Cũ";
  assert.throws(() => bangVang(chupHong), /DA1-AC-1 33 không khớp tên ISO/);
  const dbHong = new Map(db); dbHong.set("46", "VN-HU");
  assert.notEqual(dbHong.get("46"), vang.get("46"), "DA1-AC-1 46 lệch bảng vàng (đối chứng)");
});

test("DA1-AC-2 toà nhận đủ 34 mã ISO; mã lạ và UPI lệch bị từ chối", async () => {
  const { rows } = await c.query("SELECT iso_region FROM iso_regions ORDER BY 1");
  await trongGd(async () => {
    for (const { iso_region: iso } of rows) assert.equal(await bi(() => chenToa(iso)), null, `DA1-AC-2 ${iso} bị từ chối`);
    for (const la of ["VN-03", "VN-99"]) {
      const e = await bi(() => chenToa(la));
      assert.ok(e && /buildings_iso_region_fkey/.test(e.message), `DA1-AC-2 mã lạ ${la} lọt`);
    }
    const k = moiKhoa("bld");
    const nut = await idNut("vinhomes-ocean-park-1");
    const e = await bi(() => c.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
      VALUES ($1, $2, $3, 'VN-SG', 'xac_minh')`, [k, nut, upiToa("VN-HN", k)]));
    assert.ok(e && /buildings_upi_khop_khoa/.test(e.message), "DA1-AC-2 UPI lệch iso_region lọt");
  });
});

test("DA1-AC-4c trên dữ liệu thật: sau DV1, 20/20 nút ra ISO; ba khu Hưng Yên VN-66", async () => {
  await suaXaNut(c, {});
  const bang = await napBangIso(c);
  const { rows } = await c.query("SELECT slug, area_ids, meta->>'city' AS city FROM asset_nodes WHERE node_type = 'project'");
  const iso = Object.fromEntries(rows.map((r) => [r.slug, isoCuaKhu(r, bang)]));
  const ghim = { "vinhomes-ocean-park-2": "VN-66", "vinhomes-ocean-park-3": "VN-66", ecopark: "VN-66",
    "vinhomes-ocean-park-1": "VN-HN", "vinhomes-grand-park": "VN-SG" };
  for (const [s, v] of Object.entries(ghim)) assert.deepEqual(iso[s], { iso: v }, `DA1-AC-4c ${s}`);
  assert.equal(Object.values(iso).filter((x) => x.iso).length, 20, `DA1-AC-4c nút lỗi: ${JSON.stringify(Object.entries(iso).filter(([, x]) => x.loi))}`);
  for (const s of ["vinhomes-ocean-park-2", "ecopark"]) {
    assert.equal(rows.find((r) => r.slug === s).city, "hanoi", "DA1-AC-4c meta.city sai tỉnh (đối chứng: nhãn ghi hanoi)");
  }
});

test("DA1-AC-5 dựng lại hai khu đã có toà sau 088: 0 UPI đổi, cùng số toà, trục, căn", async () => {
  const anh = await anhToa(); const dem = await demKhu();
  const tk = await dung(c, { khuSlugs: await khuDaDung(c), log: () => {} });
  assert.equal(tk.khoa_moi, 0, "DA1-AC-5 đúc khoá mới");
  assert.deepEqual(await anhToa(), anh, "DA1-AC-5 ISO sai đổi UPI");
  assert.deepEqual(await demKhu(), dem, "DA1-AC-5 số toà, trục, căn đổi");
  const hong = structuredClone(anh); hong[0].upi = upiToa("VN-66", hong[0].building_key);
  assert.notDeepEqual(hong, anh, "DA1-AC-5 ISO sai đổi UPI (đối chứng: phép so thấy một UPI lệch)");
});

test("DA1-AC-4b khu thuộc hai tỉnh: lệnh dựng dừng gọi tên, không ghi", async () => {
  const { rows: [a] } = await c.query("SELECT id FROM areas WHERE region_type = 'submarket' AND parent_id = 'vn-hanoi' AND admin_code IS NOT NULL LIMIT 1");
  const { rows: [b] } = await c.query("SELECT id FROM areas WHERE region_type = 'submarket' AND parent_id = 'vn-hcmc' AND admin_code IS NOT NULL LIMIT 1");
  const { rows: [g] } = await c.query("SELECT area_ids FROM asset_nodes WHERE slug = 'vinhomes-grand-park'");
  const dem = await demKhu();
  await c.query("UPDATE asset_nodes SET area_ids = $1 WHERE slug = 'vinhomes-grand-park'", [[a.id, b.id]]);
  try {
    await assert.rejects(dung(c, { khuSlugs: ["vinhomes-grand-park"], log: () => {} }), /khu vinhomes-grand-park: nhieu-tinh/);
    assert.deepEqual(await demKhu(), dem, "DA1-AC-4b đã ghi khi khu hai tỉnh");
  } finally {
    await c.query("UPDATE asset_nodes SET area_ids = $1 WHERE slug = 'vinhomes-grand-park'", [g.area_ids]);
  }
});

test("DA1-AC-5b khu ở tỉnh thứ ba dựng được toà mang VN-66; theo meta.city thì sai mã", async () => {
  const ocp2 = await idNut("vinhomes-ocean-park-2");
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q-da1-s', 'q', 'S08', '{}') ON CONFLICT DO NOTHING`);
  await c.query(`INSERT INTO stg_s08_inventory (source_id, snapshot_id, project_id, project_type, state, product_code, subdivision_name, payload)
                 VALUES ('qda1:Q12-01-01', 'q-da1-s', 'qda1', 'high_rise', 'notSold', 'Q12-01-01', NULL, '{}') ON CONFLICT DO NOTHING`);
  await c.query(`INSERT INTO s08_project_links (project_id, asset_node_id, status) VALUES ('qda1', $1, 'noi') ON CONFLICT DO NOTHING`, [ocp2]);
  const tk = await dung(c, { khuSlugs: ["vinhomes-ocean-park-2"], log: () => {} });
  assert.ok(tk.khoa_moi > 0, "DA1-AC-5b không dựng được toà ở tỉnh thứ ba");
  const { rows } = await c.query("SELECT building_key, upi, iso_region FROM buildings WHERE region_node_id = $1", [ocp2]);
  assert.ok(rows.length > 0, "DA1-AC-5b không toà nào dưới Ocean Park 2");
  for (const r of rows) {
    assert.equal(r.iso_region, "VN-66", "DA1-AC-5b toà tỉnh thứ ba sai mã");
    assert.equal(r.upi, upiToa("VN-66", r.building_key), "DA1-AC-5b UPI lệch khuôn");
    const { rows: bd } = await c.query("SELECT 1 FROM registry_aliases WHERE object_key = $1 AND kind = 'ma_nguon' AND retired_at IS NULL", [r.building_key]);
    assert.ok(bd.length > 0, `DA1-AC-5b toà ${r.building_key} thiếu bí danh ma_nguon`);
  }
  const ISO_CU = { hanoi: "VN-HN", hcmc: "VN-SG" };
  const city = (await c.query("SELECT meta->>'city' AS c FROM asset_nodes WHERE id = $1", [ocp2])).rows[0].c;
  assert.notEqual(ISO_CU[city], "VN-66", "DA1-AC-5b toà tỉnh thứ ba sai mã (đối chứng meta.city)");
});

test("DA1-AC-6 chủ đầu tư ghi source_field kèm tệp và băm; chạy lại 0 dòng; 0 hitl không người", async () => {
  const gp = await idNut("vinhomes-grand-park");
  const { rows: [p] } = await c.query(`SELECT i.project_id FROM stg_s08_inventory i
      JOIN s08_project_links l ON l.project_id = i.project_id AND l.status = 'noi'
     WHERE l.asset_node_id = $1 AND i.project_type = 'high_rise' LIMIT 1`, [gp]);
  assert.ok(p, "DA1-AC-6 Grand Park chưa nối dự án S08");
  const tep = join(TAM, "chu-dau-tu-thu.json");
  writeFileSync(tep, JSON.stringify({ [p.project_id]: "Chủ đầu tư thử" }));
  const ban = createHash("sha256").update(readFileSync(tep)).digest("hex");
  const chay = () => spawnSync(process.execPath, [join(GOC, "pipeline/danh-ba-vat-the.mjs"), "--db", URL_LUOT, "--khu", "vinhomes-grand-park", "--tu-dien", tep],
    { encoding: "utf8", cwd: join(GOC, "pipeline") });
  const r1 = chay();
  assert.equal(r1.status, 0, `DA1-AC-6 lệnh: ${r1.stderr}`);
  const { rows } = await c.query("SELECT method, evidence FROM field_assertions WHERE field = 'builder_name' AND retracted_at IS NULL AND value = 'Chủ đầu tư thử'");
  assert.ok(rows.length > 0, "DA1-AC-6 không phát biểu builder_name nào");
  for (const x of rows) {
    assert.equal(x.method, "source_field", "DA1-AC-6 phương pháp không phải source_field");
    assert.equal(x.evidence.tep, basename(tep), "DA1-AC-6 bằng chứng thiếu tên tệp");
    assert.equal(x.evidence.ban, ban, "DA1-AC-6 bằng chứng sai băm");
  }
  const r2 = chay();
  assert.equal(r2.status, 0, r2.stderr);
  const tk = JSON.parse(r2.stdout.split("\n").find((l) => l.startsWith("tong_ket ")).slice(9));
  assert.equal(tk.builder_name_moi, 0, "DA1-AC-6 chạy lại thêm dòng");
  const HITL_TRONG = `SELECT count(*)::int AS n FROM field_assertions WHERE method = 'hitl' AND retracted_at IS NULL
                        AND (changed_by IS NULL OR changed_by = '')`;
  assert.equal((await c.query(HITL_TRONG)).rows[0].n, 0, "DA1-AC-6 còn hitl không người");
  await trongGd(async () => {
    const k = (await c.query("SELECT building_key FROM buildings LIMIT 1")).rows[0].building_key;
    await c.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at, run_id)
                   VALUES ('Building', $1, 'builder_name', 'Mẫu cũ', 'fact', 'hitl', '{}'::jsonb, now(), 'da1-mau-cu')`, [k]);
    assert.equal((await c.query(HITL_TRONG)).rows[0].n, 1, "DA1-AC-6 còn hitl không người (đối chứng: phép đếm thấy mẫu cũ)");
  });
});
