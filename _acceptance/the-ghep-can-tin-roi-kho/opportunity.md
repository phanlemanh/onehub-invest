---
schema_version: 1
slug: the-ghep-can-tin-roi-kho
feature: Thẻ ghép căn có một bên đã rời kho (khoá tin không còn trong sale_offers) tự rút khỏi hàng duyệt kèm lý do có tên, không hiện cho người duyệt
owner: phanlemanh@gmail.com
stage: decided
decision: build
decided_by: giám sát theo lời Mạnh 30/10 «Các điều còn lại theo đề xuất» (docs/research/audit-hang-duyet-3010.md §7)
decided_at: 2026-10-31T01:00:10Z
prototype:
  base_commit: 6b610913
  disposition: archive
lo_trinh_ma: HD3
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng HD3 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/hang-duyet-ghep-can.md#e02a9b3cd0d995c8c8045119584ea278658de6a1` — chưa có trang: trang đợt hang-duyet-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Thẻ ghép căn có một bên đã rời kho (khoá tin không còn trong sale_offers) tự rút khỏi hàng duyệt kèm lý do có tên, không hiện cho người duyệt

Vì sao: Audit hàng duyệt 30/10 (docs/research/audit-hang-duyet-3010.md §1, H1): 12 thẻ trỏ khoá S05 đã chết sau PL14, người duyệt quyết trên dữ liệu không còn.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Sau một lượt đêm: 0 thẻ chờ duyệt trỏ khoá tin không còn sống; mỗi thẻ rút có lý do «tin rời kho» và vết audit; chạy lại không rút trùng» chưa?
- Kết quả nào là SỐNG: [đề xuất] Sau một lượt đêm: 0 thẻ chờ duyệt trỏ khoá tin không còn sống; mỗi thẻ rút có lý do «tin rời kho» và vết audit; chạy lại không rút trùng
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Sau một lượt đêm: 0 thẻ chờ duyệt trỏ khoá tin không còn sống; mỗi thẻ rút có lý do «tin rời kho» và vết audit; chạy lại không rút trùng» khi hết timebox
- Timebox: một vòng feature-loop (dãy P3, đợt hang-duyet-3010).

## Quyết định Cổng Đáng

- **decision = build** Căn cứ: lời Mạnh 30/10 ở `docs/research/audit-hang-duyet-3010.md` §7 (PR #217), nguyên văn «Các điều còn lại theo đề xuất» — cắt ba đợt, HD3 thuộc đợt 1. Giám sát ghi ở trả lời yêu cầu P3-130 (01:00:10Z).
- **disposition = archive** Căn cứ: không có prototype.
- **Ngưỡng UAT chốt cùng lúc ký:** không đo được bằng người dùng (việc nội bộ của luồng duyệt); ngưỡng là `bat_khi` của hàng ở trên.
