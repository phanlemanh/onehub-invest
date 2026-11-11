# Review findings: dau-noi-dung-sql-bai-thu (round 2)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 5 — tuyên quét cả lớp «bản SQL chép định nghĩa bài thử» nhưng chỉ đo bốn bản chọn tay, không dò lớp ấy từ mã (r1)**
  Người dùng thấy gì: Ba script đo thử riêng lẻ trong thư mục kịch bản vẫn dùng định nghĩa bài thử cũ, chưa nhận dấu mới. Số liệu của các lệnh đo đó có thể còn lẫn bài thử của Mạnh. Số trên trang Ops và lệnh kiểm tin giả không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ: chỉ lệch số ở vài lệnh đo nội bộ chạy tay, không làm mất hay lộ dữ liệu, không ảnh hưởng người dùng cổng; khi cần có thể chạy lại sau khi sửa, và sửa sau không đắt hơn bây giờ.
  file: `pipeline/scripts/dau-bai-thu-sql.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
