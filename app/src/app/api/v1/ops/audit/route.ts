import { NextResponse } from "next/server";

import { kiemQuyen } from "@/lib/ops-access";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/ops/audit — 100 dòng ops:write gần nhất (C4 P3 DCA).
 * Admin-only (bảng quyền `audit.read`, không bearer): audit chứa cả thao tác của máy.
 */
export async function GET(req: Request) {
  const q = await kiemQuyen(req, "audit.read");
  if (!q.ok) return q.res;
  const { rows } = await pool.query(
    `SELECT at::text, actor, action, env, detail FROM ops_audit ORDER BY at DESC LIMIT 100`,
  );
  return NextResponse.json({ rows });
}
