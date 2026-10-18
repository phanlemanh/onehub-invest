import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { CoverageReport, ManifestFile, RawItem, SnapshotManifest } from "./types.js";

const BATCH = 1000;

/**
 * Ghi raw snapshots bất biến: snapshots/<city>/<snapshotId>/items-NNNN.json.gz
 * + manifest.json. Payload giữ nguyên vẹn; ghi xong không bao giờ sửa.
 */
export class SnapshotWriter {
  readonly snapshotId: string;
  private readonly dir: string;
  private readonly files: ManifestFile[] = [];
  private itemCount = 0;
  private readonly startedAt = new Date().toISOString();

  constructor(rootDir: string, city: string, source: string) {
    const ts = new Date().toISOString().replace(/[:.]/g, "").slice(0, 17); // yyyymmddThhmmss
    this.snapshotId = `${city}__${source}__${ts}`;
    this.dir = join(rootDir, city, this.snapshotId);
  }

  async write(items: RawItem[]): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    for (let i = 0; i < items.length; i += BATCH) {
      const batch = items.slice(i, i + BATCH);
      const name = `items-${String(this.files.length + 1).padStart(4, "0")}.json.gz`;
      const gz = gzipSync(JSON.stringify(batch));
      await writeFile(join(this.dir, name), gz);
      this.files.push({
        name,
        sha256: createHash("sha256").update(gz).digest("hex"),
        bytes: gz.length,
      });
      this.itemCount += batch.length;
    }
  }

  async finalize(coverage: CoverageReport, error?: string): Promise<SnapshotManifest> {
    const manifest: SnapshotManifest = {
      schemaVersion: 1,
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
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, "manifest.json"), JSON.stringify(manifest, null, 2));
    return manifest;
  }
}
