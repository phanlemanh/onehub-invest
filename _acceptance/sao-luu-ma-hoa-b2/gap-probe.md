---
slug: sao-luu-ma-hoa-b2
at: 2026-11-11T08:38:00Z
verdict: findings
p0: 4
p1: 1
p2: 0
---

# Phản biện context sạch — sao-luu-ma-hoa-b2

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | `kiem` so tệp dump với bản gốc trên đĩa trong khi `chay` đã xoá bản dump tạm | Trên máy thu `kiem` hoặc thoát 1 mỗi tuần, hoặc so kho với kho nên luôn khớp; C10 xanh vì fixture giữ dump | E5 dựng kho bằng chính `chay`; mốc đối chiếu ghi rõ; ca phá byte tệp dump đỏ | fixed: `chay` ghi `dump_sha256` vào trạng thái, `kiem` so với nó, thiếu mốc thì thoát 1; C14; AC-5 và E5 sửa |
| P0 | design + evals | Luật loại trừ khớp tên áp lên cả raw snapshot | Raw snapshot tên `chat_profile`, `author` bị loại lặng lẽ; E3 xanh vì tập kỳ vọng suy từ chính hằng | Đối chứng dương: tệp snapshot mang từng từ phải có trong `restic ls`; đột biến áp lên snapshots thì đỏ | fixed: luật chỉ áp dưới `collector/state/`; C15; tập kỳ vọng E3 viết trước, không suy từ hằng; sổ thay d-9 |
| P0 | design (sổ d-8) | Lối thứ ba «đỏ khi đã bật» bị bỏ qua | Đã bật mà job không chạy lần nào → «chưa bật» thoát 0 vô hạn | C12 thêm ca có tệp xác nhận, không có trạng thái → 1 | fixed: thiếu trạng thái mà có `da-cat-khoa` thì thoát 1; sổ thay d-8 |
| P0 | design (sổ d-3) | Chọn restic ghi máy quyết trong khi định dạng kho là cam kết khó đổi; borg, kopia chưa bị loại | Cổng Phạm vi khoá công cụ mà Hỏi-1 chỉ hỏi cài | Đổi thành câu chỉ-người có lối khác | fixed: Hỏi-1 nay là chọn restic và cài, nêu borg/kopia/rclone crypt; sổ thay d-3, d-4 |
| P1 | evals | E1 không đo `khoi-tao` khi thiếu xác nhận | `khoi-tao` chạy `init` trước khi Mạnh cất khoá mà E1 vẫn xanh | Ca C13 cùng ca dương | fixed: C13 trong design, E1 đo cả hai lệnh |
