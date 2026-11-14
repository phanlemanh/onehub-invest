import { Hono } from "hono";
import { pool } from "../db/client.js";
import { giaiMaKhuVuc } from "../lib/ma-thi-truong.js";

export const dealsRoute = new Hono();

/**
 * CG9 Hỏi-5: bảng hạng giá có và đã có dòng chưa. Chưa (cloud trước khi áp DDL, máy chưa chấm lượt đầu) → đọc thước CG8 như cũ.
 * Hai câu riêng: hỏi EXISTS trên bảng chưa có là lỗi phân tích câu.
 */
export async function coBangHang(): Promise<boolean> {
  const { rows } = await pool.query(`SELECT to_regclass('public.offer_price_rank') IS NOT NULL AS co`);
  if (!rows[0]?.co) return false;
  const { rows: r2 } = await pool.query(`SELECT EXISTS (SELECT 1 FROM offer_price_rank) AS co`);
  return r2[0]?.co === true;
}

/**
 * GET /v1/deals — căn giá tốt.
 * CG9 (bang-hang-gia-m2): có bảng hạng giá tính sẵn (offer_price_rank) thì danh sách = tin có nhãn hạng của đúng loại tin; số giảm
 * = % dưới trung vị của nhóm phường × loại hình × bán/thuê (± số phòng ngủ khi nhóm đủ), mỗi căn một phiếu; thêm khối `rank`.
 * Mọi trường cũ giữ tên và kiểu; `kind` (sale mặc định, rent_lt) — giá trị khác → 400 (Hỏi-1).
 * Bảng chưa có hay rỗng (Hỏi-5): thước CG8 — view v_ruler_p2 (một căn một phiếu, chỉ tin bán, n≥5), tin chưa rõ loại không vào.
 * Query: ?area=<area_id>&market=<market_id>&limit=30&min_discount=5&kind=sale|rent_lt
 */
dealsRoute.get("/", async (c) => {
  const rawKind = c.req.query("kind");
  if (rawKind !== undefined && rawKind !== "sale" && rawKind !== "rent_lt") {
    return c.json({ error: "kind phải là sale hoặc rent_lt" }, 400);
  }
  const kind = rawKind ?? "sale";
  // Mã thị trường dài đã đổi sang mã ngắn (migration 064) trả như gọi bằng mã mới.
  const rawArea = c.req.query("area");
  const rawMarket = c.req.query("market");
  const area = rawArea ? await giaiMaKhuVuc(rawArea) : undefined;
  const market = rawMarket ? await giaiMaKhuVuc(rawMarket) : undefined;
  const limit = Math.min(100, Number(c.req.query("limit") ?? 30) || 30);
  const minDiscount = Math.max(0, Math.min(50, Number(c.req.query("min_discount") ?? 5) || 5));
  const coBang = await coBangHang();

  const params: unknown[] = [];
  let loc = "";
  if (area) {
    params.push(area);
    loc = ` AND o.area_id = $${params.length}`;
  } else if (market) {
    params.push(market);
    loc = ` AND (a.id = $${params.length} OR a.parent_id = $${params.length})`;
  }
  let where: string;
  let thuoc: string;
  let cotSo: string;
  if (coBang) {
    params.push(kind);
    where = `h.kind = $${params.length} AND h.nhan IS NOT NULL
    AND o.last_seen >= now() - interval '45 days'
    AND h.duoi_trung_vi_pct >= ${minDiscount} AND h.duoi_trung_vi_pct <= 50`;
    thuoc = `JOIN offer_price_rank h ON h.offer_id = o.offer_id`;
    cotSo = `CASE WHEN h.thuoc = 'gia-m2' THEN h.trung_vi END AS median_perm2, h.duoi_trung_vi_pct AS discount_pct,
            h.cap, h.n, h.trung_vi, h.p20, h.hang_pct, h.nhan, h.can_xac_minh, h.thuoc, h.pn_nhom, h.ly_do`;
  } else {
    where = `o.kind = 'sale' AND o.price_perm2 > 0 AND o.area_id IS NOT NULL
    AND s.median_perm2 > 0
    AND o.property_type IS NOT NULL AND o.property_type <> 'unknown'
    AND o.last_seen >= now() - interval '45 days'
    AND ROUND((1 - o.price_perm2::numeric / s.median_perm2) * 100, 1) >= ${minDiscount}
    AND ROUND((1 - o.price_perm2::numeric / s.median_perm2) * 100, 1) <= 50`;
    thuoc = `JOIN (SELECT area_id, property_type, m::numeric AS median_perm2 FROM v_ruler_p2
            WHERE property_type IS NOT NULL AND property_type <> 'unknown') s
       ON s.area_id = o.area_id AND s.property_type = o.property_type`;
    cotSo = `s.median_perm2, ROUND((1 - o.price_perm2::numeric / s.median_perm2) * 100, 1) AS discount_pct`;
  }
  params.push(limit);

  const { rows } = await pool.query(
    `SELECT o.offer_id, o.price_vnd, o.area_m2, o.price_perm2, o.bedrooms,
            o.confidence, o.first_seen::text, o.last_seen::text, o.n_reposts,
            o.area_id, a.name AS phuong, a.parent_id AS market_id, o.property_type,
            ${cotSo},
            z.sender_name, z.group_name, z.media->0->>'path' AS media_path,
            left(z.text, 200) AS post_text
     FROM sale_offers o
     LEFT JOIN areas a ON a.id = o.area_id
     ${thuoc}
     LEFT JOIN LATERAL (
       SELECT sender_name, group_name, media, text
       FROM stg_zalo_posts z WHERE z.post_id = ANY(o.post_ids)
       ORDER BY z.captured_at DESC LIMIT 1
     ) z ON TRUE
     WHERE ${where}${loc}
     ORDER BY discount_pct DESC, o.offer_id
     LIMIT $${params.length}`,
    params,
  );

  return c.json({
    data: rows.map((r) => ({
      offerId: r.offer_id,
      priceVnd: r.price_vnd === null ? null : Number(r.price_vnd),
      areaM2: r.area_m2 === null ? null : Number(r.area_m2),
      pricePerm2: r.price_perm2 === null ? null : Number(r.price_perm2),
      bedrooms: r.bedrooms,
      phuong: r.phuong,
      marketId: r.market_id,
      propertyType: r.property_type,
      medianPerm2: r.median_perm2 === null || r.median_perm2 === undefined ? null : Number(r.median_perm2),
      discountPct: r.discount_pct === null ? null : Number(r.discount_pct),
      confidence: r.confidence,
      firstSeen: r.first_seen,
      lastSeen: r.last_seen,
      nReposts: r.n_reposts,
      // Contact info — only available if stg data exists
      contact: r.sender_name ? {
        senderName: r.sender_name,
        groupName: r.group_name,
        mediaPath: r.media_path,
      } : null,
      postText: r.post_text,
      ...(coBang ? { rank: khoiHang(r) } : {}),
    })),
    meta: coBang ? { total: rows.length, minDiscount, kind } : { total: rows.length, minDiscount },
  });
});

/** Khối `rank` của một dòng offer_price_rank — cùng khuôn với /api/v1/deals của app. */
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
