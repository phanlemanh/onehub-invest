# Nối dự án S08 của lát vào khu đô thị — thiết kế (DN1 `noi-du-an-s08-khu-do-thi`)

## Vì sao

Đo 03/11: 3/150 dự án S08 khớp `asset_nodes` đúng tên hoặc bí danh, và một dự án có thể bị tách nhiều tên (`docs/superpowers/specs/2026-11-03-danh-ba-xac-nhan-toan-quoc-design.md` §3). DB1 cần biết dự án S08 nào thuộc khu đô thị nào để dựng toà, trục, căn. Tách từ DB1 để DB1 không phình.

Tài liệu này không ghi tên dự án lấy từ S08 (luật 5).

## Đo 05/11, trước khi sửa (DB máy thu, chỉ đọc)

| Đo | Số | Nghĩa |
|---|---|---|
| Dự án S08 | 150 | |
| Dự án thuộc lát | 8 (Ocean Park 1: 3, Grand Park: 5) | Tên S08 bị tách nhiều dòng đúng như đo 03/11 |
| Bí danh dự án trùng mã toà | `s7`, `s10` của `phu-my-hung` | 107 tin S03 có `block_raw` là S7, S10, S10 lại là toà ở Ocean Park |
| `area_ids` của OCP1–3 | 2 mã trong sổ, `vn-hanoi-vy-le`, `vn-hanoi-vu-yen`, đều không có trong `areas` | Mã đã chết từ đợt đổi đơn vị hành chính |
| Bí danh và tên sai địa danh | `vu yen`, `vu yen 3`, `vang danh`, `vang danh 2`; tên «(Vũ Yên)» | Vũ Yên ở Hải Phòng, Vàng Danh ở Quảng Ninh; 35 bài S03 nhắc Vũ Yên, 0 tên nhóm nào chứa các tên này |
| Bí danh không có nguồn | `vuong` | Không nguồn nào giải thích; 5 bài S03 có chữ này, 0 tên nhóm |
| Mã vùng chết còn lại | 16 cặp nút, mã, gồm một mã của Grand Park | Ngoài phạm vi, ghi Out of scope |

## Nguồn xác minh `area_ids`

- OCP1: xã Gia Lâm (`vn-hanoi-gia-lam`), theo Nghị quyết 1656/NQ-UBTVQH15, gộp Đa Tốn, Dương Xá, Kiêu Kỵ, Trâu Quỳ.
- OCP2, OCP3: tỉnh Hưng Yên (`vn-hung-yen`). Nguồn công khai chưa thống nhất xã của OCP2 (Nghĩa Trụ hay Văn Giang), và `areas` chưa có cấp xã của Hưng Yên, nên ghi cấp tỉnh. Xã để khi `areas` có đủ.

## Cách làm

1. **Migration 074** (`db/migrations/074_noi_du_an_s08.sql`, số do liên làn cấp):
   - Bảng `s08_project_links`: `project_id` khoá chính, `asset_node_id`, `status` (`noi`, `chua_noi`), `ly_do`, `updated_at`. CHECK: `noi` phải có nút, `chua_noi` phải có lý do và không có nút. KHÔNG sync cloud.
   - Sửa `asset_nodes` theo slug: bỏ bí danh sai, đổi `area_ids` OCP1–3, bỏ «(Vũ Yên)» trong tên. Idempotent. Slug không đổi.
2. **Lệnh `pipeline/noi-du-an-s08.mjs --tep <tệp> [--thu]`**: đọc bảng nối từ tệp local, kiểm, rồi ghi `s08_project_links` trong một giao dịch. Dự án không có trong bảng nối ghi `chua_noi`, lý do `ngoai-lat`. `--thu` chỉ kiểm và in số, không ghi. Từ chối và không ghi gì khi: nút không phải `project`, slug không có, `project_id` không có trong S08, một dự án hai dòng, tệp không có dòng nối nào, tín hiệu của dòng không khớp tên hay phân khu S08 của dự án, dự án trúng từ khoá lát mà không nối cũng không có lý do loại, tệp không bị git bỏ qua hoặc nằm ngoài kho. In số và mã lỗi, không in tên hay `project_id`. Lỗi CHECK của Postgres in tên ràng buộc, không in dòng.
3. **Bảng nối** ở `research-local/s08-noi-du-an.json` của máy thu, gitignored: `project_id`, slug, tín hiệu từng dòng, từ khoá của lát, dự án loại kèm lý do. Mạnh duyệt tám cặp ở `research-local/s08-noi-du-an-xem.md`, băm của tệp được duyệt commit ở `_acceptance/noi-du-an-s08-khu-do-thi/probes/bang-noi.sha256`; đổi bảng là phép đo đỏ.
4. **`pipeline/mappings.yaml`**: khối S08 thêm `project_id`, `project_name`, nói rõ nối qua `s08_project_links`, chỉ local.

Nối tay qua bảng, không so chữ: tên S08 bị tách và mang hậu tố nội bộ, nên so chữ tự động sai âm thầm. Lát đầu chỉ 8 dòng; lát sau mở bằng cách thêm dòng, không sửa mã.

## Lựa chọn đã loại

- **Ghi bảng nối trong migration**: kho công khai, và cloud không có `stg_s08_inventory`.
- **Thêm bí danh S08 vào `asset_nodes`**: `asset_nodes` có sync cloud, tên S08 sẽ rời máy.
- **Sửa mọi mã vùng chết**: chưa có nguồn xác minh cho từng khu, gồm một mã của Grand Park; ghi lại số để mở việc riêng.

## Ảnh hưởng đã biết

- `agent/src/agents/context-resolver.ts` so tên nhóm với bí danh từ 4 ký tự: nhóm có «vu yen» thôi bị gán OCP2, OCP3. `s7`, `s10` dưới 4 ký tự nên không qua đường này, nhưng vẫn là bí danh sai trên `agent/src/enrich`, DB1 và bộ gắn toà sau này.
- `asset_nodes` sync cloud nên tên, bí danh và `area_ids` mới lên cloud ở lần sync sau khi 074 áp ở máy thu; migration chạy ở máy thu, không tự áp cloud. Không có dữ liệu S08 trong đó. Trên cloud, tên nút chỉ hiện ở danh mục khai đơn vị của `/ops`; không màn nào của cổng Invest hay API công khai đọc `area_ids` (`app/src`, `data-api/src`).

## Phép đo

- Hàm thuần: kiểm bảng nối, hai chiều (E1, E2).
- DB thử `oneinvest_dn1_noi`, dựng lại mỗi lần; phép đo từ chối chạy trên DB khác và băm `asset_nodes` của `oneinvest` bao quanh toàn lượt: migration hai lần, lệnh thật với tệp lành và tệp sai, đếm theo khu, quan hệ từng dòng, bí danh, `area_ids` (E3–E6, E9, E10).
- S08 không rời máy: không mã nào khác nhắc bảng này, diff và hồ sơ không chứa tên hay mã dự án S08, đầu ra mọi nhánh của lệnh không in chúng (E7).

## Bỏ đặc tả UX

Việc không chạm giao diện: xem dòng `descope` trong sổ.
