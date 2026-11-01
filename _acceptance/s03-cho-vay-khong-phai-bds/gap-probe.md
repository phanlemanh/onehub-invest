---
slug: s03-cho-vay-khong-phai-bds
at: 2026-10-31T14:30:00Z
verdict: findings
p0: 0
p1: 2
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design | Thiết kế đổi đuôi ranh giới từ ở cả nhánh pn/phòng ngủ/wc/vs mà không AC hay eval nào đo nhánh ấy; đổi nhánh này NỚI RỘNG chứ không thu hẹp («phòng ngủ» trần thành dấu hiệu BĐS) | Bài có «phòng ngủ» theo sau khoảng trắng hay dấu câu, không dấu hiệu khác, thành tin rao sau khi sửa; E1–E3 vẫn xanh | Ô ma trận cho nhánh pn so với bản cũ, hoặc bỏ thay đổi nhánh ấy | fixed: chỉ sửa nhánh «<số>n», nhánh pn/phòng ngủ/wc/vs giữ nguyên — design doc và dòng sổ mới (supersedes dòng approach cũ) |
| P1 | evals | Ô E1 «góp 3 năm 2 tỷ sổ hồng» có thể vi phạm Given; ba ô âm tính không có đối chứng dương rằng trước khi sửa chúng khớp nhờ «<số>n» | Ô vốn false vì lý do khác xanh dù bản sửa sai | Mỗi ô: bản cũ true, bản sửa false; thay chữ trung tính thì cả hai false | fixed: bỏ «sổ hồng», mỗi ô AC-1 so bản chép giữ ranh giới từ cũ (đối chứng dương) và ô thay chữ trung tính |
| P2 | evals | Ma trận E2 thiếu ô dấu câu, hết bài, «1nk» | Lookahead dương thay lookahead âm vẫn xanh E2 mà mất «Căn 2n, 14tr» | Thêm ô + chiều đỏ lookahead dương | fixed: thêm «căn 2n, giá 14tr», «giá 14tr căn 2n», «1nk giá 3 tỷ» so với bản cũ; chiều đỏ lookahead dương ghim «CV-AC-2 viết tắt phòng ngủ mất» |
