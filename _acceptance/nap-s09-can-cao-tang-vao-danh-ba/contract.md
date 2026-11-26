---
schema_version: 1
feature: Căn cao tầng S09 vào danh bạ dưới toà đã có, căn trùng S16 và S08 thành bí danh, không sinh căn hai khoá
slug: nap-s09-can-cao-tang-vao-danh-ba
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, ui]
status: approved
approved_by: Mạnh
approved_at: 2026-11-26
design_doc: docs/superpowers/specs/2026-11-18-nap-s09-can-cao-tang-vao-danh-ba-design.md
---

# Acceptance Contract: nap-s09-can-cao-tang-vao-danh-ba

## Context

DA43 là nhịp sau của DA42. Danh bạ hôm nay có 111.673 căn và 0 căn cao tầng mang mã S09. Bản 18/11 Mạnh đã duyệt; hồ sơ trình
lại 26/11 vì gói 2 đã thu xong và đo được (thiết kế §0): **358.032 căn**, 902 toà, 196 dự án; 23.541 tầng có bản tốt và 2 tầng rỗng hợp lệ trên
23.708 tầng của gói 1 (165 tầng chưa gọi). API gói 2 chỉ trả mã căn, không trả thuộc tính.

Lớp nạp là của DA56: kind `can-cao-tang` vào `stg_s09_danh_ba`, view `v_s09_db_can_cao_tang` chọn bản tốt mới nhất mỗi tầng. Hàng này
đọc view đó, không tạo bảng stg, không viết bộ nạp. Thi công sau khi DA42 và DA56 vào `main`; số migration (nếu cần view hay chỉ mục)
xin Phiên giám sát lúc thi công.

Mã căn có nhiều khuôn (thiết kế §0.3): toà lấy từ cấu trúc bản thu, số căn và tầng tách từ đuôi mã — luật này đưa 98,7% căn vào
được, luật 18/11 chỉ 70,9%.

## Criteria

### AC-1 — Toà chỉ tính là trọn khi mọi tầng gói 1 có bản tốt hoặc rỗng hợp lệ
Given DB của riêng lượt đã áp 115, 125, 130 và nạp qua bộ nạp của DA56 các fixture nhiều bản thu `can-cao-tang`, cùng danh sách tầng
gói 1 của từng toà (kind `tang` của gói 1 trong `stg_s09_danh_ba`, view của 115/125 mà DA42 đọc; nối theo uuid tầng = `sourceId`
của item `can-cao-tang`),
When bước căn đọc đầu vào từ view của DA56,
Then ma trận viết trước, mỗi ô một assert trạng thái trọn của toà và số căn không đếm trùng: lỗi rồi tốt · tốt rồi lỗi · tốt rồi rỗng ·
tầng gói 1 chưa gọi · tầng chỉ có bản rỗng. Toà có tầng chưa gọi hay chỉ có bản lỗi là chưa trọn; toà chỉ có tầng rỗng hợp lệ vẫn trọn;
bản lỗi hay rỗng không đè bản tốt.

### AC-2 — Đầu vào của bước căn khớp bộ đếm độc lập trên bản thu thật
Given DB thử chép từ DB máy thu, đã nạp các bản thu gói 2 thật qua DA56,
When bước căn tính đầu vào, rồi một bộ đếm độc lập (không import `pipeline/lib/s09*`) đọc thẳng snapshot theo cùng luật tách,
Then các ô dự án · toà · tầng có bản tốt · tầng rỗng · tầng chưa gọi · căn · căn tách được · mã hỏng · khoá duy nhất · căn trùng khoá
bằng nhau giữa bước căn và bộ đếm; lệch một ô thì thoát 1 và nêu ô. Trên bốn bản thu 24–25/11 các ô là 196 · 902 · 23.541 · 2 · 165 ·
358.032 · 353.386 · 4.646 · 349.493 · 3.893; bản thu mới hơn thì số theo bộ đếm.

### AC-3 — Tách số căn và tầng từ đuôi mã, toà từ cấu trúc, đúng mọi ca
Given ma trận viết trước, một ca mỗi ô, khuôn lấy từ gói 2 thật: mã chuẩn `A14A1.02.01`; toà có dấu chấm; toà viết tắt khác tên toà
của item (`AQL1.04.11` dưới toà «Lake 1»); hai đoạn có gạch `AK1-015.21`; hai đoạn trần `04.01`; dấu tách `_` (`T1-2_2`); tầng có chữ
`12A`; số căn có số 0 đầu; mã ghi tầng khác tầng của item; `code` khác `name`; mã không có dấu tách; số căn rỗng; tầng ngoài khuôn `1+2`,
When gọi hàm tách với mã căn kèm toà và tầng của item,
Then toà luôn là toà của item; số căn là đoạn sau dấu tách cuối, bỏ số 0 đầu khi so; tầng là đoạn số liền trước số căn, không có thì lấy
tầng của item; ô mã ghi tầng khác tầng của item lấy tầng của mã và được đếm; ô `code` khác `name` tách theo `code` và được đếm; hai ô
hỏng (không dấu tách, số căn rỗng) trả lý do và không tạo căn; ô tầng ngoài khuôn trả căn không trục. Mỗi ô một assert.

### AC-4 — Căn chỉ vào dưới toà đã có và đã thu trọn
Given dòng stg của ba toà: một toà có bí danh DA42 dạng `danh-ba-toa/<uuid toà gói 1>` (khuôn `MA_TOA` của DA42; uuid toà là
`meta.toaId` của item `can-cao-tang`) và đủ tầng, một toà không có bí danh, một toà có một tầng lỗi,
When chạy bước căn S09,
Then chỉ toà đầu có căn; hai toà còn lại sinh 0 toà, 0 trục, 0 căn và được đếm riêng theo lý do.

### AC-5 — Căn trùng S16, S08 thành bí danh của cùng căn
Given một toà có căn S16, căn S08 và căn không trục, và dòng S09 cùng toà, tầng, số căn với từng căn đó,
When chạy bước căn S09,
Then mỗi căn nhận đúng một bí danh S09, số căn trong toà không đổi, không căn nào mang hai bí danh S09, không mã S09 nào trỏ hai căn.
Hai căn S09 cùng toà mang cùng khoá (tầng, số căn): căn có uuid nhỏ nhất đi tiếp — kể cả khi khoá ấy khớp một căn S16 có sẵn, căn S16
chỉ nhận một bí danh S09 — căn còn lại ở stg và đếm «trùng khoá», theo lời Hỏi-5.

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
- tổng căn của bản thu (358.032 trên bốn bản thu 24–25/11) bằng đúng tổng bảy phần, mỗi phần đếm bằng một câu riêng; mỗi căn thuộc
  đúng một phần, xếp theo thứ tự: mã hỏng → toà chưa nối → toà chưa trọn → trùng khoá → nhận bí danh · đúc mới · chờ thẻ;
- số căn cao tầng S09 trong danh bạ đi từ 0 lên đúng số lệnh đếm in ra (= nhận bí danh + đúc mới), và nằm trong dải khai trước khi
  diễn tập: **sàn 250.000 (≈70% bản thu), trần 349.493 khoá duy nhất**; ngoài dải thì lượt đo đỏ. Sàn tính cho ca xấu: mọi căn S09 ở
  toà có S16 (109 toà, 66.019 căn có sẵn) lên thẻ; toà chưa nối + toà chưa trọn không quá 5% bản thu (DA42 đưa đủ 928 toà gói 1 vào
  danh bạ, nên toà chưa nối chỉ còn ca lỗi);
- ô «Căn» trên trang tăng đúng bằng số căn đúc mới;
- 0 căn hai khoá, 0 mã S09 trỏ hai căn; chạy lại ra cùng số;
- ngưỡng, mẫu số là toàn bộ căn của bản thu: mã hỏng không quá 1,5% và trùng khoá không quá 1,5% — HAI NGƯỠNG NÀY ĐẶT SAU KHI ĐO
  (1,30% và 1,09%), chừa 0,2–0,4 điểm cho bản thu đêm sau, theo lời Hỏi-4, Hỏi-5; tầng tách từ mã khác tầng của item không quá 8% căn
  tách được (đo trước luật mới 5,3%) — đây là phép kiểm độc lập của luật tách, vì tầng của item đến từ cấu trúc nguồn, không từ mã; ở toà đã nối và đã trọn, ít nhất 90% căn vào danh bạ (bí danh
  hoặc đúc mới); ở toà có S16 hoặc S08 sau khi DA42 đã dựng (tập đo lại ở lượt diễn tập, trước đó là 110 toà), ít nhất 90% căn S09 khớp căn có sẵn;
- độ đúng của phép khớp: mẫu chia theo năm khuôn mã (chuẩn ba đoạn · hai đoạn có gạch · hai đoạn trần · dấu `_` · toà viết tắt), mỗi
  khuôn tối đa 40 cặp đã khớp ở toà có S16 (hạt giống cố định), đối chiếu bằng nguồn độc lập với khoá khớp — mã căn S16 gốc sau chuẩn hoá
  so với mã S09, và tầng của item S09 so với tầng gốc S16; sai không quá 1% mỗi khuôn có từ 20 cặp. Vượt một ngưỡng thì lượt đo đỏ và dừng để người quyết, không tự nới.

## Coverage

Trục quét theo preset entity-feature và risk-premortem cho «căn S09 → căn danh bạ»:

- Dữ liệu vào: toà trọn qua nhiều bản thu (AC-1), đầu vào khớp bộ đếm độc lập (AC-2), tách mã theo khuôn thật (AC-3).
- Cấp danh bạ: toà đã nối và trọn (AC-4), căn trùng (AC-5), căn lệch (AC-6), căn mới (AC-7).
- Vòng đời: chạy lại, thứ tự nguồn, bước đêm (AC-8).
- Ranh giới: không lộ nguồn (AC-9).
- Kết quả thật: bảy phần cộng đủ, số trên màn (AC-10).

Core: AC-1…AC-10. Bảng phủ ca đếm từ DB máy thu ở thiết kế §4.

Later: thuộc tính căn từ S16, S08, S03, S02 · căn S09 lên cloud và cổng Invest.

Never: bước căn S09 đúc toà mới, xoá hay gộp căn có sẵn.

## Đường đo

- «Đầu vào bước căn khớp bản thu gói 2»: AC-2 (358.032 căn · 353.386 tách được · 349.493 khoá duy nhất).
- «Số căn cao tầng S09 trên `/ops/registry` từ 0 lên đúng lệnh đếm»: AC-10; trần 349.493, số thật chốt ở lượt diễn tập sau DA42.
- «0 căn hai khoá» và «căn trùng thành bí danh»: AC-5, AC-10.
- «Lệch tầng hoặc toà lên thẻ»: AC-6.
- «Chạy lại không đổi số»: AC-8, AC-10.
- Lệnh đếm: `node pipeline/scripts/danh-ba-s09-can-that.mjs --dem`, tạo ở bước thi công, chỉ đọc.

## Out of scope

- Thu gói 2 và DATA-CONTRACT: việc của làn thu. Bộ nạp kind `can-cao-tang`, view chọn bản tốt: DA56.
- 165 tầng gói 1 chưa gọi: làn thu thu bù; toà của chúng chờ ở «toà chưa trọn» tới khi có bản tốt.
- Áp migration và dựng trên DB máy thu: theo hồ sơ áp sau khi PR gộp.
- Thấp tầng, nối dự án mới, toà S09 mới: DA42.
- Thuộc tính căn (diện tích, phòng ngủ, hướng, giá): API gói 2 không trả.
- Đưa căn S09 lên cloud hoặc cổng Invest.

## Notes

- Năm dự án mẫu của làn thu có 0 toà trong danh bạ, nên phép đo khử trùng lấy mẫu ở 110 toà trùng thật của hai khu đã nối.
