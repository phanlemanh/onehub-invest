---
slug: stg-du-an-s08
at: 2026-11-12T10:30:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ chọn cột sinh STORED ghi nguồn một-lối nhưng chỉ bác lệnh transform và bộ nạp tự bóc; lối VIEW trên năm cột thô vẫn sống. | Cổng Phạm vi duyệt cột sinh như lối duy nhất; đổi mẫu khung bản đồ sau này phải viết migration ghi lại bảng, lối VIEW tránh được mà không ai cân. | Thay dòng sổ bằng căn cứ bác được lối VIEW, hoặc đưa thành câu hỏi. | fixed: dòng sổ mới thay d-20261112T094752Z-3, căn cứ mục tiêu trích câu giao của hàng («nằm trong stg_s08_project»); VIEW thêm đối tượng tên khác; giá đổi luật là migration trên bảng vài trăm dòng — rẻ |
| P1 | evals | E3 so cột sinh với payload bằng đường khoá do cùng người viết, chỉ ghim số đếm dương cho điểm. | 094 sai đường khoá, itest dùng cùng đường, hai vế NULL nên so bằng; bảng rỗng mọi cột trừ điểm mà E3 vẫn xanh. | Số đếm khác NULL cho từng trường trên snapshot 07/11 từ đo raw; so bằng hai vế NULL thì đỏ. | fixed: AC-3 và E3 thêm 177 địa chỉ, 177 chủ đầu tư, 76/101 loại hình, 149 sở hữu, 174 điểm; ca so bằng hai vế NULL ở trường catalog thì đỏ |
| P1 | contract | Nạp mồi chỉ chứng câu chèn; việc chọn payload và ghép item detail vào catalog do JS của itest tự dựng, không rút từ bên ghi thật. | ZCode chèn nguyên item hay ghép theo khoá khác: câu chèn đúng mà cột sinh NULL hàng loạt; bằng chứng S4 vẫn xanh. | Xuất hàm dựng dòng ở pipeline/lib/s08-du-an.mjs, lời GIAO bắt bộ nạp gọi đúng hàm. | fixed: AC-2 và E2 dựng dòng bằng dongDuAnS08 của pipeline/lib/s08-du-an.mjs; lời GIAO bắt bộ nạp gọi hàm này |
| P1 | contract | Ngưỡng sống của ô là số trên dữ liệu nạp thật; contract không có mục Đường đo, phần đo máy thu ra Out of scope không tên. | Cổng Phạm vi đọc 177/174 trên nạp mồi thành ngưỡng đã đạt; bộ nạp thật cho số khác mà không thước nào đo lại. | Mục Đường đo: ngưỡng → AC nạp mồi, ngưỡng máy thu → mục bỏ có tên, lệnh đếm, điều kiện, người đo. | fixed: thêm mục «Đường đo» trong contract — AC-2, AC-3 là bằng chứng thay thế; số máy thu do phiên liên làn đếm sau khi ZCode gộp và Mạnh áp 094, kèm câu SQL |
| P2 | evals | Itest đọc snapshot ở checkout chính bằng đường cứng; E1, E4 chung lệnh nên bị kéo đỏ khi vắng snapshot. | Chạy ở máy khác hay CI: E2, E3 đỏ chắc, E1, E4 đỏ theo dù không cần snapshot. | Đường snapshot qua biến môi trường, mặc định suy từ git; E1, E4 không phụ thuộc snapshot. | fixed: E2 đọc S08_SNAPSHOT_GOC, mặc định suy từ git common dir; E1, E4 khai không cần snapshot; executor đã ghi «ngoài CI» |
