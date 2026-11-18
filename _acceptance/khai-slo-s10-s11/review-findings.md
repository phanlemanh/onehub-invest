## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe S10 đo ở mức bản thu dù bộ nạp stg_s10_stock đã có trong base: S10 báo «fresh» cả khi lượt nạp ra 0 dòng stg**
  Người dùng thấy gì: Ô độ tươi của S10 có thể hiện «tươi» dù lượt thu gần nhất không ghi được dòng dữ liệu nào, nên người vận hành có thể tưởng nguồn này đang khoẻ khi thực ra lượt thu hỏng âm thầm.
  Căn cứ: Hậu quả vừa phải: chỉ làm một ô cảnh báo thiếu nhạy cho một nguồn, không mất hay lộ dữ liệu, và người vận hành vẫn thấy được qua kiểm tra dữ liệu khác; sửa là việc riêng, rẻ và nên làm cùng lúc với bộ nạp.
  file: `scripts/lib/freshness.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 2: fixture viết tay theo đúng khuôn bên đọc, không round-trip qua writer gom()**
  Người dùng thấy gì: Nếu sau này báo cáo ngày đổi cách viết hàng «chưa có dữ liệu», bài kiểm tự động vẫn xanh trong khi báo cáo thật có thể đỏ oan hoặc bỏ sót, nên lỗi chỉ lộ khi đọc báo cáo thật.
  Căn cứ: Nhẹ: không ảnh hưởng người dùng hiện tại, chỉ là bài kiểm có thể không bắt được lỗi trong tương lai, và còn một ca chạy trên dữ liệu thật ở máy thu bù lại phần nào.
  file: `scripts/bao-cao-ngay.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
