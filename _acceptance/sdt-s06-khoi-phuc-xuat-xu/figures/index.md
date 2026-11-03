# Hình tại điểm quyết định — sdt-s06-khoi-phuc-xuat-xu

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1: khôi phục từ stg hay kiểm trước trong transform | 5 bước nối tiếp, 2 nhánh rẽ | `hoi-1-hai-huong` |
| Không thêm cột xuất xứ riêng | 1 bước | dưới ngưỡng: 1 bước |
| Hàm mất phần giữ thì bộ gán vẫn dừng | 1 nhánh | dưới ngưỡng: 1 nhánh |
| Giả lập migration ghi đè bằng bản trước 068 | 1 bước | dưới ngưỡng: 1 bước |

## Đề bài `hoi-1-hai-huong`

Loại hình: luồng có rẽ nhánh, đọc được trong 10 giây bởi người quyết sản phẩm, không thuật ngữ mã.
Nút dòng chính: «Migration sau ghi đè hàm phân xử» → «Lượt phân xử xoá dấu nguồn gốc của số» → «Áp lại 068: dấu không tự về» → «Tin chuyển sang ẩn số» → «Tin ẩn vẫn giữ số ghép, không ai biết» (nút lỗi).
Hai nhánh: A «Kiểm trước trong lượt S06»: chặn được ở bước xoá khi lượt S06 gọi; ba lệnh công cụ và duyệt enrich vẫn xoá, dấu đã mất không về. B «Dựng lại dấu từ stg» (máy khuyên): sau bước áp lại, số khớp stg được dựng lại dấu, tin ẩn bị rút số; số không khớp giữ nguyên và được đếm.
AC liên quan: AC-1, AC-2, AC-6.
