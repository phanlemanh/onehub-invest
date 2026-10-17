# One Invest

Công cụ đầu tư bất động sản cho nhà đầu tư cho thuê ngắn hạn (short-term rental),
tương tự AirDNA. Tính năng lõi: **Market Insights** — trang chi tiết thị trường
(score, KPI, timeseries 36 tháng, so sánh với thị trường cùng cấp). Lớp discovery
**Market Finder** (bản đồ + filter) xây sau trên cùng nền dữ liệu.

## Stack

- **App**: Next.js (App Router) + TanStack Query + Recharts + MapLibre GL
- **DB**: Postgres + PostGIS (metrics precompute theo tháng)
- **Pipeline**: ETL từ nguồn công khai (Inside Airbnb, Census TIGER/Line)

Chi tiết lý do chọn: `docs/adr/0001-initial-stack.md`.

## Cấu trúc

```
src/              # Next.js app (chưa scaffold — xem AGENTS.md)
pipeline/         # ETL scripts: nguồn công khai → Postgres
db/               # migrations + SQL (PostGIS)
docs/
  research/       # kiến thức chưng cất từ điều tra REA (commit được)
  adr/            # architecture decision records
research-local/   # artifacts thô REA (HAR, chunks, evidence) — .gitignore
```

## Lộ trình (ADR-0002: Market Insights là lõi)

- **M1′** — Nền tảng: schema PostGIS + pipeline Inside Airbnb cho 1 thành phố (HN)
- **M2′** — Trang Market Insights bản lõi: header + mini-map, score, KPI strip,
  3 timeseries tháng (ADR/Occupancy/Revenue) — spec `docs/research/market-insights-spec.md`
- **M3′** — Sections sâu: Top Submarkets, Top Listings, benchmark percentile,
  supply growth
- **M4′** — Market Finder: map choropleth + filters + legend percentile
  (spec `docs/research/market-finder-spec.md`)
- **M5′** — Auth + saved markets/filters + paywall field-level (redactions)

## Nguyên tắc dữ liệu

KHÔNG scrape/hot-link dữ liệu AirDNA (vi phạm ToS). Chỉ dùng nguồn công khai
và tự tính metric theo công thức đã công bố — xem `docs/research/data-sources.md`.
