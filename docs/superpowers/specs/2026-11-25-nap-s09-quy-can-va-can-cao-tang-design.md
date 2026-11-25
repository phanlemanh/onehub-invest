# Thiết kế DA56 — quỹ căn và căn cao tầng S09 vào stg, quỹ căn có giá lên Danh bạ Ops

Ngày 25/11/2026. Hàng DA56 `nap-s09-quy-can-va-can-cao-tang`, hạng T3 (migration 130), dãy P1, đợt `dot0-cam-mau`. Tài liệu dừng ở
Cổng Phạm vi: chưa có mã, migration hay lượt ghi DB máy thu.

## 1. Kết luận

- Hai kind mới của DATA-CONTRACT v16 (`quy-can`, `can-cao-tang`) nạp vào bảng `stg_s09_danh_ba` có sẵn của 115 qua bộ nạp S09 đã có
  — không bảng stg mới. Bộ nạp bỏ URL ảnh và toạ độ của căn quỹ căn TRƯỚC khi ghi (tầng A: tên miền CDN của nguồn, toạ độ từng căn).
- Migration 130 thêm hai view đọc stg: `v_s09_db_quy_can` (một dòng mỗi căn quỹ căn, hợp theo `id` giữa các trang, chỉ lấy bản thu đủ
  của từng dự án) và `v_s09_db_can_cao_tang` (một dòng mỗi căn của bản tầng mới nhất đọc được), kèm view đối soát quỹ căn từng dự án.
- Màn `/ops/registry` có thêm số quỹ căn S09 (căn, căn có giá, dự án) ở ô tổng, và trang một dự án có bảng «Quỹ căn đang bán» với giá
  chủ đầu tư công khai (ROADMAP §3 mục 38). Màn chỉ ghi mã `S09`.
- DA43 (căn vào danh bạ) đọc `v_s09_db_can_cao_tang` của hàng này; tiêu chí nạp stg của DA43 (AC-1, AC-2) do DA56 trả (GS phán 25/11).
- DATA-CONTRACT v16 (nhánh làn thu `zcode/zk-s09-dc-16` @767c70c13) gộp cùng PR này.

## 2. Phụ thuộc

- Xếp chồng nhánh DA42 (`feat/nap-s09-toa-tang-vao-danh-ba`): cần 115 (bảng stg) và 125, cùng nối dự án S09 → nút (`project_links`
  nguồn S09) mà DA42 dựng. Gộp sau DA42.
- Snapshot v16 nằm ở thư mục chờ ngoài kho (có băm sha256, có tầng A), ZK chép vào `collector/snapshots` sau khi DA56 gộp. Hàng này đọc
  thư mục chờ chỉ để đo; không chép tệp nào vào kho hay `_acceptance`.

## 3. Bản thu v16 (đo 25/11, thư mục chờ, 37/37 tệp khớp băm)

| Bản thu | Kind | Item | Số đo |
|---|---|---:|---|
| `…T024022939` | quy-can | 396 | lượt hỏng (trang từ 1): 394 dự án, 2 có căn, 232 căn — giữ bất biến, chỉ đối soát |
| `…T031140550` | quy-can | 42 | bản đủ: 40 dự án, 1.294/1.294 căn, mọi dự án Σ id = `tongNguon` |
| `…T072936792` | can-cao-tang | 8.000 | 87 dự án, 344 toà, 8.000 tầng, 99.107 căn, 0 trùng id |
| `…T170341223` | can-cao-tang | 7.500 | 81 dự án, 300 toà, 7.500 tầng, 108.538 căn, 0 trùng id |

## 4. Bảng phủ ca

Số đếm thẳng từ snapshot thư mục chờ và DB máy thu `oneinvest` (chỉ đọc) ngày 25/11; dòng 9–11 trên DB thử `oneinvest_s09ui` đã dựng
DA42 (máy thu chưa áp 115). Chỉ số, không tên.

| # | Chiều | Giá trị | Số | Xử lý | Ai đọc đầu ra |
|---|---|---|---:|---|---|
| 1 | Quỹ căn | Bản đủ / bản hỏng trang-từ-1 | 1 / 1 | Chọn bản đủ theo đối soát, không theo thời điểm | view quỹ căn, màn |
| 2 | Quỹ căn bản đủ | Căn / có giá bán (min hoặc max > 0) | 1.294 / 1.268 | Giá hiện trên màn; 26 căn không giá hiện «—» | `/ops/registry` |
| 3 | Quỹ căn | Mã căn khuôn TÒA.TẦNG.CĂN / khác khuôn | 913 / 381 | Giữ nguyên văn; tách mã là việc DA43 | DA43 |
| 4 | Quỹ căn | Loại hình: chung cư · shophouse · liền kề · biệt thự · officetel | 1.230 · 25 · 25 · 11 · 3 | Hiện đúng chữ nguồn | `/ops/registry` |
| 5 | Quỹ căn | Trạng thái nguồn | 1.294 `ON_STOCK` / `AVAILABLE` | Hiện nguyên văn, không suy | `/ops/registry` |
| 6 | Quỹ căn | Có `geolocation` / có `galleries` | 1.294 / 1.294 | Bỏ khỏi stg (tầng A) | bộ soát rò |
| 7 | Quỹ căn | Mã căn trùng S16 `ma_can` / S08 `product_code` / `units.sub_id` | 56 / 1 / 0 | Ngoài phạm vi (DA43 nối căn) | DA43 |
| 8 | Căn cao tầng | Căn có `name` ≠ `code` | 15.584 + 12.193 | stg giữ cả hai; view lấy `code` | DA43 |
| 9 | Dự án có quỹ căn | Đã nối nút (ứng viên / xác minh) | 23 / 1 | Bảng quỹ căn trên trang dự án | `/ops/registry/[nodeId]` |
| 10 | Dự án có quỹ căn | Còn thẻ chưa duyệt | 6 | Đếm ở ô tổng, chưa có trang | `/ops/registry` |
| 11 | Dự án có quỹ căn | Không có trong danh mục gói 1 | 10 | Đếm ở ô tổng «chưa nối» | `/ops/registry` |
| 12 | Căn cao tầng | Hai bản thu chồng dự án | đo ở S3 | Bản tầng mới nhất đọc được thắng | DA43 |

**Ngoài phạm vi, vì:** đưa căn quỹ căn hay căn cao tầng vào bảng `units` (DA43) · khu, căn thấp tầng (DA50) · đồng bộ quỹ căn lên cloud
(ghi cloud cần lời riêng của Mạnh; màn đo trên máy thu) · lên cổng Invest · lịch sử giá theo thời gian (chỉ bản mới nhất).

## 5. Cách làm

1. **Bộ nạp** (`pipeline/import-s09-danh-ba.mjs`, đã nhận mọi kind): thêm một hàm thuần `boTangA(kind, payload)` trong
   `pipeline/lib/s09-danh-ba-v16.mjs` — với `quy-can`, xoá `galleries` (và `geolocation` theo Hỏi-2) của từng căn trong `payload.data`;
   kind khác giữ nguyên. Danh sách khoá giữ/bỏ là bảng kiểm kê viết trước từ bản thu thật (45 khoá cấp một của căn quỹ căn kèm khoá con, 4 của căn cao
   tầng), không suy từ fixture. Bộ nạp đếm số căn bị bỏ trường theo lý do. Kiểm băm `manifest.files[].sha256` trước khi ghi như bản thu v15.
2. **Migration 130** (idempotent, chỉ view):
   - `v_s09_db_quy_can_doi_soat`: mỗi (snapshot, dự án) — số trang, Σ id hợp, `tongNguon` trang 0, `du = (Σ id = tongNguon)`.
   - `v_s09_db_quy_can`: với mỗi dự án lấy snapshot mới nhất có `du = true`; một dòng mỗi `data[].id` (khử trùng giữa trang), các cột
     mã căn, loại hình, phòng ngủ, phòng tắm, diện tích min/max, giá bán min/max, đơn giá min/max, trạng thái, `block_id`.
   - `v_s09_db_can_cao_tang`: item `can-cao-tang` mới nhất đọc được mỗi `source_id` (tầng) qua `v_s09_db_item_moi`; một dòng mỗi căn:
     dự án, toà, tầng (uuid + tên nguyên văn), id căn, `code`, `name`.
   - `du` của view đối soát là `false` khi dự án không có trang 0 (bản hỏng gọi trang từ 1), không để rỗng.
3. **Màn** (`app/src/lib/ops/registry/doc.ts`, `du-an.ts`, `app/src/components/ops/registry/`): ô tổng thêm «Quỹ căn S09: n căn · m có
   giá · k dự án» và dòng phụ «a nối nút · b còn thẻ · c chưa có trong danh mục»; «nối» là `project_links` nguồn S09 trạng thái `noi`,
gồm cả nút ứng viên `mot_loi_khai` do DA42 đúc (đo 25/11: 23 ứng viên + 1 xác minh = 24); trang dự án nối qua đúng định nghĩa đó thêm khối «Quỹ căn đang bán» bằng `data-grid` có sẵn: mã căn, loại
   hình, PN · WC, diện tích, giá bán, đơn giá, trạng thái; trống/tải/lỗi đủ ba trạng thái.
4. **DATA-CONTRACT v16**: gộp nhánh làn thu, không sửa chữ.

## 6. Đặc tả UX

Màn Ops sẵn có, thêm một ô số và một khối bảng — khuôn IA không đổi (danh sách → chi tiết). Ô tổng: một dòng số, dòng phụ «m có giá ·
k dự án · a nối nút · b còn thẻ · c chưa có trong danh mục». Trang dự án: khối «Quỹ căn đang bán» dưới «Toà và căn», bảng `data-grid` chỉ đọc, sắp theo mã căn; trống: «Chưa có quỹ căn của
nguồn S09 cho dự án này»; lỗi: Alert kèm Thử lại; tải: Skeleton. Không màu dữ liệu mới.

## 7. Rủi ro

- Bản đủ và bản hỏng cùng ngày: chọn theo `captured_at` thôi là sai khi lượt hỏng chạy sau — view chọn theo đối soát đủ.
- Tầng A: lọt `galleries[].urls` lên màn hay log → bộ soát rò cấy chuỗi tên miền giả lập phải đỏ.
- Hai bản căn cao tầng: tầng lỗi ở bản sau không đè bản tốt (view `v_s09_db_item_moi` đã lọc code 200).
