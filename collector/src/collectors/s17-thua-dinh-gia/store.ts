/**
 * Ghi snapshot thô của S17 theo LÔ NHỎ: gãy giữa lượt (bị chặn, hết phiên, quá trần) chỉ mất lô đang
 * dở, phần đã lấy đã nằm trong thư mục snapshot hoàn chỉnh (khuôn S07). Mỗi lô một snapshot với
 * schemaVersion 17; payload nguyên văn, không sửa ở đây.
 */
import { SnapshotWriter } from "../../core/storage.js";
import type { CoverageReport, RawItem } from "../../core/types.js";

export const S17_SOURCE = "s17-thua-dinh-gia";
export const S17_CITY = "vn";
/** Số phiên bản hợp đồng dữ liệu của S17 — LL cấp 24/11 (DATA-CONTRACT, phần S17). */
export const S17_SCHEMA_VERSION = 17;
/**
 * Dấu hiệu trong `coverage.notes` của MỌI snapshot S17 ghi từ khuôn 2 (sourceId trung tính). Snapshot S17
 * không mang dấu hiệu này là bản ghi lúc dựng bộ thu sáng 24/11 (sourceId cũ) — bên đọc bỏ qua.
 */
export const S17_NOTES = "S17 khuôn 2 (mốc ngày 1, claudedp-2411-20)";

export class BatchWriter {
  readonly snapshotIds: string[] = [];
  private buffer: RawItem[] = [];

  constructor(
    private readonly o: {
      root: string;
      maxItems: number;
      phase: string;
    },
  ) {}

  /** Thêm một item; đủ lô thì chốt thành một snapshot ngay. */
  async add(item: RawItem): Promise<void> {
    this.buffer.push(item);
    if (this.buffer.length >= this.o.maxItems) await this.flush();
  }

  /** Chốt phần còn lại. Có `reason` (lý do dừng) thì ghi vào manifest.error. Không có gì → null. */
  async flush(reason?: string): Promise<string | null> {
    if (!this.buffer.length) return null;
    const items = this.buffer;
    this.buffer = [];
    const methods: Record<string, number> = {};
    for (const it of items) methods[it.kind] = (methods[it.kind] ?? 0) + 1;
    const coverage: CoverageReport = { discovered: items.length, captured: items.length, failed: 0, methods, notes: [S17_NOTES] };
    const writer = new SnapshotWriter(this.o.root, S17_CITY, S17_SOURCE, { schemaVersion: S17_SCHEMA_VERSION });
    await writer.write(items);
    const manifest = await writer.finalize(coverage, reason);
    this.snapshotIds.push(manifest.snapshotId);
    return manifest.snapshotId;
  }
}
