# Review findings: can-gia-tot-ba-vai-ten-nguon-trong (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Mô-đun mới dựng thêm một bộ nạp và bộ soát tên nguồn thứ hai, trong khi repo đã có MỘT hàm chung (source-name-entries.mjs + findSourceNames)**
  Người dùng thấy gì: Công cụ đo ba vai của Căn giá tốt kiểm tên nguồn theo cách riêng, lỏng hơn bộ kiểm chung của hệ thống. Nếu một trang lộ tên miền của nguồn mà không lộ tên chính thức thì phép đo vẫn báo là sạch.
  Căn cứ: Đây là công cụ đo nội bộ chứ không phải trang người dùng thấy, nên không làm lộ dữ liệu ra ngoài. Bộ kiểm chung của hệ thống vẫn chặn phần còn lại, và việc gộp về một chỗ làm riêng được, nên không đáng chặn lần ship này.
  file: `scripts/can-gia-tot-ba-vai-ten-nguon.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): AC-3 đo việc nối dây của script bằng grep mã nguồn, không chạy script**
  Người dùng thấy gì: Phép kiểm việc nối dây chỉ xác nhận các dòng mã có mặt, chưa chạy thử script thật. Một bản sửa sai về hành vi vẫn có thể qua phép kiểm này.
  Căn cứ: Hậu quả nhẹ vì chỉ ảnh hưởng độ tin cậy của một công cụ đo nội bộ, không mất hay lộ dữ liệu của người dùng. Hồ sơ đã ghi giới hạn này và bước đo trọn script có thước riêng ở hồ sơ khác, nên ghi lại là đủ.
  file: `scripts/can-gia-tot-ba-vai-ten-nguon.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
