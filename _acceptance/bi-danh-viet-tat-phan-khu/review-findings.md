# Review findings: bi-danh-viet-tat-phan-khu (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **--do --rule <id> không kiểm id có phải lượt bí danh còn sống: id sai hay đã đảo cho số đo «tăng 0» mà không báo lỗi**
  Người dùng thấy gì: Nếu người vận hành gõ nhầm mã lượt khi đo, lệnh báo «tăng 0» và coi như thành công thay vì báo lỗi, nên có thể hiểu nhầm là việc áp không có tác dụng.
  Căn cứ: Chỉ ảnh hưởng người chạy lệnh đo bằng tay, không mất hay lộ dữ liệu, gõ lại đúng mã là xong.
  file: `pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs`
  severity: low
  Đề xuất: known-limits

- **Lệnh --kiem trên lượt đã đảo luôn báo lỗi «khong-nut» và thoát 1; nhánh «đạt (lượt đã đảo)» không bao giờ chạy tới**
  Người dùng thấy gì: Kiểm lại một lượt tên tắt đã được đảo sẽ báo lỗi và thoát 1 dù dữ liệu đã về đúng, người vận hành có thể tưởng dữ liệu hỏng.
  Căn cứ: Chỉ gây hiểu nhầm khi kiểm sau lúc đảo, dữ liệu không bị đụng, và người vận hành biết mình vừa đảo nên bỏ qua được.
  file: `pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên lớp, chỉ có điểm-case): BDV-1 không có ca «nút nghỉ là con của nút giữ lại»**
  Người dùng thấy gì: Một ca biên về nút đã nghỉ nằm dưới nút giữ lại chưa có phép thử riêng, nên nếu sau này sửa bộ chọn đích thì có thể lọt mà không bị bắt.
  Căn cứ: Là lỗ hổng phép thử chứ không phải lỗi đã xảy ra, không ảnh hưởng dữ liệu hiện tại và bổ sung sau rẻ.
  file: `pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên lớp, chỉ có điểm-case): BDV-4 chỉ thử đảo nhầm mã luật S16, thiếu mã lượt nối DA46**
  Người dùng thấy gì: Việc từ chối đảo nhầm mã lượt nối trùng DA46 chưa có phép thử riêng, nên nếu hỏng thì có thể không ai biết cho tới khi vận hành nhầm.
  Căn cứ: Chỉ là thiếu một ca thử cho thao tác đảo nhầm hiếm gặp, bổ sung sau rẻ và chưa có hỏng thật.
  file: `pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
