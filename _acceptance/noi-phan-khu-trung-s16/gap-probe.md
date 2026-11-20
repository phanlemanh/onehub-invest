---
slug: noi-phan-khu-trung-s16
at: 2026-11-18T23:29:54Z
verdict: findings
p0: 0
p1: 5
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | PL20 là bên đọc nhưng không có phép đo trong hàng này | Hàng áp xong, PL20 chưa lọc nút nghỉ, người gắn nhãn chọn trúng nút rỗng | Điều kiện chặn việc rút lát nhãn, ca lọc nằm trong test PL20 | fixed: Notes ghi điều kiện chặn; mã PL20 chưa ở main nên hàng này không đo được truy vấn của nó |
| P1 | contract | AC-2 không có sàn tỉ lệ bằng chứng, design thiếu bảng từng cặp | Một toà có S09 kéo 15 toà không bằng chứng vào nút cũ | Bảng bảy cặp, sàn một nửa, fixture dưới sàn, E9 ghim bảy tỉ lệ | fixed: AC-2, E2, E9, design |
| P1 | evals | E7 thiếu ma trận loại nút giữ lại, E9 không định nghĩa năm khu | Bước dựng đêm đúc lại nút ở cụm cháu hay nút building mà E7 vẫn xanh | E7 đủ ba loại nút, thêm hai tệp dựng đêm vào paths, E9 liệt năm dự án | fixed: AC-7, AC-9, E7, E9 |
| P1 | contract | Đường đo không bắt lượt đêm đúc lại nút trùng | Lệnh kiểm thoát 0 trong khi đêm đó có nút trùng mới | Lệnh kiểm bắt nút chưa nghỉ khác mang khoá của cặp đã nối, chạy lại sau lượt đêm đầu | fixed: AC-10, E10, Đường đo |
| P1 | evals | E6 thiếu du-an.ts và hai tệp deals trong paths; đề nghị thêm ui-check | Màn chi tiết dự án vẫn hiện nút nghỉ mà E6 xanh | E6 phủ từng hàm đọc, có đối chứng dương | fixed: AC-6, E6 phủ từng hàm đọc và paths; rejected phần ui-check: màn chỉ hiển thị đầu ra của hàm đọc, không có logic lọc riêng, nên đo đầu ra hàm có đối chứng dương đã phân biệt được |
