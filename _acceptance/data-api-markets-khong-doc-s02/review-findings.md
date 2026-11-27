# Review findings: data-api-markets-khong-doc-s02

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Insights trả 410 làm gãy executor chm_api (ma trận CHM-AC-7, CHM-AC-8) của hồ sơ chuyen-huong-ma-thi-truong**
  Người dùng thấy gì: Đường chỉ số theo tháng của thị trường đã được gỡ có chủ ý. Bộ kiểm của một tính năng khác (chuyển hướng mã thị trường) vẫn mong đường này còn sống nên lần chạy tới sẽ báo đỏ. Người dùng cuối không thấy gì, nhưng bộ kiểm đó sẽ chặn các lần nghiệm thu sau cho tới khi được chỉnh theo.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu, chỉ làm một bộ kiểm cũ báo đỏ; sửa sau rẻ vì chỉ là chỉnh lại bộ kiểm đó trong một việc riêng.
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4, assertion âm tính một mình: soát chữ cấm ở README và /openapi.json trong ranh.mjs không có đối chứng dương nên có thể xanh rỗng**
  Người dùng thấy gì: Phép kiểm tài liệu công khai chỉ chứng minh không có chữ cấm, chưa chứng minh nó thật sự đã đọc được các dòng cần soát. Nếu sau này tài liệu bị viết lại theo kiểu khác, phép kiểm có thể báo xanh dù không soát gì.
  Căn cứ: Hôm nay phép kiểm có soát thật nên chưa có hại nào; rủi ro chỉ là xanh giả trong tương lai và có thể thêm đối chứng sau với chi phí thấp.
  file: `_acceptance/data-api-markets-khong-doc-s02/probes/ranh.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
