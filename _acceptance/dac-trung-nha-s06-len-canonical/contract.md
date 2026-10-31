---
schema_version: 1
feature: Đặc trưng nhà của tin S06 (số nhà, mã căn, mặt tiền, ngang×dài, số tầng, WC, toạ độ) lên canonical qua phát biểu trường lớp sự thật có căn cứ — migration 061
slug: dac-trung-nha-s06-len-canonical
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: db/migrations/ (061) — khớp t3_paths
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-31-dac-trung-nha-s06-len-canonical-design.md
---

# Acceptance Contract: dac-trung-nha-s06-len-canonical

## Context

Hàng HD5 của dãy P1 (đợt `hang-duyet-3010`), Cổng Đáng build (Mạnh 30/10). Stg S06 có sẵn số nhà, ngang×dài, số tầng, WC,
toạ độ và mã căn cho phần lớn tin, nhưng canonical không có. Bộ đánh giá và thẻ duyệt vì thế không dùng được các đặc trưng
này. Migration 061 do liên làn cấp.

## Acceptance criteria

- AC-1: Given migration 061, When áp hai lần lên DB thử, Then `sale_offer_records` (và view `sale_offers`) có 7 cột
  `street_number`, `unit_number`, `frontage_length`, `lot_size_dimensions`, `stories`, `latitude`, `longitude` đúng kiểu thiết
  kế §1; CHECK chặn `frontage_length ≤ 0`, `stories ≤ 0`, vĩ độ ngoài [-90, 90], kinh độ ngoài [-180, 180];
  `field_assertions_field_chk` nhận 7 mã mới và vẫn nhận 6 mã của 059; lần áp thứ hai không lỗi và migration không ghi dòng
  dữ liệu tin hay phát biểu nào.
- AC-2: Given sổ `pipeline/mappings.yaml` có trục `assertion_field` thêm 7 mã (mỗi mã `dd_lookup` theo bảng thiết kế §1) và 7
  cột mới ánh xạ RESO, When chạy `vocab.mjs --check`, `--lint` và `--check-db` trên DB thử đã áp 061, Then cả ba xanh.
- AC-3: Given ma trận viết trước — mỗi trường một dòng hợp lệ, một dòng vắng, một dòng rác (0, âm, chữ rỗng, chữ ở trường
  số, `width` > 200, `floors` > 100, toạ độ ngoài khung VN), mỗi dạng giá trị thật đếm được ở stg (số JSON, chuỗi số, dấu
  phẩy thập phân, chuỗi kèm đơn vị), dòng chỉ có `streetnumber_display`, dòng có `width` mà không `length` — When `docDacTrungS06` đọc, Then mỗi dòng ra đúng tập `{field, value, rule_id}` viết trước.
- AC-4: Given tin S06 tổng hợp trên DB thử (ROLLBACK), When transform-chotot chạy, Then mỗi giá trị hợp lệ có đúng một phát
  biểu sống lớp `fact`, phương pháp `source_field`, `rule_id` = khoá nguồn, `observed_at` = `list_time`; và với mỗi trường số
  mới (`frontage_length`, `stories`, `latitude`, `longitude`), INSERT phát biểu ở MỌI phương pháp (kể cả `hitl`) mang chữ
  không phải số hoặc giá trị ngoài miền bị trigger 061 chặn kèm tên trường, giá trị đúng miền thì vào được. (cross-layer)
- AC-5: Given các tin ấy, When phân xử chạy, Then 7 cột mới và `bathrooms` bằng giá trị phát biểu thắng, `field_provenance`
  của tin có mục cho từng trường; một phát biểu `hitl` khác giá trị cho cùng trường thắng `source_field`. (cross-layer)
- AC-6: Given cùng tin, When transform chạy lượt hai không đổi stg, rồi lượt ba với một giá trị đổi ở stg, Then lượt hai
  thêm 0 phát biểu và đổi 0 ô; lượt ba rút đúng phát biểu cũ của trường ấy, thêm đúng một phát biểu mới, ô mang giá trị mới.
  (cross-layer)
- AC-7: Given bản chép dữ liệu thật (DB thử đã áp 061), When transform bản mới chạy, Then với mỗi đặc trưng thước in ba số
  tính bằng SQL độc lập với bộ đọc — tin sống có khoá khác rỗng ở stg, trong đó số bị loại là rác (kèm ba giá trị rác phổ biến
  nhất), và số có ô khác rỗng — và tỉ lệ lên canonical trên mẫu số theo Hỏi-1 ≥ 95%; mọi ô mới khác rỗng có phát biểu sống
  cùng giá trị; cùng thước chạy với code transform của merge-base trên DB đã áp 061 (cột có mà rỗng) thì đỏ ghim
  «<trường>: X/Y < 95%», không phải lỗi SQL. (cross-layer)
- AC-8: Given cùng DB thử, When transform bản trước rồi bản mới chạy, Then năm cột cũ (`property_type`, `bedrooms`,
  `street_raw`, `block_raw`, `floor_raw`) và `offer_status` của mọi tin sống S03/S05/S06, cùng `bathrooms` của tin S03/S05,
  không đổi (0 tin miễn); tập tin sống không đổi; `CLOUD_ALLOW.sale_offers` của `sync-cloud.mjs` không có cột mới nào.
  (cross-layer)
- AC-9: Given cây sau sửa, When chạy bộ test pipeline, ca DB phát biểu (045) và ca DB trạng thái chào (059) trên DB thử, Then
  tất cả xanh.

## Coverage

- Trục A — lược đồ: 7 cột + kiểu | CHECK miền | CHECK trường phát biểu | áp lại [AC-1] · sổ RESO [AC-2]
- Trục B — đọc: trường × (hợp lệ | vắng | rác) | nguồn thay thế | ngang thiếu dài [AC-3]
- Trục C — phát biểu: lớp · phương pháp · căn cứ · thời điểm | chặn sai kiểu [AC-4]
- Trục D — phân xử và vòng đời: thắng | người thắng máy | nạp lại | đổi giá trị [AC-5, AC-6]
- Trục E — dữ liệu thật và không lùi: tỉ lệ lên canonical | có căn cứ | cột cũ | cloud [AC-7, AC-8, AC-9]
- Bỏ quét hình thái: dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- Đọc đặc trưng nhà từ chữ bài S03/S05; luật loại trừ «khác căn» trong bộ đánh giá (hàng HD khác).
- Đưa 7 cột lên cloud và hiện trên thẻ duyệt (`CLOUD_ALLOW` giữ nguyên); áp 061 lên DB máy thu (bước triển khai sau gộp).
- Sửa migration 057 của PL5 (chồng `field_assertions_field_chk` — PL5 tự lo khi gộp main).

## Đường đo

- «Mỗi đặc trưng lên canonical ở ít nhất 95% số tin có trường ấy ở stg» ← AC-7 (mẫu số theo Hỏi-1; thước in cả mẫu số «có
  khoá» và số rác bị loại).
- «Mỗi giá trị có phát biểu với căn cứ» ← AC-4 (`rule_id` = khoá nguồn) + AC-7 (mọi ô có phát biểu sống cùng giá trị).
- «Field mới khai RESO-first trong mappings.yaml» ← AC-2.

## Notes
