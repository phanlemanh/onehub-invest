// assert-rut-thay.test.mjs — hồ sơ _acceptance/slt-dc-cham-va-giu-khoa-33033: câu rút «thay bởi lượt» của writeAssertions
// (replaceOwn). TR-AC-1 tương đương câu cũ (NOT EXISTS) trên ca biên viết tay; TR-AC-3 không bậc hai ở mọi kế hoạch.
// Mọi ca trong BEGIN … ROLLBACK trên DB mà lệnh test trỏ (DB thử của lượt, CI dựng từ migration). Không nạp migration nên
// không giữ khoá 33033. Chủ thể mồi mang tiền tố «TRT:» — không đụng phát biểu thật.
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import pg from "pg";

import { SQL_RUT_THAY, writeAssertions } from "../lib/assert.mjs";
import { chotDbThu } from "../lib/db-thu-chot.mjs";
import { RULE, TAT_CA_NGUON } from "../lib/ghep-tin-danh-muc.mjs";

// Rào DB thử TRƯỚC mọi kết nối: tệp chạy ANALYZE field_assertions trong giao dịch, mà ANALYZE ghi reltuples/relpages
// tại chỗ (không lùi theo ROLLBACK) — chính loại thay đổi có thể lật kế hoạch sản xuất (hồ sơ slt-dc-cham-va-giu-khoa-33033).
// Chỉ nhận DB oneinvest_suite_* do db/db-thu.sh --chay cấp; thiếu DATABASE_URL thì bỏ qua cả tệp, sai tên thì thoát 2.
const DB_URL = chotDbThu({ ten: "assert-rut-thay", khiThieu: "bo-qua" });
const PIPE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Câu cũ trước hồ sơ (main a60adccb8) — chuẩn so tương đương và bản phá của chiều đỏ. */
const SQL_GOC =
  `WITH moi AS (SELECT DISTINCT s, f, m, assertion_value_key(v) AS vk
                  FROM unnest($1::text[], $2::text[], $3::text[], $4::text[]) AS t(s, f, m, v))
   UPDATE field_assertions fa SET retracted_at = clock_timestamp(), retract_reason = 'thay-boi-luot'
     FROM (SELECT s, f, m FROM moi GROUP BY s, f, m) k
    WHERE fa.retracted_at IS NULL AND fa.subject_key = k.s AND fa.field = k.f AND fa.method = k.m
      AND NOT EXISTS (SELECT 1 FROM moi x WHERE x.s = k.s AND x.f = k.f AND x.m = k.m AND x.vk = fa.value_key)`;

/** Bản chép tạm của lib/assert.mjs với một cặp [cũ, mới] — import tương đối trỏ về pipeline/lib. */
async function banDot(thay) {
  let src = readFileSync(path.join(PIPE, "lib/assert.mjs"), "utf8");
  for (const [a, b] of thay) {
    assert.ok(src.includes(a), `chỗ đột biến không còn trong lib/assert.mjs: ${a.slice(0, 60)}`);
    src = src.replace(a, b);
  }
  src = src.replace(/from "\.\/([^"]+)"/g, (_m, rel) => `from ${JSON.stringify(pathToFileURL(path.join(PIPE, "lib", rel)).href)}`);
  // Thư mục tạm ngoài cây (PL36 S4 r2: tệp tạm trong pipeline/ lọt vào lượt quét thư mục của suite chạy song song).
  const dir = mkdtempSync(path.join(tmpdir(), "trt-dot-"));
  const f = path.join(dir, "assert.mjs");
  writeFileSync(f, src);
  try { return await import(pathToFileURL(f).href); } finally { rmSync(dir, { recursive: true, force: true }); }
}

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try { return await fn(); } finally { await c.query("ROLLBACK"); }
}

const PB = (s, f, v, m = "parser") => ({ subject_key: s, field: f, value: v, evidence_tier: "observed", method: m });

/** Dòng sống mồi cho ca biên: [chủ thể, trường, giá trị, phương pháp, đã rút?]. */
const MOI = [
  ["TRT:a", "bedrooms", "2", "parser"], ["TRT:a", "bedrooms", "3", "parser"], ["TRT:a", "bedrooms", "4", "parser"],
  ["TRT:a", "street_raw", "Láng", "parser"],
  ["TRT:a", "bedrooms", "4", "e1_rule"],          // khác phương pháp cùng (chủ thể, trường) — không bị đụng
  ["TRT:b", "street_raw", "not_stated", "parser"], ["TRT:b", "bedrooms", "02", "parser"],
  ["TRT:c", "bedrooms", "5", "parser"],           // bộ chỉ có ở bảng
  ["TRT:d", "bedrooms", "1", "parser", true],     // đã rút từ trước — không bị đụng lại
];
/** Ca biên: tên · mảng đầu vào. */
const CA = [
  ["một bộ nhiều khoá: giữ 2 và 3, rút 4", [PB("TRT:a", "bedrooms", "2"), PB("TRT:a", "bedrooms", "3")]],
  ["khác dạng chữ và số: ' LÁNG ' khớp 'Láng', '2' khớp '02'", [PB("TRT:a", "street_raw", " LÁNG "), PB("TRT:b", "bedrooms", "2")]],
  ["not_stated khớp chính nó, giá trị khác thì rút", [PB("TRT:b", "street_raw", "not_stated"), PB("TRT:a", "street_raw", "Kim Mã")]],
  ["bộ chỉ có ở mảng: không rút gì", [PB("TRT:e", "bedrooms", "2"), PB("TRT:a", "bathrooms", "1")]],
  ["chủ thể đã rút + khác phương pháp: chỉ rút đúng bộ parser", [PB("TRT:d", "bedrooms", "9"), PB("TRT:a", "bedrooms", "9")]],
  ["trùng hệt trong mảng", [PB("TRT:a", "bedrooms", "2"), PB("TRT:a", "bedrooms", "2"), PB("TRT:a", "bedrooms", " 2 ")]],
  ["bộ chỉ ở bảng: TRT:c vắng khỏi mảng, giữ nguyên", [PB("TRT:a", "bedrooms", "2"), PB("TRT:a", "bedrooms", "3"), PB("TRT:a", "bedrooms", "4")]],
];

async function napMoi() {
  for (const [s, f, v, m, rut] of MOI) {
    // Bảng chỉ thêm: dòng «đã rút» phải chèn sống rồi rút bằng UPDATE (đường duy nhất trigger cho phép).
    const { rows } = await c.query(
      `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at)
       VALUES ($1, $2, $3, 'observed', $4, now()) RETURNING id`, [s, f, v, m]);
    if (rut) {
      await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'trt-moi' WHERE id = $1`, [rows[0].id]);
    }
  }
}
const mang = (rows) => [rows.map((r) => r.subject_key), rows.map((r) => r.field), rows.map((r) => r.method), rows.map((r) => String(r.value))];

/** Tập id bị rút bởi `ghi` (câu mới qua writeAssertions) so với câu cũ trên cùng trạng thái — trả {cu, moi}. */
async function soTapRut(ghi, rows) {
  await c.query("SAVEPOINT cu");
  await c.query("SET LOCAL enable_nestloop = off");
  const cu = (await c.query(`${SQL_GOC} RETURNING fa.id`, mang(rows))).rows.map((r) => String(r.id)).sort();
  await c.query("ROLLBACK TO SAVEPOINT cu");
  await c.query("RESET enable_nestloop");
  const t0 = await c.query("SELECT clock_timestamp() AS t");
  const kq = await ghi(c, rows, { replaceOwn: true });
  const moi = (await c.query(
    `SELECT id FROM field_assertions WHERE subject_key LIKE 'TRT:%' AND retract_reason = 'thay-boi-luot' AND retracted_at >= $1`,
    [t0.rows[0].t])).rows.map((r) => String(r.id)).sort();
  assert.equal(kq.retracted, moi.length, "TR-AC-1 số rút writeAssertions trả khác số dòng rút đọc lại");
  return { cu, moi };
}

async function kiemTuongDuong(ghi) {
  for (const [ten, rows] of CA) {
    await trongGiaoDich(async () => {
      await napMoi();
      const { cu, moi } = await soTapRut(ghi, rows);
      assert.deepEqual(moi, cu, `TR-AC-1 tập rút lệch câu cũ — ca «${ten}»: cũ ${cu.length} [${cu}] · mới ${moi.length} [${moi}]`);
    });
  }
}

describe("TR-AC-1 câu rút mới tương đương câu cũ (ca biên, ROLLBACK)", () => {
  test("TR-AC-1 bảy ca biên: tập id rút trùng câu cũ; mảng rỗng không chạy câu nào", async () => {
    await kiemTuongDuong(writeAssertions);
    const gia = { query: () => { throw new Error("không được gọi câu nào khi mảng rỗng"); } };
    assert.deepEqual(await writeAssertions(gia, [], { replaceOwn: true }), { inserted: 0, retracted: 0 });
  });
  test("TR-AC-1 đối chứng dương: ca một rút đúng 1 dòng (bedrooms=4 parser), ca «chỉ ở bảng» rút 0", async () => {
    // Bộ so không ngồi trên hai tập rỗng: ca đầu phải rút đúng một dòng; ca TRT:c (chỉ có ở bảng) không được rút gì.
    for (const [ten, can] of [[CA[0][0], 1], ["bộ chỉ ở bảng: TRT:c vắng khỏi mảng, giữ nguyên", 0]]) {
      await trongGiaoDich(async () => {
        await napMoi();
        const ca = CA.find(([t]) => t === ten);
        const { cu, moi } = await soTapRut(writeAssertions, ca[1]);
        assert.equal(cu.length, can, `TR-AC-1 đối chứng dương: ca «${ten}» câu cũ rút ${cu.length}, cần ${can}`);
        assert.equal(moi.length, can, `TR-AC-1 đối chứng dương: ca «${ten}» câu mới rút ${moi.length}, cần ${can}`);
      });
    }
  });
  test("chiều đỏ TR-AC-1: bản phá `<> ALL` → `= ANY` (rút nhầm dòng khớp) → đỏ ghim «TR-AC-1 tập rút lệch câu cũ»", async () => {
    const mod = await banDot([["fa.value_key <> ALL (k.vks)", "fa.value_key = ANY (k.vks)"]]);
    await assert.rejects(() => kiemTuongDuong(mod.writeAssertions), /TR-AC-1 tập rút lệch câu cũ/);
  });
  test("chiều đỏ TR-AC-1: bản phá bỏ điều kiện phương pháp (rút sang bộ khác) → đỏ ghim «TR-AC-1 tập rút lệch câu cũ»", async () => {
    const mod = await banDot([[" AND fa.method = k.m\n      AND fa.value_key <> ALL (k.vks)", "\n      AND fa.value_key <> ALL (k.vks)"]]);
    await assert.rejects(() => kiemTuongDuong(mod.writeAssertions), /TR-AC-1 tập rút lệch câu cũ/);
  });
});

// ---- PL20 (ghep-tin-vao-danh-muc, E7): câu rút «thay bởi lượt» chừa dòng của bước gắn toà ----
/** Mồi hai dòng sống cùng (chủ thể, trường, phương pháp): một của bước gắn (rule ghep-toa-cot), một không rule; rồi ghi giá trị
 * khác bằng replaceOwn như thẻ nhóm ghi phân khu. Trả trạng thái rút của từng dòng mồi. */
async function rutKhiTheGhi(ghi) {
  return trongGiaoDich(async () => {
    const mo = async (v, rule) => (await c.query(
      `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, rule_id, observed_at)
       VALUES ('TRT:pl20', 'subzone_node_id', $1, 'inferred', 'e1_rule', $2, now()) RETURNING id`, [v, rule])).rows[0].id;
    const gan = await mo("48", RULE.cot);
    const khac = await mo("50", null);
    await ghi(c, [{ subject_key: "TRT:pl20", field: "subzone_node_id", value: "389", evidence_tier: "inferred", method: "e1_rule", rule_id: "the-nhom" }], { replaceOwn: true });
    const rut = async (id) => (await c.query(`SELECT retracted_at IS NOT NULL AS r FROM field_assertions WHERE id = $1`, [id])).rows[0].r;
    return { gan: await rut(gan), khac: await rut(khac) };
  });
}

describe("PL20 câu rút chừa dòng bước gắn toà (ROLLBACK)", () => {
  test("PL20-E7 mọi rule_id của bước gắn mang tiền tố ghep-toa- (khớp mẫu trong SQL_RUT_THAY)", () => {
    for (const r of TAT_CA_NGUON) assert.ok(r.startsWith("ghep-toa-"), `PL20-E7 rule_id ${r} không khớp mẫu ghep-toa-% của câu rút`);
    assert.match(SQL_RUT_THAY, /fa\.rule_id NOT LIKE 'ghep-toa-%'/);
  });
  test("PL20-E7 ghi khác giá trị cùng bộ: dòng ghep-toa giữ sống, dòng không rule bị rút", async () => {
    assert.deepEqual(await rutKhiTheGhi(writeAssertions), { gan: false, khac: true });
  });
  test("chiều đỏ PL20-E7: bản phá bỏ điều kiện chừa → dòng ghep-toa bị rút, đỏ", async () => {
    // PL36 thêm vế chừa ghep-can-% cạnh ghep-toa-%: phá đúng vế ghep-toa-% (ghep-can giữ nguyên), dòng ghep-toa phải bị rút.
    const mod = await banDot([["fa.rule_id NOT LIKE 'ghep-toa-%' AND ", ""]]);
    assert.deepEqual(await rutKhiTheGhi(mod.writeAssertions), { gan: true, khac: true });
  });
});

// ---- TR-AC-3: không bậc hai ở mọi kế hoạch ----
const CO_LON = 200_000;
const TRAN_GIAY = 30; // đo 20/11: câu mới 0,6–1,7 s ở 213 nghìn; câu cũ ép nested loop quá 180 s
const EP = {
  "ép nested loop": ["SET LOCAL enable_hashjoin = off", "SET LOCAL enable_mergejoin = off"],
  "ép hash": ["SET LOCAL enable_nestloop = off", "SET LOCAL enable_mergejoin = off"],
};

/** Nạp n phát biểu sống TRT:n (bedrooms, parser) bằng một câu; trả mảng đầu vào cùng cỡ, 5% giá trị đổi. */
async function napLon(n) {
  await c.query(
    `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at)
     SELECT 'TRT:' || g, 'bedrooms', (g % 7)::text, 'observed', 'parser', now() FROM generate_series(1, $1) g`, [n]);
  const rows = Array.from({ length: n }, (_, i) => PB(`TRT:${i + 1}`, "bedrooms", (i + 1) % 20 === 0 ? "99" : String((i + 1) % 7)));
  return { rows, canRut: Math.floor(n / 20) };
}

/** Kế hoạch + thời gian của câu rút `sql` ở cỡ n dưới từng chế độ ép; ném lỗi ghim khi gặp Anti Join hay quá trần. */
async function kiemKhongBacHai(sql, n, { chiKeHoach = false } = {}) {
  const ket = [];
  for (const [che, set] of Object.entries(EP)) {
    await trongGiaoDich(async () => {
      const { rows, canRut } = await napLon(n);
      await c.query("ANALYZE field_assertions"); // trong giao dịch: planner thấy cỡ thật, không phụ thuộc thống kê cũ
      for (const s of set) await c.query(s);
      await c.query(`SET LOCAL statement_timeout = '${TRAN_GIAY}s'`);
      const ke = (await c.query(`EXPLAIN ${sql}`, mang(rows))).rows.map((r) => r["QUERY PLAN"]).join("\n");
      if (/Anti Join/.test(ke)) {
        throw new Error(`TR-AC-3 kế hoạch có Anti Join (${che}, n=${n}) — bậc hai trên bảng tạm: ${ke.split("\n").find((l) => /Anti Join/.test(l)).trim()}`);
      }
      if (chiKeHoach) return;
      const t0 = Date.now();
      let r;
      try { r = await c.query(sql, mang(rows)); } catch (e) {
        throw new Error(`TR-AC-3 quá trần ${TRAN_GIAY} s (${che}, n=${n}): ${e.message}`);
      }
      const giay = (Date.now() - t0) / 1000;
      assert.equal(r.rowCount, canRut, `TR-AC-3 đối chứng: ${che} n=${n} rút ${r.rowCount}, cần ${canRut}`);
      ket.push(`${che} ${giay.toFixed(2)} s`);
    });
  }
  return ket;
}

describe("TR-AC-3 không bậc hai ở mọi kế hoạch (ROLLBACK)", () => {
  for (const n of [10, 1_000, CO_LON]) {
    test(`TR-AC-3 n=${n}: ép nested loop và ép hash đều không Anti Join, dưới ${TRAN_GIAY} s, rút đúng 5%`, async () => {
      const ket = await kiemKhongBacHai(SQL_RUT_THAY, n);
      console.log(`TR-AC-3 n=${n}: ${ket.join(" · ")}`);
    });
  }
  test("chiều đỏ TR-AC-3: câu cũ ép nested loop ở n=200000 → đỏ ghim «TR-AC-3 kế hoạch có Anti Join»", async () => {
    await assert.rejects(() => kiemKhongBacHai(SQL_GOC, CO_LON, { chiKeHoach: true }), /TR-AC-3 kế hoạch có Anti Join \(ép nested loop/);
  });
});

describe("TR-RAO rào DB thử", () => {
  test("TR-RAO chiều đỏ: DATABASE_URL trỏ DB «oneinvest» (cổng chết) → tệp từ chối, thoát 2, không mở kết nối nào", () => {
    // Cổng 1 không có máy chủ: nếu tệp đi tới kết nối (hay ANALYZE) thì lỗi là ECONNREFUSED, không phải lời từ chối của rào.
    const { NODE_TEST_CONTEXT: _bo, ...env } = process.env;
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
      env: { ...env, DATABASE_URL: "postgres://localhost:1/oneinvest" }, encoding: "utf8", timeout: 30_000 });
    assert.equal(r.status, 2, `TR-RAO rào không chặn DB chung: mã ${r.status} · ${r.stderr.slice(-300)}`);
    assert.match(r.stderr, /assert-rut-thay: từ chối — DB 'oneinvest' không phải DB thử oneinvest_suite_\*/);
    assert.doesNotMatch(r.stderr + r.stdout, /ECONNREFUSED|ANALYZE/, "TR-RAO tệp đã thử kết nối trước khi rào chặn");
  });
});
