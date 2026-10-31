---
schema_version: 1
slug: quyet-dinh-phai-cham-ung-vien
feature: Quyết định trên thẻ ghép căn chỉ được ghi khi nó chạm đúng một ứng viên còn sống; không chạm được thì trả lỗi có tên và không đóng thẻ
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T16:29:25Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: HD9
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng HD9 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/hang-duyet-ghep-can.md#e02a9b3cd0d995c8c8045119584ea278658de6a1` — chưa có trang: trang đợt hang-duyet-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Quyết định trên thẻ ghép căn chỉ được ghi khi nó chạm đúng một ứng viên còn sống; không chạm được thì trả lỗi có tên và không đóng thẻ

Vì sao: Audit hàng duyệt 30/10 (docs/research/audit-hang-duyet-3010.md §1, H2): 11 quyết định cũ chạm 0 ứng viên mà thẻ vẫn đóng — Mạnh duyệt bỏ 11 quyết định ấy, không khôi phục.

Cổng Đáng: build — Mạnh quyết ở docs/research/audit-hang-duyet-3010.md §7.1 dòng 1 («Cắt hàng sửa theo ba đợt? — Có, theo đề xuất», 30/10 tối, commit c253cf10); hàng HD9 nằm trong §5.1 (H2), giám sát đợt dot0-cam-mau giao cho dãy P2 ngày 31/10.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Thử quyết trên thẻ trỏ ứng viên đã mất: route trả lỗi có tên, thẻ vẫn chờ, 0 dòng ghi; quyết trên thẻ hợp lệ: đúng một ứng viên đổi trạng thái, có audit» chưa?
- Kết quả nào là SỐNG: [đề xuất] Thử quyết trên thẻ trỏ ứng viên đã mất: route trả lỗi có tên, thẻ vẫn chờ, 0 dòng ghi; quyết trên thẻ hợp lệ: đúng một ứng viên đổi trạng thái, có audit
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Thử quyết trên thẻ trỏ ứng viên đã mất: route trả lỗi có tên, thẻ vẫn chờ, 0 dòng ghi; quyết trên thẻ hợp lệ: đúng một ứng viên đổi trạng thái, có audit» khi hết timebox
- Timebox: …
