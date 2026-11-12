---
schema_version: 1
slug: khoa-gop-can-khong-gia
feature: Mỗi tin thuộc nhiều nhất một căn, và đổi giá một tin không sinh căn mới
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build
decided_by: Mạnh
decided_at: 2026-11-12
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DA6
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Cổng Đáng

Mạnh trả lời ở phiên giám sát đợt ngày 12/11, câu hỏi «Cho làm DA5, DA6 và PL20 (ba Cổng Đáng của chuỗi định vị căn)?»: «Làm cả ba».

## Vấn đề & ai gặp

Mở từ hàng DA6 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/danh-ba-du-an.md#cc5a831db25ee1071ba8fee913a250b558c97b07` — chưa có trang: trang đợt danh-ba-du-an-0811
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Mỗi tin thuộc nhiều nhất một căn, và đổi giá một tin không sinh căn mới

Vì sao: Khoá Stage A của resolve-properties.mjs có giá, trái ADR-0013 câu 3: 1.853 tin đang gắn hơn một căn (27/10 là 247).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «0 tin gắn hơn một căn; chạy resolver hai lần liền, đổi giá một tin thử ra 0 căn mới; căn có sẵn giữ stable_key; có UNIQUE property_offers(offer_id)» chưa?
- Kết quả nào là SỐNG: [đề xuất] 0 tin gắn hơn một căn; chạy resolver hai lần liền, đổi giá một tin thử ra 0 căn mới; căn có sẵn giữ stable_key; có UNIQUE property_offers(offer_id)
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «0 tin gắn hơn một căn; chạy resolver hai lần liền, đổi giá một tin thử ra 0 căn mới; căn có sẵn giữ stable_key; có UNIQUE property_offers(offer_id)» khi hết timebox
- Timebox: …
