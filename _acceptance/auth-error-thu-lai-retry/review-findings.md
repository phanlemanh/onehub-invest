# Review findings: auth-error-thu-lai-retry (round 2)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ca «AER-AC-2 không lệnh nào đổi nghĩa» so với merge-base origin/main trên HỢP tập khoá sẽ làm đỏ CI của mọi PR sau này có thêm hoặc sửa một khoá trong _acceptance/config.yaml**
  Người dùng thấy gì: Sau khi hồ sơ này được gộp, những thay đổi sau này chỉ cần thêm hoặc sửa một lệnh kiểm trong cấu hình nghiệm thu là bị chặn nhầm, dù không làm hỏng gì. Việc này làm chậm các tính năng khác của đội, không ảnh hưởng khách dùng sản phẩm.
  Căn cứ: Không ảnh hưởng khách và không mất dữ liệu, nhưng sẽ chặn nhầm công việc của đội ở các lần gộp sau; sửa chi phí thấp, nên làm thành một việc riêng sớm.
  file: `scripts/auth-error-thu-lai-retry.test.mjs`
  severity: high
  Đề xuất: new-contract

- **Ca 'AER-AC-2 không lệnh nào đổi nghĩa' sẽ làm đỏ CI của mọi PR sau này có thêm, đổi hoặc xoá một khoá trong _acceptance/config.yaml**
  Người dùng thấy gì: Mỗi lần đội thêm, đổi hoặc xoá một lệnh kiểm trong cấu hình nghiệm thu, bước kiểm tự động sẽ báo đỏ dù thay đổi là chủ đích. Việc ra tính năng mới bị vướng, còn khách dùng không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng quy trình nội bộ, không mất dữ liệu hay hỏng trải nghiệm khách; đội gặp lỗi sẽ thấy ngay nhưng khó tự gỡ nếu không sửa phép so, nên xử lý bằng một việc riêng.
  file: `scripts/auth-error-thu-lai-retry.test.mjs`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 4 (không ghim thông điệp): chiều đỏ YAML chuẩn không kiểm thông điệp '<mã> dòng <n>' mà E2 khai là ghim (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu tệp cấu hình nghiệm thu bị hỏng cú pháp, công cụ vẫn báo lỗi nhưng không ai kiểm được dòng báo có ghi đúng mã lỗi và số dòng hay không. Người sửa có thể phải tự dò vị trí lỗi thay vì đọc thẳng từ thông báo.
  Căn cứ: Chỉ ảnh hưởng độ rõ của thông báo khi tệp cấu hình hỏng, không làm mất hay sai dữ liệu của khách; người sửa vẫn thấy lỗi xuất hiện và tự dò được, còn bổ sung phép kiểm thì rẻ nhưng không cấp bách.
  file: `scripts/auth-error-thu-lai-retry.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
