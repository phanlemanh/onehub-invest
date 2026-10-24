---
schema_version: 1
slug: dq-moi-nhat-moi-kiem
feature: Người vận hành mở «Kiểm chất lượng» trên /ops/quality thấy bản mới nhất của mỗi kiểm theo từng thực thể, số kiểm đếm đúng, và kết quả độ phủ không ghi «Đạt» xanh khi độ phủ 0%
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P4-14) theo lệnh Mạnh 24/10
decided_at: 2026-10-24T14:19:19Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON9
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON9 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành mở «Kiểm chất lượng» trên /ops/quality thấy bản mới nhất của mỗi kiểm theo từng thực thể, số kiểm đếm đúng, và kết quả độ phủ không ghi «Đạt» xanh khi độ phủ 0%

Vì sao: OPS-10: «pass» của truthful-coverage nghĩa là có số tham chiếu tươi, không phải độ phủ đạt; ORDER BY checked_at DESC LIMIT 20 đẩy mọi kiểm khác ra ngoài, «20 kiểm» là LIMIT. Gốc G2 + G4.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «DB có ≥2 loại kiểm: bảng hiện đủ loại, mỗi (kiểm, thực thể) một dòng mới nhất; dòng độ phủ 0% không mang badge xanh» chưa?
- Kết quả nào là SỐNG: [đề xuất] DB có ≥2 loại kiểm: bảng hiện đủ loại, mỗi (kiểm, thực thể) một dòng mới nhất; dòng độ phủ 0% không mang badge xanh
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «DB có ≥2 loại kiểm: bảng hiện đủ loại, mỗi (kiểm, thực thể) một dòng mới nhất; dòng độ phủ 0% không mang badge xanh» khi hết timebox
- Timebox: …
