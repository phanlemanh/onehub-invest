// bac-du-lieu.itest.mjs — PL16 `de-xuat-thanh-phat-bieu-bac` (AC-n ↔ _acceptance/de-xuat-thanh-phat-bieu-bac/evals.yaml E2,
// E3, E4, E7, E18). Mỗi ca BEGIN … ROLLBACK, 056 nạp trong giao dịch. Chạy trên DB thử riêng (bash db/db-thu.sh
// oneinvest_p2_bac) — không trên DB `oneinvest` dùng chung khi 056 chưa áp (luật đo của đợt dot0-cam-mau).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { chay, ghiAnhChup, KHOA as KHOA_BAC, SQL_610, SQL_KIEM_DE_XUAT } from "../bac-du-lieu.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SQL_056 = readFileSync(path.join(ROOT, "db/migrations/056_data_level.sql"), "utf8");
// PL19: 059 thay property_data_level (thêm vị từ B5) — có tệp thì nạp sau 056, mọi ca PL16 phải trả như cũ.
const TEP_059 = path.join(ROOT, "db/migrations/059_thoi_gian_hieu_luc.sql");
const SQL_059 = existsSync(TEP_059) ? readFileSync(TEP_059, "utf8") : null;
const KHOA = KHOA_BAC; // khoá của bac-du-lieu.mjs lấy TRƯỚC khi áp 056 để lượt song song xếp hàng, không deadlock
const LOI = ["kind", "property_type", "price_vnd", "area_m2", "area_id"];
const MARKET = "vn-tst-bac-m";
const WARD = "vn-tst-bac-w";

let c;
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — trỏ vào DB thử riêng (bash db/db-thu.sh oneinvest_p2_bac)");
  c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const { rows: [r] } = await c.query("SELECT current_database() AS db, to_regclass('public.data_level_snapshot')::text AS t");
  if (r.db === "oneinvest" && !r.t) throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung khi 056 chưa áp — dùng DB thử");
});
after(async () => {
  await c?.end();
});

export async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
    await c.query(SQL_056);
    if (SQL_059) await c.query(SQL_059);
    await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code, meta) VALUES
      ($1, NULL, 'market', 'Thị trường thử PL16', 'VN', '{}'), ($2, $1, 'submarket', 'Phường thử PL16', 'VN', '{}')`, [MARKET, WARD]);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK");
  }
}

/** Nguồn gốc năm trường lõi theo khuôn resolve_offer_fields (045); `rieng` đè từng khoá. */
function nguonGoc({ measured = false, tier = "observed" } = {}, rieng = {}) {
  const fp = {};
  for (const k of LOI) {
    fp[k] = { v: "x", ids: [], tier, method: tier === "fact" ? "source_field" : "parser", conflict: false, measured,
      lower_disagree: false, ...(rieng[k] ?? {}) };
  }
  return fp;
}

let dem = 0;
async function tin({ kind = "sale", pt = "house", price = 2_000_000_000, area = 60, ward = WARD, source = "S06", fp = {} } = {}) {
  const id = `pl16-tst-${++dem}`;
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, price_vnd, area_m2, area_id, source,
      originating_system_key, first_seen, last_seen, field_provenance)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $1, now(), now(), $8)`, [id, kind, pt, price, area, ward, source, fp]);
  return id;
}
async function can({ pt = "house", verification = "pending", ward = WARD } = {}, ...offers) {
  const { rows: [r] } = await c.query(
    "INSERT INTO properties (area_id, property_type, verification) VALUES ($1, $2, $3) RETURNING id", [ward, pt, verification]);
  for (const o of offers) await c.query("INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)", [r.id, o]);
  return Number(r.id);
}
async function bacCan(fn, ids) {
  const { rows } = await c.query(`SELECT property_id, data_level, ke_thieu FROM ${fn}($1)`, [ids]);
  return new Map(rows.map((r) => [Number(r.property_id), { data_level: r.data_level, ke_thieu: r.ke_thieu }]));
}
async function bacTin(id, linked) {
  const { rows: [r] } = await c.query(`SELECT l.* FROM sale_offers o,
    offer_data_level(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id, $2) l WHERE o.offer_id = $1`, [id, linked]);
  return { data_level: r.data_level, ke_thieu: r.ke_thieu };
}

/** Bản lệch của property_data_level ở pg_temp: một chỗ thay trong thân hàm — chiều đỏ của thước. */
async function banLech(cu, moi) {
  const { rows: [r] } = await c.query("SELECT pg_get_functiondef('property_data_level(bigint[])'::regprocedure) AS d");
  assert.ok(r.d.includes(cu), `bản lệch: thân hàm không còn đoạn «${cu}» — sửa ca đỏ theo hàm`);
  await c.query(r.d.replace("public.property_data_level(", "pg_temp.property_data_level_lech(").replace(cu, moi));
  return "pg_temp.property_data_level_lech";
}

async function kiemAC2(fn, b2, b0) {
  const r = await bacCan(fn, [b2, b0]);
  assert.deepEqual(r.get(b2), { data_level: "B2", ke_thieu: "so-do" }, "căn có tin đủ trường lõi phải là B2");
  assert.deepEqual(r.get(b0), { data_level: "B0", ke_thieu: "truong-loi" }, "căn thiếu trường lõi phải là B0");
}
test("AC-2 căn B2 · căn B0 truong-loi · tin lẻ B1 gan-can; không căn nào nhận B1 (kèm chiều đỏ)", async () => {
  await trongGiaoDich(async () => {
    const du = await tin();
    const thieu = await tin({ price: 0 });
    const le = await tin();
    const b2 = await can({}, du);
    const b0 = await can({}, thieu);
    await kiemAC2("property_data_level", b2, b0);
    const lech = await banLech(
      "OR NOT offer_core_complete(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id) THEN 0", "THEN 0");
    await assert.rejects(kiemAC2(lech, b2, b0), /căn thiếu trường lõi phải là B0/);
    assert.deepEqual(await bacTin(le, false), { data_level: "B1", ke_thieu: "gan-can" });
    const { rows: [n] } = await c.query("SELECT count(*)::int AS n FROM property_data_level(NULL) WHERE data_level = 'B1'");
    assert.equal(n.n, 0, "không căn nào nhận B1");
  });
});

test("AC-2 căn gắn cả tin đủ lẫn tin thiếu trường lõi → B2 (một tin đủ là đủ)", async () => {
  await trongGiaoDich(async () => {
    const p = await can({}, await tin({ area: null }), await tin());
    assert.deepEqual((await bacCan("property_data_level", [p])).get(p), { data_level: "B2", ke_thieu: "so-do" });
  });
});

async function kiemAC3(fn, b3, b2) {
  const r = await bacCan(fn, [b3, b2]);
  assert.deepEqual(r.get(b3), { data_level: "B3", ke_thieu: "xac-minh" }, "đủ năm trường lõi đã đo phải lên B3");
  assert.deepEqual(r.get(b2), { data_level: "B2", ke_thieu: "so-do" }, "thiếu một trường đo phải ở B2");
}
test("AC-3 B3 khi cả năm trường lõi measured; thiếu một trường đo ở lại B2 so-do (kèm chiều đỏ)", async () => {
  await trongGiaoDich(async () => {
    const b3 = await can({}, await tin({ fp: nguonGoc({ measured: true }) }));
    const b2 = await can({}, await tin({ fp: nguonGoc({ measured: true }, { area_m2: { measured: false } }) }));
    await kiemAC3("property_data_level", b3, b2);
    const lech = await banLech("bool_and(coalesce(o.field_provenance -> k ->> 'measured'",
      "bool_or(coalesce(o.field_provenance -> k ->> 'measured'");
    await assert.rejects(kiemAC3(lech, b3, b2), /thiếu một trường đo phải ở B2/);
  });
});

async function kiemAC4(fn, b4, cho, quanSat) {
  const r = await bacCan(fn, [b4, cho, quanSat]);
  assert.deepEqual(r.get(b4), { data_level: "B4", ke_thieu: "hieu-luc" }, "đã đo + xác minh + lớp sự thật phải lên B4");
  assert.deepEqual(r.get(cho), { data_level: "B3", ke_thieu: "xac-minh" }, "pending không được lên B4");
  assert.deepEqual(r.get(quanSat), { data_level: "B3", ke_thieu: "xac-minh" }, "một trường lớp observed không được lên B4");
}
test("AC-4 B4 khi B3 + verified + lớp fact; pending hay một trường observed → B3 xac-minh; không đơn vị nào B5", async () => {
  await trongGiaoDich(async () => {
    const fact = nguonGoc({ measured: true, tier: "fact" });
    const b4 = await can({ verification: "verified" }, await tin({ fp: fact }));
    const cho = await can({ verification: "pending" }, await tin({ fp: fact }));
    const quanSat = await can({ verification: "verified" },
      await tin({ fp: nguonGoc({ measured: true, tier: "fact" }, { price_vnd: { tier: "observed", method: "parser" } }) }));
    await kiemAC4("property_data_level", b4, cho, quanSat);
    const lech = await banLech("p.verification = 'verified'", "p.verification IN ('verified', 'pending')");
    await assert.rejects(kiemAC4(lech, b4, cho, quanSat), /pending không được lên B4/);
    const { rows: [n] } = await c.query("SELECT count(*)::int AS n FROM property_data_level(NULL) WHERE data_level = 'B5'");
    assert.equal(n.n, 0, "không đơn vị nào nhận B5 (vị từ B5 là của PL19)");
  });
});

test("AC-9 056 chạy hai lần không nhân dòng trục", async () => {
  await trongGiaoDich(async () => {
    await c.query(SQL_056);
    const { rows: [r] } = await c.query(`SELECT
      (SELECT count(*)::int FROM ref_field_lookup WHERE table_name = 'data_level_snapshot') AS rel,
      (SELECT count(*)::int FROM ref_lookup WHERE lookup_name = 'data_level') AS truc`);
    assert.deepEqual(r, { rel: 1, truc: 6 });
  });
});

// —— Việc 3: ảnh chụp 610 + kiểm đề xuất ——

async function deXuat(offer, status, value = "3") {
  const { rows: [r] } = await c.query(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source,
      route, status, applied_at) VALUES ('pl16-tst', $1, 'bedrooms', $2, $2, 'e1_rule', 'direct', $3, now()) RETURNING id`,
  [offer, value, status]);
  return Number(r.id);
}
const phatBieu = (offer, method, evidence = {}) => c.query(`INSERT INTO field_assertions (subject_key, field, value,
    evidence_tier, method, evidence, observed_at) VALUES ($1, 'bedrooms', '3', 'observed', $2, $3, now())`,
  [`S06:${offer}`, method, evidence]);
const dongKiem = async () => (await c.query(`SELECT status, detail FROM dq_check_results
  WHERE check_name = 'enrich:proposal-assertion' ORDER BY id DESC LIMIT 1`)).rows[0];
const im = () => {};

function kiemAC7(r) {
  assert.deepEqual(r, { applied: 4, missing: 2 }, "legacy không được tính là phát biểu của đề xuất");
}
test("AC-7 enrich:proposal-assertion bốn dạng → applied=4 missing=2 fail; bỏ c,d → pass; rỗng → pass; mã thoát 0", async () => {
  await trongGiaoDich(async () => {
    await c.query("UPDATE enrichment_proposals SET status = 'skipped' WHERE status = 'applied'"); // nền 0 (ROLLBACK trả lại)
    const [ta, tb, tc, td] = [await tin(), await tin(), await tin(), await tin()];
    const a = await deXuat(ta, "applied");
    await phatBieu(ta, "e1_rule", { proposal_id: a, route: "direct" });
    await deXuat(tb, "applied");
    await phatBieu(tb, "e1_rule");
    const pc = await deXuat(tc, "applied");
    await phatBieu(tc, "legacy");
    const pd = await deXuat(td, "applied");

    assert.equal(await chay(c, { write: true, out: im }), 0, "dòng kiểm fail không đổi mã thoát");
    assert.deepEqual(await dongKiem(), { status: "fail", detail: "applied=4 missing=2" });
    kiemAC7((await c.query(SQL_KIEM_DE_XUAT)).rows[0]);
    // Bản lệch: nhận cả phát biểu legacy cùng giá trị (lỗi «giá trị có trước che đề xuất thiếu» — gap-probe).
    const lech = SQL_KIEM_DE_XUAT.replace("AND fa.method <> 'legacy'", "")
      .replace("fa.method = CASE WHEN", "fa.method IN ('legacy', CASE WHEN").replace("ELSE ep.source END))", "ELSE ep.source END)))");
    assert.equal((lech.match(/'legacy', CASE/g) ?? []).length, 1, "bản lệch: câu kiểm đã đổi — sửa ca đỏ");
    await assert.rejects(async () => kiemAC7((await c.query(lech)).rows[0]), /legacy không được tính là phát biểu của đề xuất/);

    await c.query("UPDATE enrichment_proposals SET status = 'rejected' WHERE id = ANY ($1)", [[pc, pd]]);
    assert.equal(await chay(c, { write: true, out: im }), 0);
    assert.deepEqual(await dongKiem(), { status: "pass", detail: "applied=2 missing=0" });

    await c.query("UPDATE enrichment_proposals SET status = 'rejected' WHERE status = 'applied'");
    assert.equal(await chay(c, { write: true, out: im }), 0);
    assert.deepEqual(await dongKiem(), { status: "pass", detail: "applied=0 missing=0" });
  });
});

const nCua = async (market, pt, unit, lv) => (await c.query(`SELECT coalesce(sum(n), 0)::int AS n FROM data_level_snapshot
  WHERE snap_date = current_date AND market_id = $1 AND property_type = $2 AND unit = $3 AND data_level = $4`,
[market, pt, unit, lv])).rows[0].n;

async function kiemPhanKhuc(truoc) {
  assert.equal(await nCua("chua-ro", "land", "tin_le", "B0"), truoc + 1, "tin không phường phải ở chua-ro");
  assert.equal(await nCua(MARKET, "apartment", "can", "B2"), 1, "căn ở phường con của thị trường, loại hình lấy từ căn");
  assert.equal(await nCua(MARKET, "house", "can", "B2"), 0, "loại hình của căn không lấy từ tin gắn");
  assert.equal(await nCua(MARKET, "house", "tin_le", "B1"), 1, "tin lẻ đủ trường lõi ở thị trường của phường");
}
test("AC-5 phân khúc của đơn vị: thị trường = cha market của phường, không phường → chua-ro (kèm chiều đỏ)", async () => {
  await trongGiaoDich(async () => {
    await ghiAnhChup(c);
    const truoc = await nCua("chua-ro", "land", "tin_le", "B0");
    await tin({ pt: "land", ward: null, source: "S03" });
    await can({ pt: "apartment" }, await tin({ pt: "house" }));
    await tin({ pt: "house", source: "S05" });
    await ghiAnhChup(c);
    await kiemPhanKhuc(truoc);
    const { rows: [t] } = await c.query(`SELECT
      (SELECT sum(n)::int FROM data_level_snapshot WHERE snap_date = current_date) AS snap,
      (SELECT count(*)::int FROM properties)
        + (SELECT count(*)::int FROM sale_offers o WHERE o.source IN ('S03', 'S05', 'S06')
             AND NOT EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = o.offer_id)) AS dem`);
    assert.equal(t.snap, t.dem, "tổng ảnh chụp = số căn + số tin lẻ còn sống");
    const lech = SQL_610.replace("LEFT JOIN areas w ON w.id = d.area_id", "JOIN areas w ON w.id = d.area_id");
    assert.notEqual(lech, SQL_610, "bản lệch: 610 không còn LEFT JOIN phường — sửa ca đỏ");
    await c.query(lech);
    await assert.rejects(kiemPhanKhuc(truoc), /tin không phường phải ở chua-ro/);
  });
});
