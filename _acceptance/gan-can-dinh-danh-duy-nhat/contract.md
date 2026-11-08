---
schema_version: 1
feature: «Gắn căn» nghĩa là nhận diện duy nhất khớp danh bạ — FRAMING §3.4 viết lại theo thang Mạnh duyệt 08/11; CONTEXT.md có Gắn căn, Định vị, Gom cụm; /ops/data-flow thay cột Gắn căn bằng ba cột Gom cụm · Định vị · Gắn căn trên Tin rao, chữ trên tin chỉ là «chờ khớp», Sankey chia theo mức sâu nhất, chú thích nhánh rơi nói lý do thật
slug: gan-can-dinh-danh-duy-nhat
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: verified
design_doc: docs/superpowers/specs/2026-11-08-gan-can-dinh-danh-duy-nhat-design.md
approved_by: Mạnh
approved_at: 2026-11-08T16:08:54Z
---

# Acceptance Contract: gan-can-dinh-danh-duy-nhat

## Context

Cột «Gắn căn» của `/ops/data-flow` đếm tin có dòng `property_offers`; Stage A của `resolve-properties` cho mỗi tin S06
một cụm nên số S06 gần 100% theo cấu tạo, S03 luôn 0 dù 53% tin ghi toà, và chú thích «Thiếu phường hoặc toạ độ» sai.
Mạnh chốt 08/11: «gắn được căn là đã nhận diện duy nhất, thực tế nó giống như mà có số nhà, có mã căn»; thang bậc mới
«Đồng ý và viết lại Framing»; «Đồng ý đổi» cho câu «Đổi tên bậc B2 thành "Định vị" và không tính 67.688 cụm S06 tự dựng
là B2 nữa». Vòng này viết lại FRAMING §3.4, từ vựng và phép đo trên trang Dòng chảy (V2, V3, V5 của bản tổng hợp); bậc
chạy hằng ngày (V4) là hàng riêng.

Source input: lời giao của giám sát 08/11 và bản tổng hợp `tong-hop-gan-can-quyet-dinh-20261108.md` (thư mục ghi chú giám
sát); bản áp FRAMING `framing-34-viet-lai-20261108.md`; thiết kế ở `design_doc`.

## Criteria

- AC-1: Given `CONTEXT.md`, When đọc mục «Tài sản & tin», Then có ba khối thuật ngữ «Gắn căn», «Định vị», «Gom cụm»,
  mỗi khối có dòng định nghĩa, dòng `Code`, dòng `Slug URL` và dòng `_Avoid_`; «Gắn căn» nói tin khớp đúng một căn của
  danh bạ bằng định danh duy nhất (dự án + toà + mã căn, hoặc số nhà + đường + phường); «Định vị» nói tin gắn vào dự án,
  toà hoặc trục có trong danh bạ; «Gom cụm» nói không phải một bậc; khối «Căn nhà» không còn gọi cụm S06 là căn; khối
  «Dòng chảy dữ liệu» nêu thang mới và không còn nhánh «Chưa gắn căn».
- AC-2: Given `docs/product/FRAMING.md`, When đọc §3.4, Then bảng bậc là sáu dòng B0 Có lời khai · B1 Tin · B2 Định vị ·
  B3 Gắn căn · B4 Làm giàu · B5 Sống đúng bản áp Mạnh duyệt, có các gạch «Gắn căn = nhận diện duy nhất», «gom cụm không
  phải một bậc», bậc đích theo phân khúc mới, «Đổi thang 08/11 là lần hạ một lần»; năm dòng nhắc thang cũ (§3.2 «Có thật»,
  North star, Dòng chảy, Độ tươi, Quyết định) theo bản áp; nhật ký có dòng 2026-11-08.
- AC-3: Given lược đồ tạm có tin S03, S05, S06 với đủ các ca (cụm một tin, cụm hai tin sống, cụm hai tin mà một tin đã
  nghỉ, toà, trục che tầng, mã căn đầy đủ, mã «0»/«1», số nhà + đường + phường, số nhà «1», số nhà mà khu là thị trường),
  When `600_data_flow.sql` thật làm tươi, Then mỗi nguồn ở mỗi cửa sổ có `clustered`, `located`, `unitLinked`,
  `locatedPending`, `uniqueIdPending`, `deepest` đúng bảng kỳ vọng viết trước; tin của cụm chỉ một tin sống KHÔNG vào
  Gom cụm; `facts` không còn khoá `linked`.
- AC-4: Given chưa có bảng nối tin vào nút danh bạ, When làm tươi trên dữ liệu bất kỳ, Then `located` và `unitLinked` = 0
  ở mọi nguồn, mọi cửa sổ, mọi ngày; tin ghi toà/trục chỉ vào `locatedPending`, tin mang định danh duy nhất chỉ vào
  `uniqueIdPending`.
- AC-5: Given số của các nguồn, When trang dựng lưới «Chất lượng từng chặng», Then cột «Gắn căn» cũ được thay bằng ba
  cột Gom cụm · Định vị · Gắn căn theo thứ tự đó, mỗi ô là số tin và phần trăm trên Tin rao của cùng hàng; ô Định vị, Gắn
  căn có dòng phụ «N chờ khớp» khi số chờ khớp > 0; hàng nhóm thu và hàng S01 hiện «—» ở ba cột.
- AC-6: Given số của các nguồn, When trang dựng Sankey, Then «Tin rao mới» chia thành các nút Gắn căn · Định vị · Gom
  cụm · Chưa định vị có tổng bằng Tin rao (nút 0 bị bỏ); tiêu đề cột cuối là «Gắn căn» với giá trị Gắn căn / Tin rao; gợi
  ý nút «Chưa định vị» nêu số tin ghi toà/trục và số tin đủ định danh đang chờ khớp danh bạ; không chữ nào trên trang còn
  câu «Thiếu phường hoặc toạ độ».
- AC-7: Given luật nút thắt của lưới, When một nguồn có Gắn căn 0%, Then nguồn đó không bị chấm «Kẹt · gắn căn» chỉ vì
  chưa có bộ gắn; ba kiểm đọc · trường lõi · phường giữ ngưỡng cũ (Hỏi-1).
- AC-8: Given biểu đồ «Chặng theo ngày» và ngăn chi tiết một tin, When mở, Then đường «Gắn căn» đọc `unitLinked` của
  ngày; ngăn chi tiết có dòng «Mức nhận diện» là một trong Gắn căn · Định vị · Gom cụm · Chưa định vị, tính cùng luật với
  AC-3, kèm «ghi toà/trục, chờ khớp» khi có, ở cả máy thu lẫn cloud.
- AC-9: (cross-layer) Given khối `dataFlow` đi qua push-ops-facts và ingest thật lên lược đồ máy chủ, When trang cloud đọc,
  Then lưới và Sankey hiện đúng số máy thu tính; khi khối cloud đời trước thiếu khoá mới thì ô ba cột hiện «—» kèm dòng
  báo chờ lượt làm tươi kế, không hiện số cũ, không lỗi.
- AC-10: (ui) Given bản chạy `/ops/data-flow` đăng nhập vai quản trị, When xem ở 1280 px sáng, 1280 px tối và 390 px,
  Then thấy ba cột mới trong lưới, các nút mức nhận diện ở cột cuối Sankey và chú thích mới, không chữ đè, không cuộn
  ngang toàn trang.

## Coverage

Trục (quét tay theo khuôn entity-feature: thực thể «tin rao» × «mức nhận diện»):
- Mức: Gom cụm · Định vị (khớp danh bạ) · Gắn căn (khớp danh bạ) · chờ khớp (chữ trên tin) · chưa định vị → AC-3, AC-4,
  AC-6.
- Nguồn: S03 (toà, trục, không cụm) · S05 · S06 (cụm, số nhà, mã «0/1») · S01 (không áp dụng) → AC-3, AC-5.
- Bề mặt: FRAMING · từ vựng · SQL làm tươi · lưới · Sankey · biểu đồ ngày · ngăn chi tiết · cloud → AC-1, AC-2, AC-3,
  AC-5, AC-6, AC-8, AC-9, AC-10.
- Thời: cửa sổ 7d · 30d · all · khối cloud đời trước → AC-3, AC-9.
Thước CE: bảng số đo DB chung 08/11 ở design doc §3 (mỗi nguồn có ca thật ở từng mức); bản tổng hợp quyết định mục C
(V2, V3, V5).

## Out of scope

- OOS-1: Bậc chạy hằng ngày (V4) — `610_data_level.sql`, `do-hang-ngay` (DO1), `lib/data-level.ts`, nhãn B0–B5 trong
  `mappings.yaml` + `ref_lookup` (cần migration), khối bậc ở ngăn tin, ngày đổi thang trên `/ops/quality`: hàng riêng.
  Tới khi hàng đó gộp, số bậc hằng ngày và khối bậc ở ngăn tin còn hiện cụm S06 là «B2 · Gắn căn», lệch FRAMING mới.
- OOS-2: Bộ gắn tin vào nút danh bạ (bảng nối tin → nút, V9): chuỗi GC0–GC3.
- OOS-3: Sửa khoá cụm Stage A, đóng băng Stage B (V7); cờ S06 «0»/«1» (V8); trạng thái ngừng rao (V6); tài liệu mô hình
  và DO2 (V10).
- OOS-4: Dự án trên tin (S06 `projectid`, S03 theo nhóm) — DS2; «chờ khớp» hôm nay chỉ đọc toà, trục, mã căn, số nhà.

## Notes

- Ba cột không lồng nhau (nhà phố gắn căn bằng số nhà không qua toà); Sankey chia theo mức sâu nhất để dòng bảo toàn.
