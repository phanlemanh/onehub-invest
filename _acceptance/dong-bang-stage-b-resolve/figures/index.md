# Hình tại Cổng Phạm vi — dong-bang-stage-b-resolve

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 — 7 thẻ Ghép căn đang chờ | 3 nhánh | `hoi-1-the-cho.html` |
| Hỏi-2 — có báo đóng băng trên trang không | 2 nhánh | gộp vào `hoi-1-the-cho.html` (khối dưới) |
| L1–L4 (máy đã quyết) | 1 lối | dưới ngưỡng: 1 nhánh |

## Đề bài `hoi-1-the-cho`

- Loại: cây quyết định ngang, hai khối xếp dọc.
- Khối trên «Hỏi-1 · 7 thẻ Ghép căn đang chờ (duyệt không gắn tin vào căn nào)» → ba nhánh:
  (A, khuyên) «Ẩn khỏi hàng chờ và mọi số đếm chờ — giữ trong DB, thẻ đã quyết vẫn xem được» · giá «đổi mồi 5 tệp test»;
  (B) «Để nguyên trong hàng chờ, chỉ dừng sinh thẻ mới» · giá «Quá 3 ngày mãi cộng 7, duyệt vẫn không ghi gì»;
  (C) «Máy đóng 7 thẻ bằng một lượt ghi» · giá «quyết định không do người (luật 7)».
- Khối dưới «Hỏi-2 · báo trên /ops/review?» → hai nhánh: (A, khuyên) «Không thêm chữ — ghi ở ROADMAP» · giá «người mới không
  biết vì sao trống»; (B) «Thêm một Alert "Ghép căn đã đóng băng"» · giá «thêm design-pass + chấm ảnh».
- AC liên quan: AC-3, AC-4, AC-5 (Hỏi-1); Notes của hợp đồng (Hỏi-2).
