// thu-lai-deadlock.test.mjs — hồ sơ resolve-thu-lai-deadlock E1–E4, E7: client giả + đọc tĩnh, không DB.
// Chạy: node --test pipeline/lib/thu-lai-deadlock.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MAC_DINH, boc, nhanCau } from "./thu-lai-deadlock.mjs";

const loi = (code, message = `lỗi ${code}`) => Object.assign(new Error(message), code ? { code } : {});

/** Client giả: `hong(lanChay)` trả lỗi để ném, hoặc null để trả `ketQua`. */
function clientGia(hong, ketQua = { rows: [] }) {
  const cuoc = [];
  return {
    cuoc,
    async query(sql, params) {
      cuoc.push({ sql, params });
      const e = hong(cuoc.length);
      if (e) throw e;
      return ketQua;
    },
  };
}

/** Chạy một câu qua boc trên client giả; ghi số lần chạy, mảng chờ, dòng log. */
async function chay(hong, { ketQua, opts = {}, sql = "SELECT 1", params } = {}) {
  const c = clientGia(hong, ketQua);
  const cho = [];
  const log = [];
  const q = boc(c, { cho: async (ms) => { cho.push(ms); }, ghiLoi: (s) => log.push(s), ...opts });
  let kq, err;
  try { kq = await q.query(sql, params); } catch (e) { err = e; }
  return { kq, err, lanChay: c.cuoc.length, cho, log, soLanThuLai: q.soLanThuLai, soCauGui: q.soCauGui };
}

// ── E1 ──
const kiemNhip = (n, r) => {
  if (JSON.stringify(r.cho) !== JSON.stringify([500, 1000, 2000].slice(0, n))) throw new Error(`RTLD-AC-1 nhịp chờ sai: n=${n}`);
};
test("RTLD-AC-1 thử lại rồi thành công", async () => {
  const MA_TRAN = [0, 1, 2, 3]; // viết trước: n lỗi 40P01 rồi thành công
  let kiem = 0;
  for (const n of MA_TRAN) {
    const r = await chay((k) => (k <= n ? loi("40P01") : null), { ketQua: { rows: [{ x: n }] } });
    assert.equal(r.err, undefined, `n=${n}`);
    assert.deepEqual(r.kq, { rows: [{ x: n }] });
    assert.equal(r.lanChay, n + 1, `n=${n}`);
    assert.equal(r.soLanThuLai, n);
    kiemNhip(n, r);
    kiem++;
  }
  assert.equal(kiem, MA_TRAN.length);
  assert.throws(() => kiemNhip(2, { cho: [500, 500] }), /^Error: RTLD-AC-1 nhịp chờ sai: n=2$/);
});

// ── E2 ──
const kiemTran = (r) => { if (r.lanChay !== 4) throw new Error(`RTLD-AC-2 vượt trần: ${r.lanChay} lần chạy`); };
test("RTLD-AC-2 hết lượt thì ném lỗi cuối", async () => {
  const r = await chay((k) => loi("40P01", `deadlock lần ${k}`));
  assert.equal(r.err?.code, "40P01");
  assert.equal(r.err?.message, "deadlock lần 4");
  kiemTran(r);
  assert.equal(r.cho.reduce((a, b) => a + b, 0), 3500);
  assert.throws(() => kiemTran({ lanChay: 5 }), /^Error: RTLD-AC-2 vượt trần: 5 lần chạy$/);

  // mặc định
  assert.deepEqual({ lan: MAC_DINH.lan, nhip: [...MAC_DINH.nhip] }, { lan: 3, nhip: [500, 1000, 2000] });
  const c = clientGia(() => loi("40P01"));
  const cho = [];
  const q = boc(c, { cho: async (ms) => { cho.push(ms); }, ghiLoi: () => {} });
  await assert.rejects(q.query("SELECT 1"), (e) => e.code === "40P01");
  assert.equal(c.cuoc.length, 4);
  assert.deepEqual(cho, [500, 1000, 2000]);
});

// ── E3 ──
test("RTLD-AC-3 lỗi khác ném ngay", async () => {
  const MA_TRAN = ["23505", "42601", "40001", "55P03", null]; // null = lỗi kết nối không mã
  const kiem = (ma, r) => { if (r.lanChay !== 1) throw new Error(`RTLD-AC-3 thử lại mã không phải deadlock: ${ma}`); };
  let n = 0;
  for (const ma of MA_TRAN) {
    const e = ma ? loi(ma) : loi(null, "ECONNREFUSED");
    const r = await chay(() => e);
    assert.equal(r.err, e, `mã ${ma}`);
    kiem(ma, r);
    assert.deepEqual(r.cho, []);
    assert.equal(r.soLanThuLai, 0);
    n++;
  }
  assert.equal(n, 5);
  assert.throws(() => kiem("40001", { lanChay: 2 }), /^Error: RTLD-AC-3 thử lại mã không phải deadlock: 40001$/);
});

// ── E4 ──
test("RTLD-AC-4 dòng log mỗi lần thử lại", async () => {
  const sql = `
    INSERT INTO property_offers   (property_id, offer_id, score, signals)
      SELECT $1, o.offer_id FROM sale_offers o WHERE o.offer_id = $2`;
  const params = ["offer_bimat_123", 42];
  const r = await chay((k) => (k <= 2 ? loi("40P01") : null), { sql, params });
  const nhan = sql.replace(/\s+/g, " ").trim().slice(0, 40);
  assert.equal(nhanCau(sql), nhan);
  assert.deepEqual(r.log, [
    `resolve-properties: deadlock (40P01) ở «${nhan}», thử lại 1/3 sau 500ms`,
    `resolve-properties: deadlock (40P01) ở «${nhan}», thử lại 2/3 sau 1000ms`,
  ]);
  const kiem = (dong) => { if (dong.includes("offer_bimat_123") || /\b42\b/.test(dong)) throw new Error("RTLD-AC-4 log lộ tham số"); };
  r.log.forEach(kiem);
  assert.throws(() => kiem(r.log[0] + " " + params.join(",")), /^Error: RTLD-AC-4 log lộ tham số$/);
});

// ── E7 ──
const NGUON = join(import.meta.dirname, "../resolve-properties.mjs");
const BASE = JSON.parse(readFileSync(join(import.meta.dirname, "thu-lai-deadlock.sql-base.json"), "utf8"));
/** Mọi template literal trừ chuỗi in, gộp khoảng trắng. */
const rutCau = (src) => [...src.matchAll(/`([^`]*)`/g)].map((m) => m[1].replace(/\s+/g, " ").trim())
  .filter((s) => !/^(Stage [AB]:|resolve-properties:)/.test(s));
const soCau = (cau, base) => {
  const a = [...cau].sort(), b = [...base].sort();
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    if (a[i] !== b[i]) throw new Error(`RTLD-AC-7 SQL đổi: ${String(a[i] ?? b[i]).slice(0, 40)}`);
};
const quetGoiThang = (src) => { if (/\bc\.query\(/.test(src)) throw new Error("RTLD-AC-7 còn c.query trực tiếp"); };
test("RTLD-AC-7 chữ SQL không đổi", () => {
  // đối chứng dương của bộ rút trên bản chụp base
  assert.equal(BASE.cau.length, 9);
  assert.ok(BASE.cau[0].startsWith("floor(s.latitude / 0.0005)"));
  assert.ok(BASE.cau.some((s) => s.startsWith("INSERT INTO property_offers")));
  const src = readFileSync(NGUON, "utf8");
  soCau(rutCau(src), BASE.cau);
  quetGoiThang(src);
  const hong = BASE.cau.map((s) => s.replace("DO NOTHING", "DO UPDATE"));
  assert.throws(() => soCau(hong, BASE.cau), /^Error: RTLD-AC-7 SQL đổi: /);
  assert.throws(() => quetGoiThang("await c.query(`SELECT 1`)"), /^Error: RTLD-AC-7 còn c\.query trực tiếp$/);
});
