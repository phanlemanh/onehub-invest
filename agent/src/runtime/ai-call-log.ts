// ai-call-log.ts — PL29 `so-cuoc-goi-ai`: ghi một dòng sổ cuộc gọi AI (bảng ai_calls, migration 052) cho mỗi lượt
// runAgent. Chỉ số và tên: việc, model, token vào/ra, độ trễ, ok/lỗi. `loi` là TÊN LỚP lỗi — không bao giờ chép message,
// prompt hay đầu ra (lỗi API của nhà cung cấp mang cả responseBody). Gọi từ loop.ts, fail-soft ở phía người gọi.
import pg from "pg";

export type AiCallRecord = {
  viec: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  ok: boolean;
  loi: string | null;
  trace: string | null;
  khach?: "pipeline" | "tro-ly";
};

export type RecordCall = (r: AiCallRecord) => Promise<void>;

/** Tên lớp của lỗi (≤ 80 ký tự) — thứ duy nhất của lỗi được vào sổ. */
export function tenLop(err: unknown): string {
  const ten =
    err instanceof Error
      ? err.name && err.name !== "Error"
        ? err.name
        : err.constructor?.name || "Error"
      : typeof err;
  return ten.slice(0, 80);
}

/** Số token nguyên không âm, hoặc null khi nhà cung cấp không báo. */
export function soToken(x: unknown): number | null {
  return typeof x === "number" && Number.isFinite(x) && x >= 0 ? Math.round(x) : null;
}

/** Writer mặc định: một kết nối ngắn tới DATABASE_URL (đọc lúc gọi, để test trỏ được DB thử / lược đồ tạm). */
export const recordCallDb: RecordCall = async (r) => {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
  });
  await c.connect();
  try {
    await c.query(
      `INSERT INTO ai_calls (khach, viec, model, input_tokens, output_tokens, latency_ms, ok, loi, trace)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [r.khach ?? "pipeline", r.viec, r.model, r.inputTokens, r.outputTokens, Math.max(0, Math.round(r.latencyMs)), r.ok, r.loi, r.trace],
    );
  } finally {
    await c.end();
  }
};
