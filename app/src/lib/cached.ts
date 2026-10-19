import { unstable_cache } from "next/cache";

import { getYieldComps, getYieldRows } from "./queries";

/**
 * Truy vấn lợi suất phải gộp bảng nights (~11 triệu dòng) để lấy công suất 90 đêm
 * đầu — listing_stats (pipeline/sql/410_listing_stats.sql) chưa có cột này. Dữ liệu
 * chỉ đổi khi pipeline chạy lại (hằng tuần): cache 1 giờ. `unstable_cache` thay vì
 * "use cache" để không phải bật Cache Components cho cả app (các trang force-dynamic).
 * Hướng lâu dài: thêm booked90/nights90 vào listing_stats rồi bỏ file này.
 */
const HOUR = { revalidate: 3600, tags: ["listings"] };

export const getYieldRowsCached = unstable_cache(getYieldRows, ["yield-rows"], HOUR);
export const getYieldCompsCached = unstable_cache(getYieldComps, ["yield-comps"], HOUR);
