# Kế hoạch tích hợp AirDNA Market Research ($249/năm) vào One Invest

Ngày: 2026-10-18 · Trạng thái: proposed (chờ user mua tài khoản)
Mục tiêu của user: **mở một nơi duy nhất — One Invest — không phải vào AirDNA nữa**;
tài khoản $249/năm phải bơm tối đa giá trị vào One Invest.

## 1. Khảo sát — gói Market Research có gì

| Hạng mục | Chi tiết |
|---|---|
| Giá | User mua $249/năm (promo; niêm yết ~$34/tháng trả năm) |
| Dữ liệu lịch sử (LTM) | ADR, occupancy, revenue, RevPAR, demand, seasonality theo market + submarket |
| Market Score | Điểm + investability/regulation grades |
| Future demand | Forward pacing (đặt phòng sớm) — thứ ta KHÔNG tự tính được |
| Comp sets + Rentalizer | Phân tích BĐS so sánh — giá trị sau này khi mở tính năng đầu tư |
| Phạm vi | 120k+ markets toàn cầu; VN có mặt (đã verify app.airdna.co/data/vn/47/…) |
| Xuất dữ liệu | Export CSV + đọc UI; API doanh nghiệp ($50k+/năm) KHÔNG gồm trong gói |
| **MCP server chính thức** | `https://mcp.airdna.co` — OAuth bằng chính tài khoản; entitlement `standard_research` theo gói. Tools market-research (`get_market_metrics`, `get_submarket_metrics`, `get_submarket_timeseries`, `rank_submarkets`, `get_market_pacing`, `compare_markets`) đang **"coming soon"** — khi live là đường bơm dữ liệu SẠCH nhất |

## 2. Phân tích giá trị — lấy GÌ để đáng $249

Sắp theo ROI cho One Invest:

1. **Chuẩn đối chiếu (calibration)** — ADR/occ/revenue của AirDNA (LTM, booking
   thực) vs số tự thu (forward-window, giá niêm yết) → hệ số hiệu chỉnh mỗi
   metric theo market + indicator "số của ta lệch bao nhiêu %". Đây là giá trị
   cốt lõi: biến dữ liệu tự thu thành dữ liệu ĐÁNG TIN.
2. **Market Score + investability** — không thể tự tính (cần mô hình riêng của
   AirDNA); hiển thị như một cột "tham khảo bên thứ 3" trong trang area.
3. **Future demand / pacing** — booking lead time + forward occupancy: ta không
   có (calendar chỉ cho available, không cho "đặt khi nào").
4. **Seasonality chuẩn** — so với seasonality tự tính để sanity-check.
5. **Độ phủ Vrbo** — AirDNA gộp Vrbo; ta chỉ có Airbnb → biết phần thị trường
   ta đang bỏ sót.
6. (Sau này) Rentalizer/comp sets — khi One Invest có tính năng "đánh giá 1 BĐS".

KHÔNG lấy: dữ liệu listing chi tiết của AirDNA (trùng lặp cái ta tự thu được),
bản đồ/geoms (đã có OSM), anything vượt phạm vi đọc số liệu tổng hợp của gói.

## 3. Kiến trúc — đúng triết lý 2 repo hiện có

```
Track A (ngay khi có tài khoản — app.airdna.co web):
  collector repo: collectors/airdna-research.ts
    - Playwright system Chrome headful, profile riêng đã login 1 lần
    - Vào /data/vn/<market>/<submarket>/overview + tabs, chặn XHR explorer
      v1/v2 (POST /country/vn/summary, /{scope}/{id}/metrics/... — đã测绘
      trong docs/research/market-insights-spec.md) → raw items
    - kind: "market-summary" | "submarket-metrics" | "timeseries" | "market-score"
    - Rate chậm (con người đọc), 1 lần/tuần là đủ (số LTM không đổi nhanh)

Track B (khi MCP tools live — đường chính thức):
  collectors/airdna-mcp.ts — HTTP MCP client, OAuth token user đăng nhập 1 lần
  → cùng raw snapshot format → thay Track A dần dần

one-invest:
  db: migration 007_airdna_reference.sql
    airdna_ref_metrics(area_key, metric, period_kind, period, value, unit,
                       captured_at, source_snapshot)   -- LTM + monthly
    airdna_ref_scores(area_key, score, investability, regulation, captured_at)
    airdna_calibration(market, metric, our_basis, airdna_value, ratio, updated_at)
  transform-airdna.mjs: map AirDNA area keys → areas (Hà Nội + quận,
    fuzzy theo tên như OSM matching)
  UI (trang area): section "Đối chiếu AirDNA" — bảng 3 cột:
    [chỉ số | One Invest (tự thu) | AirDNA (LTM) | chênh lệch %]
    + badge Market Score + "dữ liệu AirDNA cập nhật YYYY-MM-DD"
  UI (trang market): card "Sức khoẻ hiệu chuẩn" — ratio trung bình + cảnh báo
    khi lệch >20% ("nên kiểm tra pipeline")
```

## 4. Kế hoạch thực thi (đề xuất)

Giai đoạn 0 — user làm 1 lần: mua gói, đăng nhập app.airdna.co trong Chrome
profile sẽ dùng cho collector (hoặc CDP tab), xác nhận thấy trang VN.
Giai đoạn 1 (1 buổi): collector Track A cho HÀ NỘI market + các quận đã có
(trọng tâm 34 quận có polygon), capture summary + score; bảng + UI section.
Giai đoạn 2: timeseries + pacing; bảng calibration tự tính ratio; badge trên
market page; cron tuần (thứ 7).
Giai đoạn 3: mở rộng submarkets đủ 30 quận + HCMC khi làm city thứ 2; chuyển
Track B khi MCP live.

Định nghĩa "đạt": trang /vn/hanoi và mỗi submarket có section đối chiếu với số
AirDNA ≤7 ngày tuổi; ratio ADR/occ hiển thị; user không cần mở AirDNA để biết
Market Score của bất kỳ quận nào đang theo dõi.

## 5. Rủi ro & xử lý

- Gói Research có thể giới hạn số submarket xem chi tiết → ưu tiên quận trọng
  điểm (top revenue), capture luân phiên.
- Cấu trúc trang/API AirDNA đổi → collector là plugin riêng, sửa 1 file;
  raw snapshot giữ nguyên để re-parse.
- MCP live giữa chừng → Track B song song, không phá Track A (cùng schema).
- ToS: dùng cá nhân, tự động hoá việc user vẫn đọc được bằng tay — không
  republish ra ngoài One Invest (phi thương mại, theo scope dự án).
