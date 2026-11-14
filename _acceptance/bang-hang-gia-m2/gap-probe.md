---
slug: bang-hang-gia-m2
at: 2026-11-14T02:45:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ chọn gọi bước chấm ở cuối refresh-bait-gap với căn cứ một-lối, nhưng lối khác chưa chết: phần transform của job đêm là làn Claude; ô cơ hội đòi chạy sau định vị | Job S06 chạy refresh-bait-gap trước resolve-properties nên căn S06 mới góp hai phiếu suốt một đêm, trái AC-2; fixture và bản chép tĩnh không bắt | Dòng sổ mới căn cứ mục tiêu «chạy sau định vị»; AC đo thứ tự bước trong job đêm | fixed: dòng sổ thay d-6 (bước xep-hang-gia riêng sau resolve-properties ở job S06, sau refresh-bait-gap ở job S03 và FB); AC-11 + E11 đo thứ tự bước, có đột biến đặt trước resolve-properties |
| P0 | contract | Không ghi lựa chọn chỉ người có: thứ tự gộp so với áp DDL cloud; không AC nào nói đường đọc làm gì khi bảng chưa có hay rỗng | Gộp vào main triển khai app đọc cloud trước khi Mạnh áp 104 → /ops/deals và /api/v1/deals lỗi 500 tới lúc áp; mọi eval vẫn xanh trên DB thử | Dòng sổ chỉ-người hai lối; AC đường đọc khi bảng thiếu, có đối chứng dương | fixed: Hỏi-5 (kho_dao true, khuyến nghị lùi về cách đọc CG8); AC-6, AC-7, E6, E7 đo DB không có bảng và bảng rỗng |
| P1 | contract | Chỗ gọi trong job đêm và ca DB chưa áp 104 chỉ nằm ở Notes, không AC nào đo | Job đêm trên máy thu chưa áp 104 ném lỗi, hỏng ba job; hoặc quên nối chỗ gọi, bảng không bao giờ làm mới | AC chạy lệnh thật trên DB có và không có 104, đột biến bỏ chỗ gọi | fixed: AC-11 + E11 |
| P1 | contract | Nhãn «Cần xác minh» — lớp bảo vệ còn lại sau QĐ3 — không được đo trên chữ người vận hành thấy | Trang không vẽ nhãn, căn nhập sai giá hiện như căn rẻ thật; AC-6, E10 vẫn xanh | Cặp dương/âm chữ «Cần xác minh» ở AC-6; E10 chụp nhãn | fixed: AC-6, E6 cặp dương/âm; AC-10, E10 kiểm chữ chỉ ở căn có cờ |
| P2 | evals | E6 chỉ thử 4/9 mã lý do và đo câu chứng minh bằng chuỗi có mặt, không ghim N | Mã thieu-dt-va-pn rơi về nhánh mặc định; câu in số tin thay số phiếu; E6 vẫn xanh | Ma trận đủ mã + mã lạ; N = offer_price_rank.n, đột biến N = số tin đỏ | fixed: E6 ma trận đủ mã + mã lạ, assert N bằng n của bảng có đột biến |
