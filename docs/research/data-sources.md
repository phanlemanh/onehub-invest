# Nguồn dữ liệu hợp pháp cho One Invest

Nguyên tắc: chỉ dùng nguồn công khai, tự tính metric. Không scrape AirDNA.

## Dữ liệu listings & lịch đặt

- **Inside Airbnb** (insideairbnb.com) — snapshots công khai theo thành phố:
  `listings.csv`, `calendar.csv`, `reviews.csv`. Tự tính: ADR, occupancy,
  RevPAR, revenue potential theo công thức dưới đây.

## Địa giới hành chính (polygons)

- **US Census TIGER/Line** (census.gov) — ranh giới county/state chuẩn cho market Mỹ.
- **Natural Earth** (naturalearthdata.com) — biên giới mức quốc gia (thay
  `world_bank_simplified` của AirDNA).

## Công thức metric (theo định nghĩa AirDNA công bố)

- ADR — help.airdna.co/en/articles/8062173
- Occupancy — /articles/8062178
- RevPAR — /articles/8062179
- Revenue — /articles/8374548
- Market score — /articles/8062174
- Revenue potential — /articles/8958225

(Khi vào M2, đối chiếu công thức tính từ Inside Airbnb với các bài này
và ghi rõ phương pháp tính của riêng mình.)

## Đường dữ liệu AirDNA chính thức (nếu cần)

- `https://mcp.airdna.co/docs` — MCP/API chính thức của AirDNA; kiểm tra
  điều kiện sử dụng/tier trước khi tích hợp.
- Developer API: `api-gateway.airdna.co` (quan sát được trong bundle; cần tài liệu).
