# Hình tại điểm quyết định — ops-review-khung-hang-cho

| Điểm | Đếm | Hình |
|---|---|---|
| Luồng người duyệt trên khung mới (AC-1…AC-5, AC-7) | 4 bước nối tiếp (bảng → lọc → sheet → quyết) + 2 nhánh (thẻ loại lạ, route lỗi) | cần hình: `luong-hang-cho` |
| Hỏi-1 — sửa thước hồ sơ đã ký `enrich-qua-de-xuat` AC-9 theo Q9 | 2 nhánh rẽ (sửa theo Q9 / giữ độ tin cậy) | cần hình: `hoi-1-thuoc-ac9` |
| Descope: thẻ v2 → PL23; lọc theo bậc → PL23; không thao tác hàng loạt → GD10 | 1 bước mỗi điểm | dưới ngưỡng: 1 |
| `[GIẢ ĐỊNH]` cỡ hàng duyệt nhỏ → lọc phía client | 1 bước | dưới ngưỡng: 1 |

## Đề bài

### luong-hang-cho
- Loại hình: flowchart (luồng người dùng), trái → phải.
- Nút: «Thanh bên Ops › Hàng duyệt» → «Bảng hàng chờ (mặc định Chờ duyệt)» → «Lọc Loại thẻ × Trạng thái» → «Bấm hàng / Enter tên thẻ» → «Sheet chi tiết: tin A/B hoặc trường đề xuất + dải ảnh (admin)» → «Nút quyết định (route decide không đổi)» → «Bảng làm mới».
- Nhánh: từ «Lọc» → «0 thẻ: Xoá lọc»; từ «Sheet» → «Loại lạ: chưa có giao diện duyệt, không nút»; từ «Nút quyết định» → «Route lỗi: dòng lỗi trong sheet, bấm lại».
- Nhãn phụ: dải dưới cùng «Cloud: chỉ số thẻ chờ theo loại (ON3) — review_queue không lên cloud».
- AC: AC-1, AC-2, AC-3, AC-4, AC-5, AC-9.

### hoi-1-thuoc-ac9
- Loại hình: cây quyết định 2 nhánh.
- Gốc: «Ca test AC-9 của hồ sơ đã ký enrich-qua-de-xuat kiểm thẻ hiện "85%"».
- Nhánh A (máy khuyên): «Sửa theo Q9: ca kiểm VẮNG "%"» → «UI1 qua suite» → «Ghim lại enrich-qua-de-xuat sau UI1».
- Nhánh B: «Giữ độ tin cậy trên thẻ bổ sung tin» → «Trái Q9 (Mạnh 26/10)» → «Phải hỏi lại Mạnh, UI1 đứng».
- AC: AC-6.
