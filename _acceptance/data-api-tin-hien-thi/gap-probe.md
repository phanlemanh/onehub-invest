---
slug: data-api-tin-hien-thi
at: 2026-11-27T16:05:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | Assert âm tính thiếu đối chứng dương ở nhánh kind=rent_lt và nhánh thước CG8; E6 đếm theo ca, không theo ô đường × bộ lọc | Nhánh rent_lt hay CG8 trả rỗng vì bộ lọc không khớp, câu «không chứa tin cấy» xanh trống; ô bo-loc của E6 đỏ nhờ đường bán nên đường khác không phải tự chứng | Ma trận ô viết trước, mỗi ô một tin đối chứng không ẩn khớp bộ lọc (thêm S06 thuê dài, đủ năm căn S06 ở nhóm CG8); E6 đếm thông điệp ghim theo ô = số ô | fixed: AC-3, AC-4 thêm ma trận ô viết trước và đối chứng theo từng ô (S06 thuê dài, năm căn S06 nhóm CG8); E3, E4, E6 sửa expected — E6 đòi số thông điệp ghim khác nhau = số ô |
| P1 | contract | AC-2, E2 đo chuỗi có mặt (nhập SOURCE_HIDDEN, không literal) thay quan hệ «điều kiện nguồn theo sổ» | listings.ts nhập SOURCE_HIDDEN mà SQL ghi hai chuỗi tách rời; ngày sổ thêm mã thứ ba data-api vẫn trả tin nguồn đó | Ô quan hệ: bản chép đổi SOURCE_HIDDEN thêm S06 → tin S06 đối chứng vắng ở mọi đường, thông điệp ghim; bản gốc S06 có mặt | fixed: AC-6 thêm ô «theo-so» (bản chép tệp sinh của data-api thêm S06 → S06 đối chứng vắng mọi ô, «PB7 điều kiện nguồn không theo SOURCE_HIDDEN: <đường>»); E6 thêm ô đó |
| P1 | evals | Vế «do-s03-len-cong.mjs đọc từ tệp sinh» của AC-8 không có eval đo | Regex cũ không bắt được bí danh, script rơi về danh sách rỗng mà --ben-doc vẫn thoát 0 | Script in danh sách đọc được và assert S02, S08; soát tĩnh nhập vocab.generated.mjs; chiều đỏ: tệp sinh rỗng → thoát ≠ 0 | fixed: E10 đổi sang probe nguon-chung.mjs ô «do-s03» — chạy --ben-doc, đòi dòng in «nguồn ẩn: S02, S08», soát tĩnh nhập pipeline/lib/vocab.generated.mjs, chiều đỏ trên bản chép tệp sinh SOURCE_HIDDEN rỗng → thoát ≠ 0 kèm thông điệp ghim |
| P2 | contract | AC-4 không đo việc giá tin ẩn có vào trung vị nhóm CG8 (sinh belowMedianPct của tin hiện ra) | Bộ lọc ở phần chọn tin nhưng thước trung vị đọc mọi sale_offers, giá S02 làm lệch belowMedianPct của tin S06 | Tính trước belowMedianPct kỳ vọng từ căn không ẩn; đột biến đưa tin ẩn vào tập trung vị → đỏ | deferred: thước trung vị là bảng/view tính sẵn của pipeline (v_ruler_p2, pipeline/sql/420_price_rank.sql) — data-api chỉ đọc; hôm nay 0 dòng S02, S08 trong sale_offers. Ghi Out of scope + dòng sổ revisit: lọc nguồn ẩn trong thước là việc của pipeline |
| P2 | evals | E7 có thể chép tay SQL tập ghép thay vì đo đầu ra route; mốc nền không ghim commit | Bản SQL viết tay có điều kiện nguồn, số trước/sau đúng trong khi route thật không lọc; sau gộp main nền lấy nhầm commit | Gọi chính route (bản nền từ merge-base, sha in ra) trên bản chép DB, đếm khoá trả về; ô đỏ bỏ điều kiện → sau ≥ 1 | fixed: E7 gọi route /v1/listings của bản nền (listings.ts ở nền gắn vào bản chép data-api, sha nền in ra) và bản sau hàng trên bản chép DB, đếm khoá nguồn ẩn trả về; probe không chứa chuỗi SQL tập ghép; thêm ô đỏ bỏ điều kiện → sau ≥ 1 |
