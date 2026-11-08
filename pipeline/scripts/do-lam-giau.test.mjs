// do-lam-giau.test.mjs — DO3 do-lam-giau. Ca thuần (hàm của lib/do-lam-giau.mjs) và ca DB (DB thử của lượt, giao dịch ROLLBACK,
// 086 nạp trong giao dịch). Mỗi thước có cặp hai chiều trên cùng fixture: vật lành xanh, bản đột biến (cờ dotBien) đỏ với thông điệp
// ghim — tên ca và thông điệp khớp _acceptance/do-lam-giau/evals.yaml.
import assert from "node:assert/strict";
import { test } from "node:test";

import pg from "pg";

import { daCoLamGiau, napLamGiau } from "../lib/do-lam-giau-db.mjs";

const DB = process.env.DATABASE_URL;
const coDb = { skip: DB ? false : "thiếu DATABASE_URL — chạy qua npm test (DB thử của lượt)" };

/** Một giao dịch trên DB thử: khoá 33033, chạy fn, ROLLBACK. Từ chối DB oneinvest dùng chung. */
export async function trongGiaoDich(fn) {
  const c = new pg.Client({ connectionString: DB });
  await c.connect();
  try {
    const { rows: [{ db }] } = await c.query("SELECT current_database() AS db");
    if (db === "oneinvest") throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — dùng DB thử (db/db-thu.sh)");
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const COT = async (c, bang) => (await c.query(
  "SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position", [bang])).rows.map((r) => r.column_name);

test("DO3-NAP 086 nạp trong giao dịch, chạy lại không lỗi, ROLLBACK thì mất", coDb, async () => {
  let truoc;
  await trongGiaoDich(async (c) => {
    truoc = await daCoLamGiau(c);
    await napLamGiau(c);
    assert.equal(await napLamGiau(c), false, "lần hai không nạp lại");
    assert.deepEqual(await COT(c, "enrichment_value_state"), ["duong", "subject_key", "value_key", "offer_id", "seen_on"]);
    assert.deepEqual(await COT(c, "enrichment_value_change"),
      ["snap_date", "duong", "subject_key", "from_value", "to_value", "huong", "offer_id"]);
    // CHECK giữ khuôn: hướng them phải từ NULL, may_rut phải về NULL, from ≠ to.
    await c.query("SAVEPOINT s");
    await assert.rejects(c.query(`INSERT INTO enrichment_value_change VALUES ('2025-06-01', 'quy-uoc-nhom', 'k', 'a', 'b', 'them', NULL)`));
    await c.query("ROLLBACK TO SAVEPOINT s");
    await assert.rejects(c.query(`INSERT INTO enrichment_value_change VALUES ('2025-06-01', 'quy-uoc-nhom', 'k', 'a', 'a', 'doi', NULL)`));
    await c.query("ROLLBACK TO SAVEPOINT s");
    await assert.rejects(c.query(`INSERT INTO enrichment_value_state VALUES ('duong-la', 'k', 'v', NULL, '2025-06-01')`));
    await c.query("ROLLBACK TO SAVEPOINT s");
  });
  if (truoc === false) {
    const c = new pg.Client({ connectionString: DB });
    await c.connect();
    try { assert.equal(await daCoLamGiau(c), false, "ROLLBACK phải bỏ 086"); } finally { await c.end(); }
  }
});
