---
schema_version: 1
slug: collections-khong-so-s02
feature: Người vận hành mở /ops/collections không thấy số S02 nào ở biểu đồ, bảng hay panel Rotation; số S02 chỉ ở /ops/quality và tiêu đề biểu đồ nói rõ đang đếm gì
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON6
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON6 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành mở /ops/collections không thấy số S02 nào ở biểu đồ, bảng hay panel Rotation; số S02 chỉ ở /ops/quality và tiêu đề biểu đồ nói rõ đang đếm gì

Vì sao: OPS-14 (luật 5, ToS): tab «Listing» gộp 59.880 listing S02 với 269 listing tự thu, bảng có cột market/listing S02, Rotation liệt market S02 kèm ID. routes.md: số S02 chỉ ở /ops/quality. Gốc G5.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Phép thử tĩnh + render: trang Thu thập không có số bản ghi S02; tab Listing chỉ đếm tự thu; Rotation chỉ còn đếm job» chưa?
- Kết quả nào là SỐNG: [đề xuất] Phép thử tĩnh + render: trang Thu thập không có số bản ghi S02; tab Listing chỉ đếm tự thu; Rotation chỉ còn đếm job
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Phép thử tĩnh + render: trang Thu thập không có số bản ghi S02; tab Listing chỉ đếm tự thu; Rotation chỉ còn đếm job» khi hết timebox
- Timebox: …
