# AirDNA Market Explorer — kiến trúc đã quan sát (2026-10-16)

Nguồn: điều tra REA trên `app.airdna.co/data/us`. Evidence gốc:
`research-local/airdna-evidence2.json` (headful capture `ev_c9cac651…`),
`research-local/airdna-headful.json`, chunks JS trong `research-local/airdna-chunks/`.
Passive inspect tab user: `ev_2945286b…`. Headless bị chặn: `ev_0f69f87e…`.

## Frontend

- Next.js **Pages Router**, basePath `/data`, route `pages/data/[country].tsx`
  (chunk `[country]-3100f5c9d57fc3e6.js`). MUI + emotion.
- URL model: `/data/{countryCode}/{marketId}/{submarketId}/{tab}`,
  tab: overview|revenue|occupancy|revpar|listings.
- **URL state bản đồ**: `?lat=..&lng=..&zoom=..` — shareable, app khôi phục viewport.
- Auth redirect giữ ngữ cảnh: OAuth `state={"path","search"}` round-trip.

## Map

- **deck.gl**: PolygonLayer, GeoJsonLayer, TextLayer, LineLayer, IconLayer,
  ScatterplotLayer. Không dùng tile server.
- Geometry tĩnh, version trong tên file, tải từ CDN công khai:
  - `assets.airdna.co/market_explorer/geoms/country/world_bank_simplified_001.json`
  - `assets.airdna.co/market_explorer/geoms/us_markets/all_us_markets_0025.json`
  - (CDN chặn curl; cần tải qua trình duyệt thật)

## API (client OpenAPI-generated, POST+JSON)

| Thành phần | Endpoint |
|---|---|
| Search/hierarchy country | GET `api.airdna.co/api/search/v1/markets/verbose`, `/state/markets/verbose` |
| Metrics choropleth | POST `/market/performance_metrics`, POST `/market/future/performance_metrics` |
| Market detail (lần trước) | `api.airdna.co/api/explorer/v1+v2`, ~40 endpoint (adr, revpar±weekend, occupancy, booking_demand, booking_lead_time, length_of_stay, breakdowns bedroom/price-tier/channel, percentiles, future/*) |
| Saved | `/favorite_markets`, `/favorite_submarkets` |

Config base URLs trong bundle: `searchApiBaseUrl=api.airdna.co`,
`rmsApiBaseUrl=api-gateway.airdna.co/api/v1/rms`, `authApiBaseUrl=api.airdna.co/auth`,
`developerApiBaseUrl=api-gateway.airdna.co`.

Metric keys quan sát: `occupancy`, `adr`, `revpar`, `revenue_potential`,
`market_score`, `rental_demand`. Định nghĩa công bố tại help.airdna.co
(xem `data-sources.md`).

## Auth & hạ tầng

- OIDC authorization-code: `auth.airdna.co/oauth2/register`, client_id
  `5f040464-0aef-48a1-a1d1-daa9fbf81415`, scope `profile openid offline_access`,
  token ở localStorage key `auth`.
- Unleash flags proxy `api.airdna.co/flags/proxy`; Segment/Amplitude/GA/GTM/
  Hotjar/CrazyEgg/Contentsquare/UserPilot/Sentry; Stripe payment.
- Cloudflare Turnstile: headless → 403; headful thật → qua.
- AirDNA có **MCP server chính thức**: `https://mcp.airdna.co/docs`.

## Unknowns còn lại (việc tiếp theo)

1. **Schema response** của `markets/verbose` + `performance_metrics` —
   cần HAR từ session user (DevTools → Network → Save HAR → `*.har`
   vào `research-local/`) → phân tích bằng REA `inspect_web_network_capture`.
   *(Trạng thái chi tiết các câu hỏi Q1–Q5: xem ledger cuối
   `market-finder-spec.md`.)*

Đã giải quyết 2026-10-16 (buổi 2 — graph `ev_2dbdda…`, trace
`ev_a2bc202b…`, capture geoms `ev_0d655e8d…`): filter DSL + danh sách
filter, bộ nhãn metric của map, thêm 2 endpoint verbose (`/strs/verbose`,
`/property_managers_or_host_id/verbose`), cấu trúc 2 file geoms
(`research-local/geoms-*.json`), công thức 6 metric
(`metric-definitions.md`). Còn hở: Q2 (HAR), dải màu choropleth
(accessor minified), ngữ nghĩa comparator.
