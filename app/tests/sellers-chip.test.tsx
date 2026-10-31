// sellers-chip.test.tsx — sellers-them-dong-lai (SD1) AC-6: sau bước đêm (bait gap + dựng danh bạ), mọi tin Căn giá tốt có
// SĐT người bán có số tin của người bán (chip môi giới). dealsSql THẬT của app trên DB máy thu, trong BEGIN…ROLLBACK — không
// để lại dòng nào. Từ SD3 (060) `sellers` là view trên bí danh `sdt` + tin: nạp 060 trong giao dịch khi DB chưa áp.
// Chiều đỏ: bản chép 060 nối view theo khoá băm đời trước (bí danh sdt_bam) — SĐT mới mất dòng người bán.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

import { dealsSql } from "../src/lib/deals";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const PIPE = join(import.meta.dirname, "../../pipeline");

type BuocDem = { buocDem: (c: pg.Client, o: { savepoint?: boolean; runId?: string }) => Promise<unknown> };
type Nap060 = { MIG_060: string; napSdtE164: (c: pg.Client, sql?: string) => Promise<boolean> };

async function withTx<T>(sql060: string | undefined, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const nap = (await import(pathToFileURL(join(PIPE, "lib/nap-060.mjs")).href)) as Nap060;
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await nap.napSdtE164(c, sql060 ?? nap.MIG_060);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/** Bản đột biến của 060: view nối bí danh theo khoá băm như đời trước, không theo số gốc. */
async function banNoiKhoaBam(): Promise<string> {
  const { MIG_060 } = (await import(pathToFileURL(join(PIPE, "lib/nap-060.mjs")).href)) as Nap060;
  const ma = MIG_060.replace("JOIN sdt ON sdt.value = so.seller_phone", "JOIN sdt ON sdt.value = so.h")
    .replace("CREATE OR REPLACE VIEW sellers", "DROP VIEW IF EXISTS sellers; CREATE VIEW sellers");
  assert.notEqual(ma, MIG_060, "đột biến không đổi mã — chiều đỏ rỗng");
  return ma;
}

/** Một tin Căn giá tốt mang SĐT mới (chưa có người), ở phường có thước — bảo đảm chiều đỏ không rỗng trên mọi dữ liệu. */
async function tinMoi(c: pg.Client): Promise<string> {
  const r = (await c.query(`SELECT area_id, m FROM v_ruler_p2_area ORDER BY area_id LIMIT 1`)).rows[0];
  assert.ok(r, "SD-AC-6 không phường nào có thước (v_ruler_p2_area rỗng) — ca không chạy được");
  const id = `t_sd1_chip_${process.pid}`;
  const so = `+8490${String(process.pid % 1e7).padStart(7, "0")}`;
  await c.query(
    `INSERT INTO sale_offer_records (offer_id, originating_system_key, source, kind, confidence, first_seen, last_seen, post_ids,
       price_tier, property_type, area_id, area_m2, bedrooms, price_vnd, price_perm2, n_reposts, seller_phone, seller_phone_hash)
     VALUES ($1, $1, 'S03', 'sale', 'high', now(), now(), '{}', 'P1', 'unknown', $2, 80, 2, 4000000000, $3::numeric, 1, $4, $5)`,
    [id, r.area_id, Math.round(Number(r.m) * 0.8), so, createHash("sha256").update(so).digest("hex").slice(0, 32)],
  );
  return id;
}

async function kiemAc6(c: pg.Client, mod: BuocDem): Promise<number> {
  await tinMoi(c);
  await mod.buocDem(c, { savepoint: true, runId: "sellers-chip" });
  const rows = (await c.query(dealsSql(), [0, 500])).rows;
  const coSdt = rows.filter((r) => r.seller_phone != null);
  const thieu = coSdt.filter((r) => r.broker_n_ads == null).map((r) => r.offer_id);
  assert.deepEqual(thieu, [], `SD-AC-6 tin có SĐT thiếu số tin người bán: ${thieu.join(", ")}`);
  return coSdt.length;
}

test("SD-AC-6 chip Căn giá tốt có số tin người bán", { timeout: 180_000 }, async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có tin thật và thước phường — CI chỉ có lược đồ");
  const that = (await import(pathToFileURL(join(PIPE, "refresh-bait-gap.mjs")).href)) as BuocDem;
  const n = await withTx(undefined, (c) => kiemAc6(c, that));
  assert.ok(n > 0, "SD-AC-6 không tin Căn giá tốt nào có SĐT — probe không đo được");
  const sai = await banNoiKhoaBam();
  await withTx(sai, (c) => assert.rejects(kiemAc6(c, that), /SD-AC-6 tin có SĐT thiếu số tin người bán/));
});
