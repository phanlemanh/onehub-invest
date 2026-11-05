---
schema_version: 1
slug: noi-du-an-s08-khu-do-thi
feature: Mỗi dự án S08 của lát Ocean Park 1 và Grand Park nối vào đúng một khu đô thị, không còn bí danh dự án trùng mã toà, area_ids OCP1–3 khớp nguồn xác minh
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # Mạnh chốt chuỗi gắn căn gồm DN1, ROADMAP §3 mục 30
decided_by: Mạnh 04/11 «Gộp, làm đầu tiên» (chuỗi GC0, GCQ1, GCQ2, GC1, DN1… ở ROADMAP §3 mục 30); ngưỡng dưới duyệt ở Cổng Phạm vi
decided_at: 2026-11-04T09:00:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DN1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DN1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/danh-ba-nha.md#b66f4e4c2d0531d41fd8d22ba7e7a1c74c771f11` · `onehub-invest-tri-thuc:wiki/chu-de/gan-can-s03.md#6c0cf105d554e17be3322218d457f5e33e85bc97` — chưa có trang: trang đợt danh-ba-nha-0311
Mốc: Việc đầu tiên sau 05/11: tin căn hộ S03 gắn được toà hoặc trục, diện tích suy ra hiện có nhãn, bắt đầu từ Ocean Park — chưa có ngày.

Mỗi dự án S08 của lát Ocean Park 1 và Grand Park nối vào đúng một khu đô thị, không còn bí danh dự án trùng mã toà, area_ids OCP1–3 khớp nguồn xác minh

Vì sao: Đo 03/11: 3/150 dự án S08 khớp asset_nodes đúng tên hoặc bí danh, một dự án có thể bị tách nhiều tên. Tách từ DB1 để DB1 không phình.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: đã đạt «Mọi dự án S08 của lát nối đúng một khu đô thị hoặc nằm trong danh sách chưa nối có lý do; 0 bí danh dự án trùng mã toà» chưa?
- Kết quả nào là SỐNG: Mọi dự án S08 của lát nối đúng một khu đô thị hoặc nằm trong danh sách chưa nối có lý do; 0 bí danh dự án trùng mã toà
- Kết quả nào là CHẾT: chưa đạt «Mọi dự án S08 của lát nối đúng một khu đô thị hoặc nằm trong danh sách chưa nối có lý do; 0 bí danh dự án trùng mã toà» khi hết timebox
- Timebox: một vòng T2.
