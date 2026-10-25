import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { CoverageReport, ManifestFile, RawItem, SnapshotManifest } from "./types.js";

const BATCH = 1000;

/** schemaVersion snapshot — v3 (2026-10-23): thêm RawItem.meta.kev (Kev-nhãn);
 *  v2 (2026-10-22): thêm file `media/*` + RawItem.meta.mediaFiles. */
export const SNAPSHOT_SCHEMA_VERSION = 3;

/**
 * Ghi raw snapshots bất biến: snapshots/<city>/<snapshotId>/items-NNNN.json.gz
 * + manifest.json. Payload giữ nguyên vẹn; ghi xong không bao giờ sửa.
 */
export class SnapshotWriter {
  readonly snapshotId: string;
  private readonly dir: string;
  private readonly partial: string;
  private readonly files: ManifestFile[] = [];
  private itemCount = 0;
  private itemFileCount = 0;
  private readonly startedAt = new Date().toISOString();

  constructor(rootDir: string, city: string, source: string) {
    // Giữ cả mili-giây: hai flush liên tiếp (single-flight dồn sát nhau) cùng
    // giây phải ra hai snapshot khác nhau — id theo giây sẽ đè nhau.
    const ts = new Date().toISOString().replace(/[:.]/g, "").slice(0, 20); // yyyymmddThhmmssmmm
    let sid = `${city}__${source}__${ts}`;
    let n = 1;
    // Bảo hiểm cuối: dir đã có (đâm trùng ms) thì tăng hậu tố — snapshot ghi
    // mới, không bao giờ ghi đè.
    while (existsSync(join(rootDir, city, sid))) sid = `${city}__${source}__${ts}-${n++}`;
    this.snapshotId = sid;
    this.dir = join(rootDir, city, this.snapshotId);
    // 2510-8 (nguyên tử): ghi hết vào thư mục tạm CÙNG CHA '."<id>.partial'
    // rồi rename ra tên thật ở finalize — thư mục mang tên thật LUÔN có
    // manifest; importer/daily không bao giờ thấy snapshot nửa vời (đang
    // tải media có thể kéo dài giữa write và finalize). Thư mục chấm bị
    // daily script bỏ qua; crash giữa chừng để lại '.partial' là vô hình.
    this.partial = join(rootDir, city, `.${this.snapshotId}.partial`);
  }

  async write(items: RawItem[]): Promise<void> {
    await mkdir(this.partial, { recursive: true });
    for (let i = 0; i < items.length; i += BATCH) {
      const batch = items.slice(i, i + BATCH);
      // Đánh số items bằng đếm riêng: file media (addExtraFile) có vào trước
      // cũng không làm lệch tên items-0001 (DATA-CONTRACT).
      const name = `items-${String(++this.itemFileCount).padStart(4, "0")}.json.gz`;
      const gz = gzipSync(JSON.stringify(batch));
      await writeFile(join(this.partial, name), gz);
      this.files.push({
        name,
        sha256: createHash("sha256").update(gz).digest("hex"),
        bytes: gz.length,
      });
      this.itemCount += batch.length;
    }
  }

  /**
   * Ghi file phụ (media tải từ URL) vào snapshot + khai sha256 trong manifest.
   * Trả null khi tên đã ghi — caller tái dùng (dedup URL trong 1 flush).
   */
  async addExtraFile(name: string, bytes: Buffer): Promise<{ sha256: string; bytes: number } | null> {
    if (this.files.some((f) => f.name === name)) return null;
    const target = join(this.partial, name);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    this.files.push({ name, sha256, bytes: bytes.length });
    return { sha256, bytes: bytes.length };
  }

  async finalize(coverage: CoverageReport, error?: string): Promise<SnapshotManifest> {
    const manifest: SnapshotManifest = {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      snapshotId: this.snapshotId,
      city: dirname(this.dir).split("/").pop() ?? "",
      source: this.snapshotId.split("__")[1] ?? "",
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      counts: { items: this.itemCount, failed: coverage.failed },
      coverage,
      files: this.files,
      ...(error ? { error } : {}),
    };
    await mkdir(this.partial, { recursive: true });
    await writeFile(join(this.partial, "manifest.json"), JSON.stringify(manifest, null, 2));
    // 2510-8: manifest là file CUỐI — ghi xong mới rename tạm → tên thật
    // (cùng filesystem vì cùng cha). Từ đây thư mục tên thật luôn trọn vẹn.
    await rename(this.partial, this.dir);
    return manifest;
  }
}
