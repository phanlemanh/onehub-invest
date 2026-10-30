---
schema_version: 1
feature: Transform S03 đọc giá và diện tích không lẫn URL/SĐT, chuẩn hoá cách viết giá của môi giới, chặn giá phi lý, gom repost theo mã toà/căn, ghi tên người bán và phường theo thị trường của nhóm
slug: s03-cam-mau-so-lieu
owner: phanlemanh@gmail.com
risk_tier: T2      # máy suy: pipeline/transform-zalo.mjs, pipeline/lib/** — không khớp t3_paths
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-10-30
design_doc: docs/superpowers/specs/2026-10-30-s03-cam-mau-so-lieu-design.md
---

# Acceptance Contract: s03-cam-mau-so-lieu

## Context

Transform S03 (`pipeline/transform-zalo.mjs`) đọc số trên chữ còn URL ảnh và SĐT, đọc sai bậc cách viết giá của môi
giới, kiểm «cho thuê» trước «bán», gom nhiều căn của một môi giới thành một offer, để trống `seller_name` và chỉ nạp
phường Hà Nội. Căn cứ: `docs/research/s03-boc-tach-cau-truc-3010.md` §3, §8.5 (N1), §9.2, §9.4; hàng N1 của
`docs/plan/lo-trinh.json`. Cầm máu bằng luật xác định; ý định bán/thuê không vá bằng regex (PL5).

## Acceptance criteria

- AC-1: Given ma trận viết trước gồm bài thật có URL ảnh hoặc SĐT chứa dãy số hoặc chữ khớp mẫu giá/diện tích/phòng ngủ (vd URL mang «6tY» cạnh «Giá thuê: 7.000.000»), When
  `parsePost` đọc, Then giá, diện tích, phòng ngủ đúng đáp án viết trước (không lấy số từ URL/SĐT), và `phones` vẫn ra
  đúng SĐT của chữ gốc.
- AC-2: Given ma trận viết trước các dạng giá tỷ lấy từ bài thật («2.650 tỷ», «6,950 tỷ», «3,349 tỷ», «2400 tỷ thu về»,
  «1950 Tỷ thu về», «2ty450», «1ty650», «3ty2», «2 tỷ 450», «2.9 tỷ», «2,93 tỷ», «3 tỷ»), When `parsePost` đọc, Then mỗi dòng ra đúng số đồng của
  đáp án.
- AC-3: Given ma trận viết trước các dạng giá triệu và giá không đơn vị lấy từ bài thật («5tr5», «8tr5», «4tr8»,
  «8,5tr/tháng», «12 triệu/th», «45.5tr/m²», «Giá: 4,000 (thu về)», «7.000.000», «Giá 7.500.000/tháng»), When
  `parsePost` đọc, Then mỗi dòng ra đúng giá (hoặc giá/m²) của đáp án.
- AC-4: Given ma trận viết trước «64m», «43.2m», «DT:43.2m», «65m2», «DT 70m²» và các dạng bề ngang «mặt tiền 5m», «ngang 4m»,
  «hẻm 3m», «đường 12m», When `parsePost` đọc, Then năm dạng đầu ra đúng diện tích, bốn dạng bề ngang ra diện tích
  null; biên khoảng «Nm»: «15m» ra 15, «14m» và «501m» ra null.
- AC-5: Given bài đã đọc là thuê giá từ 1 tỷ, hoặc bán giá trên 100 tỷ, When transform dựng offer, Then bài ấy không
  thành offer và được đếm theo lý do `thue-tu-1-ty` / `ban-tren-100-ty` trong kết quả của `runTransformZalo`; bài thuê
  999 triệu và bán 100 tỷ vẫn thành offer. (Hỏi-2 = (a), Mạnh duyệt 30/10.)
- AC-6: Given hai bài cùng người đăng, cùng loại tin, giá, phòng ngủ, thiếu phường và diện tích, When dựng khoá gom,
  Then khác mã toà/căn → hai khoá, cùng mã → một khoá; không mã thì khoá như hôm nay (`…|?|người đăng`); đủ phường và diện tích thì khoá giữ đúng khuôn nội dung cũ `kind|phường|giá|DT|PN`.
- AC-7: Given nhóm repost có bài mang `sender_name` và bài không, When transform ghi offer, Then `seller_name` của
  offer bằng `sender_name` (đã trim) của bài mới nhất có tên; nhóm không bài nào có tên thì `seller_name` null.
  (cross-layer)
- AC-8: Given bài S03 có tên phường TP.HCM thuộc nhóm khai `market_codes = {vn-hcmc}`, và bài có tên phường Hà Nội
  thuộc nhóm khai `{vn-hanoi}`, When transform chạy, Then `area_id` lần lượt là `vn-hcmc-…` và `vn-hanoi-…`; nhóm khai
  `{vn-hanoi}` không nhận phường TP.HCM; nhóm chưa khai thị trường (Hỏi-1 = khuyến nghị, Mạnh duyệt 30/10): tên chỉ thuộc một thị trường
  ra phường của thị trường ấy, tên trùng giữa hai thị trường ra `area_id` null. (cross-layer)
- AC-9: Given bản chép dữ liệu thật trên DB thử, When chạy lại transform S03 trong BEGIN…ROLLBACK, Then: 0 offer thuê
  giá từ 1 tỷ, 0 offer bán giá trên 100 tỷ, 0 offer có giá chỉ xuất hiện trong URL của bài, offer nào gom quá 10
  nội dung khác nhau (đếm trên chữ đã bỏ URL và SĐT) thì mọi bài là của một người đăng (Hỏi-3, Mạnh duyệt 30/10; số nội
  dung lớn nhất in ra, không chặn), `seller_name` có ở ≥ 95% offer S03, ≥ 95% bài S03 nối được tới một dòng
  `collection_units`, và mọi offer có bài mang tên phường chỉ thuộc TP.HCM (không trùng tên phường Hà Nội), ở nhóm
  không khai thị trường loại trừ TP.HCM, mang `area_id` `vn-hcmc-…`. (cross-layer)
- AC-10: Given cây sau sửa, When chạy bộ test pipeline, Then tất cả xanh (gồm `parse.test.mjs` với ca «2.900 tỷ» đổi
  đáp án sang 2,9 tỷ có ghi sổ, ca gom trùng `s03-gop-trung-dung`, `bench-extraction` dùng chung `parsePost`).

## Coverage

- Trục A — dạng giá: tỷ thập phân | tỷ nhóm nghìn | tỷ viết triệu không dấu | tỷ chen phần lẻ | triệu chen phần lẻ |
  triệu/tháng | giá/m² | không đơn vị kiểu triệu | không đơn vị kiểu đồng | giá che số (ngoài phạm vi, PL13) [thước CE:
  bảng §3.2 «Tầng 2 — đọc số» của bản nghiên cứu; AC-2, AC-3]
- Trục B — nhiễu số: URL ảnh | SĐT | bề ngang «Nm» [thước CE: §3.2; AC-1, AC-4]
- Trục C — khoá gom: đủ phường + DT | thiếu, có mã | thiếu, không mã, có DT | thiếu cả mã lẫn DT [thước CE: `repostKey`;
  AC-6]
- Trục D — phường: nhóm khai HN | khai HCM | chưa khai [thước CE: `collection_units.market_codes`; AC-8, Hỏi-1]
- Trục E — chốt khoảng: thuê dưới/từ 1 tỷ | bán tới/trên 100 tỷ [AC-5]
- Cắt ngang: dữ liệu thật (AC-9), không hồi quy (AC-10), người bán (AC-7).

## Out of scope

- Ý định 3 lớp, tách Yêu cầu, sửa bán/thuê bằng luật (PL5); tách bài nhiều căn (PL18, N2).
- Giá khoảng/giá che số, mã căn có bậc, trường thuê (PL13); nối mã toà vào danh mục (PL20, DB1).
- Gộp tin chỉ ảnh (PL28); ghi phát biểu `rule_id` cho luật mới (PL17).
- Đổi cột lên cloud của `seller_name` (giữ như hôm nay); migration.
- Nạp lại thật trên `oneinvest :5433` (bước triển khai sau gộp).

## Đường đo

- Sáu thước của «Bật khi» (ô cơ hội) ← `pipeline/scripts/do-cam-mau-s03.mjs` trên DB thử, AC-9; ca thử số lấy từ bài
  thật ← AC-1…AC-4.

## Notes

- Ra khỏi kho (việc người): admin khai `market_codes` cho 11 nhóm S03 ở `/ops/sources` để nhánh «nhóm đã khai» của
  AC-8 chạy trên dữ liệu thật.
