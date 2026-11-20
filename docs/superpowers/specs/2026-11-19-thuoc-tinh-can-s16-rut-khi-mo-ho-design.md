# Rút thuộc tính khi căn S16 thành mơ hồ toà (DA48) — thiết kế

Hàng `thuoc-tinh-can-s16-rut-khi-mo-ho`, T2, không migration. Mở từ Ngoài-7 ở Cổng Bằng chứng DA40. Hàng kèm việc sửa phép đo của DA40 đỏ sau gộp.

## 1. Lỗi

`ghi()` chỉ rút phát biểu của căn còn có mặt trong lần thu mới. Căn đã có thuộc tính mà lần thu sau rơi vào nhóm mơ hồ toà thì không còn trong danh sách phát biểu, nên thuộc tính cũ vẫn sống và trang dự án vẫn hiện. Hôm nay 0 căn bị ảnh hưởng vì chưa có lần ghi nào; lỗi lộ từ lần ghi thứ hai.

## 2. Cách sửa

- `tinh()` trả thêm danh sách căn mơ hồ: căn có bí danh S16 còn sống mà mã nằm trong nhóm `mo_ho` của `v_s16_can`, hoặc mã ở hai toà trong snapshot.
- Hàm mới `rutMoHo(c, canMoHo)` rút mọi phát biểu S16 còn sống (`resource_name='Unit'`, `method='source_field'`, `evidence->>'nguon'='S16'`) của các căn đó, lý do `chuyen-mo-ho-toa`. Hàm chạy trong cùng giao dịch, trước `ghi()`.
- Chạy thử in thêm dòng `rut_mo_ho <số căn> can <số phát biểu> phat_bieu`, chỉ đếm căn còn phát biểu S16 sống, không ghi. `--ghi` in số phát biểu đã rút.
- Căn hết mơ hồ ở lần thu sau nhận lại phát biểu qua đường ghi thường.

## 3. Sửa phép đo của DA40

Ca `TTC-AC-1` trong `pipeline/tests/thuoc-tinh-can-s16.itest.mjs` đỏ sau khi DA40 gộp vì hai phép đo gắn với trạng thái nhánh:

- Đòi diff migration từ merge-base đúng bằng 113 và 118. Đổi thành: không dòng nào khác `A` trong diff `db/migrations`, tức không migration đã commit nào bị sửa.
- Đòi tập trường CHECK đúng bằng 096 cộng bốn trường. Đổi thành: CHECK chứa đủ 096 cộng bốn trường, để migration sau được thêm trường.

Mỗi phép đo có ca đỏ trên dữ liệu cấy.

## 4. Ngoài hàng này

Phát biểu của căn biến mất khỏi snapshot mà không thành mơ hồ (vắng mặt có thể chỉ do lượt thu lỗi, manifest lần thu 18/11 ghi 6.456 lượt lỗi), lỗi đọc `v_s16_can` bị nuốt (Ngoài-3, Ngoài-6 của DA40), lịch chạy tự động cho lệnh `--ghi`.
