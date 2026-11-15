## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (thiếu đối chứng cho chính bộ dựng được sửa): withTx của CGT không có cặp hai chiều riêng, đối chứng ở tệp khác dựng giao dịch bằng một hàm khác**
  Người dùng thấy gì: Bộ test của tính năng giá tốt theo căn vẫn xanh trên DB máy thu, nhưng nếu ai đó vô tình gỡ phần dựng tiền đề thì không có phép thử riêng nào báo đỏ ngay. Người dùng cuối không bị ảnh hưởng, chỉ là lưới an toàn khi sửa test sau này mỏng hơn.
  Căn cứ: Chỉ ảnh hưởng độ chặt của kiểm thử nội bộ, không làm mất hay lộ dữ liệu người dùng; tự phát hiện được khi chạy trên DB máy thu, và bổ sung đối chứng sau này rẻ.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
