// nap-db.test.mjs — can-gia-tot-ba-vai-ten-nguon-trong AC-5: napTenNguon chạy đúng câu đọc sổ nguồn của script trên DB của riêng lượt
// (db-thu.sh --chay), có cấy hai dòng tên rỗng và chỉ khoảng trắng trong giao dịch rồi lùi. Chỉ in số đếm, không in tên nguồn (tầng A).
// CG20_SRC trỏ bản đột biến của mô-đun.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const GOC = path.join(import.meta.dirname, "../../..");
const SRC = process.env.CG20_SRC ?? path.join(GOC, "scripts/can-gia-tot-ba-vai-ten-nguon.mjs");
const { napTenNguon } = await import(pathToFileURL(SRC).href);
const pg = createRequire(path.join(GOC, "app/package.json"))("pg");
if (!process.env.DATABASE_URL || /\/oneinvest$/.test(process.env.DATABASE_URL)) throw new Error("chỉ chạy trên DB của riêng lượt (db-thu.sh --chay)");

test("AC-5 napTenNguon trên DB thật: hai dòng tên rỗng cấy thêm bị bỏ, số tên bằng số dòng có tên đếm độc lập", async () => {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query(`INSERT INTO source_registry (code, real_name, label_vi) VALUES ('S9ZRONG', '', 'thử rỗng'), ('S9ZTRANG', '   ', 'thử khoảng trắng')`);
    const dem = (await c.query("SELECT count(*)::int AS tat_ca, count(*) FILTER (WHERE btrim(real_name) <> '')::int AS co_ten FROM source_registry")).rows[0];
    const r = await napTenNguon(c);
    assert.ok(dem.co_ten > 0, "DB thử không có dòng sổ nguồn nào có tên");
    assert.equal(r.ten.length, dem.co_ten, `số tên ${r.ten.length}, đếm độc lập ${dem.co_ten}`);
    assert.equal(r.bo, dem.tat_ca - dem.co_ten, `số dòng bỏ ${r.bo}, mong ${dem.tat_ca - dem.co_ten}`);
    assert.ok(r.bo >= 2, `số dòng bỏ ${r.bo}, mong ≥ 2 (hai dòng cấy)`);
    assert.ok(r.ten.every((t) => t.length > 0 && t === t.trim().toLowerCase()), "có tên rỗng hay chưa chuẩn hoá trong danh sách");
    console.log(`AC-5: ${dem.tat_ca} dòng sổ nguồn, ${r.ten.length} tên để soát, bỏ ${r.bo}`);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
});
