// luoc-do-rieng.test.mjs — lược đồ riêng cho test DB song song (hồ sơ app-test-chiu-song-song). Postgres local :5433, mọi
// ca trong BEGIN…ROLLBACK; chỉ ACCESS SHARE trên bảng public (không khoá nào chặn job khác), phiên có hạn giờ phía server.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import pg from "pg";

import { khoaNguon, luocDoRieng } from "../lib/luoc-do-rieng.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const moi = async () => {
  const c = new pg.Client({
    connectionString: DB_URL,
    statement_timeout: 60_000,
    lock_timeout: 30_000,
    idle_in_transaction_session_timeout: 120_000,
  });
  await c.connect();
  await c.query("BEGIN");
  return c;
};
const dong = async (c) => {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
};

const demRangBuoc = async (c, ns, t) =>
  (await c.query(
    `SELECT contype, count(*)::int n FROM pg_constraint
     WHERE conrelid = to_regclass($1 || '.' || $2) AND contype IN ('c', 'p', 'u') GROUP BY 1 ORDER BY 1`,
    [ns, t],
  )).rows;
const demChiMuc = async (c, ns, t) =>
  Number((await c.query(`SELECT count(*) n FROM pg_index WHERE indrelid = to_regclass($1 || '.' || $2)`, [ns, t])).rows[0].n);

test("LDR bản chép rỗng mang đủ ràng buộc, chỉ mục, cột sinh, dãy riêng và search_path trỏ vào nó", { timeout: 120_000 }, async () => {
  const c = await moi();
  try {
    const sc = await luocDoRieng(c, ["sale_offer_records", "properties", "field_assertions"], { tienTo: "ldr_test" });
    for (const t of ["sale_offer_records", "properties", "field_assertions"]) {
      assert.equal((await c.query(`SELECT relnamespace::regnamespace::text r FROM pg_class WHERE oid = to_regclass($1)`, [t])).rows[0].r, sc, `LDR ${t} chưa trỏ vào lược đồ riêng`);
      assert.equal(Number((await c.query(`SELECT count(*) n FROM ${t}`)).rows[0].n), 0, `LDR ${t} không rỗng`);
      assert.deepEqual(await demRangBuoc(c, sc, t), await demRangBuoc(c, "public", t), `LDR ${t} lệch ràng buộc`);
      assert.equal(await demChiMuc(c, sc, t), await demChiMuc(c, "public", t), `LDR ${t} lệch chỉ mục`);
    }
    // Cột sinh STORED (field_assertions.value_key): biểu thức chép nguyên, không ném «expression contains variables».
    const bt = async (ns) => (await c.query(
      `SELECT pg_get_expr(d.adbin, d.adrelid) e FROM pg_attribute a JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
       WHERE a.attrelid = to_regclass($1 || '.field_assertions') AND a.attname = 'value_key' AND a.attgenerated = 's'`, [ns])).rows[0]?.e;
    assert.ok(await bt("public"), "LDR public.field_assertions.value_key không còn là cột sinh — ca hết căn cứ");
    assert.equal(await bt(sc), await bt("public"), "LDR cột sinh lệch biểu thức");
    const id = (await c.query(`INSERT INTO properties (kind) VALUES ('sale') RETURNING id`)).rows[0].id;
    assert.equal(Number(id), 1, "LDR dãy riêng không bắt đầu từ 1");
    // Không so last_value của dãy public: job khác chèn song song đẩy nó (đỏ oan). Đo mặc định của cột trỏ dãy nào.
    const nsDay = (await c.query(`SELECT s.relnamespace::regnamespace::text ns FROM pg_attrdef d
      JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
      JOIN pg_depend p ON p.classid = 'pg_attrdef'::regclass AND p.objid = d.oid
      JOIN pg_class s ON s.oid = p.refobjid AND s.relkind = 'S'
      WHERE d.adrelid = to_regclass($1 || '.properties') AND a.attname = 'id'`, [sc])).rows.map((r) => r.ns);
    assert.deepEqual(nsDay, [sc], `LDR chèn vào bản riêng đẩy dãy dùng chung (dãy của id ở: ${nsDay})`);
    await c.query("SAVEPOINT pk");
    await assert.rejects(
      c.query(`INSERT INTO properties (id, kind) VALUES (1, 'sale')`),
      /duplicate key/,
      "LDR khoá chính không được chép",
    );
    await c.query("ROLLBACK TO SAVEPOINT pk");
  } finally {
    await dong(c);
  }
});

test("LDR từ chối view", { timeout: 60_000 }, async () => {
  const c = await moi();
  try {
    await assert.rejects(luocDoRieng(c, ["sale_offers"], { tienTo: "ldr_test" }), /không phải bảng/);
  } finally {
    await dong(c);
  }
});

test("LDR hai phiên dựng song song không chờ nhau, không giữ khoá 33033, rollback không để lại gì", { timeout: 120_000 }, async () => {
  const a = await moi();
  const b = await moi();
  let scA;
  try {
    scA = await luocDoRieng(a, ["sale_offer_records", "properties", "property_offers"], { tienTo: "ldr_test" });
    // A còn mở giao dịch; B dựng trên CÙNG bảng phải xong mà không chờ (lock_timeout ngắn: chờ thì lỗi 55P03).
    await b.query("SET LOCAL lock_timeout = '2s'");
    const t0 = Date.now();
    const scB = await luocDoRieng(b, ["sale_offer_records", "properties", "property_offers"], { tienTo: "ldr_test" });
    assert.ok(Date.now() - t0 < 5_000, "LDR phiên B chờ phiên A");
    assert.notEqual(scA, scB, "LDR hai phiên chung một lược đồ");
    const pids = [(await a.query("SELECT pg_backend_pid() p")).rows[0].p, (await b.query("SELECT pg_backend_pid() p")).rows[0].p];
    const khoa = (await a.query(
      `SELECT count(*)::int n FROM pg_locks WHERE locktype = 'advisory' AND objid = 33033 AND pid = ANY($1::int[])`,
      [pids],
    )).rows[0].n;
    assert.equal(khoa, 0, "LDR phiên dựng lược đồ riêng vẫn giữ khoá 33033");
  } finally {
    await dong(a);
    await dong(b);
  }
  const c = await moi();
  try {
    assert.equal((await c.query(`SELECT to_regnamespace($1) r`, [scA])).rows[0].r, null, "LDR lược đồ riêng còn sau ROLLBACK");
  } finally {
    await dong(c);
  }
});

/** Một mắt của chuỗi ca nạp DDL: giữ 33033 rồi khoá độc quyền bảng tới ROLLBACK, như `napPhatBieu` trong `withTx` của các bộ
 * test. Không ghi gì; chờ theo lượt như mọi ca khác (lock_timeout 0, không hạn câu lệnh). */
const matChuoi = async () => {
  const c = await moi();
  await c.query("SET LOCAL lock_timeout = 0");
  await c.query("SET LOCAL statement_timeout = 0");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  await c.query("LOCK TABLE public.field_assertions IN ACCESS EXCLUSIVE MODE");
  return c;
};
const giu33033 = async (c, pid) => (await c.query(
  `SELECT count(*)::int n FROM pg_locks WHERE locktype = 'advisory' AND objid = 33033 AND pid = $1 AND granted`, [pid])).rows[0].n;

test("LDR chuỗi ca DDL giữ khoá liền nhau: phiên đọc xếp hàng 33033 rồi vào được, không hết lượt thử, không giữ lại 33033", { timeout: 300_000 }, async () => {
  const a = await matChuoi();
  const c = await moi();
  try {
    await c.query("SET LOCAL lock_timeout = 0");
    await c.query("SET LOCAL statement_timeout = 0");
    // toiDa nhỏ hơn hẳn thời gian a giữ: thử-rồi-ngủ 100 ms hết lượt ở đây, chiều đói khoá của lượt S4 r3.
    const dangCho = khoaNguon(c, ["field_assertions"], { toiDa: 3 });
    await new Promise((r) => setTimeout(r, 1_500));
    await a.query("ROLLBACK");
    assert.ok((await dangCho) >= 1, "LDR phiên đọc không hề gặp khoá của ca DDL — ca hết căn cứ");
    const pid = (await c.query("SELECT pg_backend_pid() p")).rows[0].p;
    assert.equal(await giu33033(c, pid), 0, "LDR xong vẫn giữ 33033: ca DDL khác không vào được");
    const co = (await c.query(`SELECT count(*)::int n FROM pg_locks WHERE locktype = 'relation' AND pid = $1 AND granted
      AND relation = 'public.field_assertions'::regclass AND mode = 'AccessShareLock'`, [pid])).rows[0].n;
    assert.equal(co, 1, "LDR chưa cầm ACCESS SHARE trên bảng nguồn");
  } finally {
    await dong(a);
    await dong(c);
  }
});

test("LDR xếp hàng bị lock_timeout cắt: giao dịch không hỏng, thử lại tới khi vào được", { timeout: 300_000 }, async () => {
  const a = await matChuoi();
  const c = await moi();
  try {
    await c.query("SET LOCAL lock_timeout = '200ms'");
    const dangCho = khoaNguon(c, ["field_assertions"], { toiDa: 1000 });
    await new Promise((r) => setTimeout(r, 1_000));
    await a.query("ROLLBACK");
    await dangCho;
    assert.equal((await c.query("SELECT 1 AS mot")).rows[0].mot, 1, "LDR giao dịch hỏng sau khi xếp hàng bị cắt");
  } finally {
    await dong(a);
    await dong(c);
  }
});

// ── Hồ sơ khoa-nguon-nghi-khi-ddl-sua: kẻ chặn KHÔNG đi qua 33033 (migration chạy tay, ALTER của job khác, phiên psql). ──

/** Kẻ chặn ngoài 33033: ACCESS EXCLUSIVE trên bảng mà không giữ khoá tư vấn nào — 33033 rảnh suốt lúc nó giữ bảng. */
const chanNgoai33033 = async () => {
  const c = await moi();
  await c.query("SET LOCAL lock_timeout = 0");
  await c.query("SET LOCAL statement_timeout = 0");
  await c.query("LOCK TABLE public.field_assertions IN ACCESS EXCLUSIVE MODE");
  return c;
};
const pidCua = async (c) => (await c.query("SELECT pg_backend_pid() p")).rows[0].p;
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

/** Đối chứng dương của hàm đo giữ-33033: một phiên giữ 33033 thì hàm phải thấy; không thì mọi vế «không giữ» xanh vô điều kiện. */
const doiChungDo33033 = async (doc) => {
  const dc = await moi();
  try {
    await dc.query("SELECT pg_advisory_lock(33033)");
    assert.equal(await giu33033(doc, await pidCua(dc)), 1, "KN do khoa 33033 hong: phiên đối chứng giữ 33033 mà hàm đo không thấy");
    await dc.query("SELECT pg_advisory_unlock(33033)");
  } finally {
    await dong(dc);
  }
};

test("KN-AC-1 khoá DDL ngoài 33033: nghỉ 100 ms giữa các lần thử, vào được khi kẻ chặn nhả, không giữ 33033", { timeout: 120_000 }, async () => {
  const c = await moi();
  let a;
  try {
    await doiChungDo33033(c);
    a = await chanNgoai33033();
    assert.equal(await giu33033(c, await pidCua(a)), 0, "KN ca het can cu: phiên chặn đang giữ 33033");
    await c.query("SET LOCAL lock_timeout = 0");
    await c.query("SET LOCAL statement_timeout = 0");
    // Bảng bị chặn đứng sau trong danh sách: câu LOCK nhiều bảng khoá được bảng đầu rồi mới gặp bảng bị chặn.
    const dangCho = khoaNguon(c, ["sale_offer_records", "field_assertions"], { toiDa: 40 }).then((v) => ({ v }), (e) => ({ e }));
    await ngu(1_500);
    await a.query("ROLLBACK");
    const r = await dangCho;
    if (r.e?.code === "55P03" || (r.v ?? 0) > 25) {
      assert.fail(`KN KHOA NGOAI 33033 QUAY KHONG NGHI: ${r.e ? "ném 55P03 trước khi kẻ chặn nhả" : `lan=${r.v} > 25`}`);
    }
    if (r.e) throw r.e;
    assert.ok(r.v >= 1, "KN ca het can cu: phiên gọi không hề bị chặn");
    assert.ok(r.v >= 5, `KN-AC-1 lan=${r.v} dưới nhịp nghỉ: vào trước khi kẻ chặn giữ đủ 1,5 s`);
    const pid = await pidCua(c);
    assert.equal(await giu33033(c, pid), 0, "KN CON GIU 33033: vào được mà chưa nhả 33033");
    const co = (await c.query(`SELECT relation::regclass::text t FROM pg_locks WHERE locktype = 'relation' AND pid = $1 AND granted
      AND mode = 'AccessShareLock' AND relation = ANY(ARRAY['public.sale_offer_records'::regclass, 'public.field_assertions'::regclass])
      ORDER BY 1`, [pid])).rows.map((x) => x.t);
    assert.deepEqual(co, ["field_assertions", "sale_offer_records"], `KN-AC-1 chưa cầm ACCESS SHARE trên cả hai bảng nguồn: ${co}`);
  } finally {
    if (a) await dong(a);
    await dong(c);
  }
});

test("KN-AC-2 khoá DDL ngoài 33033 giữ suốt: hết lượt sau khi đã nghỉ, ném 55P03, giao dịch còn dùng được", { timeout: 120_000 }, async () => {
  const c = await moi();
  const a = await chanNgoai33033();
  try {
    await c.query("SET LOCAL lock_timeout = 0");
    const t0 = Date.now();
    let loi;
    try {
      await khoaNguon(c, ["field_assertions"], { toiDa: 5 });
    } catch (e) {
      loi = e;
    }
    const ms = Date.now() - t0;
    assert.ok(loi, "KN ca het can cu: khoaNguon vào được dù kẻ chặn giữ suốt");
    assert.equal(loi.code, "55P03", `KN-AC-2 ném lỗi khác 55P03: ${loi.code} ${loi.message}`);
    assert.ok(ms >= 450, `KN HET LUOT MA KHONG NGHI: hết 5 lượt sau ${ms} ms`);
    assert.equal((await c.query("SELECT 1 AS mot")).rows[0].mot, 1, "KN-AC-2 giao dịch hỏng sau khi hết lượt");
    assert.equal(await giu33033(c, await pidCua(c)), 0, "KN CON GIU 33033: hết lượt mà chưa nhả 33033");
  } finally {
    await dong(a);
    await dong(c);
  }
});

test("KN-AC-3 khoá DDL ngoài 33033: lúc nghỉ không cầm 33033 (lấy mẫu pg_locks trong lúc chờ)", { timeout: 120_000 }, async () => {
  const c = await moi();
  const s = await moi();
  const a = await chanNgoai33033();
  try {
    await doiChungDo33033(s);
    await c.query("SET LOCAL lock_timeout = 0");
    await c.query("SET LOCAL statement_timeout = 0");
    const pid = await pidCua(c);
    let xong = false;
    const dangCho = khoaNguon(c, ["field_assertions"], { toiDa: 100 }).finally(() => { xong = true; });
    const nha = ngu(1_000).then(() => a.query("ROLLBACK"));
    let n = 0;
    let k = 0;
    while (!xong) {
      const giu = await giu33033(s, pid);
      if (xong) break; // mẫu lấy sau khi khoaNguon trả về không tính
      n += 1;
      k += giu;
      await ngu(20);
    }
    await dangCho;
    await nha;
    console.log(`# KN-AC-3 giu 33033: ${k}/${n} mau`);
    assert.ok(n >= 30, `KN lay mau thieu: ${n} mẫu`);
    assert.ok(k / n <= 0.5, `KN NGHI KHI GIU 33033: ${k}/${n} mẫu thấy phiên chờ cầm 33033`);
  } finally {
    await dong(a);
    await dong(s);
    await dong(c);
  }
});

test("KN-AC-6 lỗi khác 55P03 (bảng không có): ném ngay, không thử lại, giao dịch còn dùng được", { timeout: 60_000 }, async () => {
  const c = await moi();
  try {
    assert.equal((await c.query("SELECT to_regclass('public.bang_khong_co_kn') r")).rows[0].r, null, "KN ca het can cu: bảng thử có thật");
    const t0 = Date.now();
    let loi;
    try {
      await khoaNguon(c, ["bang_khong_co_kn"], { toiDa: 3 });
    } catch (e) {
      loi = e;
    }
    const ms = Date.now() - t0;
    assert.equal(loi?.code, "42P01", `KN-AC-6 không ném 42P01: ${loi?.code}`);
    assert.ok(ms < 250, `KN LOI KHAC VAN THU LAI: ném sau ${ms} ms`);
    assert.equal((await c.query("SELECT 1 AS mot")).rows[0].mot, 1, "KN-AC-6 giao dịch hỏng sau lỗi");
  } finally {
    await dong(c);
  }
});
