import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
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
    // Bảo hiểm cuối (đâm trùng ms) tăng hậu tố — và từ 2510-8 vòng 2 chiếm '."<sid>.partial' NGUYÊN TỮ ngay trong
    // constructor (mkdirSync thường — EEXIST = writer khác cùng mili-giây đã
    // chiếm). Chốt cũ chỉ nhìn TÊN THẬT, mà từ vòng 1 tên thật chỉ xuất hiện
    // ở finalize → hai writer cùng ms lấy chung một '.partial' (items ghi đè
    // nhau mất tin) rồi rename thứ hai ENOTEMPTY.
    let sid = `${city}__${source}__${ts}`;
    let n = 1;
    for (;;) {
      try {
        mkdirSync(join(rootDir, city, `.${sid}.partial`));
        break;
      } catch (e) {
        const err = e as NodeJS.ErrnoException;
        if (err?.code === "EEXIST") {
          sid = `${city}__${source}__${ts}-${n++}`;
          continue;
        }
        if (err?.code === "ENOENT") {
          // thư mục city chưa có — tạo rồi THỬ LẠI cùng sid
          mkdirSync(join(rootDir, city), { recursive: true });
          continue;
        }
        throw e;
      }
    }
    this.snapshotId = sid;
    this.dir = join(rootDir, city, this.snapshotId);
    // (2510-8 vòng 1) ghi hết vào '.partial' rồi rename ra tên thật ở
    // finalize — thư mục mang tên thật LUÔN có manifest.
    this.partial = join(rootDir, city, `.${this.snapshotId}.partial`);
  }

  async write(items: RawItem[]): Promise<void> {
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
    await writeFile(join(this.partial, "manifest.json"), JSON.stringify(manifest, null, 2));
    // 2510-8: manifest là file CUỐI — ghi xong mới rename tạm → tên thật
    // (cùng filesystem vì cùng cha). Từ đây thư mục tên thật luôn trọn vẹn.
    await rename(this.partial, this.dir);
    return manifest;
  }
}
