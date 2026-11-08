# Review findings: danh-ba-phuong-xa-toan-quoc (round 1)

Phiên verify tươi, đọc `git diff d60c3fa1...980ec75d -- pipeline db` (13 tệp code + dữ liệu `pipeline/data/dvhc`) và đo
thêm bằng hai đầu dò chỉ-đọc trên DB `oneinvest` (stg S06, bài S03). Không có lỗi nào làm hỏng dữ liệu hay mở cửa
(fail-open) trên dữ liệu hôm nay; các phát hiện là lỗ tiềm ẩn hoặc lệch nhỏ so với chữ của hợp đồng.

## Trong hợp đồng

- **S06 không bỏ tiền tố «Đặc khu» khi khớp `ward_name_v3`** (AC-7)
  Người dùng thấy gì: tin S06 ở 13 đặc khu (Phú Quốc, Côn Đảo, Vân Đồn, Hoàng Sa…) không gắn xã qua trường phường chuẩn 2025, chỉ còn trông vào khớp chữ trong tiêu đề; tin không nhắc tên đặc khu trong chữ thì không có xã.
  Căn cứ: `norm` chỉ bỏ «phường|xã|thị trấn|thị xã» (`pipeline/transform-chotot.mjs:25-26`; bản chép `normS06` ở `pipeline/scripts/nap-dvhc-do.mjs:35`), còn tên trong areas là «Hoàng Sa». E9 thấy đúng 3 tin «v3=Đặc khu Hoàng Sa … cách=chu» (khớp chữ cứu); đầu dò: 4/73.660 tin S06 có v3 dạng «Đặc khu …», cả 4 trượt đường v3. Hôm nay mất 0 tin vì khớp chữ cứu, nhưng AC-7 nói khớp `ward_name_v3`.
  file: `pipeline/transform-chotot.mjs`
  severity: low
  Đề xuất: sửa nhỏ (thêm «đặc khu» vào `norm`, hoặc dùng `chuanTen` của `lib/dvhc.mjs`).

- **Một xã trong danh bạ mang tên có tiền tố: «xã Bắc Sơn» (06325, Lạng Sơn)** (AC-3)
  Người dùng thấy gì: khu vực mới vào areas với tên «xã Bắc Sơn» (chữ thường, có tiền tố) và id `vn-lang-son-xa-bac-son`, khác khuôn mọi xã khác; khi lên Ops/Invest sẽ hiện lệch.
  Căn cứ: `pipeline/data/dvhc/xa.json` có đúng 1/3.321 bản ghi `ten` mang tiền tố cấp xã; bộ nạp chèn `name = x.ten` nguyên văn (`pipeline/nap-dvhc.mjs:93-97`). AC-3 đòi `name` «không tiền tố như danh bạ»; ca test chỉ so `name === ten` nên xanh. Khớp tên không bị ảnh hưởng (`chuanTen` bỏ tiền tố).
  file: `pipeline/data/dvhc/xa.json`, `pipeline/nap-dvhc.mjs`
  severity: low
  Đề xuất: sửa ở nguồn quy-hang rồi chép lại kèm băm mới, hoặc bỏ tiền tố cấp xã khi chèn (id cũng đổi theo — làm trước khi áp lên máy thu).

- **Đường `ward_name` (tên cũ) của S06 khớp thẳng tên hiện hành trước bước bí danh an toàn** (AC-8)
  Người dùng thấy gì: tin S06 mà `ward_name_v3` không khớp, còn `ward_name` (tên trước 2025) trùng tên một xã hiện hành KHÁC trong cùng tỉnh, sẽ bị gắn vào xã trùng tên đó — đúng lớp «trùng tên hiện hành» AC-8 bảo không gắn.
  Căn cứ: `ganPhuongS06` bước 2 tra `wardMap.get(norm(ad.ward_name))` (`pipeline/transform-chotot.mjs:38`) trên danh sách nay gồm mọi xã danh bạ của tỉnh, chạy trước bước bí danh có luật an toàn (`:42`). Đầu dò chỉ-đọc trên 73.660 tin S06 (chỉ HN, HCM, ĐN): 14 tin trượt v3, 0 tin rơi vào trường hợp này. Bước 2 có từ trước PX1, nhưng PX1 mở rộng danh sách tên nên tầm ảnh hưởng lớn lên khi S06 phủ thêm tỉnh. Test AC-8 chỉ kiểm `dungBiDanhAnToan`/`matchXaCuCoTienTo`, không kiểm đường này.
  file: `pipeline/transform-chotot.mjs`
  severity: medium (tiềm ẩn; 0 tin hôm nay)
  Đề xuất: người quyết — chấp nhận làm giới hạn đã biết, hoặc cho bước 2 đi qua cùng luật an toàn (chỉ nhận khi tên cũ thuộc lớp an toàn hoặc trỏ đúng xã cùng tên).

- **Thước AC-9 không đối chiếu số areas, area_aliases trước/sau; vài chiều đỏ hiện thực khác chữ `expected`** (AC-9, AC-1, AC-2, AC-3, AC-6)
  Người dùng thấy gì: không có ảnh hưởng sản phẩm; lưới kiểm mỏng hơn lời khai ở vài chỗ.
  Căn cứ: `pipeline/scripts/nap-dvhc-do.mjs:112-113, 181-183` chỉ in số areas trước/sau, không so và không đếm area_aliases. Ca «0 dòng ghi» của AC-2 kiểm sau ROLLBACK TO SAVEPOINT nên luôn đúng (`pipeline/scripts/nap-dvhc.test.mjs:123-133`); thứ thật sự bảo đảm là vòng kiểm 34 thị trường trước mọi lệnh ghi (`pipeline/nap-dvhc.mjs:45-49`). Chiều đỏ «bản sao chuanTen bỏ Quận» (AC-3) và «bản sao reassign bỏ điều kiện admin_code» (AC-6) không có ca chạy được; AC-6 dùng cách tương đương (gỡ admin_code thì bị xoá).
  file: `pipeline/scripts/nap-dvhc-do.mjs`, `pipeline/scripts/nap-dvhc.test.mjs`
  severity: low
  Đề xuất: known-limits.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi — người quyết, máy không sửa.

- **Bộ khớp tên S03 khớp chuỗi con, không ranh giới từ, nay phủ 3.321 tên xã**
  Người dùng thấy gì: bài S03 của nhóm khai một tỉnh ngoài 4 thành phố có thể bị gắn nhầm xã khi tên xã (hoặc dạng bỏ dấu của slug) là một phần của từ khác; hai xã cùng tỉnh khớp dài bằng nhau thì lấy xã đầu tiên thay vì không đoán.
  Căn cứ: `matchPhuongThiTruong` dùng `textLower.includes(v)` với cả biến thể slug bỏ dấu, và chỉ coi là tranh khi khác thị trường (`pipeline/transform-zalo.mjs:586-598`) — có từ trước PX1, PX1 mở danh sách cho nhóm khai tỉnh. Đầu dò chỉ-đọc: nhóm khai ngoài 4 thành phố hôm nay chỉ có Hưng Yên, 480 bài, 2 lần khớp, cả hai đúng ranh giới từ.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits — xem lại khi có nhóm khai tỉnh mới.

- **Thu OSM cho 30 tỉnh về sau có thể làm bộ nạp va chỉ mục duy nhất của admin_code**
  Người dùng thấy gì: lần nạp danh bạ kế tiếp dừng bằng lỗi DB không tên thay vì thông điệp «PX1 …» — không hỏng dữ liệu (một giao dịch, ROLLBACK).
  Căn cứ: xã danh bạ chèn với id có hậu tố mã (`<thị trường>-<slug>-<mã>`) không trùng id phường OSM cùng tên được upsert sau này (`pipeline/reassign-areas.mjs` upsert theo `<thị trường>-<slug>`); `khopXa` ưu tiên phường OSM (`pipeline/lib/dvhc.mjs:72-80`) nên bộ nạp gán mã vào phường OSM trong khi dòng dvhc vẫn giữ mã đó → vi phạm `areas_admin_code_uq` (`db/migrations/084_danh_ba_dvhc.sql:10`). Chỉ xảy ra sau OOS-1.
  file: `pipeline/nap-dvhc.mjs`
  severity: low
  Đề xuất: known-limits — ghi vào việc thu OSM 30 tỉnh (OOS-1), sửa cùng lượt đó.

- **Suite `cd app && npm test` đỏ một ca đo thời gian, có sẵn từ trước**
  Người dùng thấy gì: không có; lưới hồi quy của app đỏ khi máy bận.
  Căn cứ: ca «E4b đối chiếu DB máy thu» (`app/tests/tin-rao-doi-chieu.test.tsx:109`, trần 1000 ms) đỏ ở cả HEAD (1040 ms) lẫn baseline `d60c3fa1` (1076 ms) khi 8 tệp chạy song song; chạy riêng tại HEAD mọi câu dưới 400 ms. Diff không chạm `app/`.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: low
  Đề xuất: new-contract — việc riêng cho làn app (tách ca đo thời gian khỏi lượt song song).

Cụm ngoài vùng phủ: cluster: n-a (không đo — đường độc lập không chạy bộ quét cụm).
