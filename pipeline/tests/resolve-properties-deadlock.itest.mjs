// resolve-properties-deadlock.itest.mjs — hồ sơ resolve-thu-lai-deadlock E5, E6, E8, E9: deadlock THẬT trên DB thử.
// DB thử oneinvest_p3_rtld_<pid> ở :5433 (tạo đầu tệp, xoá cuối tệp); không đọc, không ghi oneinvest. Lược đồ tối thiểu
// của các bảng resolve đọc/ghi; view sale_offers dựng bằng đúng câu của migration 044 (đọc tệp, không chép tay).
// Vòng chờ giống log chotot 30/10: resolve khoá property_offers rồi chờ view sale_offers; phiên hai giữ sale_offers rồi xin
// ACCESS EXCLUSIVE trên property_offers. Ngoài glob test của CI (cần DB); chạy:
//   node --test pipeline/tests/resolve-properties-deadlock.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { chayResolve } from "../resolve-properties.mjs";

const SERVER = process.env.RTLD_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433";
const TEN_DB = `oneinvest_p3_rtld_${process.pid}`;
const URL_DB = `${SERVER}/${TEN_DB}`;
const GOC = join(import.meta.dirname, "../..");
const CAU_VIEW_044 = readFileSync(join(GOC, "db/migrations/044_nap_lai_khong_xoa.sql"), "utf8")
  .split("\n").find((l) => l.startsWith("CREATE OR REPLACE VIEW sale_offers AS"));

const LUOC_DO = `
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE sale_offer_records (
  offer_id text PRIMARY KEY, source text NOT NULL, kind text NOT NULL, property_type text, area_id text,
  area_m2 numeric, price_vnd numeric, price_perm2 numeric, confidence text,
  first_seen timestamptz, last_seen timestamptz, retired_at timestamptz);
${CAU_VIEW_044}
CREATE TABLE stg_chotot_ads (list_id bigint PRIMARY KEY, latitude double precision, longitude double precision);
CREATE TABLE properties (
  id bigserial PRIMARY KEY, geo geography(Point, 4326), area_id text, property_type text, kind text, cluster_key text,
  stable_key text UNIQUE, n_evidence int NOT NULL DEFAULT 0, first_seen timestamptz, last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), resolved_by text NOT NULL DEFAULT 'stage-ab', verification text);
CREATE TABLE property_offers (
  property_id bigint NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  offer_id text NOT NULL REFERENCES sale_offer_records(offer_id) ON DELETE RESTRICT,
  score numeric, signals jsonb NOT NULL DEFAULT '{}'::jsonb, PRIMARY KEY (property_id, offer_id));
CREATE TABLE property_candidates (
  id bigserial PRIMARY KEY, offer_a text NOT NULL, offer_b text NOT NULL, score numeric, signals jsonb,
  status text NOT NULL DEFAULT 'pending', CONSTRAINT property_candidates_offer_a_offer_b_key UNIQUE (offer_a, offer_b));`;

const S06 = (id) => `'offer_' || substr(encode(digest('S06|' || ${id}::text, 'sha256'), 'hex'), 1, 16)`;
// Mồi: 6 tin S06 ở 3 ô lưới (cụm), 1 căn có sẵn khớp cụm đầu, 3 tin S03 cùng phường → cặp needs_llm và pending.
const MOI = `
TRUNCATE property_offers, property_candidates, properties, stg_chotot_ads, sale_offer_records RESTART IDENTITY CASCADE;
INSERT INTO stg_chotot_ads VALUES (1, 21.0001, 105.8001), (2, 21.0002, 105.8002), (3, 21.0101, 105.8101),
  (4, 21.0102, 105.8102), (5, 21.0201, 105.8201), (6, 21.0202, 105.8202);
INSERT INTO sale_offer_records (offer_id, source, kind, property_type, area_id, area_m2, price_vnd, price_perm2, confidence, first_seen, last_seen)
SELECT ${S06("l")}, 'S06', 'sale', 'apartment', 'a1', 60, 3e9, 50e6, 'high',
       '2026-10-01'::timestamptz + l * interval '1 day', '2026-10-20'::timestamptz + l * interval '1 day'
  FROM generate_series(1, 6) l;
INSERT INTO sale_offer_records (offer_id, source, kind, property_type, area_id, area_m2, price_vnd, price_perm2, confidence, first_seen, last_seen) VALUES
  ('offer_s03_a', 'S03', 'sale', 'apartment', 'a1', 60, 3e9, 50e6, 'high', '2026-10-05', '2026-10-25'),
  ('offer_s03_b', 'S03', 'sale', 'apartment', 'a1', 62, 3.41e9, 55e6, 'high', '2026-10-05', '2026-10-25'),
  ('offer_s03_c', 'S03', 'sale', 'apartment', 'a1', 55, 2.31e9, 42e6, 'medium', '2026-10-05', '2026-10-25');
INSERT INTO properties (stable_key, cluster_key, kind, area_id, n_evidence, first_seen, last_seen, verification)
SELECT floor(21.00015 / 0.0005)::text || '|' || floor(105.80015 / 0.0005)::text || '|sale|apartment|60|3000',
       NULL, 'sale', 'a1', 1, '2026-09-01', '2026-09-30', 'verified';`;

let admin;
async function dbMoi() {
  const c = new pg.Client({ connectionString: URL_DB });
  await c.connect();
  return c;
}

before(async () => {
  assert.ok(CAU_VIEW_044, "không rút được câu view sale_offers từ 044");
  admin = new pg.Client({ connectionString: `${SERVER}/postgres` });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEN_DB}`);
  await admin.query(`CREATE DATABASE ${TEN_DB}`);
  const c = await dbMoi();
  try {
    await c.query(LUOC_DO);
    const def = (await c.query(`SELECT pg_get_viewdef('sale_offers') d`)).rows[0].d.replace(/\s+/g, " ");
    assert.match(def, /FROM sale_offer_records WHERE \((sale_offer_records\.)?retired_at IS NULL\);?$/);
  } finally {
    await c.end();
  }
});

after(async () => {
  await admin?.query(`DROP DATABASE IF EXISTS ${TEN_DB} WITH (FORCE)`);
  await admin?.end();
});

/** Ảnh ba bảng theo khoá nghiệp vụ (bỏ id, mốc giờ tạo). */
async function anh(c) {
  const r = async (sql) => (await c.query(sql)).rows.map((x) => JSON.stringify(x)).sort();
  return {
    properties: await r(`SELECT stable_key, n_evidence, last_seen, verification FROM properties`),
    property_offers: await r(`SELECT p.stable_key, po.offer_id, po.score FROM property_offers po JOIN properties p ON p.id = po.property_id`),
    property_candidates: await r(`SELECT offer_a, offer_b, score, status FROM property_candidates`),
  };
}
const soAnh = (a, b) => {
  for (const k of ["properties", "property_offers", "property_candidates"])
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) throw new Error(`RTLD-AC-5 kết quả lệch lượt sạch: ${k}`);
};

/** Client spy: đếm mọi câu tới client gốc; lần đầu gặp INSERT INTO property_offers thì phiên hai dựng vòng chờ. */
function spyVuDao(c, hai, { vuDao }) {
  const st = { cau: 0, haiXong: null };
  let daDung = !vuDao;
  return {
    st,
    async query(sql, params) {
      st.cau++;
      if (!daDung && String(sql).trimStart().startsWith("INSERT INTO property_offers")) {
        daDung = true;
        await hai.query("BEGIN");
        await hai.query("SET LOCAL deadlock_timeout = '10s'");
        await hai.query("LOCK TABLE sale_offers IN ACCESS EXCLUSIVE MODE");
        st.haiXong = new Promise((r) => setTimeout(r, 200))
          .then(() => hai.query("LOCK TABLE property_offers IN ACCESS EXCLUSIVE MODE"))
          .then(() => hai.query("COMMIT"));
      }
      return c.query(sql, params);
    },
  };
}

async function luot({ vuDao, opts = {} }) {
  const c = await dbMoi();
  const hai = await dbMoi();
  const out = [];
  try {
    await c.query(MOI);
    const spy = spyVuDao(c, hai, { vuDao });
    let kq, err;
    try { kq = await chayResolve(spy, { ghi: (s) => out.push(s), ghiLoi: () => {}, ...opts }); } catch (e) { err = e; }
    if (spy.st.haiXong) await spy.st.haiXong;
    return { kq, err, out, cau: spy.st.cau, haiCommit: !!spy.st.haiXong, anh: await anh(c) };
  } finally {
    await hai.end();
    await c.end();
  }
}

let sach, coVuDao;

test("RTLD-AC-5 deadlock thật — resolve hoàn tất, kết quả bằng lượt sạch", async () => {
  sach = await luot({ vuDao: false });
  assert.equal(sach.err, undefined);
  assert.ok(sach.anh.properties.length >= 3 && sach.anh.property_candidates.length >= 2);
  assert.ok(sach.anh.property_candidates.some((x) => JSON.parse(x).status === "needs_llm"));
  coVuDao = await luot({ vuDao: true });
  assert.equal(coVuDao.err, undefined, `resolve ném: ${coVuDao.err?.code} ${coVuDao.err?.message}`);
  assert.ok(coVuDao.haiCommit, "phiên hai không COMMIT");
  soAnh(coVuDao.anh, sach.anh);
  // mọi câu qua bộ thử lại: câu tới client gốc = câu boc gửi (kể cả lần chạy lại)
  assert.ok(sach.cau > 0);
  assert.equal(sach.cau, sach.kq.soCauGui);
  assert.equal(coVuDao.cau, coVuDao.kq.soCauGui);
  const hong = { ...sach.anh, property_offers: sach.anh.property_offers.slice(1) };
  assert.throws(() => soAnh(sach.anh, hong), /^Error: RTLD-AC-5 kết quả lệch lượt sạch: property_offers$/);
});

test("RTLD-AC-6 vũ đạo là deadlock thật", async () => {
  const tat = await luot({ vuDao: true, opts: { lan: 0 } });
  assert.equal(tat.err?.code, "40P01");
  assert.ok(tat.haiCommit);
  const kiem = (r) => { if (!(r.kq.soLanThuLai >= 1)) throw new Error("RTLD-AC-6 không dựng được deadlock"); };
  kiem(coVuDao);
  assert.throws(() => kiem({ kq: { soLanThuLai: 0 } }), /^Error: RTLD-AC-6 không dựng được deadlock$/);
});

test("RTLD-AC-8 dòng tổng kết thử lại", () => {
  const kiemSach = (out) => {
    if (out.length !== 2 || !out[0].startsWith("Stage A: ") || !out[1].startsWith("Stage B: "))
      throw new Error("RTLD-AC-8 dòng tổng kết khi không thử lại");
  };
  kiemSach(sach.out);
  assert.equal(coVuDao.out.length, 3);
  assert.ok(coVuDao.out[0].startsWith("Stage A: ") && coVuDao.out[1].startsWith("Stage B: "));
  assert.equal(coVuDao.out[2], `resolve-properties: thử lại sau deadlock ${coVuDao.kq.soLanThuLai} lần`);
  assert.throws(() => kiemSach([...sach.out, "resolve-properties: thử lại sau deadlock 0 lần"]),
    /^Error: RTLD-AC-8 dòng tổng kết khi không thử lại$/);
});

/** Chạy CLI thật; `truoc(hai)` trước khi spawn, `khiCho(hai)` khi resolve đang chờ khoá stg_chotot_ads. */
async function chayCli({ vuDao }) {
  const c = await dbMoi();
  const hai = await dbMoi();
  try {
    await c.query(MOI);
    if (vuDao) {
      await hai.query("BEGIN");
      await hai.query("SET LOCAL deadlock_timeout = '10s'");
      await hai.query("LOCK TABLE stg_chotot_ads IN ACCESS EXCLUSIVE MODE");
    }
    const p = spawn(process.execPath, ["pipeline/resolve-properties.mjs"], { cwd: GOC, env: { ...process.env, DATABASE_URL: URL_DB } });
    let stdout = "", stderr = "";
    p.stdout.on("data", (d) => { stdout += d; });
    p.stderr.on("data", (d) => { stderr += d; });
    const xong = new Promise((r) => p.on("close", (code) => r(code)));
    if (vuDao) {
      for (let i = 0; ; i++) {
        const { rowCount } = await c.query(`SELECT 1 FROM pg_locks l JOIN pg_class k ON k.oid = l.relation
          WHERE k.relname = 'stg_chotot_ads' AND NOT l.granted`);
        if (rowCount) break;
        assert.ok(i < 200, "resolve không chờ khoá stg_chotot_ads");
        await new Promise((r) => setTimeout(r, 50));
      }
      await hai.query("LOCK TABLE sale_offers IN ACCESS EXCLUSIVE MODE");
      await hai.query("COMMIT");
    }
    return { code: await xong, stdout, stderr };
  } finally {
    await hai.end();
    await c.end();
  }
}

test("RTLD-AC-9 điểm vào CLI thật", async () => {
  const kiem = (r) => { if (r.code !== 0) throw new Error(`RTLD-AC-9 CLI không qua deadlock: exit ${r.code}`); };
  const r = await chayCli({ vuDao: true });
  kiem(r);
  assert.ok(r.stderr.includes("deadlock (40P01) ở «"), r.stderr);
  assert.ok(r.stderr.includes("thử lại 1/3 sau 500ms"), r.stderr);
  assert.match(r.stdout, /^resolve-properties: thử lại sau deadlock \d+ lần$/m);
  assert.throws(() => kiem({ code: 1 }), /^Error: RTLD-AC-9 CLI không qua deadlock: exit 1$/);

  // ô lỗi khác: bỏ ràng buộc duy nhất (offer_a, offer_b) → ON CONFLICT ném 42P10, không thử lại
  const c = await dbMoi();
  try { await c.query(`ALTER TABLE property_candidates DROP CONSTRAINT property_candidates_offer_a_offer_b_key`); } finally { await c.end(); }
  const h = await chayCli({ vuDao: false });
  assert.equal(h.code, 1);
  assert.ok(h.stderr.includes("42P10"), h.stderr);
  assert.ok(!h.stderr.includes("thử lại"), h.stderr);
});
