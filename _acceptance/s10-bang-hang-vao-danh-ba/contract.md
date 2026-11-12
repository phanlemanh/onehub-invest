---
schema_version: 1
feature: Bảng hàng chủ đầu tư S10 vào stg (migration 089) và nối được vào nút dự án của danh bạ
slug: s10-bang-hang-vao-danh-ba
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-11-s10-bang-hang-vao-danh-ba-design.md
---

# Acceptance Contract: s10-bang-hang-vao-danh-ba

## Context

DA29 (ROADMAP §3 mục 45 Q3): S10 có raw mà chưa có bảng stg; bộ nạp `napS10` đã có trên nhánh hợp đồng S10/S11 nhưng chờ bảng của
089 (`CHUA-AP-089`). Hàng tạo 089 (bảng hàng, bảng tên dự án, bảng nối, view quỹ căn theo nút), lệnh nối `transform-s10.mjs` theo luật
DN1 của S08, và chắn khỏi Bán, thước giá, metrics, cloud (DA17, luật 5–6). Thiết kế: `docs/superpowers/specs/2026-11-11-s10-bang-hang-vao-danh-ba-design.md`.

## Criteria

### AC-1 — 089 đúng khuôn bộ nạp, chạy lại an toàn
Given DB của riêng lượt chép từ bản mẫu (`db/db-thu.sh --chay`),
When áp `db/migrations/089_s10_bang_hang.sql` hai lần,
Then lần hai không lỗi và lược đồ không đổi; cột của `stg_s10_stock` chứa đúng mọi tên trong `COT_S10` nhập từ `pipeline/import-airbnb.mjs`;
`stg_s10_project` có khoá duy nhất `(snapshot_id, project_id, project_label)` coi NULL là bằng nhau; `s10_project_links` từ chối dòng
`noi` thiếu nút, `chua_noi` thiếu lý do, trạng thái lạ.

### AC-2 — Bộ nạp ghi thật vào bảng của 089
Given snapshot `vn__s10-bang-hang__2026-11-11T013501853` (119 `stock_table`) và DB của riêng lượt đã áp 089,
When chạy `node pipeline/import-airbnb.mjs <snapshot>` hai lần,
Then lần một ghi vào `stg_s10_stock` đúng số `stock_id` khác nhau trong các dòng `bocS10` trả cho các item đủ bộ lọc của snapshot;
mỗi `stock_id` có ở cả bảng 177 và 178 giữ dòng của bảng 177, dòng còn lại được đếm và in theo snapshot ở dòng tổng kết của bộ nạp
(`trùng <số>`); tổng `bocS10` = số ghi + số trùng; `lech_khuon` bằng số lệch khuôn `bocS10` đếm; không in `CHUA-AP-089`; lần hai ghi 0 dòng; cùng snapshot trên DB chưa áp 089 thì in `CHUA-AP-089` và `stg_s10_stock` không có.

### AC-3 — Lệnh nối dự án S10 vào nút danh bạ
Given dòng `stg_s10_project` dựng từ `meta` của snapshot 11/11 (có dự án nhiều dòng: hai nhãn khối hay hai phân khu), một tệp bảng nối
gitignored,
When chạy `pipeline/transform-s10.mjs --tep <tệp>` (và `--thu`),
Then tên dự án lấy từ snapshot mới nhất của từng `project_id`: `du_an` phải duy nhất (khác nhau → lỗi `du-an-nhieu-ten`, không ghi),
phân khu và nhãn gộp theo thứ tự chữ — hai lượt cho cùng kết quả; dự án có trong tệp ghi `noi` trỏ đúng nút `project`, mọi dự án khác
`chua_noi` kèm lý do; `--thu` không ghi; chạy lại không đổi
`updated_at`; mỗi lỗi (tên dự án nhiều giá trị, slug không có, nút không phải project, dự án hai dòng, mã lạ, tín hiệu không khớp tên, ứng viên bị sót,
tệp không bị git bỏ qua) in đúng mã lỗi, thoát 1, không ghi dòng nào; stdout không có tên hay mã dự án S10.

### AC-4 — Đọc quỹ căn S10 theo nút dự án
Given AC-2 và AC-3 đã chạy (một dự án `noi`), thêm một snapshot sau cùng `stock_id` với trạng thái khác,
When đọc view `s10_quy_can_du_an` theo `asset_node_id` của nút,
Then số dòng bằng số `stock_id` khác nhau của dự án đó trong `stg_s10_stock`, mỗi `stock_id` mang dòng của snapshot mới nhất (trạng thái
mới); dự án `chua_noi` không có dòng nào.

### AC-5 — Chắn khỏi Bán, thước giá, metrics và cloud
Given diff của nhánh,
When quét,
Then `pipeline/sync-cloud.mjs` không nhắc `stg_s10_stock`, `stg_s10_project`, `s10_project_links`, `s10_quy_can_du_an`; không tệp nào dưới
`pipeline/sql/`, `app/`, `data-api/`, hay `pipeline/transform-*` (trừ `transform-s10.mjs`) nhắc bốn tên đó; bản sao chèn một tên vào
một tệp ở BẤT KỲ gốc nào trong năm gốc làm phép quét đỏ gọi tên tệp; tên trong `transform-s10.mjs` không làm đỏ.

## Coverage

Trục (preset entity-feature cho «bảng hàng S10»):
- Vòng đời dữ liệu: raw → stg (AC-2) · tên dự án → nối (AC-3) · đọc theo nút (AC-4).
- Lược đồ: tạo · chạy lại · ràng buộc (AC-1).
- Lỗi tệp nối: bảy mã của DN1 (AC-3) [thước: `kiemBangNoi` của `noi-du-an-s08.mjs` dùng lại].
- Bên đọc bị chắn: Bán, thước giá, metrics, app, API, cloud (AC-5).
- Thời gian: nhiều snapshot cùng `stock_id` (AC-4).

Core → AC-1…AC-5. Later: tin sơ cấp từ quỹ căn (DA17), trang dự án (DA20), S11 (DA24a). Never: số S10 lên cổng Invest trước DA17.

## Out of scope

- Sửa bộ nạp và DATA-CONTRACT v11 (`stg_s10_project` từ `meta.duAn`, `meta.phanKhu`, `meta.projectLabel`, item `project_tree`) — làn
  ZCode, GIAO qua LL (GS duyệt 11/11).
- Nạp tay `stg_s10_project` hay áp 089 trên DB máy thu.
- Trang danh bạ, trang dự án trên app; tin sơ cấp DA17; S11.

## Notes
- Phụ thuộc: «đọc được ở danh bạ trên dữ liệu thật của máy thu» cần bộ nạp v11 của ZCode vào main; vòng này chứng bằng dòng mồi dựng
  từ `meta` của snapshot 11/11 trên DB của riêng lượt (GS 11/11).
