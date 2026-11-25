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
 * Mốc mở rộng (claudedp-2411-73, 25/11): thêm kind `anh_du_an` và tệp nhị phân `media/*` trong snapshot của S17
 * (quy ước chung của DATA-CONTRACT: file media + RawItem.meta.mediaFiles).
 */
export const S17_SCHEMA_VERSION_MO_RONG = 18;
/**
 * Dấu hiệu trong `coverage.notes` của MỌI snapshot S17 ghi từ khuôn 2 (sourceId trung tính). Snapshot S17
 * không mang dấu hiệu này là bản ghi lúc dựng bộ thu sáng 24/11 (sourceId cũ) — bên đọc bỏ qua.
 */
export const S17_NOTES = "S17 khuôn 2 (mốc ngày 1, claudedp-2411-20)";

export class BatchWriter {
  readonly snapshotIds: string[] = [];
  private buffer: RawItem[] = [];
  private tep: Array<{ name: string; bytes: Buffer }> = [];

  /** Số item đã lấy nhưng chưa chốt thành snapshot — còn > 0 thì chưa được coi là đã lưu. */
  get pendingCount(): number {
    return this.buffer.length;
  }

  /** Ngưỡng số tệp một snapshot (pha ảnh chia lô theo đúng con số này). */
  get maxFiles(): number | undefined {
    return this.o.maxFiles;
  }

  /** Số tệp nhị phân (ảnh gốc) đang chờ chốt cùng lô. */
  get pendingFiles(): number {
    return this.tep.length;
  }

  constructor(
    private readonly o: {
      root: string;
      maxItems: number;
      phase: string;
      /** Mặc định 17; pha của mốc mở rộng ghi 18. */
      schemaVersion?: number;
      /** Đủ bấy nhiêu tệp nhị phân thì chốt ngay (ảnh không nằm lâu trong bộ nhớ). */
      maxFiles?: number;
    },
  ) {}

  /** Thêm một item; đủ lô thì chốt thành một snapshot ngay. */
  async add(item: RawItem): Promise<void> {
    this.buffer.push(item);
    if (this.buffer.length >= this.o.maxItems) await this.flush();
  }

  /**
   * Thêm MỘT item cùng các tệp nhị phân của nó (ảnh gốc) — luôn chốt cùng lô, không bao giờ tách đôi: item mang bảng
   * đối chiếu `meta.mediaFiles`, tệp nằm trong thư mục snapshot dưới `media/`. Đủ số tệp thì chốt ngay.
   */
  async addWithFiles(item: RawItem, files: Array<{ name: string; bytes: Buffer }>): Promise<void> {
    this.buffer.push(item);
    this.tep.push(...files);
    if (this.o.maxFiles !== undefined && this.tep.length >= this.o.maxFiles) await this.flush();
    else if (this.buffer.length >= this.o.maxItems) await this.flush();
  }

  /** Chốt phần còn lại. Có `reason` (lý do dừng) thì ghi vào manifest.error. Không có gì → null. */
  async flush(reason?: string): Promise<string | null> {
    if (!this.buffer.length && !this.tep.length) return null;
    const items = this.buffer;
    const tep = this.tep;
    this.buffer = [];
    this.tep = [];
    const methods: Record<string, number> = {};
    for (const it of items) methods[it.kind] = (methods[it.kind] ?? 0) + 1;
    const coverage: CoverageReport = { discovered: items.length, captured: items.length, failed: 0, methods, notes: [S17_NOTES] };
    const writer = new SnapshotWriter(this.o.root, S17_CITY, S17_SOURCE, { schemaVersion: this.o.schemaVersion ?? S17_SCHEMA_VERSION });
    for (const f of tep) await writer.addExtraFile(f.name, f.bytes);
    await writer.write(items);
    const manifest = await writer.finalize(coverage, reason);
    this.snapshotIds.push(manifest.snapshotId);
    return manifest.snapshotId;
  }
}
