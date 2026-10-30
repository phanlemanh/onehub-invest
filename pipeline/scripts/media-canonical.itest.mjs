// media-canonical.itest.mjs — NH1 `media-canonical-reso` (NH-AC-n ↔ _acceptance/media-canonical-reso/evals.yaml E1, E3, E5).
// Cần DB có sale_offer_records + bảng nạp thật; mỗi ca BEGIN … ROLLBACK. Chạy trên DB thử riêng (DATABASE_URL, mặc định
// executor là oneinvest_p2_media), không trên DB `oneinvest` dùng chung khi 053 chưa áp (luật đo của đợt dot0-cam-mau).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { chotDbThu } from "../media-rows.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SQL_053 = readFileSync(path.join(ROOT, "db/migrations/053_media.sql"), "utf8");
const COT_053 = [
  "media_key",
  "resource_record_key",
  "originating_system_name",
  "originating_system_resource_record_key",
  "media_url",
  "media_order",
  "local_file",
  "media_modification_timestamp",
];
const SNAP = "hcmc__zalo-agent__2026-10-23T000000";

let c;
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — trỏ vào DB thử riêng (bash db/db-thu.sh oneinvest_p2_media)");
  c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const { rows: [r] } = await c.query("SELECT current_database() AS db, to_regclass('public.media')::text AS m");
  const loi = chotDbThu(r.db, Boolean(r.m));
  if (loi) throw new Error(loi);
});
after(async () => {
  await c?.end();
});

/** Chạy fn trong một giao dịch luôn ROLLBACK, với 053 đã nạp (idempotent). */
export async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try {
    await c.query(SQL_053);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK");
  }
}

/** Tên ràng buộc chặn lệnh, hoặc null khi lệnh vào được. Mỗi lệnh một SAVEPOINT. */
async function rangBuocChan(sql, values) {
  await c.query("SAVEPOINT ca");
  try {
    await c.query(sql, values);
    await c.query("RELEASE SAVEPOINT ca");
    return null;
  } catch (e) {
    await c.query("ROLLBACK TO SAVEPOINT ca");
    return e.constraint ?? e.message;
  }
}

test("NH-AC-1 chốt DB: không chạy trên oneinvest dùng chung khi chưa có bảng media", () => {
  assert.match(chotDbThu("oneinvest", false) ?? "", /DATABASE_URL trỏ DB oneinvest dùng chung/);
  assert.equal(chotDbThu("oneinvest", true), null, "sau gộp (053 đã áp) oneinvest được phép");
  assert.equal(chotDbThu("oneinvest_p2_media", false), null);
});

test("NH-AC-1 053 chạy hai lần", async () => {
  await trongGiaoDich(async (db) => {
    await db.query(SQL_053); // lần hai (trongGiaoDich đã nạp lần một)
    const { rows } = await db.query(
      `SELECT column_name AS c FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'media' ORDER BY ordinal_position`,
    );
    assert.deepEqual(rows.map((r) => r.c), COT_053);
  });
});

test("NH-AC-1 ràng buộc", async () => {
  await trongGiaoDich(async (db) => {
    const { rows: [o] } = await db.query("SELECT offer_id FROM sale_offer_records LIMIT 1");
    assert.ok(o, "DB thử không có tin nào — đo trên DB rỗng không chứng gì");
    const ins = `INSERT INTO media (media_key, resource_record_key, originating_system_name,
        originating_system_resource_record_key, media_url, media_order, local_file)
      VALUES ($1, $2, 'S03', 'p1', $3, $4, $5)`;
    const ca = [
      ["k1", o.offer_id, "javascript:x", 0, null, "media_url_http"],
      ["k2", o.offer_id, null, 0, null, "media_has_source"],
      ["k3", o.offer_id, null, 0, "a/../media/x.jpg", "media_local_file_shape"],
      ["k4", o.offer_id, null, 0, "snap/x.jpg", "media_local_file_shape"],
      ["k5", o.offer_id, "https://img.example.test/1.jpg", -1, null, "media_order_nonneg"],
      ["k6", "khong-co-tin-nay", "https://img.example.test/1.jpg", 0, null, "media_offer_fk"],
    ];
    for (const [key, offer, url, order, file, mong] of ca) {
      assert.equal(await rangBuocChan(ins, [key, offer, url, order, file]), mong, `${key} phải bị ${mong} chặn`);
    }
    // Đối chứng dương: dòng hợp lệ (snapshotId có ':' và '.', khuôn route cho phép) vào được.
    assert.equal(
      await rangBuocChan(ins, ["ok", o.offer_id, "https://img.example.test/1.jpg", 0, `${SNAP}/media/1.jpg`]),
      null,
      "dòng hợp lệ phải vào được",
    );
    assert.equal(
      await rangBuocChan(ins, ["ok2", o.offer_id, null, 1, "hanoi__zalo-agent__2026-10-22T07:06.51/media/a.b.jpg"]),
      null,
      "snapshotId có ':' và '.' phải vào được",
    );
  });
});
