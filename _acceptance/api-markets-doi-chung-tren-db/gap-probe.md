---
slug: api-markets-doi-chung-tren-db
at: 2026-11-25T18:40:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E1, E2 cùng lệnh chạy cả tệp, chỉ đọc mã thoát; không chứng ca HT28-AC-1, HT28-AC-2 thật sự chạy, không tách kết luận từng AC | Ca AC-2 bị skip hay todo, tệp vẫn thoát 0, E1 E2 E4 cùng xanh | Mỗi eval chạy riêng một ca theo tên và đòi đúng một ca đạt | fixed: E1, E2 dùng executors.test.ht28_ac1, ht28_ac2 — --test-name-pattern theo tên ca, đòi dòng «ℹ pass 1» |
| P1 | contract | AC-2 không đòi hàm chỉ xét mệnh đề ORDER BY; bản âm xoá mọi «, m.name» kể cả SELECT | Hàm chỉ tìm chuỗi m.name, route bỏ khoá phụ mà SELECT còn m.name thì hàm vẫn true | Bản âm chỉ sửa trong ORDER BY, khẳng định SELECT còn m.name mà hàm false | fixed: AC-2 và design mục 2 — hàm chỉ đọc ORDER BY; ba ca (a) route true, (b) chỉ sửa ORDER BY false kèm khẳng định SELECT còn m.name, (c) m.name DESC false |
| P1 | evals | E3 bị grep đảo mã khi tệp mất, mẫu không phủ «giữ thứ tự chèn», vế dương của AC-3 không đo, chiều đỏ không chạy được bằng lệnh | Chú thích mới viết «giữ thứ tự chèn» hay tệp bị đổi tên, E3 vẫn xanh | test -f, mẫu thêm cụm, grep dương cụm ghim, chiều đỏ bằng git show | fixed: lệnh ht28_khong_theo_chen có test -f, mẫu thêm «giữ thứ tự chèn», grep dương «chiều đỏ tất định nằm ở HT28-AC-2»; chiều đỏ ghi bằng git show 04b9ddc3b trong expected |
| P2 | design | Chưa trích khuôn SQL và thứ tự tham số của route | Route dùng listing_count không tiền tố hay thứ tự tham số khác thì AC-1, AC-2 đỏ oan | Trích nguyên văn ORDER BY và tham số từ 04b9ddc3b | fixed: design mục «Khuôn route ở 04b9ddc3b» — ORDER BY m.listing_count DESC, m.name; tham số [country, limit] |
| P2 | design | Dòng sổ d-2 ghi nguồn mục-tiêu nhưng câu trích không quyết giữa đọc văn bản route và xuất hằng SQL [cham-bong-bo-sung-tin#F1] | Người ký tưởng lối đọc văn bản đã có lời chốt trong khi lối xuất hằng SQL còn sống | Dòng sổ mới nguồn một-lối với lời chết thật | fixed: dòng sổ mới supersedes d-2, nguồn một-lối — sửa route.ts ra ngoài vùng hàng và đụng hành vi đã ký của HT23 |
