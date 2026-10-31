---
schema_version: 1
slug: the-so-doc-gia-tri-song
feature: Người duyệt mở thẻ ghép căn và thấy bảng so đọc giá trị sống của hai tin, ô thiếu một bên hiện «Thiếu» chứ không tính là «Lệch»
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T16:00:00Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: HD6
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng HD6 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/hang-duyet-ghep-can.md#e02a9b3cd0d995c8c8045119584ea278658de6a1` — chưa có trang: trang đợt hang-duyet-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.
Cổng Đáng: build — Mạnh quyết ở §7.1 của `docs/research/audit-hang-duyet-3010.md` (cắt ba đợt theo đề xuất, «các điều còn lại theo đề xuất»); giám sát chuyển chuỗi đợt 2 HD6 → HD7 → HD8 từ U1 sang U2 (31/10).

Người duyệt mở thẻ ghép căn và thấy bảng so đọc giá trị sống của hai tin, ô thiếu một bên hiện «Thiếu» chứ không tính là «Lệch»

Vì sao: Audit hàng duyệt 30/10 (docs/research/audit-hang-duyet-3010.md §3, H9, H10): bảng so đọc evidence đóng băng lúc gieo; «chưa biết» bị đếm như «Lệch» làm người duyệt nghi oan.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: …
- Kết quả nào là SỐNG: 12 thẻ cũ hiện Alert ở bên A; loại hình «Chưa rõ ↔ Nhà riêng» ra Thiếu (câu «Bật khi» của hàng the-so-doc-gia-tri-song, audit §5.1)
- Kết quả nào là CHẾT: …
- Timebox: …
