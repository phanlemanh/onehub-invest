# Review findings — sua-xa-bo-nut-ung-vien (round 1)

## Trong hợp đồng

(không có finding)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **JSDoc của suaXaNut bị tách khỏi hàm và còn ghi luật cũ «khớp một-một với mọi nút dự án»**
  Người dùng thấy gì: Chú thích trong mã mô tả lệnh sửa mã xã vẫn ghi luật cũ và nằm lệch chỗ. Người dùng không thấy gì khác, lệnh chạy đúng như hợp đồng.
  Căn cứ: Chỉ là chú thích cho người đọc mã, không ảnh hưởng dữ liệu hay kết quả chạy, nhẹ và sửa sau lúc nào cũng được; hơn nữa tệp này đang bị việc khác sửa chung nên chạm vào dễ gây xung đột.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
