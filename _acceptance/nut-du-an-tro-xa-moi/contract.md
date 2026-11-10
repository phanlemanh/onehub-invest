---
schema_version: 1
feature: Mọi nút dự án trong danh bạ trỏ mã xã/phường hiện hành, suy từ xã cũ có nguồn qua bảng chuyển đổi chính thức
slug: nut-du-an-tro-xa-moi
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
design_doc: docs/superpowers/specs/2026-11-10-nut-du-an-tro-xa-moi-design.md
approved_by: Mạnh
approved_at: 2026-11-10
---

# Acceptance Contract: nut-du-an-tro-xa-moi

## Context

Hàng DV1 (Mạnh chốt gói danh bạ dự án 09/11). 20 nút dự án mang mã khu vực gieo trước danh bạ xã PX1. Đo trên DB máy thu
10/11: 15 mã không còn trong `areas`; ba nút còn mã nhưng nay là xã khác cùng tên (Estella, Global City → An Phú của
Thuận An; Central Park → phường Bình Thạnh mới); Grand Park trỏ Long Trường; Ocean Park 2, 3 chỉ tới tỉnh. PX2, DA7 tạo nút
mới mang mã, DA9 cho tin kế thừa phường từ dự án — mã của nút phải đúng trước. Tệp xã của nút ghi xã cũ có nguồn có tên;
máy suy mã mới qua `area_aliases` (PX1). Thiết kế: `docs/superpowers/specs/2026-11-10-nut-du-an-tro-xa-moi-design.md`.

## Criteria

### AC-1 — Tệp xã của nút đủ và có nguồn
Given tệp `pipeline/data/xa-nut-du-an.json` và 20 slug nút dự án của lược đồ (026, 074),
When kiểm tệp,
Then mỗi slug có đúng một mục và tệp không có slug lạ; mục `cap: "xa"` có ít nhất một xã cũ, mỗi xã cũ có `old_code`
năm số và nguồn có `ten` cùng `url` http(s); mục có `chon` thì có `nguon_chon`; mục `cap: "tinh"` có `tinh` và `ly_do`.

### AC-2 — Suy mã mới theo mã, không theo tên
Given hàm `xaMoiCuaNut` với bảng bí danh xã cũ và bảng mã xã,
When suy một mục,
Then xã cũ không tách cho đích của nó, xã cũ tách cho đúng `chon`; mỗi lỗi ra đúng một mã lỗi gọi tên: thiếu nguồn,
xã cũ không có trong bảng, xã tách thiếu `chon`, `chon` ngoài đích, mã đích không có trong `areas`, tỉnh không có; hai xã
cùng tên khác mã (An Phú Thủ Đức và An Phú Thuận An) ra hai mã khác nhau.

### AC-3 — Lệnh sửa xã ghi đúng và chạy lại không đổi
Given DB thử dựng từ `db/migrations` và nạp danh bạ xã PX1 (`nap-dvhc`),
When chạy `danh-ba-vat-the.mjs --sua-xa`,
Then 20/20 nút dự án mang đúng mã suy từ tệp: mọi mã có trong `areas`, nút cấp xã chỉ mang xã có `admin_code`, nút cấp
tỉnh mang đúng mã thị trường; lệnh in bảng `slug · cũ → mới`; chạy lần hai đổi 0 nút; `--thu` không ghi dòng nào.

### AC-4 — Chặn trước khi ghi
Given tệp có một mục lỗi, tệp thiếu hay thừa một slug so với nút trong DB, hoặc đích sai,
When chạy `--sua-xa`,
Then lệnh thoát 2, dòng lỗi gọi tên slug và lỗi (hoặc lý do đích), và không nút nào đổi `area_ids`; đích là DB khác DB
thử trên máy này mà thiếu `--db-that` hay máy chủ ngoài máy này thì bị từ chối trước câu truy vấn đầu tiên.

### AC-5 — Grand Park và các bẫy cùng tên
Given tệp thật,
When suy mã,
Then Grand Park ra đúng `vn-hcmc-long-binh` từ hai xã cũ Long Bình và Long Thạnh Mỹ, mỗi xã một nguồn có tên, lựa chọn
khi tách có nguồn riêng; Estella Heights, The Global City không trỏ `vn-hcmc-an-phu`; Vinhomes Central Park không trỏ
`vn-hcmc-binh-thanh`; Phú Mỹ Hưng không trỏ `vn-hcmc-tan-phu`.

### AC-6 — Danh bạ dựng lại không đổi, phường của toà theo xã mới
Given DB thử có toà đã dựng dưới hai khu và phát biểu phường kế thừa theo mã cũ,
When chạy `--sua-xa` rồi dựng lại danh bạ,
Then số toà, trục, căn bằng trước và 0 UPI đổi; phát biểu phường kế thừa có giá trị khác phường mà toà nay được kế thừa
bị rút với lý do `sua-xa-nut` (gồm nút chuyển từ một phường sang nhiều phường: toà còn 0 phát biểu kế thừa); toà dưới nút
có đúng một phường nhận phát biểu phường mới.

### AC-7 — Đo trên dữ liệu máy thu
Given bản chép CHỈ ĐỌC 20 nút dự án của DB máy thu sang DB thử có danh bạ xã PX1,
When đo trước và sau `--sua-xa`,
Then trước: số mã không có trong `areas` bằng số đo độc lập trên máy thu; sau: 0 mã ngoài `areas` và 20/20 nút bằng tệp;
DB máy thu không bị ghi; lệnh chỉ in số và slug.

### AC-8 — Tài liệu và hồi quy
Given `pipeline/CLAUDE.md`, `docs/ROADMAP.md` và bộ test `pipeline`,
When đọc và chạy,
Then dòng `danh-ba-vat-the.mjs` của `pipeline/CLAUDE.md` nêu `--sua-xa` và tệp xã của nút; ROADMAP §2 as-built ghi DV1;
bộ test `pipeline` xanh.

## Coverage

Trục (preset entity-feature cho «mã xã của nút dự án»):
- Lớp sai của mã: không còn trong areas · còn mà là xã khác cùng tên · đúng chỗ sai phường · chỉ tới tỉnh · đúng.
  [thước CE: đo 10/11 trên máy thu, bảng §1 của thiết kế — AC-3, AC-5, AC-7]
- Đường suy: xã cũ không tách · xã cũ tách có `chon` · nhiều xã cũ · cấp tỉnh. [thước CE: cột `split` của
  `area_aliases` — AC-2]
- Lỗi đầu vào: sáu mã lỗi của `xaMoiCuaNut` · thiếu/thừa slug · đích sai. [thước CE: danh sách lỗi của thiết kế §2 —
  AC-2, AC-4]
- Bên dùng mã: phường của toà (DB1) · UPI của toà · DA9, PX2, DA7 (hàng sau). [thước CE: `grep area_ids pipeline/` — AC-6;
  DA9, PX2, DA7 đọc mã đã sửa, không đổi trong vòng]
- Nơi: DB thử · bản chép máy thu · máy thu, cloud (sau gộp). [AC-3, AC-7; máy thu và cloud: Out of scope]

Core → AC-1…AC-7. Later: áp lên máy thu và cloud (Hỏi-1); xã cho năm nút chưa chốt khi có nguồn. Never: suy xã bằng
tên (bẫy cùng tên).

## Out of scope

- Áp `--sua-xa` lên DB máy thu và dựng lại danh bạ ở đó — bước triển khai sau gộp, cần lời Mạnh (Hỏi-1); `asset_nodes`
  lên cloud ở lượt đồng bộ kế.
- `meta.city` sai của Ecopark, Ocean Park 2, 3 (thuộc Hưng Yên) và `legal_note` sai của Ecopark — `city` sinh mã tỉnh
  trong UPI của toà, đổi là đổi UPI; hàng riêng.
- Rút hay sửa ba nút gieo không ứng với dự án tìm được (`the-rainbow`, `sun-grand-park-11`, `saluto`) — DA19.
- Không thêm bước sửa xã vào chạy đêm; không đổi nút mới do PX2, DA7 tạo.

## Notes

- Năm nút không chốt được xã theo Hỏi-2 (Ocean Park 3, Celadon City và ba nút gieo không xác định).
