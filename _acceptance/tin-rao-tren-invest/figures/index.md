# Điểm quyết định, ngưỡng N5

| Điểm | Đếm | Hình |
|---|---|---|
| Thứ tự ra thật (khó-đảo) | 5 bước nối tiếp | `thu-tu-ra-that` |
| Cách lấy số | 3 nhánh | `cach-lay-so` |
| Mở hai cột | 1 bước, 2 nhánh | dưới ngưỡng: 1 |
| Giới hạn tần suất | 3 nhánh, đã nằm trong hình cách lấy số | `cach-lay-so` |
| Ra mắt khi thiếu số | 2 nhánh | `ra-mat-thieu-so` |
| Loại tin mặc định | 2 nhánh, đảo một dòng | dưới ngưỡng: đổi một dòng |
| Giá phi lý | 2 nhánh | dưới ngưỡng: đã có bảng số trên thẻ |
| API và MCP công khai | 2 nhánh | dưới ngưỡng: 1 |
| Hai ngưỡng | hằng số | dưới ngưỡng: 0 |

## Đề bài

**thu-tu-ra-that** · loại flowchart ngang · năm nút: 1 Bật tường lửa, thử vượt ngưỡng nhận 429 (Mạnh) → 2 Gộp PR (máy) → 3 Kéo về checkout chính (máy) → 4 Chạy catch-up lên Supabase (Mạnh) → 5 Kích sync, số lên cổng (Mạnh). Ghi chú hai rẽ sai: gộp trước bước 1: gói không chặn được thì Bán lỗi nhiều ngày; áp trước bước 3: sync cũ dừng ở cổng cột. Giữa 2 và 4: Bán, Thuê dài hạn báo lỗi vài phút, Thuê ngắn hạn vẫn chạy. AC-3.

**cach-lay-so** · cây quyết định ba nhánh từ gốc «Người mua muốn lấy số»: A Một lần bấm, không đăng nhập (khuyên): nhanh nhất có bước chặn; danh sách không mang số; dựa vào tường lửa. B Hiện sẵn trên thẻ: nhanh hơn một chạm; một lần tải trang lấy hết số. C Đòi đăng nhập hay xác minh SMS: khó cào nhất; mất khách vãng lai. AC-5, AC-9.

**ra-mat-thieu-so** · hai nhánh từ «05/11, S06 chưa có số»: A Vẫn ra (khuyên): 39.823 tin S06 hiện Chưa có số, 3 tin có số, bộ lọc Chỉ tin có số; số về tới đâu cổng tự hiện. B Chờ rồi mới áp: trải nghiệm đầu tốt hơn; mốc 05/11 phụ thuộc làn thu.
