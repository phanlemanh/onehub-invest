---
slug: ui-standards-reui-thuoc-loi-thoi
at: 2026-10-27T06:00:00Z
verdict: findings
p0: 1
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract + E3 | Thiếu thẻ bắt tay ui-standards-reui/E12 mà chungThayBoi của kit đòi; E3 tự đặt điều kiện, không gọi bộ kiểm kit | Ký xong mà làn ghim lại + pre-merge của ui-standards-reui vẫn đỏ thay-khong-nhan | Thêm thẻ; E3 gọi notRunConflicts trên bản giả lập, đối chứng bỏ thẻ | fixed: mục «Thay thế» trong hợp đồng; E3 gọi notRunConflicts của kit trên bản giả lập (hồ sơ thay signed-off) và chiều đỏ bỏ thẻ → thay-khong-nhan |
| P1 | decisions d-2 | Lối giữ E7 sống còn sống — expected đã ký của E7 không nêu tên tệp | Gỡ lời hứa E7 không cần; khi hồ sơ khép E7 đỏ lại | Tách quyết định E7/E12 | fixed: E7 giữ sống (chỉ sửa thước); chỉ E12 chuyển; dòng sổ mới supersedes d-2 |
| P1 | baseline-doc | Thước mới nới so với E12 cũ (tổng = suppressions) mà hợp đồng không nói | Chuyển suppress thành eslint-disable có lý do: E2 vẫn xanh | Chặn tổng tăng; ghi rõ việc nới vào AC-2 | fixed: thêm «tổng qua các lần đo không tăng» + đột biến (d); AC-2 nói rõ ngoại lệ có lý do được tính riêng |
| P2 | selftest baseline-guard | Kiểm porcelain toàn kho đỏ giả khi lượt chấm ghi sổ song song | E1 đỏ giả ở S4 | Thu hẹp phạm vi porcelain | fixed: porcelain bỏ _acceptance/ |
