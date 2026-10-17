# Spec Market Insights (One Invest) — trang chi tiết thị trường

Cập nhật: 2026-10-16. Nguồn: runtime-session qua chrome-devtools-mcp trên tab
`/data/vn/47/142532/overview` (reqid 1696–1885, không phải REA Evidence —
runtime thô đã đối chiếu), blueprint 9-section từ phân tích bundle trước
(159 chunk), a11y tree trang thật. Quy ước auth/envelope chung: xem
`market-finder-spec.md` §3.

## 1. Cấu trúc trang (observed)

URL: `/data/{country}/{marketId}[/{submarketId}]/{tab}`,
tab: `overview | listings | occupancy | revenue | rates | seasonality |
top-submarkets | top-listings`. Breadcrumb Hanoi › Tay Ho. Toolbar filter
dùng chung Market Finder. Header có mini-map (Google Maps + polygon
submarket/market).

**Sections trang overview (theo thứ tự thật):**
1. Submarket/Market Score (91) + 5 thành phần: Investability, Rental Demand,
   Revenue Growth, Seasonality, Regulation
2. KPI strip: Annual Revenue, Total Active Listings, ADR, Occupancy Rate —
   mỗi KPI có tooltip định nghĩa + "% past year" + link tới tab tương ứng
3. Top Submarkets (card: score, Revenue Potential, Occu., RevPAR, ADR)
4. Top Listings (carousel: ảnh, beds/baths/max_guests/rating, Revenue
   Potential/Days avail/Occu./ADR; link Airbnb/Vrbo/Booking)
5. AirDNA AI — "What Guests Are Saying": tổng quan, guests love, amenities,
   guest groups, common complaints (LLM-generated, paywalled)
6. Performance Highlights: 3 chart timeseries (Avg Listing Revenue, ADR,
   Occupancy) — monthly, "% past year", nút Upgrade khi khóa (SAMPLE)
7. Supply Growth Over Time (active listings 2023–2026)
8. Listing Overview + What guests say about amenities
9. Upsell: "Unlock data-driven confidence" + "Upgrade to Unlock Submarket"

## 2. API contract (observed trên trang)

| Endpoint | Method/Body | Ghi chú |
|---|---|---|
| `/{market\|submarket}/{id}` | GET | metadata: name, `parent_market_name`, `market_id`, `region_type:"neighborhood"`, images[], metrics{…}, **`redactions[]`** |
| `/{market\|submarket}/{id}/area?include_geoms=true` | GET | polygon cho mini-map |
| `/{market\|submarket}/{id}/metric_percentiles` | POST `{percentiles:[30,60,90], filters, scope:"submarkets", metrics:[], currency}` | **comparator**: phân vị các đơn vị anh em (VD: các submarket của Hanoi) → benchmark "so với phần còn lại" |
| `/market/{id}/submarkets` | POST (giống country/markets) | danh sách submarket + metric |
| `/submarket/{id}/listings` | POST | top listings |
| `/v2/{market\|submarket}/{id}/metrics/{metric}` | POST `{filters, granularity:"monthly", period:36}` | **timeseries 36 tháng**; rate-limit 100/cycle |
| `/v2/{scope}/{id}/ai_insights` | GET | AI insights (paywalled) |
| `/v2/datasource_dates` | POST | freshness dữ liệu ("Over the last 12 months") |
| `/country/{cc}/summary` | POST | context quốc gia |
| `/v2/authorization/entitlements_map`, `favorite_markets`, `favorite_listings` | GET | quyền + saved |

Metric timeseries keys (`{metric}` path): `listing_count`, adr, occupancy,
revenue… (khớp danh mục ~40 endpoint từ bundle).

## 3. Cơ chế paywall 2 tầng (đáng mirror)

1. **Field-level redaction** — response 200 + `metrics` null những field chưa
   mua + mảng `redactions` (JSON-pointer) + status
   `{code:"EXPLORER-S-022", type:"redact"}`. VD: submarket trả `market_score`
   nhưng cắt `revenue, booked, daily_rate, revpar`.
2. **Endpoint-level 401** — `/v2/…/metrics/*`, `/v2/…/ai_insights` trả
   `{error:{message:"Unauthorized access to … by {uid}", type:"invalid_credentials"}}`.
   UI hiển thị chart SAMPLE + nút Upgrade.

→ Thiết kế One Invest: envelope `{payload, status}` + redactions[] từ đầu;
entitlement check ở gateway theo scope (market vs submarket).

## 4. Comparator (giải ẩn số còn lại của Market Finder)

"Compare against the right competitors" = `metric_percentiles` với
`scope:"submarkets"` (hoặc markets trong country): lấy p30/p60/p90 của tập
anh em → UI chấm "market này nằm ở bậc nào so với cùng cấp". Kết hợp với
legend percentile ở map — cùng một primitive.

## 5. Mapping One Invest (M2′)

| AirDNA | One Invest |
|---|---|
| `GET /submarket/{id}` | `GET /api/areas/{id}` (metadata + score + redactions) |
| `POST /{scope}/{id}/metric_percentiles` | `GET /api/areas/{id}/benchmark?scope=siblings` (SQL percentile_cont) |
| `POST /v2/{scope}/{id}/metrics/{metric}` | `GET /api/areas/{id}/metrics/{metric}?granularity=month&period=36` |
| `POST /submarket/{id}/listings` | `GET /api/areas/{id}/listings/top` |
| ai_insights |Phase sau (M4′+): LLM tóm tắt review |

Vì account AirDNA của user bị khóa submarket, giá trị thật của các timeseries
chưa quan sát được — schema response timeseries là unknown duy nhất còn lại
(dự đoán: `{payload:{metric, points:[{date, value}]}}` — xác nhận khi cần
bằng tài khoản market-level).
