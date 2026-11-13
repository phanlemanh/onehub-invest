# DA29 — Bảng hàng chủ đầu tư S10 vào stg và nối vào danh bạ dự án (thiết kế)

Hàng `s10-bang-hang-vao-danh-ba` (DA29, đợt `danh-ba-du-an-toan-dien-0911`, dãy P3, T2). Vùng: `db/migrations/089_s10_bang_hang.sql`,
`pipeline/transform-s10*`. Nhánh mang sẵn hai commit hợp đồng S10/S11 (DATA-CONTRACT v8, bộ bóc `lib/s10-bang-hang.mjs`, bộ nạp
`napS10` của `import-airbnb.mjs` — chờ bảng của 089, in `CHUA-AP-089`).

## 1. Vấn đề

ROADMAP §3 mục 45: mất lớn nhất ở bước raw → stg; S10 có raw mà chưa có bảng stg. Mục 45 Q3: S10 vào stg đã có mã (DA29), đi cùng
DA17 (quỹ căn chủ đầu tư thành tin sơ cấp, chắn khỏi Bán, thước giá, metrics). Lượt thu 11/11 (`vn__s10-bang-hang__2026-11-11T013501853`,
119 `stock_table` + `project_tree`) mang tên dự án, phân khu, nhãn khối trong `meta` — bộ nạp chưa đưa tên vào stg.

## 2. Cách làm

**(1) Migration 089** (Claude; LL soát lược đồ):
- `stg_s10_stock`: đúng cột `COT_S10` của bộ nạp (`stock_id`, `source_id`, `project_id`, `block_type`, `unit_number`,
  `subdivision_name`, `block_raw`, `property_sub_type_raw`, `lot_size_m2`, `building_area_m2`, `handover_condition_raw`,
  `direction_faces_raw`, `list_price_vnd`, `status_raw`, `remarks_raw`, `source_modified_on`, `snapshot_id`, `captured_at`,
  `server_cond`, `raw_row`) + `id`, `loaded_at`; `UNIQUE (snapshot_id, stock_id)` cho `ON CONFLICT` của bộ nạp.
- `stg_s10_project(project_id, du_an, phan_khu, project_label, snapshot_id, captured_at)`, `UNIQUE NULLS NOT DISTINCT
  (snapshot_id, project_id, project_label)` (Postgres 17). Bộ nạp v11 của ZCode ghi bảng này (GIAO qua LL); vòng này không ghi nó
  trên DB máy thu.
- `s10_project_links`: cùng khuôn `s08_project_links` (074) — `project_id` khoá, `asset_node_id`, `status` `noi`/`chua_noi`, `ly_do`.
- View `s10_quy_can_du_an`: mỗi `stock_id` lấy dòng của snapshot mới nhất, nối `s10_project_links` trạng thái `noi`; cột: `asset_node_id`,
  `project_id`, `block_type`, `stock_id`, mã căn, phân khu, loại, diện tích, giá CĐT, trạng thái thô, ngày nguồn, `captured_at`.
- Không bảng nào trong ba bảng và view vào `FILL` của `pipeline/sync-cloud.mjs` (stg là tầng A; 074 cùng luật).

**(2) `pipeline/transform-s10.mjs`** — nối dự án S10 vào nút danh bạ từ tệp bảng nối ở máy thu (gitignored), cùng luật DN1:
dùng lại `kiemBangNoi` và `kiemTep` của `noi-du-an-s08.mjs` (tín hiệu tên phải nằm trong tên dự án S10, slug là nút `project`, không
hai dòng, không mã lạ, không sót ứng viên). Tên lấy từ `stg_s10_project` mới nhất mỗi `project_id`. `--thu` chỉ kiểm; lỗi thì không
ghi dòng nào, in mã lỗi, thoát 1; chạy lại không đổi. Không in tên hay mã dự án S10.

**(3) Đo bằng dữ liệu thật mà không chờ ZCode:** test dựng dòng mồi `stg_s10_project` từ `meta` của snapshot 11/11 (đọc tệp
snapshot, không ghi DB máy thu), nạp `stg_s10_stock` bằng chính `napS10` từ cùng snapshot trên DB thử.

**(4) Chắn DA17:** view và ba bảng không được đọc bởi transform tin rao, `sale_offers`, `pipeline/sql/3xx–5xx` (thước giá, metrics),
`app/`, `data-api/`.

## 3. Phụ thuộc và ngoài vòng

- «Đọc được ở danh bạ trên dữ liệu thật của máy thu» cần bộ nạp v11 (ZCode: `stg_s10_project`, DATA-CONTRACT v11) vào main; vòng
  này chứng bằng dòng mồi từ snapshot. Không nạp tay `stg_s10_project` trên DB máy thu.
- Áp 089 lên DB máy thu là lời riêng của Mạnh sau Cổng Bằng chứng.
- Không trang danh bạ/trang dự án trên app (DA20); không tin sơ cấp DA17; không S11 (DA24a).

## Đặc tả UX

Không chạm giao diện (dòng sổ `bỏ đặc-tả-UX`).
