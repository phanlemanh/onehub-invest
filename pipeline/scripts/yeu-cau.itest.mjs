// yeu-cau.itest.mjs — bảng Yêu cầu (YC-AC-n ↔ _acceptance/bang-yeu-cau/evals.yaml).
// Chạy trên DB thử (bash db/db-thu.sh oneinvest_p1_n1), mọi ca trong BEGIN … ROLLBACK, nạp 045 + 057 + 058 trong giao dịch
// (napKev giữ 33033 rồi khoá danh bạ; napYeuCau giữ 33033). Ca đỏ chạy trên bản sao đột biến chép cạnh tệp thật rồi xoá.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import pg from "pg";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napKev } from "../lib/nap-057.mjs";
import { MIG_058, napYeuCau } from "../lib/nap-058.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1";

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

/** BEGIN, nạp 045 + 057 + 058 (sql058: văn bản 058 thay thế; false: không nạp 058), chạy fn, ROLLBACK. */
async function trongGiaoDich(fn, { sql058 } = {}) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    await napKev(c);
    if (sql058 !== false) await napYeuCau(c, sql058 ? { sql: sql058 } : {});
    return await fn();
  } finally {
    await c.query("ROLLBACK");
  }
}

/** Thông điệp lỗi chặn lệnh, hoặc null khi lệnh vào được. Mỗi lệnh một SAVEPOINT. */
async function chan(sql, vals = []) {
  await c.query("SAVEPOINT ca");
  try {
    await c.query(sql, vals);
    await c.query("RELEASE SAVEPOINT ca");
    return null;
  } catch (e) {
    await c.query("ROLLBACK TO SAVEPOINT ca");
    return `${e.constraint ?? ""} ${e.message}`;
  }
}

const dem = async (bang) => (await c.query(`SELECT to_regclass($1) AS t`, [bang])).rows[0].t
  ? (await c.query(`SELECT count(*)::int AS n FROM ${bang}`)).rows[0].n : null;

// ---- Task 1: lược đồ 058 (YC-AC-1) ----
const COT_058 = [
  ["inquiry_id", "text"], ["source", "text"], ["originating_system_key", "text"], ["post_ids", "ARRAY"], ["kind", "text"],
  ["property_type", "text"], ["bedrooms", "integer"], ["area_m2", "numeric"], ["budget_min_vnd", "bigint"],
  ["budget_max_vnd", "bigint"], ["area_id", "text"], ["market_id", "text"], ["first_seen", "timestamp with time zone"],
  ["last_seen", "timestamp with time zone"], ["intent_evidence", "jsonb"], ["retired_at", "timestamp with time zone"],
  ["retired_reason", "text"], ["created_at", "timestamp with time zone"], ["updated_at", "timestamp with time zone"],
];
const SQL_YC = `INSERT INTO inquiry_records (inquiry_id, source, originating_system_key, post_ids, kind, property_type,
    budget_min_vnd, budget_max_vnd, intent_evidence, retired_at, retired_reason)
  VALUES ($1, $2, 'p1', ARRAY['p1'], $3, $4, $5, $6, '{}'::jsonb, $7, $8)`;
const HOP_LE = ["inq_yc1", "S03", "rent_lt", "apartment", 5e6, 8e6, null, null];
const XAU = [
  ["kind", ["inq_x1", "S03", "rent_st", null, null, null, null, null], /inquiry_records_kind_chk/],
  ["property_type", ["inq_x2", "S03", "sale", "nha", null, null, null, null], /inquiry_records_property_type_chk/],
  ["source", ["inq_x3", "zalo", "sale", null, null, null, null, null], /inquiry_records_source_chk/],
  ["budget", ["inq_x4", "S03", "sale", null, 5e9, 3e9, null, null], /inquiry_records_budget_chk/],
  ["retired", ["inq_x5", "S03", "sale", null, null, null, new Date().toISOString(), null], /inquiry_records_retired_chk/],
];

async function kiemLuocDo058() {
  const { rows } = await c.query(`SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'inquiry_records' ORDER BY ordinal_position`);
  assert.deepEqual(rows.map((r) => [r.column_name, r.data_type]), COT_058, "cột inquiry_records đúng tên + kiểu");
  for (const [ten, vals, re] of XAU) assert.match(await chan(SQL_YC, vals) ?? "vào được", re, `${ten}: dòng xấu vào được`);
  assert.equal(await chan(SQL_YC, HOP_LE), null, "dòng hợp lệ bị chặn");
  await c.query(SQL_YC, ["inq_yc2", "S03", "sale", null, null, null, new Date().toISOString(), "het-phat-bieu"]);
  const { rows: v } = await c.query("SELECT inquiry_id FROM inquiries WHERE inquiry_id LIKE 'inq_yc%' ORDER BY 1");
  assert.deepEqual(v.map((r) => r.inquiry_id), ["inq_yc1"], "view inquiries phải chỉ chứa dòng sống");
}

test("YC-AC-1 058 áp hai lần: bảng + view, cột, CHECK có tên, không ghi dòng nào", async () => {
  await trongGiaoDich(async () => {
    const truoc = { offer: await dem("sale_offer_records"), yc: await dem("inquiry_records") };
    await napYeuCau(c); // lần áp thứ hai trong cùng giao dịch — không lỗi
    assert.deepEqual({ offer: await dem("sale_offer_records"), yc: await dem("inquiry_records") }, truoc,
      "áp lại 058 đổi số dòng");
    const { rows } = await c.query(`SELECT column_name, lookup_name FROM ref_field_lookup
       WHERE table_name = 'inquiry_records' ORDER BY 1`);
    assert.deepEqual(rows.map((r) => [r.column_name, r.lookup_name]), [["kind", "kind"], ["property_type", "property_type"]]);
    await kiemLuocDo058();
  });
});

test("YC-AC-1 đối chứng: bản sao 058 bỏ CHECK khoảng ngân sách → ca «budget» đỏ", async () => {
  const goc = readFileSync(MIG_058, "utf8");
  const dotBien = goc.replace("CHECK (budget_min_vnd <= budget_max_vnd)", "CHECK (true)");
  assert.notEqual(dotBien, goc, "bản sao đột biến không đổi gì");
  await trongGiaoDich(async () => {
    // DB thử đã áp 058 thật thì bỏ CHECK cũ để bản sao đột biến tự thêm lại theo tên.
    await c.query("ALTER TABLE IF EXISTS inquiry_records DROP CONSTRAINT IF EXISTS inquiry_records_budget_chk");
    await napYeuCau(c, { sql: dotBien });
    await assert.rejects(kiemLuocDo058(), /budget/, "ca đỏ không ghim «budget»");
  });
});
