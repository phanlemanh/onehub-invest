---
schema_version: 1
feature: Người vận hành mở /ops/data-flow trên cloud và thấy số chặng bài → tin rao → căn theo nguồn và số tin từng bậc, cùng số với máy thu, không còn khung «Chỉ xem ở máy thu»
slug: dong-chay-len-cloud
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [ui, db, pipeline]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-27-dong-chay-len-cloud-design.md
approved_by: Mạnh
approved_at: 2026-10-27T03:52:00Z
lo_trinh_ma: DF1
---

# Acceptance Contract: dong-chay-len-cloud

## Context

Căn cứ: hàng DF1 của `docs/plan/lo-trinh.json` (đợt `dong-chay-2710`, PR #153); ô cơ hội
`_acceptance/dong-chay-len-cloud/opportunity.md` (Cổng Đáng build — giám sát theo Mạnh 27/10 «Quyết định đã thống
nhất đội vận hành qua cloud…»); design `docs/superpowers/specs/2026-10-27-dong-chay-len-cloud-design.md`; luật 10
AGENTS.md (số tính sẵn ở pipeline/sql); ADR-0014 (khối số tổng hợp lên cloud). Số migration 051 do điều phối liên làn
cấp 27/10; bảng chỉ ở máy thu theo mẫu rào `stg_s08_inventory` (hồ sơ `stg-s08-inventory` AC-3).

`/ops/data-flow` đọc bảng nạp thô lúc tải trang; bảng đó không lên cloud nên trên prod trang chỉ hiện khung «Chỉ xem
ở máy thu». Người gặp: đội vận hành làm qua cloud.

## Criteria

- AC-1: Given `db/migrations/051_data_flow_snapshot.sql` và `pipeline/sql/600_data_flow.sql` trên lược đồ tạm, When áp migration hai lần rồi chạy 600 hai lần, Then schema trùng sau lần hai; bảng có đúng ba dòng `7d`, `30d`, `all` với `facts` bằng nhau giữa hai lần chạy; 600 chỉ ghi `data_flow_snapshot` (bảng tin chỉ được đọc); trên DB local thật 600 chạy xong trong ≤ 30 giây (thời gian ghi vào bằng chứng).
- AC-2: Given fixture DF0 (`app/tests/ops-dong-chay.test.tsx`), When 600 làm tươi rồi đọc `facts`, Then số mọi cửa sổ khớp bảng mong đợi viết trước của DF-AC-2 (từng nguồn, từng trường, ngày, nhóm, lưu trú ngắn hạn, loại giao dịch); đột biến bỏ vế «không phải bài thử» trong 600 → ca đỏ ghim thông điệp.
- AC-3: Given máy thu, When `getDataFlow` chạy, Then phần tổng hợp chỉ đọc `data_flow_snapshot` (không câu tổng hợp nào chạm `stg_*`); bộ test DF0 giữ xanh; đầu trang ghi «Số tính lúc HH:MM (giờ VN)» theo `computed_at`.
- AC-4 (cross-layer): Given lược đồ tạm đã làm tươi, When `push-ops-facts --kho` dựng bản tin, Then `blocks.dataFlow` có đủ ba cửa sổ, `measured_at` bằng `computed_at` cũ nhất của bảng (không phải giờ đẩy), và MỌI đường khoá trong khối thuộc ma trận khoá viết trước cho mọi tầng (cấp một, phần tử `sources[]`, `days[]`, `groups[]`, `shortStay`, `mix`); đột biến chèn `groups[0].groupId` hay `sources[0].offerId` → ca đỏ nêu đường khoá; bảng vắng → khối `error`, không có số.
- AC-5: Given bản tin có `blocks.dataFlow`, When bộ soát tầng A chạy, Then tên nhóm thu thường đi qua (tầng C), còn tên nhóm mang tên nguồn thật bị chặn «FACTS CHẶN [tầng A]».
- AC-6 (cross-layer): Given lược đồ tạm KHÔNG có `stg_*` và dòng `ops_heartbeat` viết từ bản tin khô thật, When dựng `DataFlowContent` của route `/ops/data-flow` (cùng mô-đun page dùng) cho từng cửa sổ, Then không có «Chỉ xem ở máy thu»; trên DOM, số chặng từng nguồn, số tin đủ năm trường lõi, nhóm và điểm ngày bằng số trong khối; đột biến giữ cổng «không thấy stg_* thì vẽ khung chỉ-máy-thu» → ca đỏ.
- AC-7: Given cloud, When khối `dataFlow` tươi / cũ / vắng / mang `error`, Then trang hiện đúng chữ chung của các trang Ops (thành phần `facts-status.tsx`, từ vựng «Máy thu» của CONTEXT.md) — «Số đo lúc … từ máy thu» / Alert «Máy thu không đẩy số từ …» kèm số cũ / «Chỉ đo ở máy thu» / «không đo được» — với độ tươi tính theo `computed_at` của bảng và ngưỡng 45′ viết trước (ADR-0014); vắng và lỗi không vẽ 0.
- AC-8: Given cloud, When mở «Tin mới nhất», Then bảng đọc `sale_offers` của cloud (bậc bằng `levelOf`), và hồ sơ tin ghi «Bài gốc chỉ xem ở máy thu» thay cho bài gốc (theo khuyến nghị Hỏi-1).
- AC-9: Given `scripts/cloud-sync.sh`, `pipeline/sync-cloud.mjs` và `pipeline/sync-pii.test.mjs`, When đọc và chạy, Then 600 chạy bằng một bước `job_run` riêng TRƯỚC `push-ops-facts`; `data_flow_snapshot` không có trong `FILL`, `sync-pii.test.mjs` xanh với code thật và ĐỎ khi cấy bảng vào `FILL`; `leakGate` với cloud giả báo `data_flow_snapshot=N` khi cloud có dòng và im khi 0.
- AC-10: Given một snapshot, When dựng phần tổng hợp của `DataFlow` qua nhánh máy thu (đọc bảng) và nhánh cloud (đọc payload bản tin khô thật), Then hai kết quả bằng nhau trọn (deep-equal) ở cả ba cửa sổ; đột biến lệch một ngày ở `days` của nhánh cloud → ca đỏ «cloud ≠ máy thu: days».

## Coverage

| Trục | Giá trị | AC |
|---|---|---|
| Nơi đọc | máy thu · cloud | AC-3 · AC-6, AC-8 |
| Trạng thái khối | tươi · cũ · vắng · lỗi | AC-7 |
| Cửa sổ | 7d · 30d · all | AC-1, AC-2, AC-6, AC-10 |
| Đường dữ liệu | làm tươi · bản tin · soát tầng A · lịch/sync/leak gate | AC-1/2 · AC-4 · AC-5 · AC-9 |
| Một định nghĩa | máy thu = cloud | AC-10 |

## Đường đo

| Vế ngưỡng (opportunity.md) | Đo bằng |
|---|---|
| Mở /ops/data-flow trên prod thấy số chặng, không còn khung chỉ máy thu | AC-6, AC-7 (route trên lược đồ «cloud», jsdom) trước merge; trên prod: phiên nghiệm thu sau ship (`/acceptance-gate:uat-session dong-chay-len-cloud`, người mở prod) — dòng sổ «bỏ ui-observed» |
| Số chặng trên cloud bằng bản máy thu cùng mốc | AC-10 |
| Leak gate xanh, không bảng thô nào lên cloud | AC-5, AC-9 |

## Out of scope

- OOS-1: Thẻ điểm tin, điều kiện lên bậc, bảng chặn bậc (DF2–DF3); lăng kính nguyên tắc (DF4).
- OOS-2: Bài gốc và ảnh tin trên cloud (TV9); hồ sơ tin trang riêng `/ops/offers` (TV10).
- OOS-3: Trang Thu thập đọc cùng bảng tính sẵn, bỏ cột tin rao (DF5).

## Notes

- Migration chỉ thử trong lược đồ tạm riêng của bài kiểm (không đụng `public` của :5433 — giám sát dặn 27/10); vì vậy
  trước merge không có bản chạy thật nào có bảng 051, mặt nhìn đo bằng jsdom, trên prod đo ở phiên nghiệm thu.
- Known limits — chọn ở Cổng Bằng chứng 2026-10-27:
  - Ngoài-1: khối số dòng chảy trên cloud không được kiểm khuôn — bản tin hỏng hay lệch phiên bản có thể làm vùng số lỗi hoặc đầu trang ghi «0 thẻ chờ duyệt» thay vì «không đo được».
  - Ngoài-3: khi máy thu chưa áp migration 051, trang máy thu ghi «chưa làm tươi, chờ lượt đồng bộ» thay vì nói thiếu migration.
  - Ngoài-4: phép đo bậc trên bảng «Tin mới nhất» trên cloud so với chính hàm bậc mà bảng dùng, không có bảng bậc viết trước cho từng tin.
  - Ngoài-7: ca vắng/lỗi của bốn trạng thái kiểm «không còn vùng số» bằng bộ dò thiếu đối chứng dương cho ba trong bốn vùng.
