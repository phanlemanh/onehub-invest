---
slug: bang-noi-ma-du-an
at: 2026-11-27T21:44:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
claims_input: ok
---

Lượt phản biện context sạch thứ hai, chạy cho bản phạm vi 27/11 (sổ d-20261127T213940Z-36). Lượt 25/11 thay bằng lượt này.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Sổ -39 ghi «mot-loi», nhưng lời GS «chỉ đọc» không giết lối khác: có thể hiện riêng 232 mã chỉ có ở tập cũ, hoặc hợp hai tập. Lối khác còn sống, mà Out of scope chỉ tả hai tập, không trình thành câu hỏi. Giống [api-markets-khong-tra-so-s02#F2] (advisory). | Mạnh thấy dòng S09 trên ô đi từ 344 xuống 49 và tưởng đó là hiệu ứng nối. Thật ra 232 dự án S09 đang có trên màn main biến mất không dấu. E8 lại ghim đúng lối bỏ ấy. | Thay -39 bằng dòng chi-nguoi Hỏi-3, kèm số 221, 344, 112, 232, 109. Notes có bảng «lối khác → AC đổi». E8 theo lối Mạnh chọn. | human-gate1: Hỏi-3 (sổ d-20261127T214631Z-41, supersedes -39). Khuyến nghị: tập DA42 cộng vào ô (49), 232 mã tập cũ hiện một dòng riêng không cộng. AC-8, E8 viết theo khuyến nghị; Notes có bảng hai lối khác A, B kèm số. |
| P1 | design | Thiết kế §3.3, §4 còn đưa S09 vào đường ghi. Lệnh áp bằng băm không qua cờ nguồn, và E6 chỉ thử cờ. | Người áp dựng thẻ S09 rồi chạy lệnh áp với băm thẻ S09 theo §4 đã ký. Lệnh ghi một đường nối S09 song song với DA42, trong khi E6 vẫn xanh. | Sửa §3.3, §4. E6 thêm ca thẻ S09 và ca áp bằng băm thẻ S09, cả hai bị từ chối; đối chứng dương là S07. | fixed: thiết kế §3.3, §3.4, §4 bỏ S09 khỏi đường ghi, có đầu đề bản 27/11. E6 thử đủ ba đường ghi S09 (--the, --ap --nguon, --ap --bam với băm thẻ S09), mỗi lần từ chối đếm bốn bảng và băm dòng S09; đối chứng dương ở E4. Hồ sơ áp gắn nhãn «bản 25/11, chưa dùng được», viết lại ở S3. |
| P1 | evals | Ngưỡng K2: hợp đồng ghi 200 m, thiết kế và mã ghi 300 m. E2 không có ô biên ngưỡng. Danh sách lùi ở §4 thiếu K2. | Mạnh duyệt 200 m nhưng máy nối theo 300 m. Lùi theo §4 thì 12 dòng K2 còn hiệu lực trên máy thu, mà E5 vẫn xanh. | E2 thêm ô biên ngưỡng kèm đột biến ngưỡng. §4 thêm K2. E5 lùi theo danh sách luật in trong hồ sơ áp. | fixed: hợp đồng sửa về 300 m theo thiết kế và mã (lỗi chép của bản 27/11; sổ d-20261127T214631Z-40 supersedes -37). E2 thêm ô 301 m, 350 m không ra K2, đột biến nâng ngưỡng lên 400 m thì đỏ, ghim «300». §4 thêm K2. E5 đảo đúng danh sách rule_id mà lệnh --ap in ra, gồm S07-K2. |
| P1 | contract | Số nền 6.484 có cộng S10 119, nên giải thích «chỉ do S09» không khớp phép cộng. E9 không đo phép cộng ô của registry-view. | E9 in 6.288 rồi 5.932 và đỏ vì phép đo. Hoặc probe tự trừ S10, che đúng lỗi cộng S10 trên dữ liệu thật. | Hợp đồng ghi rõ cách ra 6.484. E9 dùng hàm cộng của registry-view, thêm tệp ấy vào paths, assert phần chênh bằng −119. | fixed: Đường đo tách số: các dòng docDanhBa cộng 6.484 gồm S10 119; ô 6.365; theo AC-8 là 6.169. E9 tính ô bằng đúng hàm cộng xuất từ registry-view.tsx, thêm tệp vào paths, assert tổng ô trừ tổng dòng bằng −(119 + 232). AC-9 ghi phép cộng ấy. |
| P1 | contract | Notes ghi lối khác của Hỏi-2 là «S16 0», sai: 5 dòng giữ vẫn nối, ô phải là 6.152. Notes không nói ô AC-2, E2, E3 đổi ra sao. Expected của E10 «20 mẫu mỗi căn cứ» trái với AC-3. Giống [data-api-property-danh-ba-nha#F1] (advisory). | Mạnh chọn lối khác dựa trên số sai. Sau đó S4 đỏ, hoặc hợp đồng phải viết lại sau chữ ký. E10 trượt theo chữ vì K2 chỉ có 11 mẫu. | Notes có bảng lối khác → AC đổi cho từng câu hỏi. E10 sửa thành «min(20, số cặp) mỗi ô». | fixed: Notes có bảng 5 dòng (khuyến nghị; Hỏi-1 khác 5.738 · 12 · 5.825; Hỏi-2 khác 6.062 · 15 · 6.152; Hỏi-3 A; Hỏi-3 B 6.401 → 6.045), mỗi dòng ghi kết cục AC-2, E2, AC-3, E3. E10 sửa thành min(20, số cặp) mỗi ô căn cứ × hạng × nguồn đúc. |

Bỏ vì vượt trần 5 finding: E3 chỉ đỏ khi đổi kết cục. AC-3 hứa băm đổi cả khi đổi nút đích hay căn cứ, nhưng E3 không đo hai chiều ấy.
Xử lý: fixed. E3 nay có ba đột biến riêng: đổi kết cục, đổi nút đích, đổi căn cứ. Mỗi đột biến phải làm băm khác băm trong tệp.
