---
schema_version: 1
feature: Trang /ops/registry chỉ đọc cho người vận hành thấy danh bạ dự án → phân khu → toà → căn ở máy thu — số đếm, bậc danh mục, nguồn S0x, tin đang rao, chỗ thiếu, mã dự án nguồn chưa nối
slug: trang-danh-ba-chi-doc
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-17
design_doc: docs/superpowers/specs/2026-11-17-trang-danh-ba-chi-doc-design.md
---

# Acceptance Contract: trang-danh-ba-chi-doc

## Context

Cổng Đáng: build, Mạnh 17/11 «Cổng Đáng trang Danh bạ: build lát chỉ đọc ngay» (`opportunity.md`). Danh bạ dự án, toà,
trục, căn đã có trong DB máy thu (ADR-0016) nhưng Ops không có trang xem. Lát đầu của DN2; chỉ đọc, chỉ ở máy thu.

## Criteria

- AC-1: Given app chạy trên cloud (`VERCEL=1`) hoặc DB không có bảng `buildings`, When mở `/ops/registry` hay `/ops/registry/<id>`, Then trang hiện cảnh báo «Chỉ ở máy thu» và không truy vấn bảng danh bạ nào (`asset_nodes`, `buildings`, `stacks`, `units`, `registry_aliases`, bảng nối, `offer_project`).
- AC-2: Given lược đồ tạm có ma trận nút viết trước (dự án xác minh có phân khu lồng hai cấp, toà có căn và toà chưa có căn; dự án một lời khai không con có tin; dự án xác minh không con không tin; nút `building` dưới dự án; toà `merged` và căn `retired`), When gọi hàm đọc danh bạ, Then mỗi nút có đúng số phân khu, số toà, số toà chưa có căn, số căn của cả cây con, tin theo nguồn chỉ đếm `mot_du_an` và chỉ nằm ở dự án gốc (view quy tin của phân khu về gốc), nút `building` đếm là phân khu không phải toà, và toà/căn không ở trạng thái `active` không được đếm.
- AC-3: Given cùng lược đồ tạm, When đọc dải số đầu trang, Then bốn ô bằng số kỳ vọng: dự án (đã xác minh, phân khu), toà (có căn, trục), căn, mã nguồn chưa nối theo nguồn — S06 theo `project_links`, S08 = dự án khác nhau đã nạp trừ dự án đã nối (kể cả dự án chưa qua bước nối), S09 = dự án đã nạp (chưa có bảng nối); ô ấy kèm câu chú «S09 đã cấp tên N toà» với N = số toà active có bí danh S09 còn dùng (Hỏi-1 — nháp theo khuyến nghị, chờ lời Mạnh ở Cổng Phạm vi).
- AC-4: Given bảng cây trên trang `/ops/registry`, When gõ chữ tìm (khác dấu, khác hoa thường) theo tên hoặc bí danh của dự án hay của một phân khu con, hoặc lọc tỉnh/thành, nguồn, bậc, chỗ thiếu («Chưa có toà», «Có toà chưa có căn», «Chưa có tin đang rao», «Chưa nối nguồn danh mục»), Then chỉ dự án khớp còn lại và nhãn đếm «k/n dự án» đúng; «Xoá lọc» trả đủ danh sách.
- AC-5: Given một dự án có phân khu, toà có căn và toà chưa có căn, When mở `/ops/registry/<id>`, Then đầu trang có bậc, tỉnh/thành, nguồn, bí danh và mã nguồn đã nối; bốn ô số bằng số của chính dự án ấy trên trang danh sách; bảng toà liệt đúng các toà của cây con (tên, phân khu chứa, mã tại nguồn, trục, căn), mở toà thấy căn theo tầng và trục; tab «Chưa có căn» chỉ chứa toà không có căn; id sai khuôn, không tồn tại hay là phân khu trả 404.
- AC-6: Given hai trang đã dựng, When đếm dòng mọi bảng danh bạ trước và sau và quét mã `lib/ops/registry/**`, Then số dòng không đổi; mã chỉ có `SELECT` (không INSERT, UPDATE, DELETE, TRUNCATE, DDL); không có migration hay view mới trong diff.
- AC-7: Given dữ liệu thử có tên dự án, bí danh dự án, tên toà, mã toà, mã trục, mã căn, mã dự án đã nối và tên dự án nguồn chưa nối chứa tên nguồn thật, When đọc HTML hai trang và mã truy vấn, Then nguồn chỉ hiện dạng mã `S0x`; tên nguồn thật không xuất hiện (giá trị ấy hiện bản đã che bằng `maskSourceNames`); mã `lib/ops/registry/**` không đọc `source_registry`, `real_name`, `users`, `sessions`, `user_events`, `user_profile`.
- AC-8: Given danh bạ rỗng, lọc không khớp, đang tải, truy vấn lỗi, dự án không có toà, mọi mã đã nối, When mở hai trang, Then lần lượt hiện ô trống kèm lệnh dựng, «Xoá lọc», khung chờ theo bố cục, lỗi kèm «Thử lại», «Dự án chưa có toà nào trong danh bạ.» kèm «Về danh bạ», «Mọi mã dự án đã nạp đều đã nối.».
- AC-9: Given route mới, When chạy bộ kiểm route và nav, Then đoạn `registry` có dòng `Slug URL` trong `CONTEXT.md`, hai route có dòng trong bản đồ route của onehub-ui, thanh bên Ops có mục «Danh bạ» trỏ `/ops/registry`, `docs/architecture/portals.md` có dòng trang; test route-slugs và routes-map xanh.
- AC-10: Given dev server của worktree (:3461) trên DB máy thu thật, When người chấm mở hai trang ở 1280 px sáng/tối và 390 px bằng tài khoản thử admin, Then bảng cây đọc được và mở được, không cuộn ngang trang ở 390 px; và đối chiếu chỉ-đọc trên DB máy thu: bốn ô số, tổng căn và tổng toà cộng trên mọi dự án, số tin đang rao theo nguồn khớp đếm SQL độc lập; tên nguồn thật trong HTML = 0. (cross-layer)

## Coverage

Quét hình thái tại chỗ (preset entity-feature, thực thể «nút danh bạ»), bốn trục — bảng phủ ca có số đếm ở design doc:

- Trục A — Loại nút × bậc: dự án `xac_minh` | `mot_loi_khai` | `suy_ra_manh` · phân khu `subzone` | nút `building` [thước CE: CHECK `asset_nodes_node_type_check`, `asset_nodes_catalog_tier_check`]
- Trục B — Con và vật thể: không con | phân khu lồng | toà có căn | toà chưa có căn | toà/căn không active [thước CE: CHECK `buildings_status_check`, `units_status_check`]
- Trục C — Nguồn: nối S06 | S08 | S09 (meta) | S10 | chưa nối có lý do | chưa qua bước nối | tin S03/S06 [thước CE: `project_links_status_check`, view `offer_project`]
- Trục D — Môi trường: máy thu có bảng | rỗng | cloud | thiếu bảng | lỗi [thước CE: `localOnlyTable` + `LocalOnlyAlert`]

Core → AC-1…AC-10: A, B ở AC-2, AC-5; C ở AC-2, AC-3, AC-4; D ở AC-1, AC-8. Later: số tin gắn từng toà/căn, màn đối chiếu
trường × nguồn (DN2 phần sau). Never: ghi vào danh bạ từ trang (Out of scope).

## Đường đo

- «Dải số khớp đếm SQL độc lập» (ngưỡng SỐNG của `opportunity.md`) → AC-10 (ca đối chiếu chỉ-đọc trên DB máy thu) và AC-3.
- «Mạnh mở một dự án xuống tới căn và chỉ ra một chỗ thiếu» → AC-4, AC-5 (bản bấm được); đo tại phiên nghiệm thu.
- «Không lộ tên nguồn thật» (ngưỡng CHẾT) → AC-7, AC-10.

## Out of scope

- Số tin gắn vào từng toà, căn (chưa có dữ liệu, Mốc 3) và màn «Hồ sơ đối chiếu trường × nguồn» — phần sau của DN2.
- Mọi thao tác sửa cây: gộp, tách, đổi cha, rút nút, duyệt nối mã nguồn.
- Đưa danh bạ dự án, toà, căn lên cloud (DN4 `danh-ba-len-cloud`).
- Migration, view hay cột mới; ghi dữ liệu bất kỳ.
- Bảng nối dự án S09 (hiện mọi mã S09 «Chưa qua bước nối» là đúng trạng thái kho).

## Notes

- Hỏi-1 (mở ở Cổng Phạm vi): cách đếm S09 «chưa nối» và câu chú toà S09 — xem sổ quyết định dòng S1 cuối.
- Ô số «Mã nguồn chưa nối» đếm theo dự án nguồn: S08 dùng `stg_s08_project` (nhiều snapshot) nên đếm `DISTINCT project_id`.
