# Hình tại điểm quyết định — trang-chu-methodology (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| d-…-6 + d-…-7: lỗi rơi về ranh giới nào (trang marketing hỏng · layout hỏng/DB sập) và nút Thử lại làm gì | 2 nhánh rẽ × 3 bước (lỗi → ranh giới → khách thấy gì) | `loi-roi-ve-dau` |
| Hỏi-1: trạng thái tải trang chủ để sau hay làm luôn | dưới ngưỡng: 1 lựa chọn hai lối, không có luồng | — |
| d-…-1: redirect 301 /phuong-phap → /methodology | dưới ngưỡng: 1 bước | — |
| d-…-2..5, 8, 9: chọn block/màu/nút | dưới ngưỡng: lựa chọn tĩnh, ảnh design-pass thay hình | — |

## Đề bài `loi-roi-ve-dau`

- Loại hình: flowchart (lưu đồ ngang), 2 nhánh từ một gốc.
- Gốc: «Khách mở / hoặc /methodology».
- Nhánh A «Trang ném lỗi, layout marketing còn sống» → `(marketing)/error.tsx` → «Navbar + chân trang vẫn hiện; Alert “Không tải được dữ liệu” + Thử lại (retry: tải lại từ server)» (AC-7).
- Nhánh B «Layout ném lỗi (DB sập: layout đọc phiên + chỉ mục tìm kiếm)» → `app/global-error.tsx` → «Trang riêng <html lang=vi>; Alert “One Invest không mở được” + Thử lại + Về trang chủ» (AC-8).
- Ghi chú dưới nhánh B: «Phương án đã loại: layout nuốt lỗi DB → navbar giả như chưa đăng nhập».
