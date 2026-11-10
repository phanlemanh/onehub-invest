---
schema_version: 1
slug: tin-so-cap-s08
feature: Quỹ căn chủ đầu tư S08 thành tin sơ cấp gắn đúng căn, mang giá chủ đầu tư và trạng thái quỹ, và không xuất hiện ở danh sách Bán, thước giá hay metrics
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh chốt gói danh bạ dự án toàn diện 09/11 «Theo khuyến nghị» (Q1–Q9) và bảo «Gửi cho Giám Sát mở phiên thực hiện»; giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-09T15:25:52Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Mạnh 09/11 Q3: giá là trường của tin (ADR-0013 câu 1), nên quỹ căn chủ đầu tư là tin sơ cấp, giữ được lịch sử giá chủ đầu tư; DA13 hứa hiện giá chủ đầu tư và quỹ căn mà trước đó chưa hàng nào dựng đường dữ liệu. Mục 39 Hỏi-3 giữ: không vào Bán, thước, metrics.

Hàng DA17 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Dãy A. Hạng T3: thêm loại tin và chạm truy vấn Invest. MarketTier là extension (RESO NewConstructionYN khác nghĩa); giá thanh toán sớm là extension EarlyPaymentPrice; ngày nhận nhà dùng RESO AvailabilityDate.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] 0 tin sơ cấp trong truy vấn danh sách Bán, thước giá, pipeline/sql 300 và 400; mỗi mã S08 còn quỹ có đúng một tin sơ cấp mang MarketTier = so_cap và StandardStatus chuẩn (ComingSoon, Active, Pending, Closed); snapshot sau đổi trạng thái thì tin đổi trạng thái, không sinh tin mới?
- Kết quả nào là SỐNG: [đề xuất] 0 tin sơ cấp trong truy vấn danh sách Bán, thước giá, pipeline/sql 300 và 400; mỗi mã S08 còn quỹ có đúng một tin sơ cấp mang MarketTier = so_cap và StandardStatus chuẩn (ComingSoon, Active, Pending, Closed); snapshot sau đổi trạng thái thì tin đổi trạng thái, không sinh tin mới
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
