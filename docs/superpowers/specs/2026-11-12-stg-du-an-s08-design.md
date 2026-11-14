# DA30 `stg-du-an-s08` — danh mục cấp dự án S08 vào stg (migration 094)

Hồ sơ: `_acceptance/stg-du-an-s08/` · hàng DA30 của `docs/plan/lo-trinh.json` · số 094 trong `~/dev/onehub-coord/SO-MIGRATION.md`
(cấp 11/11 cho dãy P3) · mô hình danh bạ chặng D1→D2 (ROADMAP §3 mục 44), đứng trước DA3 (mục 45 Q2).

## Vấn đề

Snapshot `s08-danh-muc` mang hai item cấp dự án cho mỗi dự án: `project_catalog` (state `catalog`: mã, tên, địa chỉ, chủ đầu tư,
loại hình) và `inventory_unit` state `detail` (khối `project_info`: hình thức sở hữu, tổng diện tích, tiến độ, khung bản đồ nhúng).
Bộ nạp `pipeline/import-airbnb.mjs` đếm rồi bỏ cả hai (`s08Detail`, `s08Catalog`). Không bảng nào giữ cấp dự án của S08, nên DA3
(bảng nối mã dự án) không có đầu vào S08 ngoài 8 cặp tay của `s08_project_links`.

## Đo trên raw (12/11, máy thu, chỉ đọc)

| Snapshot | catalog | detail | điểm bóc được |
|---|---|---|---|
| `vn__s08-danh-muc__2026-11-01T002648230` | 172 | 172 | (chưa đếm) |
| `vn__s08-danh-muc__2026-11-07T233004210` | 177 | 177 | 174 |

- Trường `coordinates` rỗng ở cả catalog lẫn detail (0/177). Điểm chỉ có trong `project_info.iframe_location`: khung Google Maps
  nhúng, mẫu `!2d<kinh độ>!3d<vĩ độ>` — 174/177 khớp, cả 174 nằm trong khung lãnh thổ VN. Ba dự án còn lại: hai khung «My Maps»
  (`/maps/d/embed?mid=`, không có toạ độ trong URL), một khung rỗng.
- Địa chỉ `project_address`, chủ đầu tư `investor`, loại hình `project_type` (`low_rise` 76 · `high_rise` 101): catalog 177/177.
  Chủ đầu tư ở detail chỉ 14/177 — lấy từ catalog.
- Hình thức sở hữu `project_info.ownership_type`: 149/177 có chữ, viết tự do (hơn 30 cách viết «lâu dài», «50 năm»…) — giữ thô.
- Payload có chữ mang tên nguồn thật (`share_content`): tầng A, bảng chỉ ở máy thu.

## Thiết kế

**094 tạo một bảng `stg_s08_project`** — một dòng = một dự án ở một snapshot, khoá `(snapshot_id, project_id)`, FK
`airbnb_snapshots` như 040. Bộ nạp ghi đúng năm cột thô: `snapshot_id`, `project_id`, `catalog_payload` (payload item catalog
nguyên vẹn), `detail_payload` (payload item detail nguyên vẹn, NULL khi snapshot thiếu item detail của dự án), `fetched_at`.
Mọi cột đọc được là **cột sinh STORED** trong 094, tính từ hai payload: `project_code`, `project_name`, `project_address`,
`investor`, `project_type`, `ownership_type_raw`, `total_area_raw`, `progress_raw`, `point_lng`, `point_lat`.

- Bóc điểm bằng `regexp_match(… iframe_location, '!2d(-?[0-9]{1,3}\.[0-9]+)!3d(-?[0-9]{1,2}\.[0-9]+)')` — mẫu số chặt để ép kiểu
  `numeric` không bao giờ ném lỗi ở lúc chèn (một khung lạ chỉ cho điểm NULL, không làm hỏng lượt nạp).
- Không lọc khung VN trong bảng: stg giữ đúng điều nguồn nói; kiểm khung là việc của phép đo (AC-3) và của DA3.
- Nạp lại: bộ nạp dùng `ON CONFLICT (snapshot_id, project_id) DO NOTHING` → cùng snapshot 0 dòng mới.
- Không chạm `stg_s08_inventory` (040), không thêm field vào DATA-CONTRACT (raw đã có đủ, `schemaVersion` không đổi).
- Không sync cloud: `pipeline/sync-cloud.mjs`, `app/`, `data-api/` không nhắc bảng. Thông tin dự án là công khai (mục 38), nhưng
  bảng `stg_*` thô không sync nguyên bảng; đường lên cloud là danh bạ (DA3 trở đi).
- RESO: stg giữ hình dạng nguồn (ADR-0011, như 040); ánh field DD 2.1 (`SubdivisionName`, địa chỉ, `Latitude`/`Longitude`) làm
  ở bộ chuyển của DA3, không ở đây.

**Làn.** 094 và phép đo là làn Claude. Phần bộ nạp đọc item `catalog` + `detail` rồi chèn năm cột thô là làn ZCode
(`import-airbnb.mjs`): soạn lời GIAO qua phiên liên làn sau Cổng Phạm vi (SO-MIGRATION: «giao khi P3 chốt lược đồ»). Vòng này
chứng 094 bằng **nạp mồi** trong itest: chính câu `INSERT … ON CONFLICT DO NOTHING` năm cột mà lời GIAO đặt cho bộ nạp, chạy trên
payload thật của hai snapshot, trên DB của riêng lượt. Đo «177 có dòng» trên DB máy thu là sau khi ZCode gộp bộ nạp và Mạnh áp 094
(lời riêng) — ngoài vòng (Hỏi-1).

**Hàm dựng dòng dùng chung.** `pipeline/lib/s08-du-an.mjs` xuất `dongDuAnS08(items, snapshotId)`: gom item `project_catalog` và
item `inventory_unit` state `detail` theo `meta.projectId`, trả mỗi dự án một dòng năm cột (payload của item, không phải cả item).
Itest dựng dòng bằng hàm này; lời GIAO bắt bộ nạp gọi đúng hàm này rồi chèn — để chọn payload và khoá ghép không lệch giữa phép đo
và bộ nạp thật. Cùng tệp xuất `bocDiem(iframe)` làm thước độc lập cho cột điểm.

**Không viết `transform-s08-du-an`, không đặt VIEW.** Cột sinh làm trọn việc bóc ở lúc chèn; một lệnh transform riêng sẽ để dòng mới mang cột rỗng
tới khi nó chạy và thêm một bước chạy đêm. Câu giao đặt các trường nằm trong chính `stg_s08_project`; một VIEW là đối tượng tên khác bên đọc phải nhớ dùng. Đổi luật bóc sau
này là một migration ghi lại bảng vài trăm dòng mỗi tuần — rẻ.

## Phép đo

`pipeline/scripts/s08-du-an.itest.mjs` chạy trên `db/db-thu.sh oneinvest_suite_s08da --chay` (DB của riêng lượt, xoá khi xong).
Snapshot đọc lúc chạy từ `collector/snapshots/vn` của checkout chính; không chép mã, tên dự án S08 vào kho
(sổ `danh-ba-toa-truc-can#d-20261106T221027Z-7`). Probe `_acceptance/stg-du-an-s08/probes/chan.sh` quét cloud, app, API.
