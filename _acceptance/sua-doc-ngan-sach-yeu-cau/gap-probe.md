---
slug: sua-doc-ngan-sach-yeu-cau
at: 2026-11-11T03:18:33Z
verdict: findings
p0: 1
p1: 2
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Nghĩa «X quay đầu» do máy quyết là trần, căn cứ một-lối bỏ sót lối mức đích (min = max = X) | Cổng Phạm vi duyệt mà Mạnh không được hỏi nghĩa; gom YC4 và chỉ số cầu lệch theo nghĩa máy chọn | Một dòng Hỏi nêu ba lối kèm số bài khớp | human-gate1: dòng sổ d-20261111T031935Z-11 thay d-20261111T031640Z-4, lên thẻ thành câu hỏi; AC-6 theo câu trả lời |
| P1 | evals | AC-7 chỉ đo tổng số bài có ngân sách, không đo bài mất ngân sách hay đổi giá trị | Mất 300 bài, thêm 500 bài thì tổng vẫn tăng và E7 xanh | In mất, thêm, đổi giá trị; thoát 1 khi có bài mất; 30 mẫu đổi giá trị | fixed: AC-7 thêm 0 bài mất ngân sách và 30 mẫu đổi giá trị; E7 thêm ca tự kiểm MAT NGAN SACH |
| P1 | contract | Ngưỡng «mỗi lỗi Ngoài và mỗi cách viết ít nhất hai ca» không có bảng ca và tổng số ca ghim | Một dạng của Ngoài-7 không có ca mà AC-4 vẫn xanh; xoá ca vẫn xanh | Bảng ca → mã viết trước, đếm ít nhất hai ca mỗi mã, ghim tổng | fixed: contract thêm bảng ca viết trước; AC-4 thêm khoảng ngược 3-2 tỷ; E4 đếm theo mã, đỏ THIEU CA <mã> |
| P2 | evals | Chặn phần lẻ chỉ có đối chứng pn, phòng, m2 trong khi design chặn sáu chữ | Bản cài bỏ chặn căn, tầng, m² vẫn qua E2 | Sáu ca đối chứng, mỗi chữ một chiều đỏ | fixed: AC-2 và E2 có sáu đối chứng, sáu chiều đỏ ghim theo chữ |
| P2 | evals | Băm ghim của E8 không nói lấy từ đâu | Người cài băm tệp đã sửa, phép kiểm tự khớp với chính nó | Ghi rõ nguồn băm là git show 6c4ee41d | fixed: AC-8 và E8 ghi nguồn băm; test in lệnh tính lại cạnh hằng |
