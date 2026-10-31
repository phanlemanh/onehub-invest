---
schema_version: 1
slug: judge-luat-loai-tru-dac-trung
feature: Bộ đánh giá ghép căn loại trừ tất định một cặp khi một đặc trưng nhà khác rõ (số nhà, phòng ngủ, diện tích, ngang×dài, tầng, toạ độ), ghi đặc trưng nào khác vào evidence
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T16:00:00Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: HD2
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng HD2 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/hang-duyet-ghep-can.md#e02a9b3cd0d995c8c8045119584ea278658de6a1` — chưa có trang: trang đợt hang-duyet-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.
Cổng Đáng: build — Mạnh quyết ở §7.1 của `docs/research/audit-hang-duyet-3010.md` (#6 «Chỉ cần một đặc trưng khác là khả năng rất cao không cùng căn»; cắt ba đợt theo đề xuất); giám sát chuyển HD2 từ P3 sang U2 (31/10).

Bộ đánh giá ghép căn loại trừ tất định một cặp khi một đặc trưng nhà khác rõ (số nhà, phòng ngủ, diện tích, ngang×dài, tầng, toạ độ), ghi đặc trưng nào khác vào evidence

Vì sao: Audit hàng duyệt 30/10 (docs/research/audit-hang-duyet-3010.md §7): Mạnh nhận trùng qua đặc trưng nhà — chỉ cần một đặc trưng khác là gần như chắc không cùng căn; 10 lần từ chối đều nêu ít nhất một đặc trưng khác.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên các cặp Mạnh đã từ chối có ghi đặc trưng khác, luật cho ra «khác căn» ở mọi cặp có đủ đặc trưng hai bên; trên cặp đã nhận, luật không loại cặp nào; đặc trưng thiếu một bên không bao giờ thành lý do loại» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên các cặp Mạnh đã từ chối có ghi đặc trưng khác, luật cho ra «khác căn» ở mọi cặp có đủ đặc trưng hai bên; trên cặp đã nhận, luật không loại cặp nào; đặc trưng thiếu một bên không bao giờ thành lý do loại
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên các cặp Mạnh đã từ chối có ghi đặc trưng khác, luật cho ra «khác căn» ở mọi cặp có đủ đặc trưng hai bên; trên cặp đã nhận, luật không loại cặp nào; đặc trưng thiếu một bên không bao giờ thành lý do loại» khi hết timebox
- Timebox: …
