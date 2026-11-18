---
schema_version: 1
feature: Dự án, toà, tầng, khu và căn thấp tầng S09 vào danh bạ, toà và căn trùng S16, S08 thành bí danh, không sinh trùng
slug: nap-s09-toa-tang-vao-danh-ba
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, ui]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-18-nap-s09-toa-tang-vao-danh-ba-design.md
---

# Acceptance Contract: nap-s09-toa-tang-vao-danh-ba

## Context

DA42 đưa gói 1 của S09 vào danh bạ. Danh bạ hôm nay có 344 dự án, 307 toà, 111.668 căn. Làn thu đo 18/11: 221 dự án, 928 toà, 23.708 tầng,
91 khu thấp tầng; các số này chốt lại khi gói 1 về máy thu.

Thi công chỉ bắt đầu sau khi DA37 vào `main` và gói 1 về. Migration số 115 đã giữ.

## Criteria

### AC-1 — Gói 1 nạp vào stg không nhân dòng
Given DB của riêng lượt đã áp đủ migration và fixture rút từ phản hồi mẫu thật của làn thu, có item thiếu mã, khu nhiều trang, một tệp sai băm,
When nạp fixture hai lần qua hàm dùng chung,
Then lần một ghi đúng số dòng hợp lệ, lần hai ghi 0 dòng; item hỏng đếm theo lý do; tệp sai băm làm lượt nạp dừng trước khi ghi; áp
migration lần hai không lỗi.

### AC-2 — Số trong stg khớp manifest bản thu thật
Given DB thử chép từ DB máy thu và snapshot gói 1 thật,
When nạp rồi chạy một bộ đếm độc lập đọc thẳng snapshot,
Then số dự án, toà, tầng, khu, căn thấp tầng trong stg bằng số bộ đếm và số manifest; khu có số căn lấy được khác tổng nguồn báo thì lệch và
nêu khu; lệch một ô thì thoát 1.

### AC-3 — Dự án S09 đi đúng một trong bốn đường
Given ma trận viết trước: dự án đã nối · trùng tên đúng một dự án · tên gần giống · không khớp,
When chạy bước dự án S09,
Then lần lượt: giữ nối · ra thẻ luật theo nguồn, chưa nối khi chưa duyệt · ra thẻ từng cặp, chưa nối · tạo đúng một nút ứng viên bậc
`mot_loi_khai`. Nút ứng viên không nối tin và không đủ điều kiện lên Invest. Dự án chờ thẻ có 0 toà mới; duyệt nối rồi dựng lại thì toà vào đúng dự án
và không sinh trùng; từ chối thì vẫn không nối. Đường nút ứng viên theo lời Hỏi-2.

### AC-4 — Toà không sinh trùng
Given dự án có toà S16, toà S08, toà đã có bí danh S09 theo mã cũ, và dòng gói 1 gồm toà khớp một, khớp hai, không khớp, hai toà trùng tên,
When chạy bước toà S09,
Then khớp một thành bí danh, số toà không đổi; toà đã có bí danh mã cũ nhận thêm bí danh mã mới trên đúng toà đó; khớp hai và trùng tên ra
thẻ, 0 toà mới; không khớp tạo đúng một toà bậc `mot_loi_khai`; 0 toà hai UPI; 0 mã S09 trỏ hai toà.

### AC-5 — Dự án có S16 giữ cấu trúc của S16
Given dự án có S16 với toà đã xếp vào phân khu, và ba toà S09 cùng tên ở phân khu khác: một toà số tầng khớp S16, một toà số tầng lệch quá 2,
một toà không có số tầng để so,
When dựng danh bạ,
Then toà khớp thành bí danh, phân khu hiệu lực vẫn theo S16, số lệch cấu trúc đếm theo cặp nguồn và không sinh thẻ từng toà; toà lệch số tầng
ra thẻ, 0 bí danh, vì có thể là hai toà thật cùng tên; toà không so được thành bí danh và được đếm riêng.

### AC-6 — Danh sách tầng đủ cho DA43
Given toà có tầng thường, tầng có chữ «12B», tầng trùng tên khác mã,
When nạp gói 1,
Then view tầng trả đúng một dòng mỗi mã tầng, giữ tên nguyên văn, kèm mã toà; DA43 đọc được số tầng phải thu của từng toà.

### AC-7 — Khu và căn thấp tầng không sinh trùng
Given khu thấp tầng có căn trùng mã căn S16, căn trùng mã căn S08, căn mới, căn mã hỏng,
When chạy bước thấp tầng S09,
Then khu và căn được dựng theo lời Hỏi-1 (khuyến nghị: mỗi khu một toà gom, căn không trục): số toà gom bằng số khu, từng căn nằm đúng khu; căn
trùng nhận bí danh S09, 0 căn mới; mã khớp hai căn có sẵn thì 0 căn mới, 0 bí danh, đúng một thẻ; căn mới bậc `mot_loi_khai`; căn mã hỏng đếm
theo lý do; 0 căn hai khoá.

### AC-8 — Chạy lại và đổi thứ tự nguồn không đổi kết quả
Given cùng một bộ dòng S08, S16, S09,
When dựng trên hai DB theo hai thứ tự rồi dựng thêm hai lần,
Then hai DB có cùng tập toà, căn, bí danh và thẻ trên mọi mã chung; lần dựng lại sinh 0 khoá, 0 bí danh, 0 thẻ mới.

### AC-9 — Mọi thứ rời máy chỉ mang mã S09
Given DB thử có dữ liệu gói 1,
When chạy thử đường đồng bộ lên cloud và soát thẻ, log, tệp hàng này đổi,
Then bảng stg gói 1 và ba bảng vật thể không nằm trong danh sách đẩy; nút ứng viên không lên Invest; thẻ và log không mang tên hay tên miền
thật của nguồn; cấy một tên thật thì bộ soát đỏ và không in giá trị.

### AC-10 — Số thật khớp từng phần và hiện đúng trên trang Danh bạ (cross-layer)
Given DB thử chép DB máy thu, đã có DA37 và toàn bộ gói 1,
When dựng danh bạ rồi mở `/ops/registry`,
Then:
- tổng dự án trong manifest bằng tổng: giữ nối · chờ thẻ luật · chờ thẻ từng cặp · nút ứng viên; dự án có ở bản 13/11 mà gói 1 không có được đếm riêng;
- tổng toà trong manifest bằng tổng các phần, mỗi phần một câu đếm riêng: thành bí danh · tạo mới · chờ thẻ · thuộc dự án chưa nối;
- tổng căn thấp tầng trong manifest bằng tổng: thành bí danh · tạo mới · chờ thẻ · mã hỏng;
- ngưỡng khai trước khi thấy số: tỉ lệ vào danh bạ = (thành bí danh + tạo mới) / (tổng toà − thuộc dự án chưa nối − chờ thẻ), ít nhất 95%; chờ thẻ
  không quá 10% số toà của dự án đã nối (bản 13/11 có 93 trong 1.665 dòng toà trùng tên, tức 5,6%); mã hỏng không quá 1%; ít nhất 99% trong 175 toà
  đã có bí danh mã cũ nối về đúng toà cũ;
- độ đúng của bí danh đo bằng tín hiệu không phải tên: 0 cặp toà thành bí danh mà số tầng S09 lệch số tầng S16 quá 2. Vượt một ngưỡng thì lượt đo
  đỏ và dừng để người quyết, không tự nới;
- số dự án, toà, căn trên trang bằng câu đếm trên cùng DB; 0 toà hai UPI, 0 căn hai khoá; chạy lại ra cùng số.

## Coverage

Trục quét theo preset entity-feature và risk-premortem cho «gói 1 S09 → danh bạ»:

- Dữ liệu vào: nạp bản thu (AC-1), khớp manifest (AC-2).
- Cấp danh bạ: dự án (AC-3), toà (AC-4), cấu trúc S16 (AC-5), tầng (AC-6), thấp tầng (AC-7).
- Vòng đời: chạy lại, thứ tự nguồn (AC-8).
- Ranh giới: không lộ nguồn, nút ứng viên không lên Invest (AC-9).
- Kết quả thật: các phần cộng đủ, số trên màn (AC-10).

Core: AC-1…AC-10. Bảng phủ ca đếm từ DB máy thu ở thiết kế §4.

Later: căn cao tầng (DA43) · nối tin vào nút ứng viên · thuộc tính căn.

Never: bước S09 đổi cột gốc của toà có sẵn, xoá hay gộp toà, căn có sẵn.

## Đường đo

- «Snapshot gói 1 nạp vào stg, số khớp manifest»: AC-2.
- «Số toà và căn thấp tầng S09 đi từ hiện trạng lên đúng lệnh đếm»: AC-10, đích chốt khi gói 1 về.
- «0 toà hai UPI, 0 căn hai khoá»: AC-4, AC-7, AC-10.
- «Toà trùng thành bí danh, lệch lên thẻ»: AC-4, AC-5.
- «Chạy lại không đổi số»: AC-8, AC-10.
- Lệnh đếm: `node pipeline/scripts/danh-ba-s09-toa-that.mjs --dem`, tạo ở bước thi công, chỉ đọc.

## Out of scope

- Thu gói 1, DATA-CONTRACT và bộ nạp: việc của làn thu.
- Áp migration và dựng trên DB máy thu: theo hồ sơ áp sau khi PR gộp.
- Căn cao tầng: DA43.
- Nối tin vào nút ứng viên và đưa nút ứng viên lên Invest.
- Thuộc tính căn (diện tích, phòng ngủ, hướng, giá).
