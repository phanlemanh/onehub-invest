# Hình tại điểm quyết định — thang-bac-moi-b0-b5

| Điểm | Đếm | Hình |
|---|---|---|
| Đơn vị đếm bậc: tin hay căn, cụm không cho bậc (d-…-4) | 2 nhánh rẽ (gắn căn / chưa) × 3 bậc mỗi nhánh | `thang-bac-don-vi` |
| Đổi thang: DO1 lập mốc lại hay ghi dòng chuyển (d-…-5) | 2 nhánh rẽ (thang khác / cùng thang), 3 bước nối tiếp | `thang-bac-don-vi` (khung dưới) |
| Vị từ chờ bảng nối (d-…-2) | dưới ngưỡng: 1 bước | — |
| Kiểu tham số offer_data_level (d-…-3) | dưới ngưỡng: 1 bước | — |
| B4 không cần căn verified (d-…-6) | dưới ngưỡng: 1 điều kiện | — |
| checkDb đọc CHECK danh sách (d-…-7) | dưới ngưỡng: 1 bước | — |
| Bỏ design-pass (Hỏi-1) | dưới ngưỡng: có/không | — |

## Đề bài `thang-bac-don-vi`

Loại: lưu đồ hai khung. Khung trên «Một tin S03/S05/S06 được xếp bậc»: thiếu trường lõi → B0 (đơn vị Tin) · đủ → B1 Tin ·
đã định vị (danh bạ) → B2 Định vị · khớp một căn của danh bạ → chuyển sang đơn vị Căn: B3 Gắn căn → B4 Làm giàu (mọi trường
đo hoặc sự thật) → B5 Sống (đang chào, tươi, hai mốc giá). Nhánh phụ chấm: «Nằm trong cụm properties» → không đổi bậc
(mũi tên về B1). Ghi chú: hôm nay B2 trở lên = 0 (chưa có bảng nối). Khung dưới «DO1 mỗi ngày»: data_level_unit có thang
khác thang hiện hành? → Có: lập mốc lại, không ghi dòng chuyển, dòng do1 ly_do doi-thang → /ops/quality hiện «Thang bậc
08/11 áp từ <ngày>» · Không: ghi dòng chuyển như cũ. AC: AC-2, AC-3, AC-4, AC-5, AC-7.
