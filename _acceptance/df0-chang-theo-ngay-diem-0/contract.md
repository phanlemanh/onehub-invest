---
schema_version: 1
feature: Biểu đồ «Chặng theo ngày» trên /ops/data-flow vẽ đủ mọi ngày của cửa sổ, ngày nguồn im là điểm 0
slug: df0-chang-theo-ngay-diem-0
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: approved
design_doc: docs/superpowers/specs/2026-10-27-df0-chang-theo-ngay-diem-0-design.md
approved_by: Mạnh
approved_at: 2026-10-26T23:45:57Z
---

# Acceptance Contract: df0-chang-theo-ngay-diem-0

## Context

Căn cứ: Ngoài-8 của `ops-dong-chay-df0` — Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 26/10
(`_acceptance/ops-dong-chay-df0/decisions.jsonl`, dòng «Ngoài-8: mở hợp đồng mới»); hàng U2 2.3 của đợt
dieu-phoi-dot0-cam-mau (LUAT.md mục «Hàng tách từ Cổng Bằng chứng DF0»).

`StageTrendChart` lấy trục ngày từ các ngày có số rồi cắt đuôi theo số ngày của cửa sổ, nên ngày nguồn im biến mất và
khi thu ngừng thì ngày cũ hơn cửa sổ lấp chỗ — biểu đồ trông bình thường đúng lúc nguồn đã im. Người gặp: người vận
hành nhìn trang ở máy thu.

## Criteria

- AC-1: Given ma trận viết trước các mẫu ngày (lỗ giữa cửa sổ; im ba ngày cuối; nhiều nguồn cùng một ngày; một ngày có số), When `dailySeries(days, nowMs, 7)` chạy, Then ra ĐÚNG 7 điểm là 7 ngày giờ VN liên tiếp kết thúc ở ngày VN của `nowMs`, mỗi điểm bằng tổng bốn chặng của mọi nguồn trong ngày đó, ngày không có số = 0 ở cả bốn chặng — so trọn với bảng mong đợi viết trước.
- AC-2: Given số chỉ có ở ngày CŨ HƠN cửa sổ (ngày gần nhất có số là 10 ngày trước), When `dailySeries(…, 7)` chạy, Then 7 điểm đều 0 — không ngày nào ngoài cửa sổ lọt vào; chiều đỏ: thuật toán cũ trên cùng mẫu ra các ngày ngoài cửa sổ và ca đỏ với tên mẫu.
- AC-3: Given `nowMs` ở ranh giới nửa đêm giờ VN (16:59:59Z và 17:00:00Z cùng một ngày UTC), When `dailySeries` chạy, Then ngày cuối là ngày VN (đổi đúng lúc 00:00 giờ VN), không phải ngày UTC.
- AC-4: Given `windowDays` 7 và 30, When `dailySeries` chạy trên cùng dữ liệu, Then ra đúng 7 và 30 điểm, khoá ngày liên tiếp không trùng không sót.
- AC-5: Given mọi điểm của chuỗi đều 0, When dựng `StageTrendChart`, Then hiện câu «Chưa có số theo ngày trong khoảng này.» (theo khuyến nghị Hỏi-1); Given ít nhất một điểm khác 0, Then không hiện câu đó.
- AC-6: Given `page.tsx`, `data-flow-view.tsx` và `stage-trend-chart.tsx`, When trang dựng, Then một biến mốc duy nhất của request được truyền cho cả `getDataFlow` lẫn `DataFlowView`, `StageTrendChart` nhận đúng mốc đó và vẽ từ `dailySeries`, không còn lấy trục từ các ngày có số (judgment trên ba tệp).
- AC-7: Given trang `/ops/data-flow?window=30d` ở máy thu (dev, tài khoản ops thử), When nhìn «Chặng theo ngày», Then trục ngày bắt đầu 29 ngày trước hôm nay giờ VN (30 điểm tính cả hôm nay, không phải ngày có bài đầu tiên); ngày nào trong cửa sổ có tooltip 0 ở cả bốn chặng thì đường nằm sát trục ở ngày đó (ui-check, ảnh chụp).
- AC-8: Given mọi giá trị cửa sổ của trang (rút từ kiểu `FlowWindow` qua `parseFlowWindow`, không gõ tay), When `chartDaysOf(window)` đổi cửa sổ thành số ngày của biểu đồ, Then 7 ngày → 7, 30 ngày → 30, «Tất cả» → 30, và `dailySeries` với số đó ra đúng chừng ấy điểm.

## Coverage

Bỏ quét không gian AC — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`: hai trục (mẫu ngày có/không số
trong và ngoài cửa sổ × độ dài cửa sổ) quét ở AC-1/AC-2/AC-4 bằng ma trận viết trước; trục giờ ở AC-3; trục giá trị cửa sổ ở AC-8.

## Out of scope

- OOS-1: Ô số phía trên của cửa sổ «Tất cả» cộng mọi ngày trong khi biểu đồ chỉ 30 ngày — giữ như cũ.
- OOS-2: Precompute chuỗi ngày ở `pipeline/sql` (luật 10) — DF1.
- OOS-3: Đổi kiểu biểu đồ, màu hay ô số phía trên.

## Notes

- Tệp test riêng `app/tests/df0-chang-theo-ngay.test.tsx`; không chạm tệp test của `ops-dong-chay-df0`.
