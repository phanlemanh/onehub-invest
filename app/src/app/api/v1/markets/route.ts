import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/markets — danh sách markets và số tin (public API).
 * Query: ?country=vn&limit=50
 * Không mang điểm thị trường của S02 và không xếp theo nó (AGENTS.md luật 5, HT23 api-markets-khong-tra-so-s02):
 * số S02 chỉ ở /ops/quality. Xếp theo số tin giảm dần rồi tên.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const country = u.searchParams.get("country") ?? "vn";
  const limit = Math.min(200, Number(u.searchParams.get("limit") ?? 50) || 50);

  const { rows } = await pool.query(
    `SELECT m.id, m.name, m.country_code, m.listing_count
     FROM (
       SELECT a.id, a.name, a.country_code,
              (SELECT count(*)::int FROM listings l
               JOIN areas sa ON sa.id = l.area_id
               WHERE coalesce(sa.parent_id, sa.id) = a.id) AS listing_count
       FROM areas a
       WHERE a.region_type = 'market' AND a.country_code = $1
     ) m
     ORDER BY m.listing_count DESC, m.name
     LIMIT $2`,
    [country, limit],
  );

  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      countryCode: r.country_code,
      listingCount: r.listing_count,
    })),
    meta: { total: rows.length, limit },
  });
}
