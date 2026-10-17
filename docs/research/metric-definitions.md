# Công thức metric — theo định nghĩa AirDNA công bố (help.airdna.co, 2026-10-16)

Nguồn: 6 bài help-center (ADR, Occupancy, RevPAR, Revenue, Revenue Potential,
Market Score). Khi build One Invest: dùng công thức này trên dữ liệu
Inside Airbnb và ghi rõ phương pháp riêng nếu chỉnh.

## ADR (Average Daily Rate)
- `ADR = tổng doanh thu ÷ tổng số đêm đã đặt` (kỳ 12 tháng).
- Doanh thu gồm giá đêm + phí vệ sinh (host thu được), **trừ** phí dịch vụ
  Airbnb/OTA. ADR ≠ Price (giá niêm yết, không gồm phí vệ sinh).

## Occupancy Rate
- Market (theo tháng): `tổng đêm được đặt ÷ tổng đêm khả dụng × 100`.
- Listing (12 tháng): `số đêm reserved ÷ số đêm active`
  (active = không bị block, listing có ≥1 booking trong 28 ngày qua).

## RevPAR (Revenue Per Available Rental)
- Monthly: `doanh thu tháng ÷ tổng listing-nights khả dụng trong tháng`.
- Daily: `doanh thu ngày ÷ số listing khả dụng`.
- Kết hợp ADR × Occupancy thành một chỉ số nhu cầu.

## Revenue (market)
- `tổng doanh thu tất cả listing STR có booking ÷ số listing duy nhất có
  ≥1 booking trong tháng`.
- Giá trị mỗi listing = giá đêm + phí vệ sinh − host discounts − phí OTA.

## Revenue Potential
- Doanh thu ước tính **nếu listing mở lịch full 12 tháng**, dựa trên:
  occupancy, mùa vụ, giá, phí vệ sinh của bản thân + comp lân cận
  (giả định mọi comp đều available quanh năm để so sánh công bằng).
- Revenue thực = doanh thu trên số ngày thực mở (VD: $56.1K/327 ngày),
  potential = trần nếu mở 365 (VD: $73.5K).

## Market Score (40–100, chỉ market có ≥15 listing)
| Thành phần | Ý nghĩa |
|---|---|
| Investability (US only) | giá nhà vs thu nhập cho thuê trung bình |
| Rental Demand | công suất lưu trú năm + tốc độ tăng số listing |
| Revenue Growth | RevPAR cùng kỳ năm trước |
| Seasonality | chênh doanh thu tháng cao nhất vs thấp nhất (ít mùa vụ = điểm cao) |
| Regulation | phân tích hành vi host → mức thực thi quy định |

- Grade: 90–100=A, 75–90=B, 65–75=C, 50–65=D, 40–50=F.
- Chỉ so sánh trong cùng quốc gia; market nhiều listing có trọng số cao hơn.

## Áp dụng cho One Invest (M2)

Từ Inside Airbnb (`listings.csv`, `calendar.csv`) tự tính:
- ADR, Occupancy, RevPAR, Revenue → trực tiếp theo công thức trên.
- Revenue Potential → cần model comp-based (đặt sau, M4+).
- Market Score → bắt đầu với 3 thành phần khả thi từ dữ liệu công khai
  (Rental Demand, Revenue Growth, Seasonality); Investability cần giá nhà
  (thêm nguồn sau); Regulation → bỏ ở MVP, ghi divergence list.
