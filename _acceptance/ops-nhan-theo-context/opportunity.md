---
schema_version: 1
slug: ops-nhan-theo-context
feature: Người vận hành đọc cổng Ops thấy nhãn theo CONTEXT.md, không chữ tiếng Anh hay mã thô, chi tiết kiểm chất lượng diễn giải tiếng Việt, tên thị trường có dấu đầy đủ
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON12
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON12 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành đọc cổng Ops thấy nhãn theo CONTEXT.md, không chữ tiếng Anh hay mã thô, chi tiết kiểm chất lượng diễn giải tiếng Việt, tên thị trường có dấu đầy đủ

Vì sao: OPS-17: «Review Queue» (_Avoid_), «Occupancy» (đúng là «Công suất»), «Offers tầng P1/P2», mã thô bait_gap / truthful-coverage / our=0, «Toggle Sidebar», tên market không dấu hoặc bị cắt. Gốc G6.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Quét chữ hiển thị của 7 trang Ops: 0 từ trong cột _Avoid_ của CONTEXT.md, 0 mã thô DQ; nhãn sr-only của thanh bên tiếng Việt» chưa?
- Kết quả nào là SỐNG: [đề xuất] Quét chữ hiển thị của 7 trang Ops: 0 từ trong cột _Avoid_ của CONTEXT.md, 0 mã thô DQ; nhãn sr-only của thanh bên tiếng Việt
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Quét chữ hiển thị của 7 trang Ops: 0 từ trong cột _Avoid_ của CONTEXT.md, 0 mã thô DQ; nhãn sr-only của thanh bên tiếng Việt» khi hết timebox
- Timebox: …
