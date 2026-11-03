import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { giaiMaKhuVuc } from "@/lib/ma-thi-truong";
import { getPublicOffers, isListingKind, LISTING_KIND, offerMarketOf, parseOfferFilters } from "@/lib/offers-public";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/listings — danh sách Listing (public API), chọn loại bằng `kind`; không truyền là `rent_st` như trước.
 * rent_st: ?market=<id>&bedrooms=N&limit=50&offset=0
 * sale, rent_lt (tin rao, ROADMAP §3 mục 25): ?market=<id>&kind=&ward=<a,b>&type=<a,b>&price_min=&price_max=&area_min=&area_max=
 *   &bedrooms=&has_phone=1&sort=newest|price-asc|price-desc|perm2-asc&limit=24&offset=0. Không mang SĐT, chỉ cờ `hasPhone`;
 *   số lấy từng tin ở /api/v1/listings/<id>/contact; trường trả về do lib/offers-public.ts quyết.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const kind = u.searchParams.get("kind");
  if (kind !== null && !isListingKind(kind)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }
  if (kind === LISTING_KIND.sale || kind === LISTING_KIND.rent_lt) {
    const filters = parseOfferFilters(u.searchParams);
    const { rows, total, withPhone } = await getPublicOffers(await offerMarketOf(u.searchParams), filters);
    return NextResponse.json({
      data: rows,
      meta: { kind, total, withPhone, limit: filters.limit, offset: filters.offset },
    });
  }
  const rawMarket = u.searchParams.get("market");
  // Mã thị trường dài đã đổi sang mã ngắn (migration 064) trả như gọi bằng mã mới.
  const market = rawMarket ? await giaiMaKhuVuc(rawMarket) : null;
  const bedrooms = u.searchParams.get("bedrooms");
  const limit = Math.min(200, Number(u.searchParams.get("limit") ?? 50) || 50);
  const offset = Math.max(0, Number(u.searchParams.get("offset") ?? 0) || 0);

  const params: unknown[] = [];
  const conds: string[] = ["1=1"];

  if (market) {
    params.push(market);
    conds.push(`(a.id = $${params.length} OR a.parent_id = $${params.length})`);
  }
  if (bedrooms) {
    params.push(Number(bedrooms));
    conds.push(`l.bedrooms = $${params.length}`);
  }
  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT l.id, l.name, l.room_type, l.bedrooms, l.price_listed,
            l.photo_urls, l.review_count,
            a.id AS area_id, a.name AS area_name,
            p.id AS market_id, p.name AS market_name
     FROM listings l
     LEFT JOIN areas a ON a.id = l.area_id
     LEFT JOIN areas p ON p.id = a.parent_id
     WHERE ${conds.join(" AND ")}
     ORDER BY l.name
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      roomType: r.room_type,
      bedrooms: r.bedrooms,
      priceListed: r.price_listed === null ? null : Number(r.price_listed),
      photoUrls: r.photo_urls ?? null,
      reviewCount: r.review_count ?? null,
      area: { id: r.area_id, name: r.area_name },
      market: { id: r.market_id, name: r.market_name },
    })),
    meta: { total: rows.length, limit, offset },
  });
}
