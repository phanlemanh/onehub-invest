---
schema_version: 1
slug: stg-du-an-s08
feature: Danh mục cấp dự án của S08 (địa chỉ, chủ đầu tư, điểm toạ độ, hình thức sở hữu, loại hình) nằm trong stg_s08_project, nạp lại không nhân dòng
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DA30
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DA30 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt danh-ba-du-an-toan-dien-0911, mã DA30
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Danh mục cấp dự án của S08 (địa chỉ, chủ đầu tư, điểm toạ độ, hình thức sở hữu, loại hình) nằm trong stg_s08_project, nạp lại không nhân dòng

Vì sao: Kiểm kê 11/11: S08 có 177 dự án kèm địa chỉ, CĐT, điểm (174/177) trong raw nhưng chưa bảng nào đọc — mất lớn nhất ở raw → stg (mô hình danh bạ chặng D1→D2, mục 44)

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «177 dự án S08 có dòng; 174/177 có điểm; nạp lại cùng snapshot 0 dòng mới» chưa?
- Kết quả nào là SỐNG: [đề xuất] 177 dự án S08 có dòng; 174/177 có điểm; nạp lại cùng snapshot 0 dòng mới
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «177 dự án S08 có dòng; 174/177 có điểm; nạp lại cùng snapshot 0 dòng mới» khi hết timebox
- Timebox: …
