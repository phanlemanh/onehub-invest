// trang-thai-chao.itest.mjs — PL19 `thoi-gian-va-hieu-luc` (AC-n ↔ _acceptance/thoi-gian-va-hieu-luc/evals.yaml E1–E7).
// Mỗi ca BEGIN … ROLLBACK, 059 nạp trong giao dịch dưới khoá của bac-du-lieu.mjs. Chạy trên DB thử riêng
// (bash db/db-thu.sh oneinvest_p2_tg) — không trên DB `oneinvest` dùng chung khi 059 chưa áp (luật đo của đợt dot0-cam-mau).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { KHOA } from "../bac-du-lieu.mjs";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";

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
  retired_at = null, retired_reason = null, post_ids = [] } = {}) {
  const id = `${T}-${++dem}`;
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, price_vnd, source, originating_system_key, post_ids,
      first_seen, last_seen, retired_at, retired_reason)
    VALUES ($1, 'sale', $2, $3, $1, $4::text[], $5, $6, $7, $8)`,
  [id, price, source, post_ids, first_seen, last_seen, retired_at, retired_reason]);
  return id;
}

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
