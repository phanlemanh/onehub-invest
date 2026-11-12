---
schema_version: 1
feature: Danh mục cấp dự án của S08 (địa chỉ, chủ đầu tư, điểm toạ độ, hình thức sở hữu, loại hình) nằm trong stg_s08_project, nạp lại không nhân dòng
slug: stg-du-an-s08
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-11-13
design_doc: docs/superpowers/specs/2026-11-12-stg-du-an-s08-design.md
---

# Acceptance Contract: stg-du-an-s08

## Context

DA30 (mô hình danh bạ chặng D1→D2, ROADMAP §3 mục 44; đứng trước DA3 theo mục 45 Q2): snapshot S08 có 177 dự án kèm địa chỉ, chủ
đầu tư, loại hình, hình thức sở hữu và khung bản đồ (174 bóc được điểm), nhưng bộ nạp đếm rồi bỏ item cấp dự án. Hàng tạo migration
094 với bảng `stg_s08_project`: bộ nạp ghi payload thô, cột đọc được là cột sinh trong SQL. Bộ nạp thuộc làn ZCode (GIAO sau cổng);
vòng này chứng 094 bằng nạp mồi đúng câu chèn của lời GIAO. Thiết kế: `docs/superpowers/specs/2026-11-12-stg-du-an-s08-design.md`.

## Criteria

### AC-1 — 094 tạo bảng đúng khuôn, chạy lại an toàn
Given DB của riêng lượt chép từ bản mẫu (`db/db-thu.sh --chay`),
When áp `db/migrations/094_stg_s08_du_an.sql` hai lần,
Then lần hai không lỗi và lược đồ của `stg_s08_project` không đổi; bảng có năm cột thô (`snapshot_id`, `project_id`,
`catalog_payload`, `detail_payload`, `fetched_at`), khoá chính `(snapshot_id, project_id)`, FK tới `airbnb_snapshots`, và mười cột
sinh (`project_code`, `project_name`, `project_address`, `investor`, `project_type`, `ownership_type_raw`, `total_area_raw`,
`progress_raw`, `point_lng`, `point_lat`); lược đồ `stg_s08_inventory` bằng trước khi áp.

### AC-2 — Nạp hai snapshot S08, nạp lại không nhân dòng
Given hai snapshot `vn__s08-danh-muc__2026-11-01T002648230`, `vn__s08-danh-muc__2026-11-07T233004210` và DB đã áp 094,
When dựng dòng bằng hàm `dongDuAnS08(items, snapshotId)` của `pipeline/lib/s08-du-an.mjs` (chọn payload, ghép item `detail` vào
item `catalog` cùng dự án — lời GIAO bắt bộ nạp gọi đúng hàm này) rồi chèn bằng đúng câu năm cột `ON CONFLICT (snapshot_id,
project_id) DO NOTHING` của lời GIAO, hai lần,
Then lần một mỗi snapshot có số dòng bằng số `project_id` khác nhau của item `project_catalog` trong snapshot ấy (07/11: 177),
số dòng có `detail_payload` bằng số dự án có item `detail`; lần hai thêm 0 dòng.

### AC-3 — Cột đọc được đúng với nguồn, điểm bóc từ khung bản đồ
Given AC-2 đã nạp,
When đọc mười cột sinh,
Then mỗi dòng có mã, tên, địa chỉ, chủ đầu tư, loại hình bằng giá trị của payload catalog; hình thức sở hữu, tổng diện tích, tiến độ
bằng chữ thô của `project_info` trong payload detail; điểm bằng kết quả bóc độc lập bằng JS trên cùng khung bản đồ. Snapshot 07/11:
địa chỉ và chủ đầu tư có ở 177 dòng, loại hình 76 thấp tầng và 101 cao tầng, hình thức sở hữu có ở 149 dòng, 174 dòng có điểm và cả
174 nằm trong khung lãnh thổ Việt Nam, 3 dòng điểm rỗng.

### AC-4 — Payload lạ không làm hỏng lượt nạp
Given DB đã áp 094,
When chèn dòng mồi có detail vắng, khung bản đồ rỗng, khung «My Maps», khung mang số lỗi khuôn (`!2d1.2.3`, `!2dabc`), chủ đầu tư
vắng,
Then mọi dòng chèn được, cột sinh liên quan là NULL, cột khác vẫn đúng; không có lỗi ép kiểu.

### AC-5 — Bảng stg không lên cloud, app, API
Given cây của nhánh,
When quét,
Then `pipeline/sync-cloud.mjs`, `app/`, `data-api/` không nhắc `stg_s08_project`; bản sao chèn tên vào một tệp ở bất kỳ gốc nào
trong ba gốc làm phép quét đỏ gọi tên tệp.

## Coverage

Trục (preset entity-feature cho «dự án S08 ở stg»):
- Vòng đời dữ liệu: raw → stg (AC-2) · đọc cột (AC-3) · nạp lại (AC-2).
- Lược đồ: tạo · chạy lại · không chạm bảng cũ (AC-1).
- Trường theo câu giao: địa chỉ · chủ đầu tư · điểm · sở hữu · loại hình (AC-3) [thước: payload thật hai snapshot].
- Đầu vào xấu: detail vắng · khung rỗng · khung không toạ độ · số lỗi khuôn · trường vắng (AC-4).
- Bên đọc bị chắn: cloud · app · API (AC-5).

Core → AC-1…AC-5. Later: bộ nạp thật ghi bảng (làn ZCode, GIAO sau cổng, gọi hàm dựng dòng của AC-2); chuẩn hoá hình thức sở hữu; bộ chuyển stg → khuôn chung
(DA3). Never: lọc điểm theo khung VN trong stg (stg giữ điều nguồn nói).

## Đường đo

- Ngưỡng «177 dự án S08 có dòng» và «nạp lại cùng snapshot 0 dòng mới» → AC-2, trên DB của riêng lượt với nạp mồi bằng chính hàm
  dựng dòng và câu chèn của lời GIAO (bằng chứng thay thế, không phải số trên máy thu).
- Ngưỡng «174/177 có điểm» → AC-3, cùng điều kiện.
- Số trên DB máy thu: bỏ ở vòng này, có tên — sau khi ZCode gộp bộ nạp và Mạnh áp 094, phiên liên làn chạy
  `SELECT count(*), count(point_lat) FROM stg_s08_project WHERE snapshot_id = '<snapshot S08 mới nhất>'` và báo vào nhật ký đợt;
  lệch số của AC-2, AC-3 trên cùng snapshot là lỗi bộ nạp.

## Out of scope

- Sửa `pipeline/import-airbnb.mjs` hay DATA-CONTRACT — làn ZCode; lời GIAO qua phiên liên làn sau Cổng Phạm vi.
- Áp 094 lên DB máy thu (lời riêng của Mạnh) và đo «177 có dòng» trên DB ấy.
- Chuẩn hoá hình thức sở hữu, ánh field RESO, nối vào nút dự án (DA3).
- Lệnh `transform-s08-du-an`: cột sinh trong 094 thay nó.

## Notes
- Phụ thuộc: «177 dự án có dòng trên máy thu» cần bộ nạp của ZCode vào main và 094 áp ở máy thu; vòng này chứng bằng nạp mồi đúng câu
  chèn của lời GIAO trên DB của riêng lượt.
