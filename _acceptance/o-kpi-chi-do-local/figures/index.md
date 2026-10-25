# Điểm quyết định — o-kpi-chi-do-local (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Ô KPI trên cloud đọc số máy local: ba trạng thái (chưa có · tươi · cũ quá 45′) + khối lỗi | 4 nhánh | `ba-trang-thai` |
| Hỏi-1 — ô Lockdown trên cloud trước ON23 | 4 nhánh | `hoi-1-o-lockdown` |
| Bảy dòng sổ máy đã quyết | mỗi dòng 1 lựa chọn | dưới ngưỡng: 1 |

## Đề bài `ba-trang-thai`
- Loại: một nguồn → bốn nhánh hiển thị.
- Nguồn: «Bản tin máy local trên cloud» (readOpsFacts).
- Nhánh: «Chưa có bản tin» → ô «—» + một Alert «Chỉ đo ở máy local»; «Tươi ≤ 45′» → ô có số + «Số đo lúc HH:MM (giờ VN) từ máy local»; «Cũ > 45′» → Alert vàng «Máy local không đẩy số từ HH:MM», số mờ, không badge xanh; «Một nhóm số lỗi» → ô đó «—» + «Chưa có số».
- Áp cho: /ops, /ops/collections, /ops/review («N thẻ đang chờ»).
- AC liên quan: AC-1, AC-2, AC-4, AC-5, AC-6.

## Đề bài `hoi-1-o-lockdown`
- Loại: bốn lựa chọn.
- Gốc: «Ô Lockdown trên cloud hiện gì cho tới ON23?» (hiện nay: dải «Hỏng» đỏ giả vì probe chạy trên Vercel).
- A (máy khuyên, tô nhấn): «—» kèm nhãn vàng «Chưa kiểm được trên cloud» → không xanh, không đỏ giả, vẫn nhắc kiểm ở máy thu.
- B: «—» trung tính → không còn tín hiệu lockdown trên cloud tới ON23.
- C: ẩn ô → như B, lại mất chỗ cho ON23.
- D: làm ON23 trước → ON3 chờ thêm một vòng.
- AC liên quan: AC-3.
