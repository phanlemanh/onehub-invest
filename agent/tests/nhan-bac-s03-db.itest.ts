// nhan-bac-s03-db.itest.ts — hồ sơ _acceptance/nhan-bac-model-lon-s03 (KC1) phần cần DB máy thu: migration 065
// (`silver_labels`) và lệnh nhãn bạc chỉ ghi bảng ấy. Mọi ca trong BEGIN … ROLLBACK trên DB local, chỉ in số.
// Tệp nằm ngoài glob tests/*.test.ts — CI (DB trống) không chạy; chạy: node --import tsx --test tests/nhan-bac-s03-db.itest.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { FILL } from "../../pipeline/sync-cloud.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const MIG_065 = join(import.meta.dirname, "../../db/migrations/065_silver_labels.sql");

export async function withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

export const napMig065 = async (c: pg.Client) => c.query(await readFile(MIG_065, "utf8"));

const COT = ["label_id", "source_code", "post_id", "text_hash", "model", "prompt_version", "listing_intent", "kind",
  "probability", "probabilities", "quote", "quote_ok", "json_ok", "error_kind", "latency_ms", "cost_usd", "run_id", "labeled_at"];

/** Bảng nhãn bạc không được trong danh sách đẩy cloud. */
function kiemKhongLenCloud(fill: unknown[]) {
  const ten = fill.map((x) => (typeof x === "string" ? x : (x as { table?: string; name?: string }).table ?? (x as { name?: string }).name));
  assert.ok(ten.includes("areas"), "NB-AC-1 đối chứng dương: không đọc được tên bảng từ FILL (areas vắng)");
  if (ten.includes("silver_labels")) assert.fail("NB-AC-1 nhãn bạc lên cloud: silver_labels nằm trong FILL của sync-cloud");
}

test("NB-AC-1 migration 065 áp hai lần: bảng silver_labels đủ cột, khoá duy nhất, CHECK theo sổ, không lên cloud", async () => {
  await withTx(async (c) => {
    await napMig065(c);
    await napMig065(c);
    const cot = (await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'silver_labels'`)).rows.map((r) => r.column_name);
    for (const x of COT) assert.ok(cot.includes(x), `NB-AC-1 thiếu cột ${x}`);
    const chen = (intent: string, kind: string | null, post = "nb_ac1_p1") => c.query(
      `INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, run_id)
       VALUES ('S03', $1, 'h1', 'test:gia', 'v1', $2, $3, true, 'r1') ON CONFLICT DO NOTHING`, [post, intent, kind]);
    assert.equal((await chen("offer", "sale")).rowCount, 1, "NB-AC-1 đối chứng dương: dòng hợp lệ không chèn được");
    assert.equal((await chen("offer", "sale")).rowCount, 0, "NB-AC-1 khoá duy nhất không chặn dòng trùng");
    assert.equal((await chen("inquiry", null, "nb_ac1_p2")).rowCount, 1, "NB-AC-1 Yêu cầu kind rỗng không chèn được");
    await c.query("SAVEPOINT s");
    await assert.rejects(chen("wanted", null, "nb_ac1_p3"), (e: { code?: string }) => e.code === "23514", "NB-AC-1 giá trị ý định lạ lọt CHECK");
    await c.query("ROLLBACK TO SAVEPOINT s");
    const rel = (await c.query(`SELECT column_name, lookup_name FROM ref_field_lookup WHERE table_name = 'silver_labels' ORDER BY 1`)).rows;
    assert.deepEqual(rel, [{ column_name: "kind", lookup_name: "kind" }, { column_name: "listing_intent", lookup_name: "listing_intent" }]);
  });
  kiemKhongLenCloud(FILL);
});

test("chiều đỏ NB-AC-1: danh sách đẩy cloud có silver_labels → đỏ ghim «NB-AC-1 nhãn bạc lên cloud»", () => {
  assert.throws(() => kiemKhongLenCloud([...FILL, "silver_labels"]), /NB-AC-1 nhãn bạc lên cloud/);
});
