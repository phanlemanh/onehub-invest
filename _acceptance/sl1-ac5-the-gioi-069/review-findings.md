## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe tu-choi-oneinvest: đối số $1 đường dẫn tương đối bị phân giải theo pipeline/ thay vì thư mục người gọi**
  Người dùng thấy gì: Công cụ kiểm tra phụ có thể báo đỏ vì không tìm thấy tệp khi chạy từ thư mục khác, chứ không phải vì chốt từ chối thật sự hỏng. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là công cụ kiểm tra nội bộ, hậu quả nhẹ, không mất hay lộ dữ liệu, người chạy thấy ngay và chạy lại đúng thư mục là xong.
  file: `_acceptance/sl1-ac5-the-gioi-069/probes/tu-choi-oneinvest.sh`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
