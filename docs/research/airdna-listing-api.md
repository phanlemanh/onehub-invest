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

## Tab Rates + Market Score + Seasonality (survey 9, 2026-10-20)

Điều hướng thẳng route UI `/data/vn/47/142530/{rates,seasonality}` +
`/data/vn/47/overview`, bắt XHR (Playwright headful, ~35 request):

| Endpoint | Shape đáng chú ý |
|---|---|
| `POST /submarket/{sid}/metrics/adr` | timeseries 12 tháng `{date, avg_daily_rate}` + monthly/yearly_pct_change |
| `POST /submarket/{sid}/metrics/adr_by_bedroom` | **36 tháng**, keyed `bedrooms` |
| `POST /submarket/{sid}/metrics/adr_by_price_tier` | **36 tháng**, keyed `price_tiers` |
| `POST /submarket/{sid}/metrics/rates_summary` | `summary_cards` (KPI tab Rates) |
| `POST /submarket/{sid}/avg_daily_revpar` | `{avg_daily_revpar, yearly_pct_change}` |
| `POST /v2/submarket/{sid}/future/rates` | **163 ngày tương lai** daily `{date, booked_count, available_count, mean/median_booked_rate, mean/median_available_rate, occupancy, revpar, total_revenue}` — forward-looking |
| `POST /v2/market/{id}/overview/market_score` | **breakdown Market Score**: `buckets[6] {category, value}` (Rental Demand, Revenue Growth, Seasonality, Regulation…) |
| `POST /market/{id}/submarkets` (body `sort_order:"market_score", compute_metrics:true, metrics:[…]`) | `submarkets[]` kèm `metrics` mỗi quận — chính là bảng **Top Submarkets** + sidebar |
| `GET /submarket/{sid}/area?include_geoms=true` / `GET /market/{id}/area` | polygon ranh giới |
| `POST /explorer/v2/datasource_dates` | `{first_date, last_date}` — mốc tươi của nguồn (dùng cho DQ freshness) |
| `GET /v2/market/{id}/ai_insights` | ai_overview + insights (market level) |

Cấp **market** mirror đủ bộ: `/market/{id}/metrics/{adr,occupancy,revenue,revpar}`,
`*_summary`, `avg_daily_revpar`, `POST /v2/market/{id}/metrics/listing_count`
(36 tháng), `POST /market/{id}/listings`, `metric_percentiles`.

**Seasonality: KHÔNG có endpoint riêng** — 6 biến thể probe đều 404 và trang
không gọi call dữ liệu nào → app tính client-side từ timeseries tháng. Thu
adr/occupancy/revenue tháng (12–36 tháng) + `future/rates` là đủ gốc suy ra.

Filter body chuẩn (collect dùng `filters: []` cho toàn thị trường):
`{"type":"range","field":"bedrooms","value":[0,6]}`,
`{"type":"select","field":"real_estate_type","value":"apartment"}`.

## Phát hiện khi implement collector v2 (2026-10-20)

- **Path prefix**: endpoint cũ nằm dưới `/api/explorer/v1/...` (market detail,
  submarkets, metrics, map_listings, submarket listings); chỉ `overview/
  market_score`, `v2/.../metrics/listing_count`, `future/rates`, `ai_insights`
  là `/v2/`. Gọi thiếu prefix → 404.
- **future/rates** (pydantic ERR)): `period` là **số tháng ≤ 12**,
  `granularity` bắt buộc (`"daily"`). Body chuẩn:
  `{"filters":[],"currency":"vnd","period":6,"granularity":"daily"}` → ~163
  hàng daily.
- **submarket listings**: `sort_order` enum `"revenue"` (không nhận
  `revenue_ltm`); phải kèm `currency` — thiếu thì trả USD.
- **map_listings**: bắt buộc `currency:"vnd"` nếu muốn VND (mặc định USD).
- **Không gian ID**: `map_listings.property_id` là id **mờ** đa số (13-19 chữ
  số, chỉ ~10% là id Airbnb thật 8 chữ số); `submarket/{sid}/listings` mới
  trả `abnb_<airbnb_id thật>` + `airbnb_property_id` rõ. `combined_market_id`
  của map = **market id** (không phải submarket). Join với listings Inside
  Airbnb phải qua sub-listings (top 50/sub) — C2 có thể page sâu hơn.
- Hanoi có đúng 7 submarket (142530 Ba Đinh … 142535+); HCMC = market **48**
  (crosswalk S02 sẵn có).

## Kết quả pilot C1 (2026-10-20)

Hà Nội (47): 65 items — 7 submarket × {detail + 4 metric + listing_count +
future + listings}. HCMC (48): 169 items — **20 submarket**, 0 lỗi, token
refresh 2 lần (JWT TTL ~5 phút — collector tự refresh khi 401).

Đối chiếu UI screenshot ↔ DB (độc lập): ADR LTM 1.27M vs hiển thị ₫1.24M;
occupancy LTM 57.1% vs 58%; Market Score 94.29 vs 94; đủ 4 thành phần score
khớp 2 chữ số (59.37/76.49/97.47/67.13). **map_listings chạm cap 15.000
hàng** (HCMC listing_count 2026-09 = 15.066) → collector đã thêm vòng
lặp pagination (offset += 15000).

## Evidence

Output console các survey 1–6 trong phiên làm việc 2026-10-20 (request/response
thô); bản chưng cất là file này. Endpoint chưa verify trên market thứ 2
(HCMC) — C1 phải verify id HCMC + shape trước khi dùng đại trà (Review
Focus #2 của plan). Survey 9: `/tmp/survey9{,b,c}.log` (2026-10-20).
