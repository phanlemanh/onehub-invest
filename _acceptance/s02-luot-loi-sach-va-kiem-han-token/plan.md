# s02-luot-loi-sach-va-kiem-han-token — kế hoạch (S2, T2)

Hàng tích hợp: mã thu đã có sẵn trên hai nhánh ZCode, gộp ở `fda1381cc` (không xung đột). Claude không sửa logic thu.

| Việc | Tệp | Phục vụ | independent |
|---|---|---|---|
| 1. Gộp `zcode/s02-luot-loi-sach` @0dc032fab và `zcode/s02-apptoken-het-han` @b49971757 vào nhánh từ `origin/main` | 5 tệp collector | E6, E7 | — (đã làm) |
| 2. Phép đo phía người đọc (script đêm S02 dừng, `SNAP=` chọn bản tốt, không xoá bản thu cũ) | `probes/nguoi-doc.mjs` | E3, E8 | true |
| 3. Đột biến ma trận kiểm hạn token | `probes/dot-bien-han.mjs` | E4 | true |
| 4. Đo tĩnh đường nối kiểm hạn + dòng AUTH FAIL, bốn chiều đỏ | `probes/noi-day.sh` | E2, E5 | true |
| 5. Đo vùng tệp đổi | `probes/vung.sh` | E6 | true |

Verify mỗi việc: chạy chính probe đó cả hai chiều (đã chạy ở S1, xanh và đỏ đúng chỗ). Không còn mã nào phải viết ở S3.
