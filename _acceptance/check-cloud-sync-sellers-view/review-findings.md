# Review findings: check-cloud-sync-sellers-view (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): sellers ở hai DB mô phỏng do thước tự dựng thành bảng theo DDL 022, rồi lại assert đúng hình đó**
  Người dùng thấy gì: Bước kiểm đồng bộ lên cloud chỉ chứng minh việc chép từ bảng sang bảng. Nó không chạy thử đường đọc từ khung nhìn người bán thật của máy thu. Nếu đường đó hỏng riêng thì bước kiểm này vẫn báo xanh.
  Căn cứ: Hợp đồng đã chủ ý loại phần này, và đường đọc khung nhìn thật đã được đo ở hồ sơ khác, nên rủi ro cho người dùng thấp và không mất dữ liệu.
  file: `pipeline/scripts/check-cloud-sync.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): 'không ca nào in TRIGGER LA' và 'dump() ném TRIGGER LA' không có đối chứng dương**
  Người dùng thấy gì: Nếu sau này máy thu có thêm một cơ chế ghi lịch sử mới, bước kiểm có thể không báo lỗi đúng như hứa mà vẫn xanh. Người dùng cuối không bị ảnh hưởng trực tiếp, chỉ người vận hành có thể tin nhầm là bước kiểm đã quét sạch.
  Căn cứ: Đây là công cụ kiểm nội bộ chạy trên máy thu, không đụng dữ liệu người dùng, và người vận hành tự phát hiện được khi bước kiểm gãy vì phụ thuộc thiếu.
  file: `_acceptance/check-cloud-sync-sellers-view/evals.yaml`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
