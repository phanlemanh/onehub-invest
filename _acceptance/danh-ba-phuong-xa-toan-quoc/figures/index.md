# Hình tại điểm quyết định — danh-ba-phuong-xa-toan-quoc (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1: khoảng 2.820 xã mới lên cloud/Invest | hai nhánh rẽ (cho lên / giữ ở máy thu) | cần hình — `hoi-1-len-cloud` |
| Hỏi-2: nhóm S03 chưa khai thị trường đối chiếu 4 thành phố hay 34 tỉnh | hai nhánh rẽ | cần hình — `gan-tin-theo-ten` (chung với Hỏi-3) |
| Hỏi-3: S03 nhận tên xã cũ chỉ khi gọi đích danh | hai nhánh rẽ, ba bước nối tiếp | cần hình — `gan-tin-theo-ten` |

## Đề bài `gan-tin-theo-ten`

- Loại: flowchart (luồng gán khu vực một tin, trái → phải).
- Nút: «Tin S06 (ward_name_v3, ward_name)» và «Bài S03 (chữ tự do, nhóm có/không khai thị trường)» → «Chọn tập thị trường» (S06: thị trường theo mã tin; S03 khai: thị trường đã khai; S03 chưa khai: **Hỏi-2** 4 thành phố có phường OSM — khuyến nghị — hay 34 tỉnh) → «Khớp tên xã hiện hành (danh bạ 3.321)» → khớp: «gắn xã» · không khớp → «Bí danh an toàn (xã cũ vào trọn một xã, không trùng tên hiện hành)» → S06 `ward_name`: gắn xã · S03: **Hỏi-3** chỉ khi «phường/xã/P. <tên cũ>» — khuyến nghị — hay mọi chỗ xuất hiện → không khớp/tên bị tách: «giữ cấp tỉnh (cần chọn xã)».
- AC liên quan: AC-7, AC-8, AC-9.

## Đề bài `hoi-1-len-cloud`

- Loại: luồng hai nhánh.
- Nút: «Gộp PR (code chạy được khi chưa áp 084 — AC-10)» → «Mạnh cho áp 084 + chạy bộ nạp trên máy thu (lời riêng)» → «areas: 511 → khoảng 3.330 khu vực con» → «Lượt đồng bộ cloud 15 phút» → nhánh A (khuyến nghị): «lên cloud — Invest đếm khoảng 3.300 phường, phần lớn chưa có số liệu; đảo được bằng lượt đồng bộ kế» · nhánh B: «giữ xã mới ở máy thu — phải sửa sync-cloud (vùng T3), cloud không gắn tin 30 tỉnh».
- AC liên quan: AC-10, OOS-4.
