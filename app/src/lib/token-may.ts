import { createHash } from "node:crypto";

import { pool } from "./db";

/**
 * Token máy theo tên (TV4 `so-lenh-bo-ap`, ADR-0015 §2) — máy thu xưng danh khi kéo lệnh và gửi kết quả. DB chỉ giữ băm
 * sha256 hex (`machine_tokens.token_hash`); thu hồi bằng `revoked_at`. Khác hẳn bearer chung `OPS_API_TOKEN`: bearer
 * chung không khớp băm nào nên bị từ chối ở mọi cửa dùng hàm này.
 */
export const bamToken = (token: string): string => createHash("sha256").update(token).digest("hex");

const DANG = /^Bearer ([A-Za-z0-9_-]{16,200})$/;

/**
 * Kiểm token máy trên header `authorization` (đúng dạng `Bearer <token>`, một khoảng trắng). Token còn hiệu lực mà thiếu
 * `scope`, hay bearer chung `OPS_API_TOKEN` → 403; không header, sai dạng, token lạ hay đã thu hồi → 401. Qua thì ghi `last_used_at` (mốc máy thu liên lạc
 * lần cuối) và trả tên token.
 */
export async function kiemTokenMay(
  req: Request,
  scope: string,
): Promise<{ ok: true; ten: string } | { ok: false; res: Response }> {
  const m = DANG.exec(req.headers.get("authorization") ?? "");
  if (!m) return { ok: false, res: Response.json({ error: "unauthorized" }, { status: 401 }) };
  // Bearer chung của máy (OPS_API_TOKEN): đã xưng danh nhưng không được làm việc của token máy → 403 (như kiemQuyen).
  const chung = process.env.OPS_API_TOKEN;
  if (chung && m[1] === chung) return { ok: false, res: Response.json({ error: "forbidden" }, { status: 403 }) };
  const { rows } = await pool.query<{ name: string; scopes: string[] }>(
    `SELECT name, scopes FROM machine_tokens WHERE token_hash = $1 AND revoked_at IS NULL`,
    [bamToken(m[1])],
  );
  const t = rows[0];
  if (!t) return { ok: false, res: Response.json({ error: "unauthorized" }, { status: 401 }) };
  if (!t.scopes.includes(scope)) return { ok: false, res: Response.json({ error: "forbidden" }, { status: 403 }) };
  await pool.query(`UPDATE machine_tokens SET last_used_at = now() WHERE name = $1`, [t.name]);
  return { ok: true, ten: t.name };
}
