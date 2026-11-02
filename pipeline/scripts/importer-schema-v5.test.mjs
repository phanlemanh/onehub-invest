import test from "node:test"; import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SUPPORTED_SCHEMA_VERSIONS as AIRBNB_V } from "../import-airbnb.mjs";
import { SUPPORTED_SCHEMA_VERSIONS as CHOTOT_V, readSnapshot } from "../import-chotot.mjs";

// claudedp-0211-1 (hợp đồng người bán): DATA-CONTRACT v5 thêm RawItem.seller
// (tùy chọn) — không đổi hình dạng cũ. CẢ HAI importer phải chấp nhận v4 LẪN v5
// trước khi bất kỳ kênh nào bắt đầu ghi seller; hai mảng phải đồng bộ với nhau
// và với dòng «bên import phải chấp nhận» trong DATA-CONTRACT.md.
test("schemaVersion: cả hai importer chấp nhận {1..5} — v4 và v5 cùng lúc", () => {
  assert.deepEqual(AIRBNB_V, [1, 2, 3, 4, 5]);
  assert.deepEqual(CHOTOT_V, [1, 2, 3, 4, 5], "hai importer không được lệch nhau");
  assert.ok(AIRBNB_V.includes(4), "v4 vẫn phải nạp — kênh chưa ghi seller giữ version cũ");
  assert.ok(AIRBNB_V.includes(5) && CHOTOT_V.includes(5), "v5 phải nạp ngay từ vòng này");
});

// Đọc snapshot v5 THẬT từ dir tạm (verify sha256 + gunzip + lọc nguồn) — không
// đụng DB: chứng minh đường đọc của importer nhận item có seller mà không cần
// cột stg mới (migration phía Claude làm sau theo ranh giới 0211-1).
test("readSnapshot: manifest v5 + item có seller đọc qua (giữ seller trong payload)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ct-v5-"));
  try {
    const items = [{
      source: "chotot-ads", sourceId: "999888777", kind: "listing",
      fetchedAt: "2026-11-02T08:00:00Z",
      payload: { list_id: 999888777, full_name: "Môi giới A" },
      seller: {
        accountRef: "S06:999888777", displayName: "Môi giới A", phone: "+849012345678",
        phoneStatus: "available", seenAt: "2026-11-02T08:00:00Z",
      },
    }];
    const gz = gzipSync(Buffer.from(JSON.stringify(items)));
    const sha = createHash("sha256").update(gz).digest("hex");
    writeFileSync(join(dir, "items-0001.json.gz"), gz);
    writeFileSync(join(dir, "manifest.json"), JSON.stringify({
      schemaVersion: 5, snapshotId: "hanoi__chotot-ads__20261102T080000000",
      city: "hanoi", source: "chotot-ads",
      startedAt: "2026-11-02T08:00:00Z", finishedAt: "2026-11-02T08:05:00Z",
      counts: { items: 1, failed: 0 },
      files: [{ name: "items-0001.json.gz", sha256: sha, bytes: gz.length }],
    }));
    const { manifest, items: doc } = await readSnapshot(dir);
    assert.equal(manifest.schemaVersion, 5);
    assert.equal(doc.length, 1);
    assert.equal(doc[0].seller.phone, "+849012345678", "seller đi nguyên vẹn qua đường nạp");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readSnapshot: v6 chưa khai vẫn bị từ chối rõ ràng", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ct-v6-"));
  try {
    writeFileSync(join(dir, "manifest.json"), JSON.stringify({ schemaVersion: 6, source: "chotot-ads" }));
    await assert.rejects(() => readSnapshot(dir), /schemaVersion 6 chưa hỗ trợ/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
