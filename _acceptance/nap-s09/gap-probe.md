---
slug: nap-s09
at: 2026-11-14T06:45:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | AC-3, E3: ca dương kèm --may-thu không ghim URL trỏ chỗ không kết nối được; không assert DB máy thu không bị ghi | URL máy thu trần thật kèm --may-thu qua chốt, kết nối được và chèn snapshot giả vào DB máy thu mỗi lần chạy test | Ghim mọi URL của hai ca trỏ cổng đóng, ca kiểm trước cổng từ chối kết nối | fixed: AC-3 và E3 ghim cổng đóng localhost:1, mật khẩu giả, ca kiểm trước cổng từ chối kết nối |
| P1 | evals | AC-6, E6 chỉ quét dòng thêm, không quét thông điệp, tác giả, tên tệp của commit | Thông điệp commit mang tên miền thật, E6 vẫn ten_nguon=0, tên nguồn vào lịch sử công khai | Quét git log origin/main..HEAD (thông điệp, tác giả) và tên tệp đổi; đối chứng dương thông điệp giả | fixed: AC-6 thêm thông điệp, tác giả, tên tệp; E6 thêm ten_nguon_commit=0 và đối chứng dương |
| P1 | evals | E1, AC-1 lần nạp thứ hai chỉ đo ghi 0, tổng 3; không đo thoát 0, số dòng snapshot, khoá trỏ | Lần hai bộ nạp ném lỗi hay chèn thêm dòng snapshot mà tổng stg vẫn 3, E1 xanh | Sau lần hai: không lỗi, airbnb_snapshots đúng 1 dòng, mọi dòng stg trỏ đúng snapshot_id | fixed: AC-1 và E1 thêm ba điều kiện sau lần hai |
| P2 | evals | E4 không kiểm bản chép chưa có dòng S09; «không ghi DB máy thu» chưa có thước | Máy thu đã nạp trước lượt chấm thì lần một in 0/345, E4 đỏ giả; script trỏ nhầm DB gốc không ai bắt | Đếm dòng S09 trong bản chép trước lần một, thoát 3 riêng; đếm stg_s09_item máy thu trước, sau bằng nhau | fixed: E4 thêm thoát 3 «đã nạp sẵn» và so số dòng máy thu trước/sau |
| P2 | contract | Vùng của AC-6 thiếu pipeline/scripts/nap-s09* mà sổ d-4 đã mở | E6 làm đúng chữ AC-6 thì hai script đo bị đếm ngoài vùng; hoặc thước nới vùng lệch AC đã duyệt | Sửa AC-6 liệt vùng; E6 ghim vùng đúng chữ AC-6; tệp giả pipeline/scripts/khac.mjs đếm 1 | fixed: AC-6 liệt đủ vùng; E6 ghim vùng bằng chữ AC-6, tệp giả khac.mjs đếm 1 |
