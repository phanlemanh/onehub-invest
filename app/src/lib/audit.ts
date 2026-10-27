import type { PoolClient } from "pg";
import { pool } from "./db";

const moiTruong = () => (process.env.VERCEL === "1" ? "cloud" : "local");

/**
 * Chạy `fn` trong một transaction trên một client của pool: BEGIN → fn → COMMIT; fn ném lỗi → ROLLBACK rồi ném lại.
 * Mọi thao tác ghi Ops đi qua đây cùng dòng audit của nó (TV1).
 */
export async function trongGiaoDich<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const kq = await fn(c);
    await c.query("COMMIT");
    return kq;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

/**
 * Ghi đúng một dòng ops_audit bằng client của transaction đang mở (TV1): lỗi ghi audit làm hỏng cả thao tác.
 * Actor là MÃ (`user:<id>` / `machine:<tên>`) — không bao giờ tên nguồn tầng A. env: local (máy thu) | cloud (Vercel).
 */
export async function ghiAuditTrong(
  c: PoolClient,
  actor: string,
  action: string,
  detail: Record<string, unknown> = {},
): Promise<void> {
  await c.query(`INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, $2, $3, $4::jsonb)`, [
    actor,
    action,
    moiTruong(),
    JSON.stringify(detail),
  ]);
}

/**
 * Audit ghi nền, ngoài transaction (cách cũ). Không route nào gọi nữa từ TV1 — còn export cho bản route trước sửa ghim
 * làm fixture đối chứng (app/tests/fixtures/ops-routes-truoc-tv1/).
 */
export function auditOpsWrite(actor: string, action: string, detail: Record<string, unknown> = {}): void {
  pool
    .query(`INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, $2, $3, $4::jsonb)`, [
      actor,
      action,
      moiTruong(),
      JSON.stringify(detail),
    ])
    .catch((e) => console.error("audit write failed:", e instanceof Error ? e.message : e));
}
