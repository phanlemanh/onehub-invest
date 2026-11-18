---
schema_version: 1
feature: Căn cao tầng S09 vào danh bạ dưới toà đã có, căn trùng S16 và S08 thành bí danh, không sinh căn hai khoá
slug: nap-s09-can-cao-tang-vao-danh-ba
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, ui]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-18-nap-s09-can-cao-tang-vao-danh-ba-design.md
---

# Acceptance Contract: nap-s09-can-cao-tang-vao-danh-ba

## Context

DA43 là nhịp sau của DA42. Danh bạ hôm nay có 111.668 căn và 0 căn cao tầng mang mã S09. Làn thu ước gói 2 có khoảng 309 nghìn căn
(dải 237–379 nghìn), 221 dự án, 14 tỉnh; số này chốt lại khi có manifest. API gói 2 chỉ trả mã căn, không trả thuộc tính.

Thi công chỉ bắt đầu sau khi DA42 và DA37 vào `main`. Migration của hàng lấy số từ 119 trở đi, xin Phiên giám sát lúc thi công.

Danh sách trường làn thu cần thu nằm ở thiết kế §3. Duyệt hợp đồng này là cho làn thu thu gói 2 đúng danh sách đó.

## Criteria

### AC-1 — Bản thu gói 2 nạp vào stg không nhân dòng
Given DB của riêng lượt đã áp đủ migration và một fixture sinh từ khuôn bản thu ở thiết kế §3, có tầng rỗng, tầng lỗi, item thiếu
uuid căn, một tệp sai băm,
When nạp fixture hai lần qua hàm dùng chung,
Then lần một ghi đúng số dòng hợp lệ, lần hai ghi 0 dòng; item hỏng bị bỏ và đếm theo lý do; tệp sai băm làm lượt nạp dừng trước khi
ghi. Ma trận nhiều bản thu viết trước, mỗi ô một assert trạng thái trọn của toà và số căn không đếm trùng: lỗi rồi tốt · tốt rồi lỗi ·
tốt rồi rỗng · tầng chưa gọi. Bản lỗi hay rỗng không đè bản tốt; tầng có trong danh sách gói 1 mà chưa gọi tính là chưa trọn.

### AC-2 — Số trong stg khớp manifest bản thu thật
Given DB thử chép từ DB máy thu và các snapshot gói 2 thật,
When nạp hết rồi chạy một bộ đếm độc lập đọc thẳng snapshot,
Then số dự án, toà, tầng gọi được, tầng rỗng, tầng lỗi và số căn trong stg bằng số bộ đếm và bằng số manifest khai; lệch một ô thì
thoát 1 và nêu ô.

### AC-3 — Tách mã TOÀ.TẦNG.CĂN đúng mọi ca
Given ma trận viết trước, một ca mỗi ô: mã chuẩn; tên toà có dấu chấm; tầng có chữ «12B»; số căn có số 0 đầu; `code` khác `name`;
`code` không mở đầu bằng toà và tầng của item; số căn rỗng; tầng ngoài khuôn,
When gọi hàm tách,
Then ba ô đầu và ô số 0 đầu trả đúng toà, tầng, số căn; ô `code` khác `name` vẫn tách theo `code` và được đếm; hai ô hỏng trả lý do
và không tạo căn; ô tầng ngoài khuôn trả căn không trục. Mỗi ô một assert.

### AC-4 — Căn chỉ vào dưới toà đã có và đã thu trọn
Given dòng stg của ba toà: một toà có bí danh DA42 và đủ tầng, một toà không có bí danh, một toà có một tầng lỗi,
When chạy bước căn S09,
Then chỉ toà đầu có căn; hai toà còn lại sinh 0 toà, 0 trục, 0 căn và được đếm riêng theo lý do.

### AC-5 — Căn trùng S16, S08 thành bí danh của cùng căn
Given một toà có căn S16, căn S08 và căn không trục, và dòng S09 cùng toà, tầng, số căn với từng căn đó,
When chạy bước căn S09,
Then mỗi căn nhận đúng một bí danh S09, số căn trong toà không đổi, không căn nào mang hai bí danh S09, không mã S09 nào trỏ hai căn.

### AC-6 — Căn không khớp ở toà đã có S16, S08 không sinh căn mới
Given toà có S16 và dòng S09 không khớp căn nào, gồm ca lệch tầng và ca lệch toà,
When chạy bước căn S09,
Then xử đúng theo lời Hỏi-2 (khuyến nghị: 0 căn mới, mỗi toà đúng một thẻ kèm số căn lệch theo loại); evidence của thẻ chỉ mang khoá
vật thể và số đếm; chạy lại không nhân thẻ; thẻ hiện trên `/ops/review` với tên toà và số lệch theo loại. Duyệt thẻ ở hàng này không
đổi dữ liệu: căn lệch nằm ở stg, chờ một hàng sau xử.

### AC-7 — Toà chỉ có S09 được đúc đủ căn
Given toà có bí danh S09, chưa có căn nào, và dòng S09 gồm căn chuẩn và căn có tầng ngoài khuôn,
When chạy bước căn S09,
Then căn chuẩn có trục, tầng đúng, bậc theo lời Hỏi-3 (khuyến nghị `mot_loi_khai`); căn tầng ngoài khuôn thành căn không trục; mỗi căn có đúng một bí danh S09.

### AC-8 — Chạy lại và đổi thứ tự nguồn không đổi tập căn
Given cùng một bộ dòng S08, S16, S09 có căn chung,
When dựng trên hai DB theo hai thứ tự (S09 trước, S16 và S08 sau; và ngược lại), rồi dựng thêm hai lần,
Then hai DB có cùng tập căn và bí danh trên mọi mã chung; căn lệch theo đúng luật đã khai: S16 đến sau toà chỉ có S09 thì căn khớp thành
bí danh, căn S16 không khớp vẫn đúc vì S16 thắng cấu trúc, căn S09 còn lại lên một thẻ mỗi toà; lần dựng lại sinh 0 khoá, 0 bí danh, 0 thẻ mới; bước đêm không có bản thu
mới thì không đọc lại bảng căn S09.

### AC-9 — Mọi thứ rời máy chỉ mang mã S09
Given DB thử có dữ liệu căn S09,
When chạy thử đường đồng bộ lên cloud và soát thẻ, log, tệp hàng này đổi,
Then bảng stg căn và ba bảng vật thể không nằm trong danh sách đẩy; thẻ và log không mang tên hay tên miền thật của nguồn; cấy một
tên thật vào thẻ thì bộ soát đỏ và không in giá trị.

### AC-10 — Số căn thật khớp từng phần và hiện đúng trên trang Danh bạ (cross-layer)
Given DB thử chép DB máy thu, đã có DA42, DA37 và toàn bộ gói 2,
When dựng danh bạ rồi mở `/ops/registry`,
Then:
- tổng căn trong manifest bằng đúng tổng sáu phần, mỗi phần đếm bằng một câu riêng: nhận bí danh · đúc mới · chờ thẻ · toà chưa nối ·
  toà chưa trọn · mã hỏng;
- số căn cao tầng S09 trong danh bạ đi từ 0 lên đúng số lệnh đếm in ra;
- ô «Căn» trên trang tăng đúng bằng số căn đúc mới;
- 0 căn hai khoá, 0 mã S09 trỏ hai căn; chạy lại ra cùng số;
- ngưỡng khai trước khi thấy số: mã hỏng không quá 1% căn trong manifest; ở toà đã nối và đã trọn, ít nhất 90% căn vào danh bạ (bí danh
  hoặc đúc mới); ở 110 toà trùng S16, S08, ít nhất 90% căn S09 khớp căn có sẵn;
- độ đúng của phép khớp: lấy ngẫu nhiên 200 cặp đã khớp ở toà có S16 (hạt giống cố định), đối chiếu tầng với cột tầng gốc của S16; sai
  không quá 1%. Vượt một ngưỡng thì lượt đo đỏ và dừng để người quyết, không tự nới.

## Coverage

Trục quét theo preset entity-feature và risk-premortem cho «căn S09 → căn danh bạ»:

- Dữ liệu vào: khuôn bản thu (AC-1), khớp manifest (AC-2), tách mã (AC-3).
- Cấp danh bạ: toà đã nối và trọn (AC-4), căn trùng (AC-5), căn lệch (AC-6), căn mới (AC-7).
- Vòng đời: chạy lại, thứ tự nguồn, bước đêm (AC-8).
- Ranh giới: không lộ nguồn (AC-9).
- Kết quả thật: sáu phần cộng đủ, số trên màn (AC-10).

Core: AC-1…AC-10. Bảng phủ ca đếm từ DB máy thu ở thiết kế §4.

Later: thuộc tính căn từ S16, S08, S03, S02 · căn S09 lên cloud và cổng Invest.

Never: bước căn S09 đúc toà mới, xoá hay gộp căn có sẵn.

## Đường đo

- «Snapshot gói 2 nạp khớp manifest»: AC-2.
- «Số căn cao tầng S09 từ 0 lên đúng lệnh đếm»: AC-10, đích chốt khi có manifest gói 2; số ước hôm nay là 237–379 nghìn.
- «0 căn hai khoá» và «căn trùng thành bí danh»: AC-5, AC-10.
- «Lệch tầng hoặc toà lên thẻ»: AC-6.
- «Chạy lại không đổi số»: AC-8, AC-10.
- Lệnh đếm: `node pipeline/scripts/danh-ba-s09-can-that.mjs --dem`, tạo ở bước thi công, chỉ đọc.

## Out of scope

- Thu gói 2, DATA-CONTRACT và bộ nạp: việc của làn thu.
- Áp migration và dựng trên DB máy thu: theo hồ sơ áp sau khi PR gộp.
- Thấp tầng, nối dự án mới, toà S09 mới: DA42.
- Thuộc tính căn (diện tích, phòng ngủ, hướng, giá): API gói 2 không trả.
- Đưa căn S09 lên cloud hoặc cổng Invest.

## Notes

- Năm dự án mẫu của làn thu có 0 toà trong danh bạ, nên phép đo khử trùng lấy mẫu ở 110 toà trùng thật của hai khu đã nối.
