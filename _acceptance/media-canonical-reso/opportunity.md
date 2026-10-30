---
schema_version: 1
slug: media-canonical-reso
feature: Ảnh của tin S03 và S06 nằm ở một bảng media canonical theo RESO Media nối với offer, và /ops/review, /ops/data-flow ở máy thu đọc ảnh từ bảng này
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T00:48:55Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: NH1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng NH1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/nen-tang-2310.md#f1b3e246e47f23674931a2d25a2b4197331a8c94` — chưa có trang: mã TD11
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Ảnh của tin S03 và S06 nằm ở một bảng media canonical theo RESO Media nối với offer, và /ops/review, /ops/data-flow ở máy thu đọc ảnh từ bảng này

Vì sao: Mục chờ NH1 đạt điều kiện mở: ZC4 đã ký, media_files S03 có dòng thật. Đo 30/10: /ops hiện 0 ảnh S06 dù stg có ảnh ở gần mọi tin; ảnh S03 đi loader riêng. Một bảng cho mọi nguồn thay cho loader từng trang (gộp A3 của báo cáo 29/10).

## Ngưỡng chết / ngưỡng UAT

Mạnh chốt ở Cổng Phạm vi 30/10 (Hỏi-2, nhận khuyến nghị).

- Câu hỏi phép đo trả lời: đã đạt «Offer S06 có ảnh trong stg thì thẻ duyệt hiện ≥ 1 ảnh; offer S03 có file local thì hiện ảnh; nạp lại hai lần không nhân dòng; sync cloud không đẩy URL ảnh, leak gate xanh» chưa?
- Kết quả nào là SỐNG: cả bốn vế đạt trước hết 02/11/2026 — ba vế đầu đo trên bản chép DB máy thu (probe AC-7, chụp AC-8), vế leak gate đọc ở lượt sync đêm đầu tiên sau bước triển khai.
- Kết quả nào là CHẾT: còn ít nhất một vế chưa đạt khi hết 02/11/2026. Vế leak gate chưa có lượt sync nào là CHƯA ĐO, không tính SỐNG.
- Timebox: 3 ngày, tới hết 02/11/2026.
