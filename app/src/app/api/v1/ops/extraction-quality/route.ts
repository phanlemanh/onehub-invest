import { NextResponse } from "next/server";

import { pool } from "@/lib/db";
import { kiemQuyen } from "@/lib/ops-access";

export const dynamic = "force-dynamic";

type Row = { entity: string; checked_at: string; detail: string };

/**
 * GET /api/v1/ops/extraction-quality — F1 extractor (regex/llm) từ
 * dq_check_results do bench-extraction ghi (ADR-0007 DCA + DQO).
 * Quyền `ops.read` như coverage route: phiên từ vai người xem hoặc bearer chung của máy.
 */
export async function GET(req: Request) {
  const q = await kiemQuyen(req, "ops.read");
  if (!q.ok) return q.res;
  const { rows } = await pool.query<Row>(
    `SELECT DISTINCT ON (entity) entity, checked_at::text, detail
     FROM dq_check_results WHERE check_name = 'extraction-quality'
     ORDER BY entity, checked_at DESC`,
  );
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    results: rows.map((r) => {
      const f1: Record<string, number> = {};
      for (const m of r.detail.matchAll(/(\w+)=([\d.]+)/g)) {
        if (m[1] !== "samples") f1[m[1]] = Number(m[2]);
      }
      const fields = Object.keys(f1).filter((k) => k !== "avgF1");
      const samples = Number(r.detail.match(/samples=(\d+)/)?.[1] ?? 0);
      const f1ByField = Object.fromEntries(fields.map((k) => [k, f1[k]]));
      return {
        extractor: r.entity,
        f1ByField: samples > 0 ? f1ByField : {},
        f1Avg: samples > 0 ? (f1.avgF1 ?? null) : null,
        samples,
        checkedAt: r.checked_at,
      };
    }),
  });
}
