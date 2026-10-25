---
schema_version: 1
slug: luong-7-ngay-dung-so
feature: "Người vận hành đọc «Luồng 7 ngày qua» trên /ops/collections thấy mỗi cột đếm đúng thứ nhãn nói: tin rao đúng nguồn, đủ 7 ngày từ số máy local đẩy lên (ADR-0014), cột không có dữ liệu trên cloud ghi «chỉ local»"
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON5
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON5 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành đọc «Luồng 7 ngày qua» trên /ops/collections thấy mỗi cột đếm đúng thứ nhãn nói: tin rao đúng nguồn, đủ 7 ngày từ số máy local đẩy lên (ADR-0014), cột không có dữ liệu trên cloud ghi «chỉ local»

Vì sao: OPS-8: cột offer đếm sale_offers mọi nguồn (lớn hơn số post — vô lý), facts chỉ đẩy một ngày, bảng thô trên cloud 0 dòng nên cột luôn 0. Gốc G1 + G4.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Ngày có tin S03 qua cổng: cột tin rao bằng số tin S03 của ngày đó, không lớn hơn số post; facts có 7 khoá ngày; cột thô trên cloud ghi «chỉ local»» chưa?
- Kết quả nào là SỐNG: [đề xuất] Ngày có tin S03 qua cổng: cột tin rao bằng số tin S03 của ngày đó, không lớn hơn số post; facts có 7 khoá ngày; cột thô trên cloud ghi «chỉ local»
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Ngày có tin S03 qua cổng: cột tin rao bằng số tin S03 của ngày đó, không lớn hơn số post; facts có 7 khoá ngày; cột thô trên cloud ghi «chỉ local»» khi hết timebox
- Timebox: …
