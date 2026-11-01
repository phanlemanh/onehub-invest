# Review findings: reconcile-tin-con-anh (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Test cần DB local đặt tên .test.mjs thay vì .itest.mjs, nên lọt vào glob `npm test` thuần**
  Người dùng thấy gì: Bộ test chạy nhanh trên máy giờ có thêm một bài cần cơ sở dữ liệu máy thu. Khi cơ sở dữ liệu đang bận do lượt chạy đêm hoặc ZCode, bộ test này có thể treo lâu. Tính năng đối chiếu tin còn ảnh vẫn chạy đúng.
  Căn cứ: Hậu quả nhẹ: chỉ làm chậm hoặc treo lệnh test trên máy phát triển, không mất hay lộ dữ liệu, chạy lại là được, và đổi tên tệp sau này rất rẻ.
  file: `pipeline/scripts/nap-lai-ba-luot-fk.test.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
