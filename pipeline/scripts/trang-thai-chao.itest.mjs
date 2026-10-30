// trang-thai-chao.itest.mjs — PL19 `thoi-gian-va-hieu-luc` (AC-n ↔ _acceptance/thoi-gian-va-hieu-luc/evals.yaml E1–E7).
// Mỗi ca BEGIN … ROLLBACK, 059 nạp trong giao dịch dưới khoá của bac-du-lieu.mjs. Chạy trên DB thử riêng
// (bash db/db-thu.sh oneinvest_p2_tg) — không trên DB `oneinvest` dùng chung khi 059 chưa áp (luật đo của đợt dot0-cam-mau).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { ghiAnhChup, KHOA } from "../bac-du-lieu.mjs";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";
import { writeAssertions } from "../lib/assert.mjs";
import { catChuyen } from "../phat-bieu-cat-chuyen.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const TEP_059 = path.join(ROOT, "db/migrations/059_thoi_gian_hieu_luc.sql");
const sql059 = () => readFileSync(TEP_059, "utf8");
const T = `pl19-tst-${process.pid}`;

let c;
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — trỏ vào DB thử riêng (bash db/db-thu.sh oneinvest_p2_tg)");
  c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const { rows: [r] } = await c.query(
    "SELECT current_database() AS db, to_regclass('public.history_transactional')::text AS t");
  if (r.db === "oneinvest" && !r.t) throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung khi 059 chưa áp — dùng DB thử");
});
after(async () => {
  await c?.end();
});

/** Một giao dịch ROLLBACK: `truoc` chạy trước khi nạp 059 (fixture đời cũ), rồi nạp `sql` (mặc định 059 thật). */
async function trongGiaoDich(fn, { truoc, sql = sql059() } = {}) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
    if (truoc) await truoc(c);
    await c.query(sql);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK");
  }
}

let dem = 0;
/** Một tin trong bảng bản ghi; trả offer_id (= khoá gốc). */
async function tin({ source = "S06", last_seen = "2026-10-20T00:00:00Z", first_seen = last_seen, price = 2_000_000_000,
  retired_at = null, retired_reason = null, post_ids = [], bedrooms = null } = {}) {
  const id = `${T}-${++dem}`;
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, price_vnd, source, originating_system_key, post_ids,
      first_seen, last_seen, retired_at, retired_reason, bedrooms)
    VALUES ($1, 'sale', $2, $3, $1, $4::text[], $5, $6, $7, $8, $9)`,
  [id, price, source, post_ids, first_seen, last_seen, retired_at, retired_reason, bedrooms]);
  return id;
}
const phatBieu = async (subject, field) => (await c.query(`SELECT * FROM field_assertions
  WHERE subject_key = $1 AND field = $2 AND retracted_at IS NULL ORDER BY id`, [subject, field])).rows;

// ---- Task 1 · AC-1: observed_at bắt buộc ----
/** Fixture đời cũ: phát biểu legacy chèn khi cột còn cho NULL (DB đã áp 059 thì gỡ NOT NULL trong giao dịch). */
async function fixtureLegacy(db) {
  await db.query("ALTER TABLE field_assertions ALTER COLUMN observed_at DROP NOT NULL");
  const sau = await tin({ last_seen: "2026-10-20T00:00:00Z" });    // thấy lần cuối SAU khi phát biểu được tạo
  const truoc = await tin({ last_seen: "2026-10-01T00:00:00Z" });  // thấy lần cuối TRƯỚC
  const legacy = (offer, tao) => db.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method,
      evidence, created_at) VALUES ($1, 'bedrooms', '2', 'observed', 'legacy', jsonb_build_object('offer_id', $2::text), $3)
    RETURNING id`, [`S06:${offer}`, offer, tao]).then((r) => r.rows[0].id);
  return {
    sau: await legacy(sau, "2026-10-10T00:00:00Z"),
    truoc: await legacy(truoc, "2026-10-10T00:00:00Z"),
    moCoi: await legacy(`${T}-khong-co`, "2026-10-12T00:00:00Z"),
  };
}
const fx = {};
async function kiemAC1(db) {
  const { rows } = await db.query("SELECT id, observed_at FROM field_assertions WHERE id = ANY ($1)",
    [[fx.sau, fx.truoc, fx.moCoi]]);
  const at = new Map(rows.map((r) => [Number(r.id), r.observed_at?.toISOString()]));
  assert.equal(at.get(Number(fx.sau)), "2026-10-10T00:00:00.000Z", "legacy phải lấy least(last_seen, created_at)");
  assert.equal(at.get(Number(fx.truoc)), "2026-10-01T00:00:00.000Z", "legacy phải lấy least(last_seen, created_at)");
  assert.equal(at.get(Number(fx.moCoi)), "2026-10-12T00:00:00.000Z", "legacy mồ côi phải lấy created_at");
}
test("AC-1 observed_at bắt buộc: điền lùi legacy, 0 phát biểu sống thiếu, chèn thiếu bị từ chối (kèm chiều đỏ)", async () => {
  await trongGiaoDich(async (db) => {
    await kiemAC1(db);
    const { rows: [n] } = await db.query(
      "SELECT count(*)::int AS n FROM field_assertions WHERE retracted_at IS NULL AND observed_at IS NULL");
    assert.equal(n.n, 0, "còn phát biểu sống thiếu observed_at");
    await db.query("SAVEPOINT chen");
    await assert.rejects(db.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method)
      VALUES ('S06:${T}-x', 'bedrooms', '3', 'fact', 'source_field')`), /observed_at/);
    await db.query("ROLLBACK TO SAVEPOINT chen");
  }, { truoc: async (db) => Object.assign(fx, await fixtureLegacy(db)) });

  const cu = "least(o.last_seen, fa.created_at)";
  assert.ok(sql059().includes(cu), `chiều đỏ: 059 không còn đoạn «${cu}» — sửa ca theo migration`);
  await assert.rejects(trongGiaoDich(kiemAC1, {
    truoc: async (db) => Object.assign(fx, await fixtureLegacy(db)),
    sql: sql059().replace(cu, "o.last_seen"),
  }), /legacy phải lấy least\(last_seen, created_at\)/);
});

// ---- Task 1 · AC-3: cột trạng thái chào và trục cột phát biểu ----
const COT_MOI = ["sale_offer_records.offer_status", "field_assertions.field"];
const lechCuaCot = (ds) => ds.filter((x) => COT_MOI.includes(x.column) || ["assertion_field", "offer_status"].includes(x.axis));
test("AC-3 cột và trục: offer_status mặc định unknown, CHECK theo sổ, checkDb 0 lệch (kèm chiều đỏ)", async () => {
  const reg = readMappings(ROOT);
  await trongGiaoDich(async (db) => {
    const id = await tin();
    const { rows: [o] } = await db.query("SELECT offer_status FROM sale_offers WHERE offer_id = $1", [id]);
    assert.equal(o.offer_status, "unknown", "tin mới phải mang offer_status mặc định unknown");
    const { rows: rel } = await db.query(`SELECT table_name || '.' || column_name AS col, lookup_name FROM ref_field_lookup
      WHERE (table_name, column_name) IN (('field_assertions', 'field'), ('enrichment_proposals', 'field'),
                                          ('sale_offer_records', 'offer_status'))`);
    assert.deepEqual(Object.fromEntries(rel.map((r) => [r.col, r.lookup_name])), {
      "field_assertions.field": "assertion_field",
      "enrichment_proposals.field": "enrich_field",
      "sale_offer_records.offer_status": "offer_status",
    });
    const truc = (ten) => reg.axes.find((a) => a.name === ten);
    assert.deepEqual(truc("assertion_field").values.map((v) => v.code).sort(),
      [...truc("enrich_field").values.map((v) => v.code), "offer_status"].sort(), "trục assertion_field = năm trường enrich + offer_status");
    assert.deepEqual((await checkDb(db, reg)).map((x) => x.msg), [], "sổ từ vựng lệch DB sau 059");

    const regLech = structuredClone(reg);
    regLech.axes.find((a) => a.name === "offer_status").values
      .push({ code: "gia_tri_gia", label_vi: "Giá trị giả", local: true });
    const lech = lechCuaCot(await checkDb(db, regLech));
    assert.ok(lech.some((x) => x.axis === "offer_status" && x.column === "sale_offer_records.offer_status"),
      `checkDb không báo lệch ở trục offer_status: ${JSON.stringify(lech)}`);
  });
});

// ---- Task 2 · AC-2: ba bộ ghi đều ghi observed_at ----
const SQL_045 = readFileSync(path.join(ROOT, "db/migrations/045_phat_bieu_va_phan_xu.sql"), "utf8");
const APPLY_045 = SQL_045.slice(SQL_045.indexOf("CREATE OR REPLACE FUNCTION apply_enrichment("),
  SQL_045.indexOf("-- 8. revert_enrichment"));
const TAO_DE_XUAT = "2026-10-15T08:00:00.000Z";
async function kiemApply(db) {
  const o = await tin({ last_seen: "2026-10-20T00:00:00Z" });
  const { rows: [ep] } = await db.query(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source,
      route, created_at) VALUES ('${T}', $1, 'bathrooms', '2', '2', 'e1_rule', 'direct', $2) RETURNING id`, [o, TAO_DE_XUAT]);
  await db.query("SAVEPOINT ap");
  try {
    await db.query("SELECT apply_enrichment($1::bigint[], 'agent:pl19')", [[ep.id]]);
  } catch (e) {
    await db.query("ROLLBACK TO SAVEPOINT ap");
    assert.fail(`apply_enrichment phải ghi observed_at — ${e.message}`);
  }
  const [fa] = await phatBieu(`S06:${o}`, "bathrooms");
  assert.equal(fa?.observed_at?.toISOString(), TAO_DE_XUAT, "apply_enrichment phải ghi observed_at");
}
test("AC-2 ba bộ ghi đều ghi observed_at: bộ đọc, áp đề xuất, bước chuyển (kèm chiều đỏ)", async () => {
  await trongGiaoDich(async (db) => {
    // bộ đọc: nguồn không cho thời điểm đăng → lúc đọc
    const doc = await tin();
    const t0 = Date.now();
    await writeAssertions(db, [{ subject_key: `S06:${doc}`, field: "bedrooms", value: 3, evidence_tier: "observed",
      method: "parser", observed_at: null }]);
    const [p] = await phatBieu(`S06:${doc}`, "bedrooms");
    assert.ok(p.observed_at, "bộ đọc phải ghi observed_at");
    assert.ok(Math.abs(p.observed_at.getTime() - t0) <= 5000, `observed_at của bộ đọc phải là lúc đọc: ${p.observed_at.toISOString()}`);
    // áp đề xuất: lúc tạo đề xuất
    await kiemApply(db);
    // bước chuyển: least(lần thấy cuối, lúc ghi)
    const cu = await tin({ last_seen: "2026-09-01T00:00:00Z", bedrooms: 4 });
    await catChuyen(db, { actor: "cat-chuyen:pl19-itest" });
    const [lg] = await phatBieu(`S06:${cu}`, "bedrooms");
    assert.equal(lg?.method, "legacy");
    assert.equal(lg.observed_at.toISOString(), "2026-09-01T00:00:00.000Z", "bước chuyển phải ghi least(last_seen, lúc ghi)");
  });
  await assert.rejects(trongGiaoDich(async (db) => {
    await db.query(APPLY_045);
    await kiemApply(db);
  }), /apply_enrichment phải ghi observed_at/);
});

// ---- Task 3 · AC-4, AC-5: bộ ghi bằng chứng + phân xử trạng thái chào ----
const iso = (d) => d?.toISOString();
async function chao(ids) {
  const { rows: [g] } = await c.query("SELECT ghi_bang_chung_chao($1::text[]) AS g", [ids]);
  await c.query("SELECT resolve_offer_status($1::text[])", [ids]);
  return g.g;
}
const trangThai = async (id) => (await c.query("SELECT offer_status FROM sale_offer_records WHERE offer_id = $1", [id]))
  .rows[0].offer_status;
const chaoCua = async (id) => (await c.query(`SELECT * FROM field_assertions WHERE field = 'offer_status'
  AND evidence ->> 'offer_id' = $1 AND retracted_at IS NULL ORDER BY id`, [id])).rows;
const nghi = (id, at, ly_do = "het_trong_luot") => c.query(
  "UPDATE sale_offer_records SET retired_at = $2, retired_reason = $3 WHERE offer_id = $1", [id, at, ly_do]);
const quayLai = (id, at) => c.query(
  "UPDATE sale_offer_records SET retired_at = NULL, retired_reason = NULL, last_seen = $2 WHERE offer_id = $1", [id, at]);

const L = "2026-10-20T03:00:00.000Z";
const R = "2026-10-22T03:00:00.000Z";
async function nhanDang() {
  return {
    s06: await tin({ source: "S06", last_seen: L }),
    s03: await tin({ source: "S03", last_seen: L }),
    s05: await tin({ source: "S05", last_seen: L }),
    het: await tin({ source: "S06", last_seen: L, retired_at: R, retired_reason: "het_trong_luot" }),
    doi: await tin({ source: "S03", last_seen: L, retired_at: R, retired_reason: "doi_khoa" }),
  };
}
async function kiemNamDang(t) {
  const ids = Object.values(t);
  await chao(ids);
  const mot = async (id) => {
    const ds = await chaoCua(id);
    assert.equal(ds.length, 1, `tin ${id}: phải đúng một phát biểu trạng thái, có ${ds.length}`);
    return ds[0];
  };
  const pick = (a) => [a.value, a.evidence_tier, a.method, iso(a.observed_at)];
  assert.deepEqual(pick(await mot(t.s06)), ["active", "fact", "source_field", L], "S06 sống → active lớp sự thật");
  assert.deepEqual(pick(await mot(t.s03)), ["active", "observed", "parser", L], "S03 sống → active lớp quan sát");
  assert.deepEqual(pick(await mot(t.s05)), ["active", "observed", "parser", L], "S05 sống → active lớp quan sát");
  assert.deepEqual(pick(await mot(t.het)), ["withdrawn", "fact", "source_field", R], "S06 vắng lượt → withdrawn lúc nghỉ");
  assert.deepEqual(await chaoCua(t.doi), [], "đổi khoá không phải bằng chứng gỡ");
  assert.equal((await chao(ids)).moi, 0, "lần hai không thêm phát biểu nào");
}
/** Đầu–cuối trên tin S06: sống (t1) → nghỉ vắng lượt (t2) → quay lại (t3). */
async function songNghiQuayLai() {
  const o = await tin({ source: "S06", last_seen: "2026-10-01T00:00:00Z" });
  await chao([o]);
  assert.equal(await trangThai(o), "active", "tin sống phải ra active");
  await nghi(o, "2026-10-05T00:00:00Z");
  await chao([o]);
  assert.equal(await trangThai(o), "withdrawn", "tin đã gỡ phải ra withdrawn");
  await quayLai(o, "2026-10-08T00:00:00Z");
  await chao([o]);
  assert.equal(await trangThai(o), "active", "tin quay lại phải ra active");
  const { rows } = await c.query(`SELECT value, observed_at, retract_reason FROM field_assertions
    WHERE field = 'offer_status' AND evidence ->> 'offer_id' = $1 ORDER BY id`, [o]);
  assert.deepEqual(rows.map((r) => [r.value, iso(r.observed_at), r.retract_reason]), [
    ["active", "2026-10-01T00:00:00.000Z", "quay-lai"],
    ["withdrawn", "2026-10-05T00:00:00.000Z", null],
    ["active", "2026-10-08T00:00:00.000Z", null],
  ], "phát biểu active cũ bị rút có lý do, phát biểu mới lúc quay lại");
}
test("AC-4 bộ ghi bằng chứng năm dạng + đầu–cuối sống → nghỉ → quay lại (kèm chiều đỏ)", async () => {
  await trongGiaoDich(async () => {
    await kiemNamDang(await nhanDang());
    await songNghiQuayLai();
    // Tin S06 nghỉ đổi khoá, tin kế sống chung post: tin kế giữ active (Review Focus 1).
    const x = await tin({ source: "S06", last_seen: L, retired_at: R, retired_reason: "doi_khoa" });
    const y = await tin({ source: "S06", last_seen: R, post_ids: [x] });
    await chao([x, y]);
    assert.equal(await trangThai(y), "active", "tin kế của tin đổi khoá phải giữ active");
    // Quay lại đúng lúc nghỉ (cùng lượt): active mới vẫn sau withdrawn (Review Focus 2).
    const z = await tin({ source: "S06", last_seen: L });
    await chao([z]);
    await nghi(z, R);
    await chao([z]);
    await quayLai(z, R);
    await chao([z]);
    assert.equal(await trangThai(z), "active", "quay lại cùng thời điểm nghỉ phải ra active");
  });
  const doiKhoa = "(r.retired_at IS NOT NULL AND r.retired_reason = 'het_trong_luot' AND r.source = 'S06')";
  const songLast = "CASE WHEN r.retired_at IS NULL THEN r.last_seen ELSE r.retired_at END AS t";
  for (const cu of [doiKhoa, songLast]) assert.ok(sql059().includes(cu), `chiều đỏ: 059 không còn «${cu}»`);
  await assert.rejects(trongGiaoDich(async () => kiemNamDang(await nhanDang()), {
    sql: sql059().replace(doiKhoa, "(r.retired_at IS NOT NULL AND r.retired_reason IN ('het_trong_luot', 'doi_khoa'))"),
  }), /đổi khoá không phải bằng chứng gỡ/);
  await assert.rejects(trongGiaoDich(songNghiQuayLai, {
    sql: sql059().replace(songLast, "CASE WHEN r.retired_at IS NULL THEN now() ELSE r.retired_at END AS t"),
  }), /tin đã gỡ phải ra withdrawn/);
});

const phatBieuChao = (id, value, tier, method, at) => c.query(`INSERT INTO field_assertions (subject_key, field, value,
    evidence_tier, method, evidence, observed_at) VALUES ($1, 'offer_status', $2, $3, $4, jsonb_build_object('offer_id', $5::text), $6)`,
[`S06:${id}`, value, tier, method, id, at]);
async function kiemMoiNhat() {
  const o = await tin({ source: "S06" });
  await phatBieuChao(o, "active", "fact", "source_field", "2026-10-01T00:00:00Z");
  await phatBieuChao(o, "closed", "observed", "parser", "2026-10-09T00:00:00Z");
  await c.query("SELECT resolve_offer_status($1::text[])", [[o]]);
  assert.equal(await trangThai(o), "closed", "trạng thái mới nhất phải thắng");
}
test("AC-5 phân xử theo thời gian: mới nhất thắng, cùng lúc theo phương pháp, quá cửa sổ giữ nguyên (kèm chiều đỏ)", async () => {
  await trongGiaoDich(async () => {
    await songNghiQuayLai();
    // cùng thời điểm, khác giá trị → thứ tự phương pháp của 045 (source_field trước parser)
    const o = await tin({ source: "S06" });
    await phatBieuChao(o, "withdrawn", "observed", "parser", "2026-10-03T00:00:00Z");
    await phatBieuChao(o, "active", "fact", "source_field", "2026-10-03T00:00:00Z");
    await c.query("SELECT resolve_offer_status($1::text[])", [[o]]);
    assert.equal(await trangThai(o), "active", "cùng thời điểm phải theo thứ tự phương pháp");
    const { rows: [fp] } = await c.query("SELECT field_provenance -> 'offer_status' AS p FROM sale_offer_records WHERE offer_id = $1", [o]);
    assert.deepEqual([fp.p.v, fp.p.tier, fp.p.method, fp.p.observed_at], ["active", "fact", "source_field", "2026-10-03T00:00:00+00:00"]);
    // lớp quan sát mới hơn thắng lớp sự thật cũ hơn (Hỏi-4)
    await kiemMoiNhat();
    // chỉ quá cửa sổ độ tươi, không bằng chứng mới → giữ nguyên (Hỏi-1)
    const cu = await tin({ source: "S06", last_seen: new Date(Date.now() - 30 * 86400e3).toISOString() });
    await chao([cu]);
    assert.equal(await trangThai(cu), "active");
    assert.equal((await chao([cu])).moi, 0);
    assert.equal(await trangThai(cu), "active", "quá cửa sổ không có bằng chứng mới phải giữ nguyên trạng thái");
  });
  const thuTu = "ORDER BY sk.offer_id, fa.observed_at DESC, assertion_method_rank(fa.method), fa.id";
  assert.ok(sql059().includes(thuTu), `chiều đỏ: 059 không còn «${thuTu}»`);
  await assert.rejects(trongGiaoDich(kiemMoiNhat, {
    sql: sql059().replace(thuTu, "ORDER BY sk.offer_id, assertion_method_rank(fa.method), fa.observed_at DESC, fa.id"),
  }), /trạng thái mới nhất phải thắng/);
});

// ---- Task 4 · AC-6: lịch sử giá và trạng thái ----
const lichSu = async (id) => (await c.query(`SELECT field_name, previous_value, new_value, change_type FROM history_transactional
  WHERE resource_record_key = $1 ORDER BY id`, [id])).rows.map((r) => [r.change_type, r.field_name, r.previous_value, r.new_value]);
async function canCo(...offers) {
  const { rows: [p] } = await c.query("INSERT INTO properties (property_type) VALUES ('house') RETURNING id");
  for (const o of offers) await c.query("INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)", [p.id, o]);
  return Number(p.id);
}
async function kiemCungGia() {
  const o = await tin({ price: 3_000_000_000 });
  await c.query("UPDATE sale_offer_records SET price_vnd = price_vnd, last_seen = now() WHERE offer_id = $1", [o]);
  assert.deepEqual(await lichSu(o), [["new_listing", "ListPrice", null, "3000000000"]], "cùng giá không sinh dòng lịch sử");
}
test("AC-6 lịch sử giá và trạng thái: tin mới, đổi giá, gỡ, chào lại, gom theo căn, điền lùi (kèm chiều đỏ)", async (t) => {
  let truoc;
  await trongGiaoDich(async () => {
    const a = await tin({ source: "S06", price: 2_000_000_000, last_seen: "2026-10-01T00:00:00Z" });
    await c.query("UPDATE sale_offer_records SET price_vnd = 1900000000 WHERE offer_id = $1", [a]);
    await kiemCungGia();
    await chao([a]);                                   // unknown → active: lần xác định đầu, không ghi
    await nghi(a, "2026-10-05T00:00:00Z");
    await chao([a]);
    await quayLai(a, "2026-10-08T00:00:00Z");
    await chao([a]);
    assert.deepEqual(await lichSu(a), [
      ["new_listing", "ListPrice", null, "2000000000"],
      ["price_change", "ListPrice", "2000000000", "1900000000"],
      ["withdrawn", "StandardStatus", "active", "withdrawn"],
      ["back_on_market", "StandardStatus", "withdrawn", "active"],
    ]);
    // gom theo căn: hai tin cùng căn, dòng của cả hai theo thời gian
    const b = await tin({ source: "S03", price: 2_100_000_000, first_seen: "2026-09-15T00:00:00Z", last_seen: "2026-10-02T00:00:00Z" });
    const p = await canCo(a, b);
    const { rows } = await c.query(`SELECT offer_id, change_type, new_value FROM property_price_history
      WHERE property_id = $1 ORDER BY modification_timestamp, offer_id`, [p]);
    assert.deepEqual(rows.map((r) => [r.offer_id, r.change_type, r.new_value]), [
      [b, "new_listing", "2100000000"],
      [a, "new_listing", "2000000000"],
      [a, "price_change", "1900000000"],
    ], "lịch sử giá của căn phải gồm dòng của mọi tin gắn căn theo thời gian");
    // hiệu năng: lượt nạp ghi lại cùng giá cho mọi tin S06 (Review Focus 3)
    truoc = Number((await c.query("SELECT count(*) FROM history_transactional")).rows[0].count);
    const t0 = performance.now();
    const { rowCount } = await c.query("UPDATE sale_offer_records SET price_vnd = price_vnd WHERE source = 'S06'");
    const giay = (performance.now() - t0) / 1000;
    const sau = Number((await c.query("SELECT count(*) FROM history_transactional")).rows[0].count);
    assert.equal(sau, truoc, "ghi lại cùng giá cho mọi tin không sinh dòng lịch sử");
    t.diagnostic(`cùng giá: UPDATE ${rowCount} tin S06 trong ${giay.toFixed(2)} s, 0 dòng lịch sử`);
  });
  const khi = "WHEN (OLD.price_vnd IS DISTINCT FROM NEW.price_vnd) ";
  assert.ok(sql059().includes(khi), `chiều đỏ: 059 không còn «${khi}»`);
  await assert.rejects(trongGiaoDich(kiemCungGia, { sql: sql059().replace(khi, "") }), /cùng giá không sinh dòng lịch sử/);
});

// Điền lùi: DB đã áp 059 thì bỏ bảng lịch sử trong giao dịch trước khi nạp lại, để bước điền lùi thật sự chạy
// (đối chứng dương: có tin, mỗi tin đúng một new_listing — S4 r2 t5).
const boLichSu = (db) => db.query("DROP TABLE IF EXISTS history_transactional CASCADE");
async function kiemDienLui(db) {
  const { rows: [d] } = await db.query(`SELECT (SELECT count(*) FROM sale_offer_records)::int AS tin,
    (SELECT count(*) FROM history_transactional WHERE change_type = 'new_listing')::int AS moi,
    (SELECT count(DISTINCT resource_record_key) FROM history_transactional WHERE change_type = 'new_listing')::int AS khac`);
  assert.ok(d.tin > 0, "đối chứng dương: DB thử phải có tin để đo điền lùi");
  assert.equal(d.moi, d.tin, "điền lùi: số new_listing phải bằng số tin có sẵn");
  assert.equal(d.khac, d.tin, "điền lùi: mỗi tin đúng một new_listing");
}
test("AC-6 điền lùi lịch sử: mỗi tin có sẵn đúng một new_listing (đối chứng dương + chiều đỏ)", async () => {
  await trongGiaoDich(kiemDienLui, { truoc: boLichSu });
  const dienLui = `INSERT INTO history_transactional (resource_record_key, field_name, previous_value, new_value, change_type,
                                   modification_timestamp)
SELECT offer_id, 'ListPrice', NULL, price_vnd::text, 'new_listing', first_seen FROM sale_offer_records
ON CONFLICT DO NOTHING;`;
  assert.ok(sql059().includes(dienLui), "chiều đỏ: 059 không còn câu điền lùi — sửa ca theo migration");
  await assert.rejects(trongGiaoDich(kiemDienLui, { truoc: boLichSu, sql: sql059().replace(dienLui, "") }),
    /điền lùi: số new_listing phải bằng số tin có sẵn/);
});

// ---- Task 5 · AC-7: vị từ B5 và tụt về B4 ----
const MARKET = "vn-tst-tg-m";
const WARD = "vn-tst-tg-w";
const LOI = ["kind", "property_type", "price_vnd", "area_m2", "area_id"];
const FACT = Object.fromEntries(LOI.map((k) => [k, { v: "x", ids: [], tier: "fact", method: "source_field", measured: true }]));
const ngayTruoc = (n) => new Date(Date.now() - n * 86400e3).toISOString();
/** Tin đủ điều kiện B4 (trường lõi đủ, đã đo, lớp sự thật); `doiGia` thêm một mốc giá; trạng thái qua bộ ghi + phân xử. */
async function tinB4({ last_seen = ngayTruoc(1), doiGia = true, rut = false } = {}) {
  const id = `${T}-b-${++dem}`;
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, price_vnd, area_m2, area_id, source,
      originating_system_key, first_seen, last_seen, field_provenance)
    VALUES ($1, 'sale', 'house', 2000000000, 60, $2, 'S06', $1, $3, $3, $4)`, [id, WARD, last_seen, FACT]);
  if (doiGia) await c.query("UPDATE sale_offer_records SET price_vnd = 1950000000 WHERE offer_id = $1", [id]);
  await chao([id]);
  if (rut) {
    await phatBieuChao(id, "withdrawn", "fact", "source_field", new Date().toISOString());
    await c.query("SELECT resolve_offer_status($1::text[])", [[id]]);
  }
  return id;
}
async function canB4(...offers) {
  const { rows: [p] } = await c.query(
    "INSERT INTO properties (area_id, property_type, verification) VALUES ($1, 'house', 'verified') RETURNING id", [WARD]);
  for (const o of offers) await c.query("INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)", [p.id, o]);
  return Number(p.id);
}
async function sauCan() {
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code, meta) VALUES
    ($1, NULL, 'market', 'Thị trường thử PL19', 'VN', '{}'), ($2, $1, 'submarket', 'Phường thử PL19', 'VN', '{}')`, [MARKET, WARD]);
  const dau = await tinB4();
  return {
    dau, can: {
      dat: await canB4(dau),
      quaCuaSo: await canB4(await tinB4({ last_seen: ngayTruoc(10) })),
      daGo: await canB4(await tinB4({ rut: true })),
      thieuLichSu: await canB4(await tinB4({ doiGia: false })),
      haiTinGo: await canB4(await tinB4(), await tinB4({ rut: true })),
      haiTinCu: await canB4(await tinB4(), await tinB4({ last_seen: ngayTruoc(10) })),
    },
  };
}
async function kiemAC7(can) {
  const { rows } = await c.query("SELECT property_id, data_level, ke_thieu FROM property_data_level($1)", [Object.values(can)]);
  const b = new Map(rows.map((r) => [Number(r.property_id), [r.data_level, r.ke_thieu]]));
  assert.deepEqual(b.get(can.dat), ["B5", "giu-nhip"], "căn đang chào, trong cửa sổ, có lịch sử giá phải lên B5");
  assert.deepEqual(b.get(can.quaCuaSo), ["B4", "hieu-luc"], "quá cửa sổ phải về B4");
  assert.deepEqual(b.get(can.daGo), ["B4", "hieu-luc"], "tin đã gỡ phải ở B4");
  assert.deepEqual(b.get(can.thieuLichSu), ["B4", "hieu-luc"], "thiếu lịch sử giá (Hỏi-3) phải ở B4");
  assert.deepEqual(b.get(can.haiTinGo), ["B5", "giu-nhip"], "căn lấy tin tốt nhất");
  assert.deepEqual(b.get(can.haiTinCu), ["B5", "giu-nhip"], "căn lấy tin tốt nhất");
}
test("AC-7 B5 và tụt về B4: sáu căn, ảnh chụp trước/sau đẩy quá cửa sổ (kèm chiều đỏ)", async () => {
  await trongGiaoDich(async () => {
    const { dau, can } = await sauCan();
    await kiemAC7(can);
    const truoc = (await ghiAnhChup(c)).byLevel;
    await c.query("UPDATE sale_offer_records SET last_seen = $2 WHERE offer_id = $1", [dau, ngayTruoc(10)]);
    const sau = (await ghiAnhChup(c)).byLevel;
    assert.deepEqual([sau.B5 - truoc.B5, sau.B4 - truoc.B4], [-1, 1], "ảnh chụp sau: B5 giảm một, B4 tăng một");
  });
  const cuaSo = " AND o.last_seen >= now() - freshness_window()";
  const totNhat = "SELECT pid, max(lv) AS lv FROM tin GROUP BY pid";
  for (const cu of [cuaSo, totNhat]) assert.ok(sql059().includes(cu), `chiều đỏ: 059 không còn «${cu}»`);
  await assert.rejects(trongGiaoDich(async () => kiemAC7((await sauCan()).can), { sql: sql059().replace(cuaSo, "") }),
    /quá cửa sổ phải về B4/);
  await assert.rejects(trongGiaoDich(async () => kiemAC7((await sauCan()).can),
    { sql: sql059().replace(totNhat, "SELECT pid, min(lv) AS lv FROM tin GROUP BY pid") }), /căn lấy tin tốt nhất/);
});
