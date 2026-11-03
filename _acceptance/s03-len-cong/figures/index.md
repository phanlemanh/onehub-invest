# Hình tại điểm quyết định — s03-len-cong

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1, chặn loại hình | ba nhánh | `hoi-1-loai-hinh` |
| Hỏi-2, phường nơi khác | hai nhánh | `hoi-2-phuong-noi-khac` |
| Duyệt sổ 30 nhóm | dưới ngưỡng: một bước, gửi bảng nháp | không |
| Chín dòng sổ máy đã quyết | dưới ngưỡng: mỗi dòng một lựa chọn có căn cứ | không |

## `hoi-1-loai-hinh`
Cây quyết định, đặt câu hỏi ở gốc: «1.265 tin S03 đủ giá và diện tích, chỉ 81 có loại hình. Mở chặn bằng cách nào?».
Ba nhánh, mỗi nhánh một ô kết quả: (A, khuyến nghị) đọc từ chữ cộng suy từ nhóm → 1.041/1.265 có loại hình; đúng 93% theo chữ, 92% theo nhóm; bậc thấp hơn LLM.
(B) nới cổng cho S03 chưa rõ loại → gần hết 1.265 lên ngay; đổi nghĩa bậc B1, lọc theo loại bỏ sót. (C) chờ đọc bằng LLM → không thêm luật; phụ thuộc hàng khác, 6 USD.
Ghi nhỏ: số đếm thô 17:40Z sau lượt đêm, độ đúng đo 16:20Z, nhãn do tác tử gắn. AC liên quan: AC-4, AC-5.

## `hoi-2-phuong-noi-khac`
Cây hai nhánh. Gốc: «Nhóm khai một thị trường, chữ nêu tên phường của thị trường khác: 2 trên 1.035 tin». (A, khuyến nghị) nhận mã thị trường của nhóm → tin vẫn lên, nếu chữ đúng thì hiện sai thị trường. (B) để trống → tin mất khỏi cổng, thêm một lần đối chiếu.
AC liên quan: AC-1, AC-7.
