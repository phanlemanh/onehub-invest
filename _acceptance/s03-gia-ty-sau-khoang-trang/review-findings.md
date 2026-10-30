## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 3 (assert có mặt thay vì QUAN HỆ): dungQuanHe miễn kiểm pricePerm2Vnd, nên trường này đổi sang giá trị nào cũng lọt**
  Người dùng thấy gì: Phép so sánh dữ liệu thật hiện chỉ kiểm chắc giá của tin; giá trên mỗi m2 có thể đổi sai mà phép đo vẫn cho qua. Hôm nay không có bài thật nào dính nên người dùng chưa thấy số sai.
  Căn cứ: Hiện chưa có bài thật nào thuộc dạng này nên không có số sai nào đến tay người dùng, và phép đo vẫn bắt được lỗi ở giá chính; ghi lại hạn chế để biết thước đo yếu hơn lời hứa là đủ, sửa sau vẫn rẻ.
  file: `pipeline/scripts/so-gia-ty-sau-khoang-trang.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
