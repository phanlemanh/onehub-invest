# Pipeline — Inside Airbnb → Postgres (M1′)

Thành phố hiện tại: **Bangkok** (Inside Airbnb không còn dữ liệu Việt Nam —
xem divergence 6). Snapshot: tham số `import.sh`.

```bash
# 1. Tải data (một lần / mỗi snapshot)
./fetch-data.sh            # hoặc curl tay vào data/ (xem script)

# 2. Import + compute metrics
./import.sh 2026-09-22

# 3. Truy vấn
docker compose -f ../db/docker-compose.yml exec db psql -U oneinvest -d oneinvest
```

Bảng kết quả: `market_metrics(area_id, month, listing_count, booked_nights,
available_nights, revenue, adr, occupancy, revpar)` — submarket + rollup market.
Legend/benchmark percentile: `percentile_cont` trên `market_metrics` (mirror
AirDNA `metric_percentiles`, xem docs/research/*-spec.md).

## Divergence list (khác AirDNA — chủ đích và có giới hạn)

1. **Cửa sổ thời gian**: calendar Inside Airbnb là 12 tháng *tới* từ snapshot,
   không phải lịch sử → metrics M1′ là "forward window" (booking pace), không
   phải LTM lịch sử. Tháng đầu (2026-09) bị cụt vì snapshot giữa tháng.
   Import định kỳ theo snapshot mới sẽ tự tích lũy lịch sử.
2. **Đêm đặt ≈ `available=false`**: calendar không phân biệt booked vs
   owner-blocked → occupancy là xấp xỉ (AirDNA lọc theo active listing).
3. **Snapshot 2026 bỏ giá khỏi calendar** → ADR/revenue/revpar tính từ
   `price_listed` của listing (giá niêm yết, không gồm phí vệ sinh, không
   phản ánh giá từng đêm thực chốt) → ADR thiên về "listed rate".
4. **Giá theo nội tệ**: snapshot Bangkok để giá THB (ADR ~2.100 THB ≈ $60).
   Cần bảng quy đổi + metadata `currency` theo thành phố khi đa thị trường.
5. **Revenue Potential / home_value / property_rating / market_score**: chưa
   tính (cần nguồn giá BĐS + model comp) — M3′+.
6. **Neighbourhood polygon** từ Inside Airbnb geojson; chuẩn hóa ranh giới
   hành chính (GADM/OSM) để sau.
7. **Bangkok thay Hanoi**: Inside Airbnb dropped Vietnam khỏi danh sách city
   hiện tại (thiếu 2026-10); pipeline tham số hóa — khi có nguồn VN chỉ đổi biến.

## fetch-data.sh

Tải 4 file: `data/listings.csv.gz`, `data/calendar.csv.gz`,
`visualisations/neighbourhoods.csv|.geojson` từ
`https://data.insideairbnb.com/thailand/central-thailand/bangkok/<snapshot>/`.
File thô nằm `pipeline/data/` (gitignored).
