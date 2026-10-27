# Dòng chảy dữ liệu lên cloud — design (DF1 `dong-chay-len-cloud`)

Ngày 27/10/2026 · hàng DF1 của lộ trình (đợt `dong-chay-2710`, PR #153) · T3 (chạm `pipeline/push-ops-facts.mjs`,
`scripts/cloud-sync.sh`, `db/migrations/**`) · Cổng Đáng: build (giám sát theo Mạnh 27/10 «đội vận hành qua cloud»).

## Vấn đề

`/ops/data-flow` đọc thẳng bảng nạp thô (`stg_zalo_posts`, `stg_chotot_ads`, `stg_abnb_listings`) lúc tải trang. Các bảng
đó không lên cloud (tầng A, leak gate), nên trên prod trang chỉ hiện khung «Chỉ xem ở máy thu». Đội vận hành làm qua
cloud (quyết định 25/10 và 27/10) — trang phải có số trên prod. Ngoài ra trang tính số lúc tải, trái luật 10 (Known
limit của DF0, «DF1 chuyển»).

## Cách làm

Một định nghĩa số, tính sẵn ở máy thu, hai nơi đọc:

1. **Bảng tính sẵn** `data_flow_snapshot` (migration `051_data_flow_snapshot.sql`, idempotent, chỉ ở máy thu): một dòng mỗi cửa sổ (`7d`, `30d`, `all`),
   cột `computed_at`, `facts jsonb`. `facts` mang đúng phần TỔNG HỢP của `DataFlow` hôm nay: `sources` (số chặng + năm
   trường lõi + bậc theo nguồn), `days` (30 ngày, theo nguồn), `groups` (nhóm thu S03/S05: tên nhóm tầng C, số đếm),
   `shortStay`, `mix`, `enrichPending`. KHÔNG mang tin rao từng dòng, mã tin, bài gốc, mã nhóm, tên nguồn thật.
2. **Câu làm tươi** `pipeline/sql/600_data_flow.sql`: xoá và ghi lại ba dòng trong một giao dịch, idempotent — các câu
   tổng hợp chuyển nguyên từ `getDataFlow` (`POSTS_CTE`, `COMPLETE_SQL`, `IS_TEST_SQL`, `ENRICH_PENDING_SQL` …) sang
   SQL thuần; mốc «bây giờ» là `now()` của lượt làm tươi, ngày theo giờ VN. Đây là MỘT định nghĩa — app không còn bản
   chép câu tổng hợp.
3. **Lịch**: `scripts/cloud-sync.sh` chạy 600 trước `push-ops-facts` mỗi lượt 15′ (bước riêng `job_run`, lỗi không
   chặn hai bước kia).
4. **Khối bản tin** `blocks.dataFlow` trong `push-ops-facts`: `SELECT window, computed_at, facts FROM
   data_flow_snapshot`, bọc `measure()` như mọi khối (lỗi → `{measured_at, error}`, không bao giờ thay bằng 0).
   `measured_at` của khối là `computed_at` CŨ NHẤT của bảng, không phải giờ đẩy — 600 gãy thì cloud thấy số cũ đi và
   hiện Alert, không ghi «số đo lúc <giờ hiện tại>». Bộ soát tầng A (`factsChan`) chạy trên cả khối; tên nhóm S03 là
   tầng C (miễn như `blocks.s03.groups[i].name`).
4b. **Rào bảng chỉ ở máy thu** (mẫu `stg_s08_inventory`): bảng không vào `FILL` của `sync-cloud.mjs`, ca của
   `pipeline/sync-pii.test.mjs` đỏ khi cấy bảng vào `FILL`, `leakGate` thêm bảng vào danh sách kiểm (cloud có dòng →
   vi phạm).
5. **App đọc**: `DataFlowContent` (rời `page.tsx` sang `components/ops/data-flow/data-flow-content.tsx` để route và bài
   kiểm dùng cùng một mô-đun) chọn nhánh máy thu / cloud; `getDataFlow` tách hai phần —
   - phần tổng hợp: máy thu đọc `data_flow_snapshot`; cloud (bảng vắng) đọc `readOpsFacts().blocks.dataFlow` — cùng
     khuôn `facts`, cùng một hàm dựng `DataFlow`;
   - phần «Tin mới nhất»: máy thu như cũ (kèm bài gốc); cloud đọc `sale_offers` (đã lên cloud, tầng C) không có bài gốc —
     theo Hỏi-1.
   `reviewPending` trên cloud lấy từ khối `reviewQueue` sẵn có.
6. **Trạng thái trên cloud** đúng chữ ADR-0014: tươi → «Số đo lúc HH:MM (giờ VN) từ máy local»; cũ quá 45′ → Alert
   «Máy local không đẩy số từ HH:MM (giờ VN)», số cũ vẫn hiện; vắng → «—» kèm «Chỉ đo ở máy local»; lỗi → «không đo
   được». Không bao giờ vẽ 0 thay cho số không có.
7. **Trang máy thu** đọc bảng tính sẵn nên số máy thu và cloud bằng nhau cùng mốc; đầu trang ghi «Số tính lúc HH:MM
   (giờ VN)» theo `computed_at`.

## Hỏi người

- **Hỏi-1** — «Tin mới nhất» trên cloud: hiện từ `sale_offers` của cloud (không bài gốc, sheet ghi «bài gốc chỉ xem ở
  máy thu tới TV9») — khuyến nghị; hay ẩn bảng trên cloud tới TV10 (`/ops/offers`).
- **Hỏi-2** (khó đảo — dữ liệu rời máy): khối `dataFlow` lên cloud mang đúng các số tổng hợp ở mục 1 cộng tên nhóm thu
  (tầng C), không gì khác — khuyến nghị đồng ý (khớp lời Mạnh 27/10 «cloud chỉ nhận số tổng hợp»).

## Đo

- Bảng làm tươi trên lược đồ tạm cùng fixture DF0 (`app/tests/ops-dong-chay.test.tsx`): số mọi cửa sổ khớp bảng mong
  đợi viết trước của DF-AC-2; chạy lại hai lần ra cùng dòng; ca DF0 giữ xanh khi `getDataFlow` đọc bảng.
- Bản tin khô (`push-ops-facts --kho`) trên lược đồ tạm: có `blocks.dataFlow` đủ ba cửa sổ; đột biến tên nguồn thật
  trong tên nhóm → bị chặn; đột biến khối thêm trường lạ (mã tin) → ca đỏ «khối mang trường ngoài danh sách».
- App «chế độ cloud» trên lược đồ tạm KHÔNG có `stg_*` + dòng `ops_heartbeat` viết từ bản tin khô thật: trang dựng số,
  không có khung chỉ-máy-thu; ba trạng thái none/stale/error.
- Một định nghĩa: cùng snapshot, phần tổng hợp qua nhánh máy thu và nhánh cloud deep-equal.
- 600 chạy ≤ 30 giây trên DB local thật (trong giao dịch ROLLBACK) và chỉ ghi `data_flow_snapshot`.
- Không chụp trang thật trước merge: migration chưa merge không được thử trên :5433, nên không bản chạy nào có bảng; mặt
  nhìn đo bằng jsdom trên route, trên prod đo ở phiên nghiệm thu sau ship.

## Ngoài phạm vi

- Thẻ điểm tin, điều kiện lên bậc (DF2–DF3); lăng kính nguyên tắc (DF4); dọn IA Thu thập (DF5).
- Bài gốc và ảnh tin trên cloud (TV9); hồ sơ tin trang riêng (TV10).
- Thu thập (`/ops/collections`) đọc cùng bảng — DF5.
