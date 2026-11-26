import { Hono } from "hono";
import { pool } from "../db/client.js";

export const coverageRoute = new Hono();

/**
 * GET /v1/coverage — số tin thuê ngắn hạn tự thu theo thị trường.
 * Mỗi thị trường Việt Nam một dòng: `areaId`, `name`, `ourListings` (tin tự thu thuộc thị trường, gồm các phường con).
 * HT19: không đọc bảng S02 và không trả số nào suy từ S02 (S02 chỉ để hiệu chuẩn, chỉ hiện ở cổng Ops — luật 5). Thị trường
 * chưa có tin tự thu vẫn có mặt với `ourListings = 0`.
 */
coverageRoute.get("/", async (c) => {
  const { rows } = await pool.query(
    `SELECT a.id AS area_id, a.name,
            (SELECT count(*)::int FROM listings l
             JOIN areas sa ON sa.id = l.area_id
             WHERE coalesce(sa.parent_id, sa.id) = a.id) AS our_listings
     FROM areas a
     WHERE a.region_type = 'market' AND a.country_code = 'vn'
     ORDER BY a.name`,
  );

  return c.json({
    data: rows.map((r) => ({
      areaId: r.area_id,
      name: r.name,
      ourListings: r.our_listings ?? 0,
    })),
    meta: { total: rows.length },
  });
});
