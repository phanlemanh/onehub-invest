# Review findings: bat-dieu-phoi-cap-du-an (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **card-plain.json xếp AC-4 vào wont_do nên bản dịch AC-4 bị bỏ, thẻ Cổng 1 hiện nguyên văn Given/When/Then**
  Người dùng thấy gì: Thẻ để người ký đọc hiện tiêu chí thứ tư bằng câu chữ kỹ thuật chưa dịch, kèm một cảnh báo thừa. Việc bật gói điều phối cho kho không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ: chỉ làm thẻ đọc kém dễ hiểu, không mất hay lộ dữ liệu, cổng đã ký xong và sửa lại sau rất rẻ.
  file: `_acceptance/bat-dieu-phoi-cap-du-an/card-plain.json`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (kèm 4): bản phá ten-goi-la chỉ đỏ ở phép so chuỗi cứng 'dieu-phoi', không chạm quan hệ «tên gói ∈ manifest» mà AC-4 tuyên đo**
  Người dùng thấy gì: Phép kiểm tên gói có trong danh mục của kho kit có thể bị lỏng đi mà bộ thử vẫn báo xanh. Hiện dữ liệu thật vẫn đúng và gói được bật bình thường, rủi ro chỉ ở lần sửa thước sau này.
  Căn cứ: Hậu quả nhẹ và không ảnh hưởng người dùng cuối: không mất hay lộ dữ liệu, cấu hình hiện tại đúng, chỉ làm thước kiểm kém chặt nếu sau này bị sửa nhầm; bổ sung bản thử sau này không tốn nhiều.
  file: `_acceptance/bat-dieu-phoi-cap-du-an/probes/settings.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
