---
schema_version: 1
feature: ca «AC-6 để sau» của agent/tests/enrich-db.test.ts khoanh lượt backlog vào tin của chính ca — hết đỏ ngẫu nhiên trên DB :5433 dùng chung
slug: enrich-db-test-khoanh-tin
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-26T01:11:32Z
approved_by:
approved_at:
---

# Acceptance Contract: enrich-db-test-khoanh-tin

## Context

Ghim lại hồ sơ `che-do-thu-tren-ops` (#113) trên main 106cbd3 đỏ hai lượt ở `cd agent && npm test`, ca «AC-6 để sau: lượt
backlog sau luôn mở lại thẻ…» (`agent/tests/enrich-db.test.ts`). Ca gọi `runEnrich({ limit: 1 })` không chỉ định `offerIds`
(đúng điều AC-6 của hồ sơ enrich đo), nhưng `selectOffers` (`agent/src/enrich/run.ts`) đặt MỌI tin «hoãn» (đề xuất chờ, thẻ không
còn pending) lên đầu rồi bốc `random()`. DB :5433 dùng chung đang có sẵn 2 tin như vậy, nên lượt bốc tin của ca chỉ ~1/3 số lần:
bản trên main đỏ 6/8 lần chạy riêng. Giám sát giao P4 sửa (lối a), chỉ sửa test, không đụng mã sản phẩm.

## Criteria

- AC-1: Given DB local :5433 dùng chung (có sẵn tin «hoãn» khác), When chạy `cd agent && npm test` ba lần liên tiếp, Then cả ba lần
  xanh trọn bộ, 0 ca đỏ.
- AC-2: Given bản sửa, When chạy riêng ca «AC-6 để sau: lượt backlog» tám lần, Then tám lần xanh; ca vẫn gọi lượt backlog KHÔNG
  `offerIds` và khẳng định hàng ưu tiên chỉ còn tin của ca trước khi chạy lượt.
- AC-3: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có `agent/tests/enrich-db.test.ts`, hồ sơ này, `_acceptance/config.yaml`
  và tệp máy sinh; diff của tệp test không xoá hay sửa dòng nào, chỉ thêm.

## Coverage

- Bỏ coverage-scan — vòng sửa một ca test; trục: xanh lặp lại (AC-1, AC-2), giữ đúng ý đo của ca (AC-2), không lén sửa mã (AC-3).

## Out of scope

- Hàm `selectOffers` và luật «tin hoãn đi trước» của `agent/src/enrich/run.ts` — không đổi.
- Cách ly toàn bộ test agent khỏi DB dùng chung (lược đồ tạm) — việc riêng nếu còn ca khác lộ.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-10-26:
  - Ngoài-1: Script đo E2 in số lời gọi runEnrich trong ca nhưng không so với số cần có, nên mất vòng lượt dry thì script vẫn xanh.
  - Ngoài-2: Câu kiểm «năm lượt dry bốc đúng tin của ca» chỉ được thử đỏ bằng tay (ghi trong sổ), script đo không tự chạy phép thử đó.
  - Ngoài-4: Phép đếm tin «hoãn» khác của script đối chứng lỏng hơn luật chọn tin thật, nên đối chứng có thể báo đỏ oan khi DB có tin hoãn thiếu nội dung.
  - Ngoài-5: Dòng chú thích đầu script đo E2 từng ghi đối chứng với origin/main; đã sửa sang bản ghim 106cbd3.
  - Ngoài-6: Cùng gốc Ngoài-4 — đối chứng có thể đỏ oan trên dữ liệu đặc biệt.
  - Ngoài-7: Script đối chứng chép lại một phần luật chọn tin, có thể lệch khi luật gốc đổi.
  - Ngoài-8: Trên DB không có tin «hoãn» khác, đối chứng in «không áp dụng» và E2 đạt mà không chứng được bản sửa tốt hơn bản cũ.
  - Ngoài-9: Đối chứng từng theo origin/main đang trôi; đã ghim 106cbd3 nên lượt ghim lại sau merge không còn đỏ vì cớ này.
  - Ngoài-11: Đối chứng phụ thuộc trạng thái DB dùng chung lúc chạy, không tái lập tất định.
