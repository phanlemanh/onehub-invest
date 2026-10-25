# Hình tại điểm quyết định — login-kiem-id (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| d-…-1 bước kiểm dùng chung + d-…-4 400 cho lỗi bước kiểm | 4 bước nối tiếp (nhận id → đọc config → kiểm → spawn + chờ QR) + 2 nhánh rẽ (kiểm sai → 400; phiên đang chạy → trả QR cũ) | `thu-tu-dang-nhap` |
| d-…-2 cho qua «default» | dưới ngưỡng: 1 điều kiện | — |
| d-…-8 (thay d-…-3) thư mục QR từ env | dưới ngưỡng: 1 bước | — |
| d-…-5/6/7 descope | dưới ngưỡng: không luồng | — |

## Đề bài `thu-tu-dang-nhap`

- Loại hình: luồng (flowchart) hai cột «Trước» / «Sau» cho `POST /api/v1/ops/zalo/login`.
- Trước: nhận accountId → chỉ chặn rỗng → có phiên đang chạy? (có: trả QR cũ) → **spawn openclaw channels login** → chờ QR ở /tmp/openclaw tới 20 giây → 200; mọi lỗi → 500.
- Sau: nhận accountId nguyên văn → đọc openclaw.json → bước kiểm dùng chung (không rỗng · không khoảng trắng · không mở đầu «-» · «default» luôn cho qua · có trong danh sách) → sai: 400, openclaw không được gọi → đúng: có phiên đang chạy? (có: trả QR cũ) → spawn openclaw channels login → chờ QR ở thư mục QR (mặc định /tmp/openclaw) → 200.
- Ghi chú phụ dưới cột Sau: bước kiểm dùng chung với việc gỡ tài khoản (ON14), thông điệp giữ nguyên.
- Nhãn bằng chữ tiếng Việt; tô nổi chỗ bước kiểm chen vào TRƯỚC nhánh «phiên đang chạy».
- AC liên quan: AC-1…AC-6, AC-10.
