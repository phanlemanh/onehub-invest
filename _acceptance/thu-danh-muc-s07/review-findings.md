# Review findings: thu-danh-muc-s07 (round 2)

## Trong hợp đồng

(không có finding)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 — Fixture VIẾT TAY đúng khuôn bên đọc: giá trị từng trường của S07 chỉ được đo trên HTML tự dựng, phép đo trên raw thật chỉ đếm dòng**
  Người dùng thấy gì: Dữ liệu dự án S07 nạp vào máy thu có thể có một vài cột bị trống hoặc sai trên những kiểu trang thật mà bài thử chưa mô phỏng, mà phép đo vẫn báo đạt. Một lỗi kiểu này đã xảy ra rồi (giá bị ghi nhầm vào cột diện tích) và đã được sửa.
  Căn cứ: Dữ liệu chỉ nằm ở máy thu, chưa lên cổng hay cloud và nạp lại được sau khi sửa, nên hậu quả nhẹ; ghi rõ giới hạn để người dùng dữ liệu biết kiểm các cột này, còn dựng bộ đo giá trị trên trang thật là việc riêng.
  file: `pipeline/scripts/s07-fixture.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
