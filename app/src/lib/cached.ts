import { unstable_cache } from "next/cache";

import { getMarketListings, getYieldComps, getYieldRows } from "./queries";

/**
 * Truy vấn phải gộp bảng nights (~11 triệu dòng), dữ liệu chỉ đổi khi pipeline
 * chạy lại (hằng tuần): cache 1 giờ. `unstable_cache` thay vì "use cache" để
 * không phải bật Cache Components cho cả app (các trang đang force-dynamic).
 * Hướng lâu dài: pipeline tính sẵn bảng thống kê theo listing.
 */
const HOUR = { revalidate: 3600, tags: ["listings"] };

export const getMarketListingsCached = unstable_cache(getMarketListings, ["market-listings"], HOUR);
export const getYieldRowsCached = unstable_cache(getYieldRows, ["yield-rows"], HOUR);
export const getYieldCompsCached = unstable_cache(getYieldComps, ["yield-comps"], HOUR);
