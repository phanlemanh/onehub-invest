---
schema_version: 1
slug: anh-goc-qua-may-chu
feature: Người duyệt vai ops trên cloud thấy ảnh của tin S06 trên thẻ ghép căn, ảnh đi qua máy chủ chứ không lộ URL nguồn
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build           # Mạnh duyệt cho ảnh S06 đi qua máy chủ (audit hàng duyệt 30/10, lộ trình HD10 vi_sao); giám sát xếp U1 31/10
decided_by: Mạnh
decided_at: 2026-10-30T17:00:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: HD10
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng HD10 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/hang-duyet-ghep-can.md#e02a9b3cd0d995c8c8045119584ea278658de6a1` — chưa có trang: trang đợt hang-duyet-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người duyệt vai ops trên cloud thấy ảnh của tin S06 trên thẻ ghép căn, ảnh đi qua máy chủ chứ không lộ URL nguồn

Vì sao: Audit hàng duyệt 30/10 (docs/research/audit-hang-duyet-3010.md §2, H5): S06 có 0 ảnh local nên vai ops trên cloud không thấy ảnh nào; Mạnh duyệt cho ảnh S06 đi qua máy chủ.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: …
- Kết quả nào là SỐNG: …
- Kết quả nào là CHẾT: …
- Timebox: …
