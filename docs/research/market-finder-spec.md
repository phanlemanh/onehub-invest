# Spec Market Finder (One Invest) — chưng cất từ điều tra REA AirDNA

Cập nhật: 2026-10-16 (buổi 3 — Q2 đóng bằng chrome-devtools-mcp trên session thật).
Authority: shipped-artifact (graph `ev_2dbdda…`), runtime captures (`ev_0d655e8d…`),
**runtime-session qua DevTools MCP** (reqid 110/328/327 — không phải REA Evidence,
kết quả raw đã đối chiếu chéo với bundle), tài liệu công khai. File gốc trong
`research-local/`.

## 1. Luồng người dùng (UX flow — observed trên app thật)

1. Bản đồ quốc gia (Google Maps base + choropleth deck.gl), URL state `?lat&lng&zoom`.
2. Combobox chọn metric tô màu (mặc định **Market Score**).
3. Toolbar filter: **Market** (chọn cấp Market/Submarket) · **Beds/Baths** (Bedrooms
   0–10, Baths 1–6, Guests 1–10 — dual slider) · **Property Types** · **Amenities**
   · **Price Tier** · **Rating** · **All Filters** · **Save** (lưu filter set).
4. Panel kết quả bên phải: N markets shown + card xếp hạng theo metric
   (tên, market type, Revenue Potential, Occupancy, Daily Rate, ảnh Unsplash,
   badge "Best Places To Invest").
5. Click card → `/data/us/airdna-133` (market detail).
6. Search box "Search market, submarket, or address" (combobox autocomplete).
7. Filter áp dụng ngay khi đóng popover (không cần bấm Apply nếu đổi qua slider).

## 2. Filter DSL (observed in vivo — reqid 328)

```json
"filters": [
  {"type": "range",  "field": "bedrooms",         "value": [0, 6]},
  {"type": "select", "field": "real_estate_type", "value": "apartment"},
  {"type": "range",  "field": "bathrooms",        "value": [1, 4]}
]
```
- `type`: `select` | `range` | `gt` | `gte` | `lt` | `lte` (từ bundle, module 32264).
- Field đã thấy: `bedrooms`, `bathrooms`, `real_estate_type`, `for_sale_listing_type`.
  (UI còn có Amenities/Price Tier/Rating/Guests — field name chưa bắt được request.)
- Filter persist server-side: `GET/PUT /api/explorer/v1/session_filter/{id}`.

## 3. API contract (observed trên session thật — Q2 answered)

Base `https://api.airdna.co` · auth `Authorization: Bearer <JWT EdDSA>` ·
response envelope `{payload, status:{code:"EXPLORER-S-00x",…}}` · rate-limit
250/cycle (markets), 35/cycle (summary) · header `x-trace-id`.

### 3.1 `POST /api/explorer/v1/country/us/markets` — data chính của map + list

**Pha 1 — load map (không filter, reqid 110):**
```json
{"filters":[],"sort_order":"market_score","pagination":{"page_size":500,"offset":0},
 "currency":"usd","include_geoms":false,"include_images":false,
 "compute_metrics":true,
 "metrics":["market_score","revenue","revenue_potential_ltm","occupancy","adr",
            "estimated_yield","home_value","property_rating","location_score",
            "listing_count"]}
```

**Pha 2 — sau khi có filter (reqid 328):**
```json
{"filters":[…],"sort_order":"market_score","pagination":{"page_size":10,"offset":0},
 "currency":"usd","include_geoms":true,"include_images":false,
 "compute_metrics":false,"metrics":[]}
```

**Response** (`payload`): `{pagination, sort_order, geom_resolution:"low",
markets:[{metrics:{…}, id:"airdna-N", name, market_type, images[],
geospatial:{geom, geom_pt} | null, country_code}]}`.
- `metrics` đầy đủ ở pha 1: `market_score, revenue, booked(=occupancy alias),
  occupancy, adr(=daily_rate alias), revpar, estimated_yield, home_value,
  property_rating, revenue_potential, location_score, listing_count`.
  Pha 2 chỉ còn metric dùng để sort,其余 null (UI merge từ cache pha 1 theo id).
- `market_type` enum quan sát: `mid_size_city, urban_metro, coastal, rural,
  mountains_lakes`.
- Chiến lược đáng học: **2 pha** — map cần all-markets + metric + không cần geom
  (geom lấy từ CDN tĩnh); list filter cần geom nội tuyến + phân trang.

### 3.2 `POST /api/explorer/v1/country/us/summary` — KPI + legend (reqid 327)

Request: `{filters, percentiles:[30,60,90], currency}`.
Response `payload`: `counts:{markets:349, listings:749160, submarkets:6229,
for_sale_properties:531938}` + `percentiles` p30/p60/p90 cho từng metric
(`market_score, average_daily_rate_ltm, occupancy_rate_ltm, revenue_ltm,
revenue_potential_ltm, rating_location, rating_overall, listing_count,
estimated_yield, list_price`).

**→ Legend choropleth là ĐỘNG**: breaks = p30/p60/p90 của phân phối metric
trong tập đã lọc (đối chiếu: market_score p30/p60/p90 = 58.8/76.2/94.2 ↔
legend "< 59 | 59–76 | 76–94 | > 94").

### 3.3 Endpoint khác quan sát trên trang (chưa lấy body)

- `POST /market/47/submarkets`, `GET /market/47/area?include_geoms=false`
- `POST /country/us/for_sale_properties/count`
- `GET /auth/v1/account`, `GET /api/explorer/v2/authorization/entitlements_map`
- Search client (từ bundle): `GET /api/search/v1/{markets,state/markets,strs,
  property_managers_or_host_id}/verbose`
- `POST /market/performance_metrics`, `/market/future/performance_metrics`
  (timeseries — dùng ở trang detail)

## 4. Dữ liệu hình học

- CDN tĩnh version-named: `assets.airdna.co/market_explorer/geoms/…` —
  countries 240 items, US markets 317 items (xem buổi 2; file decode
  `research-local/geoms-*.json`).
- **API cũng trả geom nội tuyến** khi `include_geoms:true` (`geom_resolution:"low"`)
  — CDN dùng cho view mặc định, API dùng khi filter/zoom.

## 5. Render & legend

- Base map: **Google Maps JS API** (tiles + mapConfigs style; sửa sai nhận định
  trước đây "no tile server"). deck.gl layers vẽ polygon choropleth chồng lên.
- Legend 4 bậc theo percentile (mục 3.2), màu tính bằng accessor function.
- Card ảnh bìa: Unsplash; badge BPTI từ S3 assets.

## 6. Gợi ý mapping cho One Invest (M2/M3)

| AirDNA | One Invest tương đương |
|---|---|
| `POST /country/{cc}/markets` pha 1 | `GET /api/markets?metrics=…` (không filter) |
| `POST /country/{cc}/markets` pha 2 | `POST /api/markets/search` {filters, page, geoms} |
| `POST /country/{cc}/summary` | `GET /api/markets/summary` → counts + percentiles |
| Filter DSL `{type,field,value}` | dùng nguyên — đơn giản và đủ |
| Legend p30/p60/p90 | tính bằng SQL `percentile_cont` trong PostGIS |
| session_filter | bảng `saved_filters` (user_id, filters jsonb) |
| geoms CDN version-named | static file serve + ETag, bump version |

## Ledger trạng thái (2026-10-16, cuối buổi 3)

| # | Câu hỏi | Trạng thái |
|---|---|---|
| Q1 | Filter list + metric→màu + comparator | **answered** (DSL in vivo; legend = percentiles động; comparator="baseline" còn mờ — xem unknowns) |
| Q2 | Schema request/response verbose + metrics | **answered** (3.1–3.3; search/v1 verbose chỉ ở bundle — chưa thấy gọi trên trang map) |
| Q3 | Cấu trúc geoms | **answered** |
| Q4 | Công thức metric | **answered** |
| Q5 | Spec tổng hợp | **answered** — file này. **Gate 1 đóng.** |

## Unknowns còn lại (không chặn M1–M3)

1. Ngữ nghĩa "comparator/baseline" (so sánh với ai khi bấm compare) — chỉ cần khi
   làm M4 (market detail).
2. Field name của Amenities/Price Tier/Rating/Guests trong filters[] — lấy thêm
   khi cần bằng cùng phương pháp DevTools MCP.
3. Timeseries `performance_metrics` body đầy đủ — thuộc M4.
