# Chạy khô E5 — 25/11 (máy thu thật, không đường nào tới cloud)

## Mã cũ (merge-base caadfbb1c, worktree tạm tách rời, cloud giả) — 12:04Z
```
tải 1′ 11.07 — chạy mã cũ (merge-base) đo pha lúc 12:04:10Z
real 971.78
(mốc pha của harness ghi sai — cleanup sau câu nạp đè mốc; dùng thời gian cả tiến trình làm cận trên, catalog giả tốn mili giây)
```

## Mã mới `--kho` (cổng chết + lsof) — 12:20Z
```
tải 1′ 11.18 — chạy mã mới --kho (cổng chết + lsof) lúc 12:20:37Z
mã thoát kho: 0
socket thấy được (duy nhất):
TCP 127.0.0.1:49192->127.0.0.1:5433
socket KHÔNG phải loopback:
(không có)
  WARN cột chưa duyệt lên cloud, ở lại máy: sale_offers.retired_at
  WARN cột chưa duyệt lên cloud, ở lại máy: sale_offers.retired_reason
  WARN cột chưa duyệt lên cloud, ở lại máy: sale_offers.superseded_by
  WARN cột chưa duyệt lên cloud, ở lại máy: sale_offers.originating_system_key
  WARN cột chưa duyệt lên cloud, ở lại máy: sale_offers.field_provenance
  WARN cột chưa duyệt lên cloud, ở lại máy: sale_offers.offer_status
  WARN cột chưa duyệt lên cloud, ở lại máy: sale_offers.street_number
  WARN cột chưa duyệt lên cloud, ở lại máy: sale_offers.unit_number
  WARN cột chưa duyệt lên cloud, ở lại máy: sale_offers.lot_size_dimensions
  WARN cột chưa duyệt lên cloud, ở lại máy: sale_offers.latitude
  WARN cột chưa duyệt lên cloud, ở lại máy: sale_offers.longitude
  WARN che định danh nguồn ở sale_offers: 3 tên, 0 số
  WARN che tên nguồn 3743 ô: area_sources.meta 3, areas.meta 501, dq_check_results.detail 75, listings.name 1, listings.photo_urls 10, ref_calib_listings.listing_url 1575, ref_calib_listings.metrics 1575, ref_calib_listings.title 3
  areas: 3355
  listings: 989
  market_metrics: 1077
  listing_stats: 870
  area_breakdowns: 718
  market_asset_stats: 372
  nights: 346750
  sale_offers: 148748
  sellers: 13854
  asset_nodes: 429
  properties: 120371
  property_offers: 139415
  area_sources: 43
  dq_check_results: 5561
  offer_price_rank: 148748
  ref_calib_markets: 43
  ref_calib_scores: 43
  ref_calib_market_metrics: 3636
  ref_calib_sub_monthly: 3360
  ref_calib_future_daily: 6472
  ref_calib_listings: 79209
  ref_calib_submarket_metrics: 40
  che area_sources.meta: 3
  che areas.meta: 501
  che dq_check_results.detail: 75
  che listings.name: 1
  che listings.photo_urls: 10
  che ref_calib_listings.listing_url: 1575
  che ref_calib_listings.metrics: 1575
  che ref_calib_listings.title: 3
kho che: 3743 ô ở 8 bảng.cột
kho bộ chặn: 0 (mọi bảng, sau che)
kho đếm thô độc lập trên payload đã che: 0
kho xong: 1024103 dòng, 22 bảng; catalog 0.0s · gate-pre 0.0s · read 514.3s · che 30.7s · scan 46.2s; pha đọc+che+soát 591.3s; tới hết soát 591.3s
```

## `scripts/do-ten-nguon-cloud.mjs --chi-may-thu` — 12:31Z
```
tải 1′ 11.75 — chạy do-ten-nguon-cloud --chi-may-thu lúc 12:31:21Z
bảng.cột · ô máy thu · thô máy thu
area_sources.meta · 3 · 3
areas.meta · 501 · 501
dq_check_results.detail · 75 · 75
listings.name · 1 · 1
listings.photo_urls · 10 · 10
ref_calib_listings.listing_url · 1575 · 1575
ref_calib_listings.metrics · 1575 · 1575
ref_calib_listings.title · 3 · 3
tổng · 3743 · 3743
do-ten-nguon-cloud --chi-may-thu: 0 lời gọi cloud; 506.2s
real 506.30
```
