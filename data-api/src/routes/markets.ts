import { Hono } from "hono";
import { pool } from "../db/client.js";
import { giaiMaKhuVuc } from "../lib/ma-thi-truong.js";

/**
 * /v1/markets — thị trường (tỉnh/thành) và tiểu vùng, chỉ số tự có của OneHub.
 *
 * HT20 (`_acceptance/data-api-markets-khong-doc-s02`, Mạnh ký 27/11): không đường nào đọc bảng của S02 hay bảng nối khu
 * nguồn — S02 chỉ để hiệu chuẩn, chỉ hiện ở cổng Ops (AGENTS.md luật 5). Điểm thị trường, chỉ số tiểu vùng và chuỗi tháng của
 * S02 đã gỡ; đường «insights» trả 410 vì số theo tháng của thị trường chưa có nguồn tự thu đủ phủ. Test
 * `test/markets-khong-s02.test.ts` có rào tĩnh đỏ khi tệp nào dưới `src/`, `api/` nhắc lại các bảng đó.
 */
export const marketsRoute = new Hono();

/** Số tin thuê ngắn hạn tự thu của mỗi khu (khu cha của phường gộp tin của phường con). */
const DEM_TIN = `(SELECT count(*)::int FROM listings l
                    JOIN areas sa ON sa.id = l.area_id
                   WHERE coalesce(sa.parent_id, sa.id) = a.id)`;

/**
 * GET /v1/markets — danh sách thị trường + số tin, xếp số tin giảm dần, bằng nhau theo tên.
 * Query: ?country=vn&limit=50
 */
marketsRoute.get("/", async (c) => {
  const country = c.req.query("country") ?? "vn";
  const limit = Math.min(200, Number(c.req.query("limit") ?? 50) || 50);

  const { rows } = await pool.query(
    `SELECT a.id, a.name, a.country_code, ${DEM_TIN} AS listing_count
       FROM areas a
      WHERE a.region_type = 'market' AND a.country_code = $1
      ORDER BY listing_count DESC, a.name
      LIMIT $2`,
    [country, limit],
  );

  return c.json({
    data: rows.map((r) => ({ id: r.id, name: r.name, countryCode: r.country_code, listingCount: r.listing_count })),
    meta: { total: rows.length, limit },
  });
});

/**
 * GET /v1/markets/:id — một thị trường, cùng hình một dòng danh sách.
 */
marketsRoute.get("/:id", async (c) => {
  // Mã thị trường dài đã đổi sang mã ngắn (migration 064) trả như gọi bằng mã mới.
  const id = await giaiMaKhuVuc(c.req.param("id"));
  const { rows } = await pool.query(
    `SELECT a.id, a.name, a.country_code, ${DEM_TIN} AS listing_count
       FROM areas a
      WHERE a.id = $1 AND a.region_type = 'market'`,
    [id],
  );

  if (!rows[0]) {
    return c.json({ error: { code: "NOT_FOUND", message: `Market "${id}" not found` } }, 404);
  }
  const m = rows[0];
  return c.json({ data: { id: m.id, name: m.name, countryCode: m.country_code, listingCount: m.listing_count } });
});

/**
 * GET /v1/markets/:id/submarkets — tiểu vùng của một thị trường: tên + số tin, xếp theo tên.
 */
marketsRoute.get("/:id/submarkets", async (c) => {
  // Mã thị trường dài đã đổi sang mã ngắn (migration 064) trả như gọi bằng mã mới.
  const id = await giaiMaKhuVuc(c.req.param("id"));
  const { rows } = await pool.query(
    `SELECT a.id, a.name, (SELECT count(*)::int FROM listings l WHERE l.area_id = a.id) AS listing_count
       FROM areas a
      WHERE a.parent_id = $1 AND a.region_type = 'submarket'
      ORDER BY a.name`,
    [id],
  );

  return c.json({
    data: rows.map((r) => ({ id: r.id, name: r.name, listingCount: r.listing_count })),
    meta: { total: rows.length },
  });
});

/**
 * GET /v1/markets/:id/insights — đã gỡ (HT20, Hỏi-3): trả 410 cho mọi mã, không truy vấn.
 */
export const THONG_DIEP_INSIGHTS_GO = "insights đã gỡ: số theo tháng của thị trường chưa có nguồn tự thu đủ phủ";
marketsRoute.get("/:id/insights", (c) =>
  c.json({ error: { code: "GONE", message: THONG_DIEP_INSIGHTS_GO } }, 410),
);
