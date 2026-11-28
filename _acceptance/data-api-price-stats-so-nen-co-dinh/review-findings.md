# Review findings: data-api-price-stats-so-nen-co-dinh

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (assertion âm tính một mình): pham-vi.mjs kiểm «không gọi merge-base» mà không có đối chứng dương**
  Người dùng thấy gì: Bộ kiểm có một phép đo xác nhận bài test không còn gọi cách so cũ, nhưng chưa có ca thử chứng minh phép đo này sẽ đỏ khi lỗi xuất hiện. Nếu phép đo hỏng ngầm, nó vẫn báo xanh. Người dùng cuối không bị ảnh hưởng, chỉ là độ tin cậy của bộ kiểm nội bộ kém hơn một chút.
  Căn cứ: Hậu quả nhẹ vì chỉ ảnh hưởng độ tin cậy của một phép kiểm nội bộ, không làm mất hay lộ dữ liệu của người dùng; kết quả thật vẫn được các ca khác kiểm chéo, và bổ sung đối chứng sau này rẻ nếu cần.
  file: `_acceptance/data-api-price-stats-so-nen-co-dinh/probes/pham-vi.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
