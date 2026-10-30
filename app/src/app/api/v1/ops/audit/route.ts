import { NextResponse } from "next/server";

import { kiemQuyen } from "@/lib/ops-access";
import { pool } from "@/lib/db";
import { DAU_MAY } from "@/lib/ops/audit-loc";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/ops/audit — 100 dòng ops:write gần nhất (C4 P3 DCA).
 * Admin-only (bảng quyền `audit.read`, không bearer): audit chứa cả thao tác của máy.
 * Không trả dấu máy (`DAU_MAY`, vd `enrich:thu` mỗi tin enrich đã thử) — giới hạn 100 áp lên dòng đã lọc, nên dấu ghi
 * hằng đêm không đẩy thao tác của người ra ngoài (hồ sơ loc-enrich-thu-ops-audit).
 */
export async function GET(req: Request) {
  const q = await kiemQuyen(req, "audit.read");
  if (!q.ok) return q.res;
  const { rows } = await pool.query(
    `SELECT at::text, actor, action, env, detail FROM ops_audit
     WHERE action <> ALL ($1::text[]) ORDER BY at DESC LIMIT 100`,
    [DAU_MAY],
  );
  return NextResponse.json({ rows });
}
