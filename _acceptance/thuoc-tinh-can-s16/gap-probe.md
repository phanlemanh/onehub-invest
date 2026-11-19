---
slug: thuoc-tinh-can-s16
at: 2026-11-18T02:10:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Shophouse (5 mã, 7.111 khoá) xếp commercial do máy tự quyết trong khi Q7 còn chờ; sổ không có dòng | Người duyệt tưởng luật đã chốt; nếu Q7 chốt mã local thì rút khoảng 7 nghìn phát biểu fact | Dòng sổ chi-nguoi Hỏi-4 + ô ma trận AC-3 ghim nhánh người chọn | human-gate1: thêm Hỏi-4 (khuyến nghị commercial, lối khác chờ Q7); AC-3 và E3 ghim nhánh Mạnh chọn |
| P1 | evals | Không eval nào so đầu ra cuối với số từ tệp thu gốc; E13 chỉ so stg với stg; E3 nói round-trip mà bộ ghi thật chưa có; E14 hỏi điều ngoài inputs | Bộ nạp làn thu ánh xạ sai cột → chạy thử và số thật lệch như nhau, E13/E14 vẫn xanh | Cột thứ tư «bảng phủ ca §1» trong E13; bỏ vế «sửa cho khớp» của E14 | fixed: E13 thêm cột bảng phủ ca §1 (ngưỡng lệch 0 khi manifest là lượt 18/11); E3 khai khuôn migration 113 thay vì round-trip, giới hạn ghi ở Notes; E14 hỏi «ô lệch có dòng dừng-và-báo» trên chính ap-may-thu.md |
| P1 | design | Dòng sổ giá trích câu ADR không quyết «không phát biểu + chỉ snapshot mới nhất», trái ý lịch sử giá | Người duyệt tin ADR đã quyết thiết kế giá; DA41 phải làm lại | Viết lại dòng sổ với nguồn đúng | fixed: dòng mới mot-loi supersedes dòng cũ; design §4.4 nói rõ stg giữ mọi snapshot, lịch sử giá theo căn dựng ở DA41/hàng sau |
| P1 | design | Chưa định nghĩa khoá nối nút ↔ dự án S16; AC hứa ô N cho royal-island vốn chưa nối | Trang royal-island không có cách nối → AC-11 fail hoặc bị nới tay | Design §7 nêu khoá nối + số thật; eval dùng đúng đường ấy | fixed: tập du_an của nút lấy từ bí danh S16 của toà thuộc nút (qua v_toa_nut_vung); AC-10/11, E12 đổi mẫu sang ocean-park-3 (820 chưa căn); bốn dự án chưa nối hiện «Chưa có nguồn thuộc tính căn», số chỉ ở lệnh chạy thử |
| P1 | evals | Trạng thái tải và lỗi nội tuyến của AC-9 không eval nào đo | Lớp đọc ném lỗi → trang 500, mọi eval vẫn xanh | Ca đột biến lỗi trong E9 + hai bước chụp E10 | fixed: E9 thêm ca lỗi (route 200, lưới còn, Alert «Thử lại», đỏ khi bỏ khối bắt lỗi); E10 thêm step5 (tải) và step6 (lỗi) |
