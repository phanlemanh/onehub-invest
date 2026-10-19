import { unstable_cache } from "next/cache";

import { getMarketListings } from "./queries";

/**
 * Truy vấn nặng, dữ liệu chỉ đổi khi pipeline chạy lại (hằng tuần): cache 1 giờ.
 * `unstable_cache` thay vì "use cache" để không phải bật Cache Components cho
 * cả app (các trang đang force-dynamic). Hướng lâu dài: pipeline tính sẵn
 * bảng thống kê theo listing.
 */
export const getMarketListingsCached = unstable_cache(getMarketListings, ["market-listings"], {
  revalidate: 3600,
  tags: ["listings"],
});
