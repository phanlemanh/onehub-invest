import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import { canCallOpsApi } from "@/lib/ops-access";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/offers — C3-wrap DCA: bề mặt máy cho tin rao bán / cho thuê dài hạn.
 * TẠM ĐÓNG cùng chế độ với /api/v1/deals — chỉ bearer OPS_API_TOKEN hoặc phiên ops; người gọi
 * khác nhận 401 trước khi truy vấn. Lý do: cùng bảng sale_offers lẫn tin mock S03 (audit 23/10 P7).
 * Mở lại khi PL2 đã rút tin mock khỏi canonical là quyết riêng — sổ bề mặt: app/src/lib/api-surface.ts.
 * Query: ?kind=sale|rent_lt&area=<area_id>&limit=50&since_days=30
 */
export async function GET(req: Request) {
  if (!(await canCallOpsApi(req, getSessionUser))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const u = new URL(req.url);
  const kind = u.searchParams.get("kind") === "rent_lt" ? "rent_lt" : "sale";
  const area = u.searchParams.get("area");
  const limit = Math.min(200, Math.max(1, Number(u.searchParams.get("limit") ?? 50) || 50));
  const sinceDays = Math.min(365, Math.max(1, Number(u.searchParams.get("since_days") ?? 30) || 30));

  const params: unknown[] = [kind, sinceDays];
  let where = `o.kind = $1 AND o.last_seen >= now() - ($2 || ' days')::interval`;
  if (area) {
    params.push(area);
    where += ` AND o.area_id = $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT o.offer_id, o.kind, o.price_vnd, o.area_m2, o.price_perm2, o.bedrooms,
            o.area_id, a.name AS area_name,
            o.confidence, o.first_seen::text, o.last_seen::text, o.n_reposts,
            o.source AS source_code
     FROM sale_offers o
     LEFT JOIN areas a ON a.id = o.area_id
     WHERE ${where}
     ORDER BY o.last_seen DESC
     LIMIT ${limit}`,
    params,
  );
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    kind,
    count: rows.length,
    rows: rows.map((r) => ({
      ...r,
      priceVnd: r.price_vnd === null ? null : Number(r.price_vnd),
      areaM2: r.area_m2 === null ? null : Number(r.area_m2),
      pricePerm2: r.price_perm2 === null ? null : Number(r.price_perm2),
    })),
  });
}
