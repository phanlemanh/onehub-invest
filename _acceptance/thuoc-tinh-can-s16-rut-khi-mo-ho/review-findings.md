## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chạy thử báo «rut_mo_ho 0» sai khi đọc v_s16_can lỗi, vì lỗi bị nuốt**
  Người dùng thấy gì: Khi nguồn dữ liệu căn bị lỗi lúc chạy thử, lệnh vẫn báo «không có căn nào cần rút» thay vì báo lỗi. Người vận hành có thể tin nhầm là mọi thứ ổn trước khi áp thật.
  Căn cứ: Hậu quả nhẹ và đã được ghi là ngoài phạm vi từ trước; lúc chạy ghi thật lệnh vẫn báo đỏ nên không mất hay lộ dữ liệu, và có thể chạy thử lại để kiểm.
  file: `pipeline/scripts/thuoc-tinh-can-s16.mjs`
  severity: low
  Đề xuất: known-limits

- **Phép đo can_mo_ho_doc_dung của that.mjs bỏ qua nhánh nhieu_toa của lệnh, có thể báo LỆCH sai**
  Người dùng thấy gì: Phép kiểm số liệu thật có thể báo lệch nhầm trong một tình huống hiếm, làm người duyệt tưởng lệnh sai trong khi lệnh đúng. Người dùng cuối không thấy ảnh hưởng gì.
  Căn cứ: Chỉ ảnh hưởng công cụ kiểm tra nội bộ, không động tới dữ liệu hay trang người dùng; nếu báo lệch nhầm thì kiểm lại là rõ, và sửa sau không tốn kém.
  file: `_acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4, assertion âm tính một mình: chiều đỏ RMH-AC-3 chỉ có doesNotMatch, không có đối chứng dương và không ghim thông điệp**
  Người dùng thấy gì: Một ca kiểm tự động có thể vẫn xanh dù lệnh bị hỏng hẳn theo kiểu nhất định, nên có thể bỏ sót một lỗi chạy lại sai. Hành vi thật cho người dùng không đổi.
  Căn cứ: Các ca kiểm khác của cùng tính năng vẫn chặn được hướng lỗi này; chỉ là lớp bảo vệ mỏng đi một chỗ, không mất dữ liệu, và siết lại về sau rẻ.
  file: `pipeline/tests/thuoc-tinh-can-s16-rut.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1, đo chỉ dẫn thay vì đầu ra: E8 hứa đo dòng in của lệnh chạy thử nhưng probe chỉ gọi hàm demMoHo**
  Người dùng thấy gì: Phép kiểm trên máy thu đo phần đếm bên trong chứ không đo đúng dòng chữ lệnh in ra, nên chỗ nối giữa hai phần chưa được kiểm trực tiếp. Người dùng không thấy ảnh hưởng.
  Căn cứ: Nguy cơ thấp vì phần đếm đã được đo và số chạy thử vẫn đọc được bằng mắt; không mất dữ liệu, và có thể bổ sung phép đo trực tiếp sau với chi phí nhỏ.
  file: `_acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/that.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
