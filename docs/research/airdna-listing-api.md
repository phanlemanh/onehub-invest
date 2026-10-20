# AirDNA listing-level API — kết quả khảo sát REA (E2 Task A3)

Ngày: 2026-10-20 · Phương pháp: Playwright + profile `.airdna-profile` (ADR-0009,
chỉ đọc, ~30 request khảo sát tổng) · Scripts khảo sát: /tmp/airdna-survey*.mjs
(throwaway — logic sẽ nằm trong collector)

## Xác thực

- Explorer API dùng **Authorization: Bearer** (JWT EdDSA, ~334 chars), KHÔNG
  phải cookie. Token lưu `localStorage.auth` (key `appToken`), được app attach
  vào mọi request `api.airdna.co`.
- Collector phải đọc token từ localStorage của profile sau khi load app
  (hoặc intercept 1 request để lấy header) — không hardcode.

## Route UI (để collector điều hướng)

- Trang listings của market: `https://app.airdna.co/data/vn/{market_id}/listings`
  (tabs: Overview | Listings | Occupancy | Revenue | Rates | Seasonality | Top
  Submarkets; filter channel All/Airbnb/Vrbo/Booking).
- Market Hà Nội = id **47** (khớp crosswalk `area_sources` S02 sẵn có).
- URL theo slug (/data/vn/hanoi) → redirect/404; luôn dùng numeric id.

## Endpoint vàng: POST /api/explorer/v1/market/{id}/map_listings

- **Method POST** (GET trả 405) với body:
  `{"filters":[{bedrooms 0-6},{real_estate_type},{bathrooms}], "sort_order":"revenue", "pagination":{"page_size":15000,"offset":0}, "bounding_box":…}`
- **1 request = toàn bộ listing của market** (app dùng page_size 15000 cho map).
- Response: `payload.listings[]` với mỗi listing:
  - `property_id`: `"abnb_<airbnb_id>"` — **Airbnb ID, cùng gốc với listings.id**
  - `location {lat,lng}`
  - `metrics {revenue, revenue_potential, occupancy, adr, bedrooms, price_tier,
    rating_overall, rating_location}` — **LTM 12 tháng** (lịch sử booking — lớp
    không thể tự thu)
  - `combined_market_id`
- Endpoint đồng họ: `POST /country/vn/markets` (market-level, sort/filters
  giống), `GET /market/{id}/submarkets` (pagination + sort_order), các
  `GET /market/{id}/metrics/*` + `/v2/market/{id}/overview/*` (đã thu E1).

## Hàm ý kiến trúc (cho Task C1/C2)

1. **Universe**: 1 request/market → list `abnb_*` id → diff với discovery tự
   thu → nạp id mới vào queue airbnb-listing. Volume gần như bằng 0 — CCP
   dễ tuân.
2. **LTM per listing**: metrics trong map_listings chính là dữ liệu "mua
   thời gian" — ghi bảng `airdna_listings` keyed `listing_id` (bỏ prefix
   `abnb_`), kèm `captured_at` (rolling LTM — Review Focus #4).
3. History theo tháng sâu hơn (timeseries listing) có thể có endpoint riêng
   khi mở trang chi tiết 1 listing — chưa khảo sát (để sau nếu C2 cần).
4. Submarket ids lộ trong nav (score per submarket) — E2 submarket dùng lại
   `GET /market/{id}/submarkets`.

## Cấp SUBMARKET (survey 7–8, 2026-10-20)

Route UI: `https://app.airdna.co/data/vn/{market_id}/{submarket_id}/overview`
(ví dụ Ba Đình của Hà Nội = 142530). Danh sách submarket + id:
`GET /market/{id}/submarkets` → `payload.submarkets[]` (pagination,
sort_order; nav UI kèm market_score mỗi quận).

| Endpoint | Shape đáng chú ý |
|---|---|
| `GET /submarket/{sid}` | metrics, id, name, parent, images, geospatial |
| `POST /submarket/{sid}/metrics/revenue|occupancy|revpar` | **timeseries 12 tháng** `{date, value}` + monthly/yearly_pct_change |
| `POST /v2/submarket/{sid}/metrics/listing_count` | **timeseries 36 tháng** (lịch sử nguồn cung 3 năm!) |
| `POST /submarket/{sid}/listings` | bảng listing: `property_id, airbnb_property_id, vrbo/booking ids, channels, urls, title, rating, reviews, revenue_ltm, revenue_potential_ltm, occupancy…` — **giàu hơn map_listings** |
| `POST /submarket/{sid}/map_listings` | như market (bản đồ) |
| `POST /submarket/{sid}/metric_percentiles, /metrics/*_summary` | summary_cards, percentile |
| `GET /v2/submarket/{sid}/ai_insights` | ai_overview + insights |

Hàm ý: C1 collector sẽ theo thứ tự market → submarkets (lấy id+score) →
per-submarket {metrics timeseries + listings}; bảng `airdna_submarket_metrics`
(7 dòng hiện tại) + `airdna_listings` keyed airbnb_property_id. History
listing_count 36 tháng = lịch sử nguồn cung tự động có.

## Evidence

Output console các survey 1–6 trong phiên làm việc 2026-10-20 (request/response
thô); bản chưng cất là file này. Endpoint chưa verify trên market thứ 2
(HCMC) — C1 phải verify id HCMC + shape trước khi dùng đại trà (Review
Focus #2 của plan).
