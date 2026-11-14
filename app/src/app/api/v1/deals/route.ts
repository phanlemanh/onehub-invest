import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import { THUOC_CUNG_LOAI, coBangHang } from "@/lib/deals";
import { giaiMaKhuVuc } from "@/lib/ma-thi-truong";
import { canCallOpsApi } from "@/lib/ops-access";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/deals — căn giá tốt. TẠM ĐÓNG — chỉ bearer OPS_API_TOKEN hoặc
 * phiên ops; người gọi khác nhận 401 trước khi truy vấn. Lý do: audit 23/10 P7 — 29/30 căn giá
 * tốt trả công khai là tin mock S03 (Q3: đóng ngay, yêu cầu token ops). Mở lại khi PL2 đã rút tin mock
 * khỏi canonical là quyết riêng, hàng riêng — hồ sơ _acceptance/deals-api-tam-dong.
 * Query: ?market=<id>&limit=30&min_discount=5&kind=sale|rent_lt
 * CG9: có bảng hạng giá (offer_price_rank) thì danh sách = tin có nhãn hạng của đúng loại tin (P1 và P2), số giảm = % dưới trung
 * vị nhóm, thêm khối `rank`; `kind` vắng = sale, giá trị khác → 400. Bảng chưa có hay rỗng (Hỏi-5) → thước CG8 như cũ (P1 bán).
 * Lưu ý: contact info (PII tầng A) KHÔNG trả về.
 */
export async function GET(req: Request) {
  if (!(await canCallOpsApi(req, getSessionUser))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const u = new URL(req.url);
  const rawKind = u.searchParams.get("kind");
  if (rawKind !== null && rawKind !== "sale" && rawKind !== "rent_lt") {
    return NextResponse.json({ error: "kind phải là sale hoặc rent_lt" }, { status: 400 });
  }
  const kind = rawKind ?? "sale";
  const rawMarket = u.searchParams.get("market");
  // Mã thị trường dài đã đổi sang mã ngắn (migration 064) trả như gọi bằng mã mới.
  const market = rawMarket ? await giaiMaKhuVuc(rawMarket) : null;
  const limit = Math.min(100, Number(u.searchParams.get("limit") ?? 30) || 30);
  const minDiscount = Math.max(0, Math.min(50, Number(u.searchParams.get("min_discount") ?? 5) || 5));
  const coBang = await coBangHang();

  const params: unknown[] = [];
  let marketWhere = "";
  if (market) {
    params.push(market);
    marketWhere = ` AND (a.id = $${params.length} OR a.parent_id = $${params.length})`;
  }
  params.push(limit);
  const pLimit = params.length;
  params.push(minDiscount);
  const pMin = params.length;
  let pKind = 0;
  if (coBang) {
    params.push(kind);
    pKind = params.length;
  }

  const { rows } = await pool.query(coBang ? sqlBang(pLimit, pMin, pKind, marketWhere) : sqlCu(pLimit, pMin, marketWhere), params);

  return NextResponse.json({
    data: rows.map((r) => ({
      offerId: r.offer_id,
      source: r.source,
      priceVnd: r.price_vnd === null ? null : Number(r.price_vnd),
      areaM2: r.area_m2 === null ? null : Number(r.area_m2),
      pricePerm2: r.price_perm2 === null ? null : Number(r.price_perm2),
      bedrooms: r.bedrooms,
      phuong: r.phuong,
      medianPerm2: r.median_perm2 === null ? null : Number(r.median_perm2),
      rulerN: r.ruler_n === null ? null : Number(r.ruler_n),
      discountPct: r.discount_pct === null ? null : Number(r.discount_pct),
      confidence: r.confidence,
      lastSeen: r.last_seen,
      ...(coBang ? { rank: khoiHang(r) } : {}),
    })),
    meta: coBang
      ? { total: rows.length, minDiscount, kind, ruler: "hạng giá tính sẵn: phường × loại hình × bán/thuê (± số phòng ngủ), mỗi căn một phiếu, n>=10 có nhãn" }
      : { total: rows.length, minDiscount, ruler: "phường × loại hình, n>=5" },
  });
}

/** CG9: đọc bảng hạng giá. */
function sqlBang(pLimit: number, pMin: number, pKind: number, marketWhere: string): string {
  return `SELECT o.offer_id, o.source, o.price_vnd, o.area_m2, o.price_perm2, o.bedrooms,
            o.confidence, o.last_seen::text, o.area_id, a.name AS phuong,
            CASE WHEN h.thuoc = 'gia-m2' THEN h.trung_vi END AS median_perm2, h.n AS ruler_n,
            h.duoi_trung_vi_pct AS discount_pct,
            h.cap, h.n, h.trung_vi, h.p20, h.hang_pct, h.nhan, h.can_xac_minh, h.thuoc, h.pn_nhom, h.ly_do
     FROM offer_price_rank h
     JOIN sale_offers o ON o.offer_id = h.offer_id
     LEFT JOIN areas a ON a.id = o.area_id
     WHERE h.kind = $${pKind} AND h.nhan IS NOT NULL
       AND o.last_seen >= now() - interval '45 days'
       AND h.duoi_trung_vi_pct >= $${pMin} AND h.duoi_trung_vi_pct <= 50
       ${marketWhere}
     ORDER BY h.duoi_trung_vi_pct DESC, o.offer_id
     LIMIT $${pLimit}`;
}

/** Thước CG8 (bảng hạng chưa có hay rỗng — Hỏi-5). */
function sqlCu(pLimit: number, pMin: number, marketWhere: string): string {
  return `WITH ruler AS (${THUOC_CUNG_LOAI})
     SELECT o.offer_id, o.source, o.price_vnd, o.area_m2, o.price_perm2, o.bedrooms,
            o.confidence, o.last_seen::text,
            o.area_id, a.name AS phuong,
            r.m AS median_perm2, r.n AS ruler_n,
            ROUND((1 - o.price_perm2::numeric / r.m::numeric) * 100, 1) AS discount_pct
     FROM sale_offers o
     JOIN ruler r ON r.area_id = o.area_id AND r.property_type = o.property_type
     LEFT JOIN areas a ON a.id = o.area_id
     WHERE o.price_tier = 'P1' AND o.kind = 'sale'
       AND o.price_perm2 > 0 AND o.area_id IS NOT NULL
       AND o.last_seen >= now() - interval '45 days'
       AND ROUND((1 - o.price_perm2::numeric / r.m::numeric) * 100, 1) >= $${pMin}
       AND ROUND((1 - o.price_perm2::numeric / r.m::numeric) * 100, 1) <= 50
       ${marketWhere}
     ORDER BY discount_pct DESC
     LIMIT $${pLimit}`;
}

/** Khối `rank` của một dòng offer_price_rank (CG9) — cùng khuôn với /v1/deals của data-api. */
function khoiHang(r: Record<string, unknown>) {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    level: r.cap ?? null,
    n: num(r.n),
    median: num(r.trung_vi),
    p20: num(r.p20),
    percentile: num(r.hang_pct),
    label: r.nhan ?? null,
    needsVerification: r.can_xac_minh === true,
    metric: r.thuoc ?? null,
    bedroomsGroup: num(r.pn_nhom),
    reason: r.ly_do ?? null,
  };
}
