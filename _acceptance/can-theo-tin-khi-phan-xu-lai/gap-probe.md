---
slug: can-theo-tin-khi-phan-xu-lai
at: 2026-11-01T05:40:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Dòng sổ câu trả lời của Mạnh thừa dấu đóng ngoặc; thiết kế còn ghi «chờ Mạnh chốt», thiếu vế sao lưu trước của Hỏi-3 | Bộ đọc sổ bỏ dòng, Cổng 1 không thấy câu trả lời; người duyệt đọc trạng thái lệch | Parse từng dòng thoát 0; thiết kế ghi Mạnh duyệt và vế sao lưu | fixed: sửa dòng sổ (commit b0da682e, parse 0 lỗi); thiết kế ghi «Mạnh Duyệt cả 4 01/11» và «sao lưu :5433 bằng pg_dump TRƯỚC khi áp 066» |
| P1 | evals | Chiều đỏ đòi ném ở cả 8 ô, nhưng ở 4 ô cùng căn 063 đã cho cùng giá trị | E1/E2 đỏ vĩnh viễn, hoặc chiều đỏ dựa vào chuỗi log có mặt | Tách ma trận: chiều đỏ giá trị chỉ ở 4 ô khác căn; ô cùng căn assert giá trị bằng 063, chỉ log khác | fixed: E1/E2 expected tách khác căn (ném, thông điệp ghim theo ô) và cùng căn (giá trị = 063, khác duy nhất là offer_ids trong log); AC-1/AC-2 ghi rõ |
| P1 | evals | Fixture E4 viết tay, phép đếm tự khép, thiếu đối chứng âm | Khối sửa đọc sai nguồn hoặc lọc sai trạng thái mà itest vẫn xanh, rồi điền sai trên :5433 | Sinh lệch bằng apply_enrichment 063; đếm độc lập; ba ô đối chứng | fixed: AC-4/E4 sinh lệch bằng apply_enrichment bản 063 trong giao dịch, cells so với đếm độc lập, thêm ô đề xuất đã hoàn tác (0 ô), căn không chung bài (md5 không đổi), ô có sẵn (giữ) |
| P1 | evals | E2 thiếu ô B còn mang giá trị từ nguồn riêng sau phân xử lại | Bản cài loại B khỏi tập tin khác của PB, PB mất giá trị trong khi B vẫn mang | Ô riêng, thông điệp ghim | fixed: AC-2/E2 thêm ô «B còn mang giá trị từ nguồn riêng» với thông điệp 'CT-AC-2: căn mất giá trị B vẫn mang' |
| P2 | contract | AC-1 hứa giá trị của B, thiết kế dùng max(); khoá log chung_bai không có AC | Hai đặc tả mâu thuẫn khi A ≠ B cùng căn | AC theo max(), ô A ≠ B; bỏ hoặc đo chung_bai | fixed: AC-1 theo max() các tin trong tập gắn PB, E1 thêm ô 'A ≠ B cùng căn'; bỏ khoá chung_bai khỏi thiết kế |
