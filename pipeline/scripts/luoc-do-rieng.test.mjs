// luoc-do-rieng.test.mjs — lược đồ riêng cho test DB song song (hồ sơ app-test-chiu-song-song). Postgres local :5433, mọi
// ca trong BEGIN…ROLLBACK; chỉ ACCESS SHARE trên bảng public (không khoá nào chặn job khác), phiên có hạn giờ phía server.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import pg from "pg";

import { luocDoRieng } from "../lib/luoc-do-rieng.mjs";

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

test("LDR bản chép rỗng mang đủ ràng buộc, chỉ mục, dãy riêng và search_path trỏ vào nó", { timeout: 120_000 }, async () => {
  const c = await moi();
  try {
    const seq0 = (await c.query(`SELECT last_value::text v FROM public.properties_id_seq`)).rows[0].v;
    const sc = await luocDoRieng(c, ["sale_offer_records", "properties"], { tienTo: "ldr_test" });
    for (const t of ["sale_offer_records", "properties"]) {
      assert.equal((await c.query(`SELECT relnamespace::regnamespace::text r FROM pg_class WHERE oid = to_regclass($1)`, [t])).rows[0].r, sc, `LDR ${t} chưa trỏ vào lược đồ riêng`);
      assert.equal(Number((await c.query(`SELECT count(*) n FROM ${t}`)).rows[0].n), 0, `LDR ${t} không rỗng`);
      assert.deepEqual(await demRangBuoc(c, sc, t), await demRangBuoc(c, "public", t), `LDR ${t} lệch ràng buộc`);
      assert.equal(await demChiMuc(c, sc, t), await demChiMuc(c, "public", t), `LDR ${t} lệch chỉ mục`);
    }
    const id = (await c.query(`INSERT INTO properties (kind) VALUES ('sale') RETURNING id`)).rows[0].id;
    assert.equal(Number(id), 1, "LDR dãy riêng không bắt đầu từ 1");
    const seq1 = (await c.query(`SELECT last_value::text v FROM public.properties_id_seq`)).rows[0].v;
    assert.equal(seq1, seq0, "LDR chèn vào bản riêng đẩy dãy dùng chung");
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
