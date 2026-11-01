// nap-lai-ba-luot-fk.test.mjs — hồ sơ _acceptance/reconcile-tin-con-anh: đối chứng 039 của thước PL14 (nap-lai-ba-luot.mjs)
// đổi MỌI FK trỏ bảng bản ghi sang CASCADE, kể cả bảng thêm sau 044 (053 media). Trước: danh sách cứng 6 FK → xoá tin còn ảnh
// vướng media_offer_fk và thước sập (tin «cho vay» bị luật #253 loại còn ảnh). Mọi ca trong BEGIN … ROLLBACK, mồi nguồn T99.
import { test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";

import { FK_039, HAM_039, fkTroBanGhi, sqlCascade } from "./nap-lai-ba-luot.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const MOI = "offer_t99_con_anh_moi";

async function withTx(fn) {
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

/** Mồi: một tin nguồn T99 có một ảnh — đúng dạng tin bị luật mới loại mà còn ảnh. */
async function moiTinConAnh(c) {
  await c.query(`INSERT INTO sale_offer_records (offer_id, source, kind, first_seen, last_seen) VALUES ($1, 'T99', 'rent_lt', now(), now())`, [MOI]);
  await c.query(`INSERT INTO media (media_key, resource_record_key, originating_system_name, originating_system_resource_record_key, media_url, media_order)
    VALUES ('media_t99_moi', $1, 'S03', 'post_t99', 'https://example.test/a.jpg', 0)`, [MOI]);
}

/** Chạy đối soát 039 trên nguồn T99 (p_live không chứa mồi → mồi bị xoá). */
const doiSoat039 = (c) => c.query(`SELECT reconcile_stale_offers('T99', ARRAY['offer_khong_co'], 'test')`);

test("NLF-1 danh sách FK đọc từ lược đồ có media_offer_fk và đủ sáu FK đời 039, không có khoá tự trỏ", async () => {
  await withTx(async (c) => {
    const ten = (await fkTroBanGhi(c)).map((f) => f.ten);
    assert.ok(ten.includes("media_offer_fk"), `NLF-1 thiếu media_offer_fk: ${ten.join(", ")}`);
    for (const [, con] of FK_039) assert.ok(ten.includes(con), `NLF-1 thiếu FK đời 039 ${con}`);
    assert.ok(!ten.includes("sale_offer_records_superseded_by_fkey"), "NLF-1 khoá tự trỏ superseded_by lọt vào danh sách");
  });
});

test("NLF-2 đối chứng 039 (FK đọc từ lược đồ) xoá tin còn ảnh không vướng FK, ảnh đi theo", async () => {
  await withTx(async (c) => {
    await moiTinConAnh(c);
    await c.query(`${sqlCascade(await fkTroBanGhi(c))}\n${HAM_039}`);
    const r = (await doiSoat039(c)).rows[0].reconcile_stale_offers;
    assert.equal(r.stale, 1, `NLF-2 đối chứng không xoá mồi: ${JSON.stringify(r)}`);
    const { rows } = await c.query(`SELECT count(*)::int AS n FROM media WHERE resource_record_key = $1`, [MOI]);
    assert.equal(rows[0].n, 0, "NLF-2 ảnh của tin đã xoá còn lại");
  });
});

test("chiều đỏ NLF-2: danh sách cứng sáu FK đời 039 → xoá tin còn ảnh vướng media_offer_fk", async () => {
  await withTx(async (c) => {
    await moiTinConAnh(c);
    const cung = FK_039.map(([bang, ten, cot, ref]) => ({ bang, ten, dinh_nghia: `FOREIGN KEY (${cot}) REFERENCES ${ref}` }));
    await c.query(`${sqlCascade(cung)}\n${HAM_039}`);
    await assert.rejects(doiSoat039(c), (e) => e.code === "23503" && /media_offer_fk/.test(e.message),
      "NLF-2 chiều đỏ: danh sách cứng không vướng media_offer_fk — mồi không có ảnh?");
  });
});
