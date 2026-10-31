---
schema_version: 1
slug: judge-evidence-du-truong
feature: Bộ đánh giá ghép căn ghi vào evidence của thẻ đủ mười trường mà bảng so trên thẻ hiện, mỗi trường kèm giá trị của cả hai tin
owner: phanlemanh@gmail.com
stage: decided
decision: build
decided_by: giám sát theo lời Mạnh 30/10 «Các điều còn lại theo đề xuất» (docs/research/audit-hang-duyet-3010.md §7)
decided_at: 2026-10-30T22:35:48Z
prototype:
  base_commit: 2d248ffd
  disposition: archive
lo_trinh_ma: HD1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng HD1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/hang-duyet-ghep-can.md#e02a9b3cd0d995c8c8045119584ea278658de6a1` — chưa có trang: trang đợt hang-duyet-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Bộ đánh giá ghép căn ghi vào evidence của thẻ đủ mười trường mà bảng so trên thẻ hiện, mỗi trường kèm giá trị của cả hai tin

Vì sao: Audit hàng duyệt 30/10 (docs/research/audit-hang-duyet-3010.md §3, H8): evidence của PL25 ghi 8 khoá trong khi bảng so có 10 hàng, nên thẻ thiếu trường người duyệt cần.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Gieo lại một lô thẻ: mọi thẻ mới có đủ mười khoá của bảng so cho cả Tin A và Tin B (giá trị hay null tường minh); thẻ cũ không bị sửa» chưa?
- Kết quả nào là SỐNG: [đề xuất] Gieo lại một lô thẻ: mọi thẻ mới có đủ mười khoá của bảng so cho cả Tin A và Tin B (giá trị hay null tường minh); thẻ cũ không bị sửa
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Gieo lại một lô thẻ: mọi thẻ mới có đủ mười khoá của bảng so cho cả Tin A và Tin B (giá trị hay null tường minh); thẻ cũ không bị sửa» khi hết timebox
- Timebox: một vòng feature-loop (dãy P3, đợt hang-duyet-3010).

## Quyết định Cổng Đáng

- **decision = build** Căn cứ: lời Mạnh 30/10 ở `docs/research/audit-hang-duyet-3010.md` §7 (PR #217), nguyên văn «Các điều còn lại theo đề xuất» — cắt ba đợt, đợt 1 trước; HD1 thuộc đợt 1. Giám sát ghi ở trả lời yêu cầu P3-128 (22:35:48Z).
- **disposition = archive** Căn cứ: không có prototype.
- **Ngưỡng UAT chốt cùng lúc ký:** không đo được bằng người dùng (việc nội bộ của luồng duyệt); ngưỡng là `bat_khi` của hàng ở trên.
