// thang-bac.itest.mjs — thang-bac-moi-b0-b5 (AC-n ↔ _acceptance/thang-bac-moi-b0-b5/evals.yaml E1b, E3, E4, E5, E9).
// Mỗi ca BEGIN … ROLLBACK, 087 nạp THẬT trong giao dịch dưới khoá của bac-du-lieu.mjs. Chạy trên DB của riêng lượt
// (config:executors.test.tb_db — db/db-thu.sh … --chay), không trên DB `oneinvest` dùng chung khi 087 chưa áp.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { chay, KHOA, SQL_610 } from "../bac-du-lieu.mjs";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SQL_087 = readFileSync(path.join(ROOT, "db/migrations/087_thang_bac_moi.sql"), "utf8");
const LOI = ["kind", "property_type", "price_vnd", "area_m2", "area_id"];
export const NHAN = [["B0", "Có lời khai"], ["B1", "Tin"], ["B2", "Định vị"], ["B3", "Gắn căn"], ["B4", "Làm giàu"], ["B5", "Sống"]];

let c;
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — chạy qua config:executors.test.tb_db (DB của riêng lượt)");
  c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const { rows: [r] } = await c.query("SELECT current_database() AS db, to_regprocedure('data_level_units()') IS NOT NULL AS co");
  if (r.db === "oneinvest" && !r.co) throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung khi 087 chưa áp — dùng DB thử");
});
after(async () => {
  await c?.end();
});

/** Một giao dịch ROLLBACK: `truoc` chạy trước khi nạp 087 (trạng thái chưa áp), rồi nạp 087 thật (trừ khi nap087 false). */
async function trongGiaoDich(fn, { truoc, nap087 = true } = {}) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
    if (truoc) await truoc(c);
    if (nap087) await c.query(SQL_087);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK");
  }
}

/** Nguồn gốc năm trường lõi theo khuôn resolve_offer_fields (045); `rieng` đè từng khoá. */
function nguonGoc({ measured = false, tier = "observed" } = {}, rieng = {}) {
  const fp = {};
  for (const k of LOI) fp[k] = { v: "x", ids: [], tier, measured, conflict: false, ...(rieng[k] ?? {}) };
  return fp;
}

let dem = 0;
const T = `tb-tst-${process.pid}`;
/** Một tin trong bảng bản ghi; trả offer_id. */
async function tin({ source = "S06", kind = "sale", pt = "apartment", price = 2_000_000_000, area = 60, ward,
  fp = {}, status = "unknown", lastSeen = "now()", retired = false } = {}) {
  const id = `${T}-${++dem}`;
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, price_vnd, area_m2, area_id, source,
      originating_system_key, first_seen, last_seen, field_provenance, offer_status, retired_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $1, now() - interval '1 day', ${lastSeen}, $8, $9, $10)`,
  [id, kind, pt, price, area, ward, source, fp, status, retired ? new Date() : null]);
  return id;
}

/** Thay thân offer_unit_key bằng bảng tạm offer → căn (chỗ cắm của GC): fixture gắn tin vào căn danh bạ. */
async function ganCan(cap) {
  await c.query("CREATE TEMP TABLE IF NOT EXISTS tb_gan (offer_id text PRIMARY KEY, unit_key text) ON COMMIT DROP");
  for (const [o, u] of cap) await c.query("INSERT INTO tb_gan VALUES ($1, $2)", [o, u]);
  await c.query(`CREATE OR REPLACE FUNCTION offer_unit_key(p_offer_id text) RETURNS text LANGUAGE sql STABLE AS
    $f$ SELECT unit_key FROM pg_temp.tb_gan WHERE offer_id = p_offer_id $f$`);
}

/** Một phường có sẵn (để tin qua khoá ngoại) và n căn danh bạ đang hiệu lực. */
async function khuVaCan(n) {
  const { rows: [w] } = await c.query("SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1");
  const { rows: u } = await c.query("SELECT unit_key FROM units WHERE status = 'active' ORDER BY unit_key LIMIT $1", [n]);
  assert.equal(u.length, n, `bản chép không đủ ${n} căn danh bạ đang hiệu lực (082)`);
  return { ward: w.id, units: u.map((r) => r.unit_key) };
}

// ---- E1b · AC-1: nhãn ref_lookup sau 087, checkDb trục data_level không lệch ----
test("TB-AC-1 ref_lookup: sáu nhãn thang 08/11, checkDb trục data_level 0 lệch (kèm chiều đỏ)", async () => {
  const reg = readMappings(ROOT);
  const lechBac = async () => (await checkDb(c, reg)).filter((x) => x.axis === "data_level").map((x) => x.msg);
  await trongGiaoDich(async () => {
    const { rows } = await c.query(
      "SELECT lookup_value, label_vi FROM ref_lookup WHERE lookup_name = 'data_level' ORDER BY sort_order");
    assert.deepEqual(rows.map((r) => [r.lookup_value, r.label_vi]), NHAN);
    assert.deepEqual(await lechBac(), [], "checkDb trục data_level phải 0 lệch sau 087");
  }, {
    // chiều đỏ: trên DB chưa có nhãn mới (đưa nhãn về thang cũ trong giao dịch), sổ mới phải báo lệch ở B2
    truoc: async () => {
      await c.query(`UPDATE ref_lookup SET label_vi = CASE lookup_value WHEN 'B1' THEN 'Đọc được' WHEN 'B2' THEN 'Gắn căn'
        WHEN 'B3' THEN 'Đã đo' WHEN 'B4' THEN 'Xác minh' ELSE label_vi END WHERE lookup_name = 'data_level'`);
      const lech = await lechBac();
      assert.ok(lech.some((m) => m.includes("ref_lookup lệch sổ ở data_level · B2")), `chiều đỏ không báo B2: ${lech}`);
    },
  });
});

// ---- E3 · AC-3: bậc của căn danh bạ có tin gắn ----
async function bacCan() {
  const { rows } = await c.query("SELECT unit_key, data_level, ke_thieu FROM unit_data_level() ORDER BY unit_key");
  return rows.map((r) => [r.unit_key, r.data_level, r.ke_thieu]);
}
test("TB-AC-3 unit_data_level: B3 lam-giau · B4 hieu-luc · B5 giu-nhip · quá cửa sổ về B4 (kèm chiều đỏ)", async () => {
  await trongGiaoDich(async () => {
    const { rows: [{ d }] } = await c.query("SELECT pg_get_functiondef('unit_data_level()'::regprocedure) AS d");
    assert.deepEqual(await bacCan(), [], "087 nguyên (chưa bảng nối) — unit_data_level phải rỗng");
    const { rows: [p] } = await c.query("SELECT to_regprocedure('property_data_level(bigint[])') IS NULL AS mat");
    assert.equal(p.mat, true, "property_data_level phải bị bỏ");

    const { ward, units: [u1, u2, u3, u4, u5] } = await khuVaCan(5);
    const daDo = nguonGoc({ measured: true });
    const suThat = nguonGoc({ tier: "fact" });
    const t1 = await tin({ ward, area: null });                                    // thiếu diện tích
    const t2 = await tin({ ward });                                                // đủ, chưa đo
    const t3 = await tin({ ward, fp: daDo });                                      // mọi trường đo
    const t4 = await tin({ ward, fp: suThat, status: "active" });                  // + đang chào, tươi
    const t4b = await tin({ ward, fp: suThat, status: "active" });                 //   tin thứ hai cùng căn = hai mốc giá
    const t5 = await tin({ ward, fp: daDo, status: "active", lastSeen: "now() - interval '30 days'" }); // quá cửa sổ
    const t5b = await tin({ ward, fp: daDo, status: "active", lastSeen: "now() - interval '30 days'" });
    await ganCan([[t1, u1], [t2, u2], [t3, u3], [t4, u4], [t4b, u4], [t5, u5], [t5b, u5]]);
    const ky = [[u2, "B3", "lam-giau"], [u3, "B4", "hieu-luc"], [u4, "B5", "giu-nhip"], [u5, "B4", "hieu-luc"]]
      .sort((a, b) => a[0].localeCompare(b[0]));
    assert.deepEqual(await bacCan(), ky, "TB-AC-3 bảng bậc căn lệch");

    // chiều đỏ: bỏ vế last_seen của B5 → căn quá cửa sổ lên B5
    const lech = d.replace("public.unit_data_level(", "pg_temp.unit_data_level_lech(")
      .replace("AND g.last_seen >= now() - freshness_window()", "");
    assert.notEqual(lech, d.replace("public.unit_data_level(", "pg_temp.unit_data_level_lech("), "bản lệch không đổi gì");
    await c.query(lech);
    const { rows: [r] } = await c.query("SELECT data_level FROM pg_temp.unit_data_level_lech() WHERE unit_key = $1", [u5]);
    assert.notEqual(r.data_level, "B4", "TB-AC-3 quá cửa sổ vẫn B5");
    assert.equal(r.data_level, "B5");
  });
});

// ---- E9 · AC-9: checkDb đọc CHECK danh sách của chính cột, không vớ CHECK chéo với huong ----
test("TB-AC-9 checkDb đọc đúng CHECK của data_level_change (kèm chiều đỏ)", async () => {
  const reg = readMappings(ROOT);
  const cotChuyen = (ds) => ds.filter((x) => ["data_level_change.from_level", "data_level_change.to_level"].includes(x.column));
  await trongGiaoDich(async () => {
    assert.deepEqual(cotChuyen(await checkDb(c, reg)), [], "TB-AC-9 sổ thật: hai cột bậc của data_level_change phải 0 lệch");
    const regLech = structuredClone(reg);
    regLech.axes.find((a) => a.name === "data_level").values.push({ code: "B9", label_vi: "Bậc giả", local: true });
    const lech = cotChuyen(await checkDb(c, regLech)).find((x) => x.column === "data_level_change.from_level");
    assert.ok(lech, "TB-AC-9 sổ có B9 mà không báo lệch ở data_level_change.from_level");
    assert.match(lech.msg, /thiếu \[B9\]/);
    assert.doesNotMatch(lech.msg, /moi/, "TB-AC-9 vớ CHECK chéo");
    // đối chứng: bộ chọn cũ (dòng đầu) trên cùng DB vớ CHECK chéo nếu nó đứng trước — luật mới không phụ thuộc thứ tự
    const { rows: defs } = await c.query(`SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
      WHERE contype = 'c' AND conrelid = 'data_level_change'::regclass`);
    const cua = defs.filter((r) => /\bfrom_level\b/.test(r.def) && /'[^']*'::text/.test(r.def));
    const cheo = cua.find((r) => /huong/.test(r.def));
    assert.ok(cheo, "đối chứng: phải có CHECK chéo huong ↔ from_level");
    const { chonCheckCot } = await import("../lib/vocab-core.mjs");
    assert.doesNotMatch(chonCheckCot([cheo, ...cua.filter((r) => r !== cheo)], "from_level").def, /huong/,
      "TB-AC-9 vớ CHECK chéo khi nó đứng đầu");
    assert.match([cheo, ...cua][0].def, /huong/, "đối chứng đỏ: bộ chọn dòng đầu ra CHECK chéo");
  });
});

// ---- E4 · AC-4: 610 đếm tin và căn theo thang 08/11 ----
const MARKET = `vn-tst-tb-m-${process.pid}`;
const WARD = `vn-tst-tb-w-${process.pid}`;
async function thiTruongThu() {
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code, meta) VALUES
    ($1, NULL, 'market', 'Thị trường thử TB', 'VN', '{}'), ($2, $1, 'submarket', 'Phường thử TB', 'VN', '{}')`, [MARKET, WARD]);
}
async function cum(...offers) {
  const { rows: [r] } = await c.query(
    "INSERT INTO properties (area_id, property_type, verification) VALUES ($1, 'apartment', 'pending') RETURNING id", [WARD]);
  for (const o of offers) await c.query("INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)", [r.id, o]);
}
const anhChupThu = async (sql = SQL_610) => {
  await c.query(sql);
  const { rows } = await c.query(`SELECT unit, data_level, sum(n)::int AS n, array_agg(DISTINCT scale) AS scale
    FROM data_level_snapshot WHERE snap_date = current_date AND market_id = $1 GROUP BY 1, 2 ORDER BY 1, 2`, [MARKET]);
  return rows;
};
/** Fixture viết trước của TB-AC-4: trả các offer_id để ca hai so tập khoá. */
async function fixtureAC4({ ganCanThu = true } = {}) {
  await thiTruongThu();
  const ds = {
    s03: await tin({ source: "S03", ward: WARD }),
    s03Thieu: await tin({ source: "S03", ward: WARD, price: 0 }),
    s05: await tin({ source: "S05", ward: WARD }),
    cum: [await tin({ ward: WARD }), await tin({ ward: WARD }), await tin({ ward: WARD })],
    gan: await tin({ ward: WARD }),
    rut: [await tin({ source: "S03", ward: WARD, retired: true }), await tin({ source: "S05", ward: WARD, retired: true }),
      await tin({ ward: WARD, retired: true })],
  };
  await cum(...ds.cum);
  if (ganCanThu) {
    const { units: [u] } = await khuVaCan(1);
    ds.unit = u;
    await ganCan([[ds.gan, u]]);
  }
  return ds;
}
test("TB-AC-4 610 đếm đơn vị: tin trong cụm ở B1, tin gắn căn chỉ ở căn, scale thang-0811 (kèm chiều đỏ)", async () => {
  await trongGiaoDich(async () => {
    await fixtureAC4();
    const rows = await anhChupThu();
    assert.deepEqual(rows.map((r) => [r.unit, r.data_level, r.n]), [["can", "B3", 1], ["tin_le", "B0", 1], ["tin_le", "B1", 5]],
      "TB-AC-4 bảng đơn vị lệch");
    assert.ok(rows.every((r) => r.scale.length === 1 && r.scale[0] === "thang-0811"), "mọi dòng hôm nay phải mang thang-0811");
    // chiều đỏ: luật cũ (đơn vị tin = tin không nằm trong cụm) bỏ sót ba tin cụm
    const lech = SQL_610.replace("FROM data_level_units() d",
      "FROM (SELECT * FROM data_level_units() x WHERE NOT EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = ANY (x.offer_ids))) d");
    assert.notEqual(lech, SQL_610, "bản lệch không đổi gì — sửa ca đỏ theo 610");
    const r2 = await anhChupThu(lech);
    assert.notDeepEqual(r2.map((r) => [r.unit, r.data_level, r.n]), rows.map((r) => [r.unit, r.data_level, r.n]),
      "TB-AC-4 tin trong cụm không được đếm");
  });
  await trongGiaoDich(async () => {   // 087 nguyên: không fixture gắn căn → không dòng nào của thị trường thử từ B2 trở lên
    await fixtureAC4({ ganCanThu: false });
    const rows = await anhChupThu();
    assert.deepEqual(rows.filter((r) => r.data_level >= "B2"), [], "087 nguyên mà có đơn vị từ B2");
  });
});

test("TB-AC-4 chưa áp 087: bac-du-lieu --write bỏ qua có tên, không chụp ảnh, kiểm đề xuất vẫn ghi", async () => {
  await trongGiaoDich(async () => {
    const { rows: [co] } = await c.query("SELECT to_regprocedure('data_level_units()') IS NOT NULL AS co");
    if (co.co) return;   // DB đã áp 087 (máy thu sau triển khai) — ca chỉ có nghĩa trên lược đồ chưa áp
    const dong = [];
    const { rows: [t0] } = await c.query("SELECT count(*)::int n FROM data_level_snapshot WHERE snap_date = current_date");
    assert.equal(await chay(c, { write: true, out: (s) => dong.push(s) }), 0);
    assert.ok(dong.some((s) => s.includes("chưa áp 087 — bỏ qua")), `không in dòng bỏ qua: ${dong}`);
    const { rows: [t1] } = await c.query("SELECT count(*)::int n FROM data_level_snapshot WHERE snap_date = current_date");
    assert.equal(t1.n, t0.n, "chưa áp 087 mà vẫn chụp ảnh");
    const { rows: k } = await c.query(`SELECT check_name, status, detail FROM dq_check_results
      WHERE check_name IN ('data-level:distribution', 'enrich:proposal-assertion') ORDER BY id DESC LIMIT 2`);
    assert.deepEqual(k.map((r) => r.check_name).sort(), ["data-level:distribution", "enrich:proposal-assertion"]);
    assert.deepEqual(k.find((r) => r.check_name === "data-level:distribution"),
      { check_name: "data-level:distribution", status: "skip", detail: "chua-ap-087" });
    // đối chứng: cùng giao dịch, nạp 087 thì chốt mở (co087 đúng) — bỏ qua là vì thiếu 087, không vì lỗi khác
    await c.query(SQL_087);
    const { co087 } = await import("../bac-du-lieu.mjs");
    assert.equal(await co087(c), true);
  }, { nap087: false });
});

// ---- E4 ca hai · AC-4: 610 và DO1 đọc một tập đơn vị ----
test("TB-AC-4 hai bộ đếm một tập: data_level_units = donViHienTai của DO1 = tập viết trước, tin đã rút không có", async () => {
  const { donViHienTai } = await import("../do-hang-ngay.mjs");
  await trongGiaoDich(async () => {
    const ds = await fixtureAC4();
    const cuaFixture = (k) => k.startsWith(`tin:${T}`) || k === `can:${ds.unit}`;
    const ky = [`can:${ds.unit}`, ...[ds.s03, ds.s03Thieu, ds.s05, ...ds.cum].map((o) => `tin:${o}`)].sort();
    const { rows } = await c.query("SELECT unit_key FROM data_level_units()");
    const sql = rows.map((r) => r.unit_key).filter(cuaFixture).sort();
    const do1 = [...(await donViHienTai(c)).keys()].filter(cuaFixture).sort();
    assert.deepEqual(sql, ky, "TB-AC-4 tập đơn vị của 610 lệch tập viết trước");
    assert.deepEqual(do1, sql, "TB-AC-4 DO1 và 610 đếm hai tập khác nhau");
    for (const o of ds.rut) assert.ok(!sql.includes(`tin:${o}`), `tin đã rút ${o} vẫn là đơn vị`);
  });
});

// ---- E5 · AC-5: DO1 ngày đổi thang lập mốc lại, ngày kế ghi dòng chuyển ----
test("TB-AC-5 DO1 đổi thang: ngày D không ghi dòng chuyển, doi-thang + ngày áp; ngày D+1 ghi như thường (kèm chiều đỏ)", async () => {
  const { doHangNgay, donViHienTai } = await import("../do-hang-ngay.mjs");
  const D = "2026-11-12", D1 = "2026-11-13", AP = "2026-11-10";
  const nen = async (db) => {
    await db.query("DELETE FROM data_level_unit; DELETE FROM data_level_change");
    await db.query(`INSERT INTO data_level_unit (unit_key, unit, source, data_level, ke_thieu, core, seen_on, scale) VALUES
      ('can:999999001', 'can', 'S06', 'B2', 'so-do', '{"tin": []}', '2026-11-08', 'thang-2310'),
      ('tin:${T}-cu-1', 'tin_le', 'S03', 'B0', 'truong-loi', '{"tin": []}', '2026-11-08', 'thang-2310'),
      ('tin:${T}-cu-2', 'tin_le', 'S03', 'B1', 'gan-can', '{"tin": []}', '2026-11-08', 'thang-2310')`);
    await db.query(`DELETE FROM data_level_snapshot WHERE scale = 'thang-0811';
      INSERT INTO data_level_snapshot (snap_date, market_id, property_type, unit, data_level, n, scale)
      VALUES ('${AP}', 'chua-ro', 'unknown', 'tin_le', 'B1', 1, 'thang-0811')`);
  };
  await trongGiaoDich(async () => {
    const { ward } = await khuVaCan(0);
    const t1 = await tin({ ward, source: "S03" });
    await nen(c);
    const lan1 = await doHangNgay(c, { ngay: D, write: true });
    const { rows: [n] } = await c.query("SELECT count(*)::int AS n FROM data_level_change WHERE snap_date = $1", [D]);
    assert.equal(n.n, 0, "TB-AC-5 đổi thang ghi dòng chuyển");
    const r = lan1.dq.find((x) => x.check_name === "do1-chuyen-bac");
    assert.equal(r.status, "skip");
    assert.equal(r.detail.ly_do, "doi-thang");
    assert.equal(r.detail.don_vi, (await donViHienTai(c)).size);
    assert.deepEqual(r.detail.thang, { ma: "thang-0811", tu_ngay: AP }, "ngày áp phải là ngày nhỏ nhất có ảnh chụp thang mới");
    const { rows: thang } = await c.query("SELECT DISTINCT scale FROM data_level_unit");
    assert.deepEqual(thang.map((x) => x.scale), ["thang-0811"]);
    await doHangNgay(c, { ngay: D, write: true });   // chạy lại cùng ngày đổi thang: vẫn không dòng chuyển nào
    const { rows: [n2] } = await c.query("SELECT count(*)::int AS n FROM data_level_change WHERE snap_date = $1", [D]);
    assert.equal(n2.n, 0, "TB-AC-5 chạy lại ngày đổi thang ghi dòng chuyển");

    await c.query("UPDATE sale_offer_records SET price_vnd = NULL WHERE offer_id = $1", [t1]);
    const lan2 = await doHangNgay(c, { ngay: D1, write: true });
    const { rows: dong } = await c.query(
      "SELECT unit_key, huong FROM data_level_change WHERE snap_date = $1 AND unit_key LIKE $2", [D1, `tin:${T}%`]);
    assert.deepEqual(dong.map((x) => [x.unit_key, x.huong]), [[`tin:${t1}`, "tut"]]);
    assert.deepEqual(lan2.dq.find((x) => x.check_name === "do1-chuyen-bac").detail.thang, { ma: "thang-0811", tu_ngay: AP });
  });
  await trongGiaoDich(async () => {   // chiều đỏ: bỏ nhánh đổi thang → ngày D ghi dòng chuyển (đơn vị thang cũ «mất»)
    await nen(c);
    await doHangNgay(c, { ngay: D, write: true, dotBien: "bo-doi-thang" });
    const { rows: [n] } = await c.query("SELECT count(*)::int AS n FROM data_level_change WHERE snap_date = $1", [D]);
    assert.ok(n.n > 0, "đối chứng đỏ: bỏ nhánh đổi thang mà không có dòng chuyển — thước không phân biệt");
    assert.throws(() => assert.equal(n.n, 0, "TB-AC-5 đổi thang ghi dòng chuyển"), /TB-AC-5 đổi thang ghi dòng chuyển/);
  });
});
