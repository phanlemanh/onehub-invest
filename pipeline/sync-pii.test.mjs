import { strict as assert } from "node:assert";
import { test } from "node:test";

import pg from "pg";

import { mediaFilesOf } from "./import-airbnb.mjs";
import { FILL } from "./sync-cloud.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
// Cột ảnh PII tầng A — không bảng nào trong FILL được mang
const MEDIA_COLUMNS = ["media", "media_files"];

// ADR-0007: tầng A (stg_*, raw, ảnh media/*) không bao giờ rời máy local.
// sync-cloud đẩy theo danh sách FILL tường minh — gác ở đây để thêm bảng
// nhầm thì test đỏ trước khi leak gate (chạy SAU khi đã đẩy) bắt được.

test("FILL không chứa bảng staging stg_* nào", () => {
  assert.deepEqual(FILL.filter((t) => t.startsWith("stg_")), []);
});

test("FILL không chứa stg_zalo_posts (media, media_files = ảnh PII tầng A)", () => {
  assert.ok(!FILL.includes("stg_zalo_posts"));
});

test("FILL không chứa raw/registry tầng A", () => {
  for (const t of ["airbnb_snapshots", "source_registry"]) assert.ok(!FILL.includes(t), t);
});

test("không bảng nào trong FILL có cột ảnh media/media_files (schema DB local)", async (t) => {
  const client = new pg.Client({ connectionString: DB_URL, connectionTimeoutMillis: 2000 });
  try {
    await client.connect();
  } catch {
    t.skip("DB local không chạy — chỉ kiểm phần tĩnh");
    return;
  }
  try {
    const { rows } = await client.query(
      `SELECT table_name || '.' || column_name AS col FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ANY($1) AND column_name = ANY($2)`,
      [FILL, MEDIA_COLUMNS],
    );
    assert.deepEqual(rows.map((r) => r.col), []);
  } finally {
    await client.end();
  }
});

// N1 (DATA-CONTRACT v2): meta.mediaFiles → stg_zalo_posts.media_files

test("mediaFilesOf: gắn snapshotId vào từng phần tử, giữ nguyên field hợp đồng", () => {
  const it = {
    meta: {
      mediaFiles: [
        { url: "https://a.zdn.vn/1.jpg", file: "media/1a2b3c4d5e6f7a8b.jpg", sha256: "ab", bytes: 10 },
        { url: "https://a.zdn.vn/2.jpg", error: "timeout" },
      ],
    },
  };
  assert.deepEqual(mediaFilesOf(it, "hanoi__zalo-agent__20261023T010203000"), [
    {
      url: "https://a.zdn.vn/1.jpg",
      file: "media/1a2b3c4d5e6f7a8b.jpg",
      sha256: "ab",
      bytes: 10,
      snapshotId: "hanoi__zalo-agent__20261023T010203000",
    },
    { url: "https://a.zdn.vn/2.jpg", error: "timeout", snapshotId: "hanoi__zalo-agent__20261023T010203000" },
  ]);
});

test("mediaFilesOf: v1 / không ảnh / mảng rỗng → null (SQL NULL, COALESCE giữ bản cũ)", () => {
  assert.equal(mediaFilesOf({ payload: {} }, "s"), null);
  assert.equal(mediaFilesOf({ meta: { method: "x" } }, "s"), null);
  assert.equal(mediaFilesOf({ meta: { mediaFiles: [] } }, "s"), null);
  assert.equal(mediaFilesOf(undefined, "s"), null);
});
