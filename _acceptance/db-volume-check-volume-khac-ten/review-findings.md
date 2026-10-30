# Review findings: db-volume-check-volume-khac-ten (round 1)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chú thích executor db_volume_mutation trong config.yaml đã lỗi thời: suite mutation giờ cần one-invest-db đang chạy**
  Người dùng thấy gì: Ghi chú trong cấu hình nói bộ kiểm đột biến chỉ cần compose, nhưng thực tế giờ cần DB local đang chạy. Người chạy ghim lại hoặc CI khi tắt DB sẽ thấy đỏ mà không được báo trước điều kiện này.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, chỉ gây bối rối cho người chạy; họ tự gỡ được bằng cách bật DB rồi chạy lại. Sửa sau rẻ, chỉ là một dòng chú thích, và đã được duyệt là không chạm tệp cấu hình trong vòng này.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
