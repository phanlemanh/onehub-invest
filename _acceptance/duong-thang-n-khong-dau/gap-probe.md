---
slug: duong-thang-n-khong-dau
at: 2026-11-01T00:50:00Z
verdict: findings
p0: 0
p1: 1
p2: 4
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Điều kiện loại của AC-6 chỉ xét mở đầu chuỗi, không xét tiền tố đứng sau cụm vị trí/số nhà; ô gõ sai dấu | «123 Đường Nguyễn Trãi», «Ngỏ» làm E6 đỏ oan | Loại sau khi bỏ cụm vị trí + số nhà; thêm đối chứng dương tự dựng; in số loại/lệch | fixed: AC-6/E6 loại sau khi bỏ cụm vị trí và số nhà, thêm tập viết trước 5 giá trị gồm «123 Đường Láng», «Số 5 Dương Khuê», «Ngỏ»; in số so/loại/lệch; cách sửa đổi sang thử trên boDau nên ô gõ sai dấu cũng khớp |
| P2 | evals | Chiều đỏ E6 ghim vào dữ liệu thật («Ngõ») và thứ tự SELECT | Không có ô «Ngõ» hay lệch đầu tiên khác → chiều đỏ hỏng | Ghim chiều đỏ vào tập tự dựng, mỗi đột biến một thông điệp | fixed: E6 chiều đỏ chạy trên tập viết trước, hai đột biến hai thông điệp; dữ liệu thật chỉ đòi số lệch > 0 |
| P2 | evals | E7–E10 «tệp không đổi» không ghim mốc so | Chấm lại sau gộp, diff bằng 0 vô nghĩa | Ghim mốc là merge-base | fixed: AC-7, E7–E10 so với merge-base của nhánh (diffBase) |
| P2 | contract | Ngưỡng «mọi cặp» nhưng AC-6 loại nhóm duong/pho mà không nói | Duyệt ngưỡng tưởng đã đo hết | Sửa chữ ngưỡng, nêu phần loại | fixed: ngưỡng ở opportunity.md và bảng Đường đo nêu rõ phần loại (tiền tố không dấu duong/pho, HD2); vẫn ở dạng [đề xuất] cho Mạnh chốt |
| P2 | design | Dòng sổ chỗ-sửa trích tiền lệ hồ sơ khác làm căn cứ cho cả cách sửa; lối thử trên boDau chưa cân | Duyệt cách sửa không có căn cứ | Tách hai dòng, lối khác có loi_chet | fixed: dòng mới supersedes tách «chỗ sửa» (tiền lệ) và «cách sửa» (mot-loi: thử trên boDau, lối liệt kê không dấu chết vì không gỡ ô gõ sai dấu) |
