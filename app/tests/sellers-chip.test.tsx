// sellers-chip.test.tsx — sellers-them-dong-lai (SD1) AC-6: sau bước bait gap, mọi tin Căn giá tốt có SĐT người bán có số
// tin của người bán (chip môi giới). dealsSql THẬT của app trên DB máy thu, trong BEGIN…ROLLBACK — không để lại dòng nào.
// Chiều đỏ: bản đột biến của pipeline/refresh-bait-gap.mjs (bỏ lệnh thêm dòng) chép tạm cạnh tệp thật.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

import { dealsSql } from "../src/lib/deals";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const PIPE = join(import.meta.dirname, "../../pipeline");

type BaitGap = { refreshBaitGap: (c: pg.Client) => Promise<unknown> };

async function withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
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

/** Bản đột biến: bước 3 về UPDATE dòng đã có như trước vòng (không thêm dòng cho SĐT mới). */
async function banBoThemDong(): Promise<BaitGap> {
  const goc = readFileSync(join(PIPE, "refresh-bait-gap.mjs"), "utf8");
  const ma = goc
    .replace(/INSERT INTO sellers AS x[\s\S]*?FROM s\n\s*ON CONFLICT \(phone_hash\) DO UPDATE\n\s*SET/, "UPDATE sellers x SET")
    .replace(/flags = EXCLUDED\.flags\n\s*RETURNING \(xmax = 0\) AS moi/, "flags = EXCLUDED.flags FROM s WHERE x.phone_hash = s.h RETURNING false AS moi")
    .replace(/EXCLUDED\.n_ads/, "s.n_ads").replace(/EXCLUDED\.sources/, "s.srcs").replace(/EXCLUDED\.first_seen/, "s.fs")
    .replace(/EXCLUDED\.last_seen/, "s.ls").replace(/COALESCE\(x\.name, EXCLUDED\.name\)/, "COALESCE(x.name, s.best_name)")
    .replace(/flags = EXCLUDED\.flags FROM s/, "flags = jsonb_build_object('n_ads', s.n_ads) FROM s");
  assert.notEqual(ma, goc, "đột biến không đổi mã — chiều đỏ rỗng");
  const f = join(PIPE, `.tam-sellers-chip-${process.pid}.mjs`);
  writeFileSync(f, ma);
  try {
    return (await import(pathToFileURL(f).href)) as BaitGap;
  } finally {
    rmSync(f, { force: true });
  }
}

/** Một tin Căn giá tốt mang SĐT chưa có dòng sellers, ở phường có thước — bảo đảm chiều đỏ không rỗng trên mọi dữ liệu. */
async function tinMoi(c: pg.Client): Promise<string> {
  const r = (await c.query(`SELECT area_id, m FROM v_ruler_p2_area ORDER BY area_id LIMIT 1`)).rows[0];
  assert.ok(r, "SD-AC-6 không phường nào có thước (v_ruler_p2_area rỗng) — ca không chạy được");
  const id = `t_sd1_chip_${process.pid}`;
  await c.query(
    `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids, price_tier,
       property_type, area_id, area_m2, bedrooms, price_vnd, price_perm2, n_reposts, seller_phone, seller_phone_hash)
     VALUES ($1, 'S03', 'sale', 'high', now(), now(), '{}', 'P1', 'unknown', $2, 80, 2, 4000000000, $3::numeric, 1,
             '0900000000', $4)`,
    [id, r.area_id, Math.round(Number(r.m) * 0.8), `t_sd1_chip_h_${process.pid}`],
  );
  return id;
}

async function kiemAc6(c: pg.Client, mod: BaitGap): Promise<number> {
  await tinMoi(c);
  await mod.refreshBaitGap(c);
  const rows = (await c.query(dealsSql(), [0, 500])).rows;
  const coSdt = rows.filter((r) => r.seller_phone != null);
  const thieu = coSdt.filter((r) => r.broker_n_ads == null).map((r) => r.offer_id);
  assert.deepEqual(thieu, [], `SD-AC-6 tin có SĐT thiếu số tin người bán: ${thieu.join(", ")}`);
  return coSdt.length;
}

test("SD-AC-6 chip Căn giá tốt có số tin người bán", { timeout: 180_000 }, async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có tin thật và thước phường — CI chỉ có lược đồ");
  const that = (await import(pathToFileURL(join(PIPE, "refresh-bait-gap.mjs")).href)) as BaitGap;
  const n = await withTx((c) => kiemAc6(c, that));
  assert.ok(n > 0, "SD-AC-6 không tin Căn giá tốt nào có SĐT — probe không đo được");
  const sai = await banBoThemDong();
  await withTx((c) => assert.rejects(kiemAc6(c, sai), /SD-AC-6 tin có SĐT thiếu số tin người bán/));
});
