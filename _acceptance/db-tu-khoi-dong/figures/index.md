# Hình tại điểm quyết định — db-tu-khoi-dong (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 (sổ d-…-5): bằng chứng ngưỡng sống — proxy dind + live, hay diễn tập colima thật | 2 nhánh rẽ → cần hình | `chuoi-khoi-dong.html` |
| Seal các dòng máy quyết d-1, d-3, d-4 | dưới ngưỡng: 1 bước, 0 nhánh | — |

## Đề bài: chuoi-khoi-dong

- Loại hình: luồng (flowchart) trái → phải, hai làn.
- Làn trên «máy thật»: Đăng nhập macOS → LaunchAgent colima (RunAtLoad) → VM colima → dockerd → `one-invest-db` (restart: unless-stopped trong compose). Gắn nhãn dưới mỗi nút đo bằng gì: LaunchAgent + container ← `live` chỉ đọc (AC-5); mắt xích dockerd → container ← chưa đo trên máy thật.
- Làn dưới «daemon cách ly»: container dind tạm → dockerd bên trong khởi động lại → container từ compose của cây về running (AC-3); đối chứng compose bỏ restart → exited (AC-4).
- Nhánh rẽ ở cạnh chữ «dockerd → container» của làn trên: (A) khuyên — nhận làn dưới làm bằng chứng, Mạnh diễn tập sau; (B) hẹn diễn tập colima restart thật trước Cổng Bằng chứng (DB + 14 container khác dừng ~1 phút).
- AC liên quan: AC-3, AC-4, AC-5.
