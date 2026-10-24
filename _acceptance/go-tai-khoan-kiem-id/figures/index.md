# Hình tại điểm quyết định — go-tai-khoan-kiem-id (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| d-…-1 bước kiểm id trong thư viện, trước logout | 4 bước nối tiếp (đọc config → kiểm → logout → gỡ config) + 1 nhánh rẽ (kiểm sai → 400) | `thu-tu-go-tai-khoan` |
| d-…-2 không cắt khoảng trắng | dưới ngưỡng: 1 bước | — |
| d-…-8 (thay d-…-3) bỏ khuôn SLUG, chặn «-» đầu + thành viên | dưới ngưỡng: điều kiện song song, 1 lối ra | — |
| d-…-4 DATABASE_URL cổng đóng trong test | dưới ngưỡng: 1 bước | — |
| d-…-5/6/7 descope | dưới ngưỡng: không luồng | — |

## Đề bài `thu-tu-go-tai-khoan`

- Loại hình: luồng (flowchart) hai cột «Trước» / «Sau» cho `DELETE /api/v1/ops/zalo/accounts`.
- Trước: nhận id → cắt khoảng trắng → chặn "default" → **chạy openclaw logout** → đọc config → id không có thì trả ok lặng.
- Sau: nhận id nguyên văn → đọc openclaw.json → bước kiểm (không rỗng · không khoảng trắng · không mở đầu bằng «-» · khác default · có trong danh sách) → sai: 400, openclaw không được gọi → đúng: openclaw logout → gỡ khỏi config (+ .bak) → 200.
- Nhãn bằng chữ tiếng Việt; tô nổi chỗ logout đổi vị trí.
- AC liên quan: AC-1, AC-2, AC-3, AC-4, AC-5.
