---
schema_version: 1
slug: ops-mobile-cot-trang-thai
feature: Người trực mở bảng Ops trên điện thoại 390px thấy cột Trạng thái ngay sau cột tên, không phải cuộn ngang mới thấy Hỏng hay Ổn
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON13
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON13 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người trực mở bảng Ops trên điện thoại 390px thấy cột Trạng thái ngay sau cột tên, không phải cuộn ngang mới thấy Hỏng hay Ổn

Vì sao: OPS-18: bảng Lockdown, Sức khoẻ nguồn, nhóm, Máy móc (Thu thập), DQ, Độ phủ (Chất lượng) đẩy cột Trạng thái khỏi khung ở 390px. Gốc G6.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Ở 390px, cột Trạng thái của 6 bảng nằm trong khung nhìn khi chưa cuộn ngang» chưa?
- Kết quả nào là SỐNG: [đề xuất] Ở 390px, cột Trạng thái của 6 bảng nằm trong khung nhìn khi chưa cuộn ngang
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Ở 390px, cột Trạng thái của 6 bảng nằm trong khung nhìn khi chưa cuộn ngang» khi hết timebox
- Timebox: …
