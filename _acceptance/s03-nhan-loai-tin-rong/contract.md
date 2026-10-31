---
schema_version: 1
feature: Bộ nhận loại tin S03 nhận tin bán và tin thuê không ghi chữ «bán/cho thuê» theo tín hiệu chữ, đơn vị giá và bối cảnh nhóm; vẫn loại bài khách tìm nhà; bài đã có loại không đổi
slug: s03-nhan-loai-tin-rong
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline]
status: signed-off
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-31-s03-nhan-loai-tin-rong-design.md
---

# Acceptance Contract: s03-nhan-loai-tin-rong

## Context

`parsePost` chỉ nhận chữ «bán»/«cho thuê» nên bỏ 27.292/38.104 bài S03 (đo 31/10). Mạnh: nhóm S03 đã tham gia đều là mua
bán và cho thuê — bài mặc định là tin rao theo bối cảnh nhóm. Mục tiêu ra mắt 05/11: S03 200 tin mới/ngày. Cổng Đáng:
build, Mạnh («Giao U1 sửa», 31/10), hàng RM1.

## Criteria

- AC-1: Given bài không có chữ «bán/cho thuê», có giá và dấu hiệu BĐS, không đi đường thuê của AC-2, và có một tín hiệu bán (giá đơn vị tỷ, «thu về», «cắt lỗ», «hạ giá», «giá tốt», «chuyển nhượng», «bao thuế phí»/«BTP», «sổ hồng/đỏ»), When transform suy loại, Then `kind = sale`, nguồn `tin-hieu-chu`.
- AC-2: Given bài không có chữ loại, có dấu hiệu BĐS và giá đơn vị triệu dưới 1 tỷ không kèm «/m²» mà bài không có chữ «tỷ» (vd «2PN Full nt 14Tr», «3PN FULL 14tr», «6tr5», «chuyển nhượng HĐ thuê 2PN 14tr», «2PN giá tốt 12tr»), hay có «/tháng» hay «pass», When transform suy loại, Then `kind = rent_lt`, nguồn `don-vi-gia` — xét trước tín hiệu bán.
- AC-3: Given bài có giá và dấu hiệu BĐS mà tín hiệu chữ và đơn vị giá không quyết, When nhóm có mục đích rõ (tên nhóm, hoặc ≥ 20 bài chữ bài với ≥ 85% một loại trên mọi bài của lượt — lượt nạp lại toàn bộ bài của nhóm), Then `kind` theo mục đích nhóm, nguồn `boi-canh-nhom`; nhóm «cả hai» thì giữ rỗng.
- AC-4: Given bài là **Yêu cầu** (`listing_intent = inquiry`, CONTEXT.md — bên mua: «cần mua/thuê/tìm», «tìm mua/thuê/căn», «khách … tìm/xem/cần» trong cùng câu ngắn, «anh chị/ai có căn gửi») — kể cả khi có giá, PN hay tín hiệu bán, When transform suy loại, Then bài không thành tin rao bên bán (`kind` rỗng, không vào `sale_offers`), vẫn giữ nguyên ở raw và `stg_zalo_posts` làm tín hiệu cầu (không xoá), nguồn đếm `yeu-cau`.
- AC-5: Given bài thiếu giá hoặc thiếu dấu hiệu BĐS, hay chỉ có «CN» trần (chủ nhật), When transform suy loại, Then không nhận thành tin (không thêm tin rác).
- AC-6: Given bài mà `parsePost` đã gán `kind`, When transform chạy, Then `kind` giữ nguyên, nguồn `chu-bai`; `parsePost` không đổi (bộ test `parse.test.mjs` xanh nguyên).
- AC-7: Given hai bài cùng phường khác số phòng ngủ, khác diện tích hoặc khác giá, When gộp đăng lại, Then khác khoá; trên DB máy thu (chỉ đọc, ROLLBACK) số nhóm gộp có ≥ 2 bài khác số phòng ngủ hoặc khác diện tích = 0. (cross-layer)
- AC-8: Given một lượt `runTransformZalo`, When xong, Then giá trị trả về và một dòng log đếm số bài theo nguồn (`chu-bai`, `tin-hieu-chu`, `don-vi-gia`, `boi-canh-nhom`, `yeu-cau`, `bo`).
- AC-9: Given DB máy thu thật, When chạy `runTransformZalo` trong transaction ROLLBACK, Then số tin S03 loại `sale` tăng ít nhất 30% so với chạy cùng dữ liệu với suy loại tắt; tin thuê giá ≥ 1 tỷ và tin bán giá < 300 triệu không tăng; mọi bài trong tập Yêu cầu mẫu bị loại; và chạy lại với suy loại tắt thì mọi tin chỉ gồm bài suy loại bị rút (`retired_at`), số còn sống = 0. (cross-layer)
- AC-10: Given `label-sample.mjs --lat s03-loai-tin`, When lấy mẫu, Then mẫu phân tầng ba phần bằng nhau (bài chữ bài, bài mới nhận, bài vẫn bỏ — tầng tính bằng chính parsePost + suy loại), tất định theo seed; chạy lại cùng tham số thêm 0 dòng; `--thu` ghi 0 dòng. (cross-layer)

## Coverage

- Trục A — Chữ trong bài: có chữ loại | tín hiệu bán | đơn vị giá thuê | không tín hiệu | Yêu cầu [thước CE: regex `parsePost` dòng 181 + danh sách tín hiệu giám sát giao 31/10] → AC-1, AC-2, AC-4, AC-6.
- Trục B — Cửa vào: có giá + BĐS | thiếu giá | thiếu BĐS [thước CE: trường `priceVnd`, `pricePerm2Vnd`, `areaM2`, `bedrooms` của `parsePost`] → AC-5.
- Trục C — Mục đích nhóm: tên rõ bán | tên rõ thuê | tỉ lệ | cả hai | nhóm chưa tên [thước CE: `collection_units` S03 (20 nhóm có bài, 31/10)] → AC-3.
- Trục D — Lớp đo: ma trận viết tay | DB máy thu ROLLBACK | mẫu gắn nhãn người [thước CE: `/ops/labels` + `eval_label_items`] → AC-1..AC-6, AC-7, AC-9, AC-10.

## Out of scope

- Lưu nguồn suy loại xuống DB cho thẻ duyệt hiện — theo Hỏi-1.
- Sửa `parsePost`; ghi ý định tin (tin rao · Yêu cầu · không phải tin) cho từng bài — việc của PL5 `meta-kev-thanh-phat-bieu`.
- Lưu và ghép Yêu cầu với listing — tính năng sau, cần số đo trước (CONTEXT.md «Yêu cầu», luật 11).
- Khai và sửa mục đích nhóm ở /ops (RM2, chờ điều kiện).
- Thêm nhóm S03 (làn ZCode).

## Đường đo

- Ngưỡng ô cơ hội «recall tin bán tăng, precision không giảm trên mẫu gắn nhãn»: trên lát `s03-loai-tin` (người gắn «Loại tin» ở `/ops/labels`), precision cũ = đúng/nhận trên tầng chu-bai; precision mới = đúng/nhận trên tầng chu-bai + mới nhận (trọng số theo cỡ tầng thật); recall bán = bán nhận đúng / bán theo nhãn trên cả ba tầng — AC-10 bảo đảm mẫu; tính số ở Cổng Giá trị (Hỏi-2).

## Notes

- Mô phỏng 31/10 (trước khi sửa ba lỗi luật thấy ở mẫu đọc lướt): +~2.300 bài bán, +~6.000 bài thuê theo bài (chưa gộp); 6/24 bài mẫu sai, cả 6 do «CN» chủ nhật, tên nhóm «chuyển nhượng» chứa tin thuê, và Yêu cầu viết rời — ba lỗi ấy thành luật ở AC-2, AC-3, AC-4, AC-5.
- RM1 là lớp luật sàn cho mốc 05/11 và lớp dự phòng khi model không chạy; phân loại bằng model là KC1 (nhãn bạc, đo Haiku 5.5 + Decisions API so với Qwen 27B local) — model thay luật khi tập nhãn vàng xác nhận (luật 7), qua đường PL5.
- Known limits — chọn ở Cổng Bằng chứng 2026-10-31:
  - Ngoài-1: Phép đo trên dữ liệu thật chưa chứng được sàn giá 300 triệu chặn tin bán, chỉ ma trận viết tay chứng.
  - Ngoài-2: Kiểm mẫu nhãn ba tầng trên dữ liệu thật dựa số công cụ lấy mẫu tự báo, chưa đọc lại dòng đã ghi.
  - Ngoài-3: Sau khi lấy mẫu nhãn thật lát s03-loai-tin, một ca kiểm tự động báo đỏ giả.
  - Ngoài-4: Tin bán có câu mời «khách thiện chí xem nhà» bị coi là Yêu cầu và không thành tin bán.
