---
schema_version: 1
feature: Đường của tin S06 đi tới tin và căn, không rơi giữa chừng
slug: s06-duong-du-an-len-tin
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-03
design_doc: docs/superpowers/specs/2026-11-02-s06-duong-du-an-len-tin-design.md
---

# Acceptance Contract: s06-duong-du-an-len-tin

## Context

Hàng DS1, việc 6 của kế hoạch ra mắt 05/11, chỉ số «Không tệ đi». Đo 02/11: đường có ở 98,2% tin S06 trong dữ liệu thô, chỉ 16,9% ở tin và
17,7% ở căn, vì transform không đọc `payload.street_name`. Dự án cần migration nên tách thành hàng T3 riêng (Mạnh chọn ở Hỏi-1).

## Criteria

- AC-1: Given bảng «Ma trận AC-1» dưới đây, When đọc từng hàng qua `docDacTrungS06`, Then ra đúng cột «Kết quả»: phát biểu `street_raw` với `rule_id = payload.street_name` và đúng chuỗi ghi, hoặc không có phát biểu; các phát biểu đặc trưng nhà cũ không đổi.
- AC-2: Given tin S06 tổng hợp trên DB thử, When chạy `runTransformChotot` thật, Then có đúng một phát biểu sống (`fact`, `source_field`, `rule_id = payload.street_name`) và cột `street_raw` của tin bằng giá trị đó, `field_provenance` trỏ về phát biểu. (cross-layer)
- AC-3: Given ba tin có sẵn `legacy`: nguồn cùng chữ, nguồn khác chữ, nguồn rỗng, When chạy transform, Then lần lượt ra chữ của nguồn, chữ của nguồn, giữ `legacy`; dòng `legacy` không bị xoá. (cross-layer)
- AC-4: Given transform chạy hai lượt liên tiếp không đổi dữ liệu, rồi một lượt nguồn đổi tên đường, rồi một lượt nguồn bỏ trống, When đọc phát biểu và tin, Then lượt hai không thêm phát biểu và không đổi tin; lượt đổi rút phát biểu cũ và tin mang tên mới; lượt bỏ trống rút phát biểu của transform, tin có `legacy` thì cột bằng đúng chuỗi `legacy`, không có thì NULL. (cross-layer)
- AC-5: Given căn tổng hợp: ô trống với một tin có đường; ô trống với hai tin khác đường và khác `last_seen`; hai tin cùng `last_seen`; ô đã có giá trị; căn có tin đã rời kho mang đường; căn không tin nào có đường, When chạy `resolve-properties` thật, Then lần lượt: nhận đường của tin; nhận của tin thấy gần nhất; nhận của `offer_id` nhỏ nhất; giữ nguyên; không nhận từ tin đã rời kho; vẫn trống. Mỗi căn được điền có đúng một mục `enrichment_log`, lượt thứ hai không thêm mục nào. Lệnh hoàn tác `resolve-properties --hoan-tac-duong` trả đúng các ô đã điền về trống theo `enrichment_log`, không đụng ô có sẵn, số ô trả về bằng số mục log. (cross-layer)
- AC-6: Given ma trận cặp đường gồm «Đường X» × «X», «Phố X» × «X», «Ngõ 5 X» × «X», «Đường X, Phường Y, TP Z» × «X», «Số 277 Đường X» × «Đường X», «Đường X» × «Đường W», và một bên trống, When qua `soDuong` của `judge-entity` và của thẻ duyệt, Then lần lượt ra Khớp, Khớp, Khớp, Khớp, Khớp, Lệch, Thiếu ở cả hai bản, và chỉ ca Lệch làm `same_house = no`.
- AC-7: Given bản chép DB máy thu (`db/db-thu.sh`, không ghi lên DB dùng chung), transform và `resolve-properties` chạy thật trên bản chép, When đếm trước và sau, Then ≥ 90% tin S06 sống có đường; ≥ 90% căn S06 có đường; loại hình, phòng ngủ, WC, số nhà, mã căn, số tầng không giảm quá 1 điểm %; 0 giá trị đường chứa tên nguồn thật, với danh sách tên có ít nhất một phần tử; trong các cặp tin cùng căn, 0 cặp ra Lệch mà hai chuỗi bằng nhau sau khi bỏ hoa, tiền tố «Đường», «Phố» viết đúng chính tả (có dấu hoặc không dấu cả chữ) rồi mới bỏ dấu; in số từng dòng, số cặp Lệch, số tin bị bỏ theo từng tiền tố hành chính và thời gian chạy. Vi phạm bất kỳ dòng nào thì thoát 1 và in dòng đó, không in tên nguồn. (cross-layer)

## Ma trận AC-1

| # | `payload.street_name` | Kết quả |
|---|---|---|
| 1 | `Nguyễn Xiển` | `Nguyễn Xiển` |
| 2 | `Đường Huỳnh Tấn Phát` | `Đường Huỳnh Tấn Phát` |
| 3 | `  Âu Cơ  ` | `Âu Cơ` |
| 4 | `Lạc   Long  Quân` | `Lạc Long Quân` |
| 5 | `Nguyễn Trãi` dạng NFD | `Nguyễn Trãi` dạng NFC |
| 6 | `Đường Tân Túc, Thị trấn Tân Túc, Bình Chánh` | giữ nguyên |
| 7 | `Số 277 Đường Bến Bình Đông, Phường 14` | giữ nguyên |
| 8 | `Nguyễn Xiển 0912345678` | giữ nguyên |
| 9 | `Đường Quận 1 cũ` | giữ nguyên |
| 10 | `Xã Đàn` | giữ nguyên |
| 11 | `Tỉnh lộ 10` | giữ nguyên |
| 12 | `TP Giao Lưu` | giữ nguyên |
| 13 | rỗng | không phát biểu |
| 14 | chỉ khoảng trắng | không phát biểu |
| 15 | kiểu số `123` | không phát biểu |
| 16 | vắng khoá | không phát biểu |
| 17 | `Phường Hòa Quý, Quận Ngũ Hành Sơn, Đà Nẵng` | không phát biểu |
| 18 | `phường 5` | không phát biểu |
| 19 | `P. Hòa Quý, Q. Ngũ Hành Sơn` | không phát biểu |
| 20 | `Quận Ngũ Hành Sơn` | không phát biểu |
| 21 | `Huyện Bình Chánh, Hồ Chí Minh` | không phát biểu |
| 22 | `Thị trấn Tân Túc` | không phát biểu |
| 23 | `Thị xã Bến Cát, Bình Dương` | không phát biểu |
| 24 | `Xã Tân Nhựt, Bình Chánh` | không phát biểu |
| 25 | `TP Thủ Đức, Hồ Chí Minh` | không phát biểu |
| 26 | `Thành phố Thủ Đức, Hồ Chí Minh` | không phát biểu |
| 27 | `Tỉnh Bình Dương, Việt Nam` | không phát biểu |

## Coverage

Quét tay theo ba trục (không dùng khung quét: ít chiều, đo từ dữ liệu thật).

| Trục | Giá trị | AC |
|---|---|---|
| Dạng chữ nguồn (đo trên 48.499 tin) | thường · có tiền tố · thừa khoảng trắng · có phẩy · số đầu · địa danh hành chính · rỗng · vắng | AC-1, AC-6 |
| Trạng thái ô tin | trống · có `legacy` · có phát biểu cũ cùng/khác chữ · nguồn rút | AC-2, AC-3, AC-4 |
| Trạng thái ô căn | trống · có sẵn · nhiều tin · tin rời kho · không tin nào có đường | AC-5 |
| Nơi đọc | hàm thuần · DB thử · bản chép DB máy thu | AC-1, AC-2, AC-7 |

## Đường đo

| Ngưỡng (opportunity.md) | Đo bằng |
|---|---|
| Đường ≥ 90% ở tin | AC-7 (bản chép DB máy thu) |
| Các trường khác không giảm quá 1 điểm % | AC-7 (bản chép DB máy thu) |
| Dự án có mặt ở tin và căn | Không đo ở vòng này (Hỏi-1 chọn tách): hàng DS2 `s06-du-an-len-tin-can` (T3) đo; đã ghi ở `opportunity.md` |

## Out of scope

- Dự án của tin và căn (`SubdivisionName`, `project_node`): cần migration và sửa `sync-cloud.mjs`, tách thành hàng T3 riêng theo Hỏi-1.
- Chuẩn hoá đường về danh mục, tách số nhà ra khỏi chữ đường.
- Đường của S03, S05: lớp LLM và parser của hàng khác.
- Sửa `khoaDuong`, luật `judge-entity`, giao diện thẻ duyệt; đổi cách lên cloud.
- Chạy tay transform trên DB máy thu: job đêm làm sau khi gộp.

## Notes

- Lượt đồng bộ cloud đầu tiên sau gộp chở khoảng 39.000 tin đổi đường; giám sát xếp lượt với TR1.
- Đo sau gộp, ngoài lượt chấm: sau job đêm đầu tiên chạy `node pipeline/scripts/do-duong-s06.mjs --chi-doc` trên DB máy thu; sau lượt đồng bộ đối chiếu số `street_raw` và `properties.street` khác NULL trên cloud.
- Biết trước: `Xã Đàn, Đống Đa` bị bỏ như tiền tố hành chính; chuỗi không phẩy thì giữ. Số tin bị bỏ theo từng tiền tố in ở AC-7.
- Known limits — Mạnh chọn sửa chữ AC-7 ngày 2026-11-03:
  - Người bán gõ sai tiền tố («Đương An Phú Đông 26» so với «Đường An Phú Đông 26», căn 10658) thì bộ so vẫn ra Lệch; đo 03/11 có đúng một cặp như vậy, và `khoaDuong` không đổi vì hợp đồng đã loại.
- Ngoài ma trận AC-1: `street_name` nguồn trả dạng mã hoá (base64 dài, đo 03/11 có 21 tin) thì không phát biểu; ghim ở ca thuần cùng tệp test.
