---
schema_version: 1
feature: Hàng Phường của bảng so ghép căn ở /ops/review so theo tên phường chuẩn, không báo «Lệch» khi hai tin cùng phường chỉ khác cách viết
slug: the-duyet-phuong-lech-gia
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: approved
veto_state: mo
veto_opened_at: 2026-10-30T09:32:27Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-30-the-duyet-phuong-lech-gia-design.md
---

# Acceptance Contract: the-duyet-phuong-lech-gia

## Context

Căn cứ: mục Ngoài-1 của PL3 the-duyet-du-can-cu — Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 30/10
(`_acceptance/the-duyet-du-can-cu/decisions.jsonl` `d-20261030T071529Z-26`); giám sát xếp hàng cho dãy U1 (Cổng Đáng
build, Mạnh). Đo trên DB máy thu 30/10: 12/12 thẻ ghép căn là cặp S05 ↔ S06, bên S05 ghi slug phường (`binh-thanh`),
bên S06 ghi tên đủ (`Phường Bình Thạnh`); cả năm cặp khác nhau đều cùng phường mà hàng Phường báo «Lệch».

## Criteria

- AC-1: Given hai tin của thẻ ghép căn ghi cùng một phường theo hai cách (slug, tên đủ có «Phường»/«Xã»/«Thị trấn»,
  viết tắt «P.» có hay không dấu cách sau, có dấu hay không dấu, hoa hay thường, có «Đ», tên phường tự bắt đầu bằng
  «Phương»/«Phượng» như «Phương Liệt»), When dựng bảng so, Then hàng Phường mang nhãn «Khớp».
- AC-2: Given hai tin ghi hai phường khác nhau — kể cả tên này là phần đầu tên kia («Bình Thạnh» với «Bình Thạnh
  Đông») và hai phường số khác số («Phường 1» với «Phường 12») — When dựng bảng so, Then hàng Phường mang nhãn «Lệch».
- AC-3: Given ít nhất một bên có tên phường chỉ còn số sau khi chuẩn hoá («Phường 12», `phuong-12`, «P.12»), When dựng
  bảng so, Then hàng Phường so đúng như trước vòng — «Khớp» chỉ khi hai chuỗi gốc giống hệt (bỏ khoảng trắng hai đầu,
  không phân biệt hoa thường), còn lại «Lệch»: khoá số không làm hai chuỗi gốc khác nhau thành «Khớp».
- AC-4: Given một bên trống phường, hoặc chỉ có tiền tố không tên («P.», «Phường», «-»), When dựng bảng so, Then hàng
  Phường «Thiếu» — hai bên cùng chỉ có tiền tố cũng «Thiếu», không bao giờ «Khớp»; Given bất kỳ thẻ nào, Then ô Tin A /
  Tin B của hàng Phường hiện nguyên chuỗi của nguồn, và chín hàng còn lại so như trước vòng (ca PL3 TD-AC-2 vẫn xanh;
  «Đường Phan Văn Trị» với «Phan Văn Trị» vẫn «Lệch» — chuẩn hoá chỉ áp cho hàng Phường).
- AC-5: Given thẻ ghép căn chờ có Tin A `binh-thanh` và Tin B `Phường Bình Thạnh`, When mở sheet chi tiết (ReviewCard
  thật), Then hàng Phường của bảng so hiện badge «Khớp» cạnh hai giá trị `binh-thanh` và `Phường Bình Thạnh`.
- AC-6: Given bảng `areas` thật của DB máy thu (chỉ đọc; đuôi mã area sau mã thị trường là mốc, không qua hàm đang
  đo), When so từng phường dưới hai cách ghi của nguồn (đuôi mã ↔ «Phường » + tên, đuôi mã ↔ tên trần) và mọi cặp hai
  phường khác nhau cùng thị trường (đuôi mã phường này ↔ «Phường » + tên phường kia), Then mọi cặp cùng phường «Khớp»,
  mọi cặp khác phường «Lệch», mỗi nhánh có ít nhất một cặp; và mọi thẻ ghép căn thật có hai bên cùng đuôi mã một phường
  mang «Khớp», có ít nhất một thẻ như vậy (phép đo không xanh suông). (cross-layer)

## Coverage

Quét hình thái tại chỗ (preset test-matrix của morphological-scan), hai trục:

- Cách ghi tên phường: slug | tên đủ có tiền tố (Phường · Xã · Thị trấn) | viết tắt P./P. | không dấu | hoa thường |
  chữ Đ | tên tự bắt đầu bằng Phương/Phượng | tên số | chỉ tiền tố | trống — [thước CE: dữ liệu thật 30/10 (slug S05, «Phường X» S06) + `slugifyName()` của
  `app/src/lib/queries.ts` + tên phường OSM của bảng `areas` (304 phường, 0 phường số, 2 tên đầu «Phương/Phượng»;
  đuôi mã = slug tên ở 304/304)]
- Quan hệ hai bên: cùng phường | khác phường | một phần tên trùng | cùng số khác quận | thiếu một bên — [thước CE:
  `soGiaTri` ba nhãn Khớp/Lệch/Thiếu của PL3]

Core → AC-1…AC-6. Later: ghi `area_id` vào evidence thẻ mới để so theo mã (bên sinh thẻ ở `agent/`). Never: đoán phường
từ quận hay thành phố đi kèm tên.

## Out of scope

- OOS-1: Tên phường kèm quận hay thành phố («Phường 12, Quận 3») — khoá khác nhau nên vẫn «Lệch» (chiều an toàn).
- OOS-2: Ghi `area_id` vào evidence của thẻ ghép căn, hay sửa evidence các thẻ đã có.
- OOS-3: Nối lại khoá tin S05 đã trôi của các thẻ chờ (phía Tin A hiện «Không có toàn văn ở máy thu») — việc riêng
  đã báo giám sát 30/10.
- OOS-4: Đổi bố cục, chữ hay thành phần của sheet.
- OOS-5: Hai chuỗi phường số giống hệt ở hai quận khác nhau — «Khớp» như trước vòng; vòng chỉ sửa «Lệch» giả.

## Notes
