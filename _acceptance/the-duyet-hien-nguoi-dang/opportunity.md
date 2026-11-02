---
schema_version: 1
slug: the-duyet-hien-nguoi-dang
feature: Người duyệt thấy người đăng của mỗi tin trên thẻ ghép căn (tên, SĐT, số tin đang rao) và nhận ra ngay khi hai tin cùng một người
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T16:00:00Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: HD7
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng HD7 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/hang-duyet-ghep-can.md#e02a9b3cd0d995c8c8045119584ea278658de6a1` — chưa có trang: trang đợt hang-duyet-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.
Cổng Đáng: build — Mạnh quyết ở §7.1 của `docs/research/audit-hang-duyet-3010.md` (câu 1: «**Có** (theo đề xuất, đợt 1 trước)», cắt §5.1 thành ba đợt); giám sát giao hàng HD7 cho U2 sau khi HD6 và HD4 lên `main` (02/11).

Người duyệt thấy người đăng của mỗi tin trên thẻ ghép căn (tên, SĐT, số tin đang rao) và nhận ra ngay khi hai tin cùng một người

Vì sao: Audit hàng duyệt 30/10 (docs/research/audit-hang-duyet-3010.md §3b, H14, H17): thẻ không hiện người đăng; 5/8 ứng viên kế có Tin B từ một tài khoản rao hơn nghìn tin.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: …
- Kết quả nào là SỐNG: thẻ S05 ↔ S06 không bao giờ hiện «Lệch» ở hàng Người đăng; thẻ có Tin B của tài khoản rao hơn nghìn tin hiện badge (câu «Bật khi» của hàng, audit §5.1)
- Kết quả nào là CHẾT: …
- Timebox: …
