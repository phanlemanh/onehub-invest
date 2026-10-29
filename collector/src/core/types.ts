/** Hợp đồng plugin collector + raw snapshot/manifest — xem docs/DATA-CONTRACT.md. */

export type CityRef = {
  id: string; // "hanoi"
  name: string; // "Hà Nội"
  country: string; // "vn"
  center: [number, number]; // [lng, lat]
  radiusKm?: number;
};

/** Một bản ghi thô — payload NGUYÊN VẬN, chưa chuẩn hoá gì ngoài định danh. */
export type RawItem = {
  source: string;
  sourceId: string;
  kind: string; // "listing" | "calendar" | "search-page" | ...
  fetchedAt: string; // ISO
  payload: unknown;
  meta?: Record<string, unknown>;
};

/** Đo độ tin cậy coverage — chỉ số cốt lõi của collector (ADR-0003). */
export type CoverageReport = {
  discovered: number; // tổng phát hiện qua mọi phương pháp
  captured: number; // số item ghi được
  failed: number; // fetch lỗi
  /** Số lượng theo từng phương pháp discovery (vd mapTiles, searchPaging). */
  methods: Record<string, number>;
  /** Độ giao nhau giữa các phương pháp — ước lượng độ "thấy hết". */
  overlap?: { methodA: string; methodB: string; both: number; onlyA: number; onlyB: number };
  notes?: string[];
};

export type ManifestFile = {
  name: string; // "items-0001.json.gz"
  sha256: string; // hash file bytes
  bytes: number;
};

export type SnapshotManifest = {
  schemaVersion: 4;
  snapshotId: string; // "<city>__<source>__<yyyymmdd-hhmmss>"
  city: string;
  source: string;
  startedAt: string;
  finishedAt: string;
  counts: { items: number; failed: number };
  coverage: CoverageReport;
  files: ManifestFile[];
  error?: string;
};

export type CollectContext = {
  city: CityRef;
  checkpoint: CheckpointLike;
  rateLimit: RateLimitLike;
  log: (...args: unknown[]) => void;
  /** Đường dẫn hệ thống để collector đọc snapshot trước đó / ghi state. */
  paths: { snapshotRoot: string; stateDir: string };
};

/** Collector plugin — thêm nguồn mới = thêm file trong collectors/, không sửa core. */
export type Collector = {
  id: string;
  description: string;
  /** Tốc độ mặc định (request/giây) — tôn trọng nguồn, tránh bị chặn. */
  requestsPerSecond: number;
  collect(ctx: CollectContext): Promise<{ items: RawItem[]; coverage: CoverageReport }>;
};

/** Trạng thái resume giữa các lần chạy (cursor phân trang, ngày chạy cuối...). */
export interface CheckpointLike {
  get<T>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  save(): Promise<void>;
}

export interface RateLimitLike {
  take(n?: number): Promise<void>;
}
