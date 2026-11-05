---
schema_version: 1
slug: doc-so-m2-bi-sot
feature: Bài S03 ghi diện tích không đơn vị sau nhãn «Diện tích» hay bằng chữ kiểu Unicode được đọc ra area_m2 như bài ghi m² thường
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # Mạnh chốt chuỗi gắn căn gồm GC1, ROADMAP §3 mục 30
decided_by: Mạnh 04/11 «Gộp, làm đầu tiên» (chuỗi GC0, GCQ1, GCQ2, GC1… ở ROADMAP §3 mục 30); ngưỡng dưới duyệt ở Cổng Phạm vi
decided_at: 2026-11-04T09:00:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: GC1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng GC1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt gan-can-s03-0411, mã GC1
Mốc: Việc đầu tiên sau 05/11: tin căn hộ S03 gắn được toà hoặc trục, diện tích suy ra hiện có nhãn, bắt đầu từ Ocean Park — chưa có ngày.

Bài S03 ghi diện tích không đơn vị sau nhãn «Diện tích» hay bằng chữ kiểu Unicode được đọc ra area_m2 như bài ghi m² thường

Vì sao: Đo 04/11: 14/2.175 tin thiếu m² thật ra có số trong chữ. Sửa rẻ, không phụ thuộc chuỗi gắn căn.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: đã đạt «tin đo có đúng số trong bài; băm area_m2 của các tin khác không đổi; «hdt 21 triệu» không thành diện tích» chưa?
- Kết quả nào là SỐNG: tin đo có đúng số trong bài; băm area_m2 của các tin khác không đổi; «hdt 21 triệu» không thành diện tích
- Kết quả nào là CHẾT: chưa đạt «tin đo có đúng số trong bài; băm area_m2 của các tin khác không đổi; «hdt 21 triệu» không thành diện tích» khi hết timebox
- Timebox: một vòng T2.
