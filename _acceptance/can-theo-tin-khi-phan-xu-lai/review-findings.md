# Review findings: can-theo-tin-khi-phan-xu-lai (vòng 4)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Răng E5 sẽ đỏ vĩnh viễn ngay khi 066 được áp thật vào DB oneinvest**
  Người dùng thấy gì: Sau khi bản sửa được áp thật lên dữ liệu của máy thu, phép kiểm tự động này sẽ báo lỗi mãi dù không có gì hỏng. Người dùng cuối không bị ảnh hưởng, nhưng người vận hành sẽ thấy cảnh báo sai.
  Căn cứ: Chỉ làm báo động giả cho người vận hành, không mất hay lộ dữ liệu, và chỉ xuất hiện sau bước triển khai riêng nên sửa lúc đó vẫn rẻ.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture VIẾT TAY đúng khuôn bên đọc (đối chứng dương vế (1) của răng E5)**
  Người dùng thấy gì: Phép kiểm phụ dùng dữ liệu mẫu tự viết nên có thể không phát hiện nếu cách nhận diện tin sai theo cùng một kiểu. Việc sửa căn theo tin vẫn được một bài kiểm khác dựng sát thực tế kiểm tra lại.
  Căn cứ: Rủi ro thấp vì đã có bài kiểm khác che đúng chỗ này, không ảnh hưởng dữ liệu người dùng, và nâng độ chặt sau này không tốn nhiều.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
