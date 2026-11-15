---
slug: resolve-stage-a-theo-tap
at: 2026-11-15T04:10:00Z
verdict: findings
p0: 0
p1: 1
p2: 4
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E1 (AC-1) chỉ đòi «lệch 0», không có đối chứng dương rằng mẫu 5% thật sự chạy qua đường chèn; số đếm lớp cụm ở bảng phủ ca là trên đủ dữ liệu. | Bản chép dựng sau khi lượt resolve trên máy thu đã xong: gần như mọi tin đã gắn, mẫu chỉ còn lớp «khớp căn», hai bản chỉ chạy UPDATE, hai câu INSERT theo tập không chạy dòng nào, E1 vẫn «lệch 0». | E1 đếm căn mới và link mới, thoát 1 khi bằng 0; hoặc đưa bản chép về trước lượt 14/11 22:30Z. | fixed: lệnh dựng xoá căn và link tạo từ 2026-11-14 22:30Z trên bản chép (cờ --truoc), phép so in «đường chèn: c căn mới · l link mới» và thoát 1 khi c hay l bằng 0; đo mẫu 0,5%: 40 căn mới, 47 link mới, lệch 0 |
| P2 | evals | E3 (AC-3) đo giờ mà không ghim số link được chèn. | Bản chép mọi tin đã gắn: bản mới chỉ UPDATE, dưới 300 giây, phần chèn của lượt đêm thật chưa được đo. | E3 in số link và căn đã chèn, đòi số link ≥ một mức gần lượt đêm. | fixed: E3 chạy trên bản chép đưa về trước mốc 22:30Z, đòi ≥ 1.000 link; đo: 5,0 giây, 8.107 căn mới, 9.316 link mới |
| P2 | contract | Phép so đủ dữ liệu (bù cho mẫu) ghi «ở Notes» nhưng Notes không có, và không là điều kiện trước gộp. | Lệch chỉ có ngoài mẫu không lộ trong lượt chấm; người ký không thấy bằng chứng đủ dữ liệu; lệch vào DB máy thu ở lượt đêm kế. | Notes ghi lệnh, nơi lưu output, luật «TỔNG lệch 0» trước gộp. | fixed: Notes ghi lệnh, tệp `so-du-lieu-du.log` của hồ sơ, và luật «TỔNG lệch 0» là điều kiện trình thẻ Cổng Bằng chứng |
| P2 | contract | Trục «Lớp tin» gán năm lớp lọc cho AC-1 trong khi số đếm 0 hoặc gần 0, AC-1 không chạy qua nhánh lọc nào. | Bản viết lại bỏ sót điều kiện lọc; dữ liệu hôm nay không có dòng nào ở các lớp đó nên hai bản vẫn bằng; Coverage ghi là đã phủ. | Chèn dòng giả mỗi lớp lọc vào cả hai bản chép, hoặc Coverage ghi thẳng «chưa phủ». | fixed: Coverage ghi thẳng «chưa phủ bằng dữ liệu, số đếm 0 hoặc gần 0»; điều kiện lọc ở bản mới giữ nguyên chữ bản cũ (CLUSTER_EXPR, KHONG_CAP_THI_TRUONG, ba điều kiện WHERE) và bị ghim chữ bởi AC-5 |
| P2 | evals | E6 không đòi N ≥ 1 và không ghim rằng 40P01 rơi vào câu chèn link theo tập. | Vũ đạo viết cho vòng mỗi cụm có thể không còn trúng câu Stage A mới; lượt vẫn hoàn tất, E6 xanh. | E6 đòi N ≥ 1 và thấy đúng câu chèn property_offers. | fixed: expected E6 ghi rõ vũ đạo kích ở câu đầu tiên bắt đầu «INSERT INTO property_offers» (ở bản mới là câu chèn theo tập) và RTLD-AC-6 đòi soLanThuLai ≥ 1, lượt tắt thử lại ném 40P01 — cả hai đã có trong itest |
