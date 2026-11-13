---
schema_version: 1
slug: s10-bang-hang-vao-danh-ba
feature: Bảng hàng chủ đầu tư S10 (sản phẩm, giá, trạng thái) nạp vào stg_s10 và đọc được ở danh bạ dự án
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DA29
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DA29 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt danh-ba-du-an-toan-dien-0911, mã DA29
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Bảng hàng chủ đầu tư S10 (sản phẩm, giá, trạng thái) nạp vào stg_s10 và đọc được ở danh bạ dự án

Vì sao: Quỹ căn S08, S10 là tin sơ cấp của dự án (DA17; mô hình danh bạ §2, mục 44); bảng hàng S10 chưa có bảng stg nào đọc.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: …
- Kết quả nào là SỐNG: …
- Kết quả nào là CHẾT: …
- Timebox: …
