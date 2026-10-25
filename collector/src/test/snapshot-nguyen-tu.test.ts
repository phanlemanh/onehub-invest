import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { test } from "node:test";
import { SnapshotWriter } from "../core/storage.js";
import type { CoverageReport, RawItem, SnapshotManifest } from "../core/types.js";

/**
 * 2510-8 (claudedp): snapshot NGUYÊN TỬ — trong suốt lúc ghi (items + tải
 * media có thể kéo dài) chỉ tồn tại thư mục tạm '.<id>.partial'; finalize
 * ghi manifest XONG rồi rename ra tên thật. Điều kiện nghiệm thu:
 * importer/daily không bao giờ thấy thư mục tên thật thiếu manifest.
 */
test("2510-8: đang ghi chỉ có '.partial'; finalize rename ra tên thật trọn vẹn (items + media + manifest)", async () => {
  const root = mkdtempSync(join(tmpdir(), "snap-nguyen-tu-"));
  try {
    const writer = new SnapshotWriter(root, "hanoi", "zalo-agent");
    const cityDir = join(root, "hanoi");
    const real = join(cityDir, writer.snapshotId);
    const partial = join(cityDir, `.${writer.snapshotId}.partial`);
    const items: RawItem[] = [
      { source: "zalo-agent", sourceId: "a1", kind: "post", fetchedAt: "2026-10-25T06:00:00Z", payload: { text: "tin 1" } },
      { source: "zalo-agent", sourceId: "a2", kind: "post", fetchedAt: "2026-10-25T06:00:01Z", payload: { text: "tin 2" } },
    ];

    await writer.write(items);
    assert.ok(existsSync(partial), "sau write: có thư mục .partial");
    assert.ok(!existsSync(real), "sau write: CHƯA có thư mục tên thật");

    // 'tải ảnh chậm' — addExtraFile giữa chừng: vẫn vô hình ở tên thật
    const extra = await writer.addExtraFile("media/anh-1.jpg", Buffer.from([1, 2, 3, 4]));
    assert.ok(extra && extra.sha256.length === 64, "addExtraFile khai sha256");
    assert.ok(existsSync(join(partial, "media/anh-1.jpg")), "media nằm trong .partial");
    assert.ok(!existsSync(real), "đang tải media: vẫn CHƯA có thư mục tên thật");

    const coverage: CoverageReport = { discovered: 2, captured: 2, failed: 0, methods: {} };
    const manifest = await writer.finalize(coverage);
    assert.ok(existsSync(join(real, "manifest.json")), "finalize: tên thật có manifest");
    assert.ok(!existsSync(partial), "finalize: .partial biến mất sau rename");
    assert.equal(manifest.snapshotId, writer.snapshotId);

    const m: SnapshotManifest = JSON.parse(readFileSync(join(real, "manifest.json"), "utf8"));
    assert.equal(m.counts.items, 2, "manifest đếm đủ 2 item");
    const itemFile = m.files.find((f) => f.name.startsWith("items-"));
    assert.ok(itemFile, "manifest khai file items");
    const gz = readFileSync(join(real, itemFile.name));
    assert.equal(
      createHash("sha256").update(gz).digest("hex"),
      itemFile.sha256,
      "checksum items khớp sau rename",
    );
    assert.equal(JSON.parse(gunzipSync(gz).toString()).length, 2, "đủ 2 item bên trong sau rename");
    assert.ok(existsSync(join(real, "media/anh-1.jpg")), "media theo qua rename");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
