---
slug: e1-e2-theo-lop
at: 2026-11-05T11:55:00Z
verdict: findings
p0: 5
p1: 0
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design, contract | Cổng chỉ chặn lệnh ghi, transform đọc nhãn là tách; hoàn tác không chặn tách lại | `--thu` ghi nhãn, lượt đêm tách hàng loạt; hoàn tác xong lượt nạp sau tách lại, cloud còn tin căn | Ca transform không có dấu; ca transform sau hoàn tác; bản đồng bộ | fixed: dấu `tach:mo`, `tach:chan`; AC-10, AC-12, E10, E12 |
| P0 | opportunity, contract | Ngưỡng và cỡ 100 nhãn mâu thuẫn về toán, không có sàn nhãn Có | Bộ đọc đúng hết vẫn thoát 5; nhánh đóng không bao giờ bắn vì 0/100 cho cận trên 3,7% | Ca biên 0/124, 0/125, 28/30, 29/30 | fixed: 125 nhãn, sàn 30, thêm vào E10; mức ngưỡng là human-gate1 |
| P0 | contract, design | Độ đúng từng căn không có mức đạt, bảng lúc ký chỉ có model giả | Bộ đọc gán giá căn này sang căn kia, Mạnh ký trên dữ liệu giả | Tệp đọc tay từ lượt đọc thật, mức 27/30, khớp `run_id` | fixed: AC-11, lượt đọc thật trước Cổng Bằng chứng; mức là human-gate1 |
| P0 | evals | Nhiều vế AC không có eval; E4 thiếu `quote_loai`, `quote_ma`; E3, E10, E11 cần DB | Hoán vị giá giữa các căn mà 12 eval vẫn xanh | `expected` từng vế, E3, E10, E11 sang executor có DB | fixed: viết lại `evals.yaml`, thêm `pl18_cong` |
| P0 | design, contract | Căn cứ trong sổ yếu; `kho_dao` của tin cũ sai; 0,80 chưa ghi; căn hay bài khi lệch | Mạnh không thấy mình đang quyết đường dẫn công khai đổi nội dung và mức 0,80 | Dòng sổ mới | fixed: dòng thay thế cho d-3, d-4, d-6, d-7, d-8, thêm dòng lệch cả bài và `post_units`; tin cũ và ngưỡng là human-gate1 |
