---
schema_version: 1
slug: danh-ba-phuong-xa-toan-quoc
feature: "Mọi tin trên 34 tỉnh/thành gắn được tới xã/phường hiện hành: danh bạ đủ 3.321 xã, phường, đặc khu theo mã 5 số của Cục Thống kê, tên xã cũ đọc ra xã mới, ranh giới khớp vào mã"
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build
decided_by: Mạnh
decided_at: 2026-11-07T23:18:38Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition: archive
lo_trinh_ma: PX1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PX1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt danh-ba-0811, mã PX1
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Mọi tin trên 34 tỉnh/thành gắn được tới xã/phường hiện hành: danh bạ đủ 3.321 xã, phường, đặc khu theo mã 5 số của Cục Thống kê, tên xã cũ đọc ra xã mới, ranh giới khớp vào mã

Vì sao: Mạnh 08/11 «Đồng ý»: hiện chỉ có 511 phường ở 4 thành phố (~15%), 30 tỉnh không có xã nào nên thước phường × loại, Căn giá tốt và TV11 trống ở đó.

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | Danh bạ Cục Thống kê (bản đọc 06/11/2026, chép ở kho quy-hang) đúng và đủ 3.321 đơn vị, 34 mã tỉnh khớp 34 thị trường đang có trong `areas` | Gắn tin sai tỉnh hoặc thiếu xã | Đếm theo mã tỉnh, so tên 34 thị trường hiện có | Đã thử 08/11: 3.321 dòng, 34 mã tỉnh, 709 phường · 2.599 xã · 13 đặc khu; 34 thị trường `vn-*` có sẵn |
| 2 | 511 khu vực con đang có (500 phường OSM ở 4 thành phố, 11 khu `airbnb-discovery`) khớp được vào mã mới theo tên trong tỉnh mà không đổi `id` | Đổi `id` làm vỡ tin, metrics, sổ lưu đang trỏ vào | Khớp thử tên 500 phường OSM với danh bạ mã của tỉnh | Chưa thử |
| 3 | Tên xã cũ đọc ra xã mới chỉ an toàn khi xã cũ vào trọn một xã mới; 441 xã cũ bị tách thì không đoán | Tin rơi vào xã sai | Đếm `vao` > 1 trong bảng chuyển đổi | Đã thử 08/11: 441 xã cũ bị tách |
| 4 | Tin ngoài 4 thành phố hiện rất ít, nên lợi ích đo được ngay nằm ở tin đang chỉ gắn tỉnh | Đo trước/sau không thấy đổi | Đếm tin theo tỉnh, theo cấp khu vực | Đã thử 08/11: HCM 59.829 tin (94,7% có xã), HN 10.221 (86,6%), ĐN 8.246 (100%), Hưng Yên 46 (0%), 233 tin không tỉnh |

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: Sau khi nạp, mỗi tỉnh trong 34 tỉnh có đủ xã/phường hiện hành mang mã 5 số chưa, và tin đọc được tên xã (mới hoặc cũ) có gắn tới xã không?
- Kết quả nào là SỐNG: `areas` có đúng 3.321 khu vực con mang mã 5 số, mỗi khu vực nằm dưới đúng thị trường của mã tỉnh; 10.033 tên xã cũ thành bí danh; 441 xã cũ bị tách trả «cần chọn xã», không đoán; tỉ lệ tin gắn được xã đo trước/sau theo tỉnh: không tỉnh nào giảm, tin đang chỉ gắn tỉnh mà bài nêu tên xã cũ được gắn xuống xã; chạy lại bộ nạp lần hai không đổi dòng nào; 511 khu vực con cũ giữ nguyên `id`.
- Kết quả nào là CHẾT: thiếu hoặc thừa đơn vị so với 3.321; một khu vực gắn sai tỉnh; tỉnh nào mất tin đang có xã; bộ nạp đoán xã cho tên cũ bị tách; chạy lại đổi dữ liệu; `id` khu vực cũ bị đổi.
- Timebox: hai ngày máy (S1 tới S4 hai lượt chấm), không tính thời gian chờ chữ ký.

## Kết quả prototype

Không dựng prototype: việc là nạp danh bạ có nguồn chính thức, đo trực tiếp trên DB thử.

## Nguồn ngoài & phạm vi kế thừa

| Món vật liệu | Nguồn (đường dẫn/tên gói) | Phân loại | Kế thừa? | Người ký |
|---|---|---|---|---|
| Danh bạ 3.321 xã, 34 tỉnh, 10.033 xã cũ, 63 tỉnh cũ (`xa.json`, `xa-cu.json`, `tinh-cu.json`) | repo riêng `phanlemanh/onehub-quy-hang`, `packages/core/src/address/du-lieu/` (sinh từ tệp Cục Thống kê, QĐ 19/2025 và bảng chuyển đổi sửa 23/10/2025) | triết-lý/logic (dữ liệu tham chiếu) | có — chép DỮ LIỆU kèm sha256 và sha commit nguồn, không chép code | — |
| Bộ đọc địa chỉ `doc-dia-chi.ts`, `chuan-hoa.ts` | cùng kho | triết-lý/logic | không — không chép code; luật khớp viết lại trong pipeline | — |
| Ranh giới xã | OpenStreetMap, bảng `stg_osm_boundaries` (đang có 752 ranh giới cấp 6 ở 4 thành phố) | triết-lý/logic | có — khớp ranh giới vào mã theo tên trong tỉnh; thu thêm OSM cho 30 tỉnh là làn ZCode, không thuộc hàng này | — |

## Cổng 0

- **decision = build** (Mạnh gõ «build» ở phiên N1 08/11; ngưỡng theo đề xuất) Căn cứ: Mạnh 08/11 «Đồng ý» (ROADMAP §3 mục 34–37); 30 tỉnh hiện không có xã nào nên thước phường × loại, Căn giá tốt, TV11 trống ở đó.
- **disposition = archive** Căn cứ: không có code prototype.
- **Ngưỡng UAT chốt cùng lúc ký:** như mục Ngưỡng ở trên.

## Thước đo thành công → ứng viên criterion

- Số khu vực con có mã 5 số theo tỉnh = số xã của tỉnh trong danh bạ (3.321 tổng) → AC đếm.
- Số bí danh tên cũ = 10.033, số «cần chọn xã» = 441 → AC bí danh.
- Tỉ lệ tin gắn được xã theo tỉnh, trước/sau → AC đo trước/sau.
- Chạy lại bộ nạp: 0 dòng đổi → AC idempotent.
