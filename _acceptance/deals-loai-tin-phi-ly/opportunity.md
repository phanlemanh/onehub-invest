---
schema_version: 1
slug: deals-loai-tin-phi-ly
feature: Người vận hành mở «Căn giá tốt» /ops/deals không thấy căn có diện tích hay số phòng phi lý, danh sách không dồn ở trần giảm giá, và thẻ ghi «đăng 1 lần» thay «mới»
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P4-10) theo lệnh Mạnh 24/10
decided_at: 2026-10-24T11:34:14Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON11
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON11 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành mở «Căn giá tốt» /ops/deals không thấy căn có diện tích hay số phòng phi lý, danh sách không dồn ở trần giảm giá, và thẻ ghi «đăng 1 lần» thay «mới»

Vì sao: OPS-12: 30 thẻ gần như toàn S03 giảm 41–50%, 36 m² 3PN, thẻ thiếu diện tích vẫn có giá/m²; sắp discount DESC nên tin ngoại lai lên đầu; «mới» thật ra là «chưa đăng lại». Thước theo phường × loại hình là PL26 (đợt phan-loai). Gốc G4.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Tin 36 m² 3PN hay thiếu diện tích không lên danh sách, có dòng audit lý do; đầu danh sách không còn dồn ở mức trần guard» chưa?
- Kết quả nào là SỐNG: [đề xuất] Tin 36 m² 3PN hay thiếu diện tích không lên danh sách, có dòng audit lý do; đầu danh sách không còn dồn ở mức trần guard
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Tin 36 m² 3PN hay thiếu diện tích không lên danh sách, có dòng audit lý do; đầu danh sách không còn dồn ở mức trần guard» khi hết timebox
- Timebox: …
