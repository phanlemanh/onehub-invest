## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Rào chống bỏ sót của bộ rút chỉ đếm câu INSERT ref_*; câu dựng lại CHECK *_chk nằm trong DO $$ hoặc thụt lề bị bỏ qua mà không báo**
  Người dùng thấy gì: Nếu sau này có bản cập nhật sổ từ vựng viết theo một kiểu nhất định, bộ kiểm tra có thể bỏ sót một phần mà không báo rõ. Khi đó test vẫn đỏ nhưng thông báo không nói đúng nguyên nhân, nên người sửa mất thêm công tìm.
  Căn cứ: Hậu quả nhẹ: hiện chưa xảy ra, nếu xảy ra thì test vẫn đỏ chứ không lọt lỗi âm thầm, người dùng cuối không bị ảnh hưởng, chỉ tốn thêm thời gian dò nguyên nhân.
  file: `pipeline/scripts/vocab-db.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: lời hứa «không nới assertion» là quan hệ nội dung, nhưng phép đo chỉ đếm số lời gọi assert**
  Người dùng thấy gì: Phép kiểm chứng rằng bản test sửa không bị nới lỏng chỉ đếm số lần kiểm tra chứ không so nội dung. Một lần nới lỏng âm thầm trong tương lai có thể lọt qua mà vẫn báo xanh.
  Căn cứ: Hậu quả nhẹ và chỉ ảnh hưởng nội bộ: hợp đồng chỉ hứa đếm số lần kiểm tra, người ký xem được nội dung thay đổi khi duyệt, và siết chặt hơn có thể làm thành việc riêng sau.
  file: `_acceptance/vocab-db-itest-xanh-tren-main/rang/doi-chung.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
