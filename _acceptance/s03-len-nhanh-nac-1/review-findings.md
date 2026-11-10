## Trong hợp đồng

- **Hình dạng 4 (assertion âm tính một mình): «sale_offers S03 sau bằng trước» không có đối chứng dương cho thấy số đếm có thể đổi**
  file: `scripts/zalo-import-job-khoa.itest.mjs:84`
  severity: medium
  AC: AC-3
  source: measurement
  detail: Dòng 84 `assert.equal(await demS03(C), truoc, …)` là bằng chứng duy nhất cho lời hứa «lùi trọn, không ghi dở». Cây tạm có collector/snapshots rỗng (dòng 38), nên lượt không nạp gì mới. transform-zalo chạy trên bản chép DB đã transform sẵn, nên số dòng sale_offers S03 rất có thể giữ nguyên cả khi transform-zalo chạy xong trọn vẹn. Đối chứng không khoá (dòng 87–93) không đo số đếm này. Đẳng thức trước/sau vì thế xanh cả khi có lẫn không có rollback, nên không phân biệt được hành vi được hứa. AC-3 hứa số dòng sale_offers S03 không đổi khi bị khoá; phép so trước/sau xanh cả khi không có lùi trọn nên không chứng minh được vế này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khoá cloud-sync-do.lock không có giới hạn tuổi: khi PID cũ bị dùng lại, cả job giờ lẫn cloud-sync bỏ bảy bước đo mãi mãi mà vẫn thoát 0**
  Người dùng thấy gì: Hiếm khi, sau một lần mất điện hay máy bị tắt đột ngột, các số đo hằng giờ có thể ngừng chạy lặng lẽ mà không có cảnh báo nào, nên số liệu vận hành cũ dần.
  Căn cứ: Chỉ xảy ra khi máy chết đúng lúc đang đo rồi trùng mã tiến trình; không mất dữ liệu người dùng, chỉ các số đo nội bộ đứng yên, và gỡ tay khoá là chạy lại ngay.
  file: `scripts/cloud-sync-do.sh`
  severity: low
  Đề xuất: known-limits

- **BỎ LƯỢT dựa trên giả định «ba bước một giao dịch, lùi trọn», nhưng refresh-bait-gap ở cây này không chạy trong một giao dịch (r1)**
  Người dùng thấy gì: Khi lượt nạp nhanh đụng khoá đúng lúc đang tính lại chỉ số chênh giá, một số tin có thể tạm mất chỉ số này cho tới lượt tính lại kế tiếp, trong khi hệ thống chỉ báo là bỏ lượt.
  Căn cứ: Hậu quả nhẹ và tự hồi phục ở lượt chạy sau, không mất dữ liệu gốc; hàng riêng đã nhận việc sửa nên chỉ cần ghi rõ thứ tự gộp.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: known-limits

- **Khoá cloud-sync-do.lock bị giành khi tệp pid chưa kịp ghi, lệch khuôn go_khoa_cu đang có (r1)**
  Người dùng thấy gì: Hiếm khi hai lượt đo có thể chạy chồng nhau nếu cùng khởi động trong cùng một khoảnh khắc, làm số đo bị ghi hai lần.
  Căn cứ: Khe thời gian rất hẹp, hậu quả chỉ là chạy trùng việc đo chứ không mất dữ liệu, và lượt sau tự chạy lại bình thường.
  file: `scripts/cloud-sync-do.sh`
  severity: low
  Đề xuất: known-limits

- **Khoá đo cloud-sync-do.lock có khe đua: thư mục khoá chưa có tệp pid bị bên kia coi là khoá chết, xoá đi rồi chiếm lại (r1)**
  Người dùng thấy gì: Hiếm khi lượt đồng bộ và job đo hằng giờ có thể cùng chạy bảy bước đo một lúc, khiến số đo bị tính trùng.
  Căn cứ: Khe chỉ vài micro giây và đồng bộ chạm khoá sau nhiều bước mạng, nên khó xảy ra; nếu xảy ra thì chạy lại là xong, không mất dữ liệu.
  file: `scripts/cloud-sync.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): chiều đỏ SK-AC-3 chỉ ghim «chưa xong trong 20 s», không đối chứng dương nên không phân biệt được «treo sau khoá» với «chạy chậm» (r1)**
  Người dùng thấy gì: Bài kiểm tra việc bỏ lượt khi bị khoá có thể vẫn báo xanh dù cơ chế giới hạn thời gian chờ khoá hỏng, nên một lỗi treo lượt nạp có thể lọt qua mà không ai biết.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp lúc này, chỉ giảm độ tin cậy của phép kiểm; bổ sung đối chứng sau này rẻ và không gấp.
  file: `scripts/zalo-import-job-khoa.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): «sale_offers S03 không đổi» không có ca đối chứng cho thấy số đếm sẽ đổi khi transform chạy trọn (r1)**
  Người dùng thấy gì: Phép kiểm khẳng định lượt bị bỏ không ghi gì có thể xanh ngay cả khi lượt đó thực ra đã chạy trọn, nên không chứng minh được lời hứa không ghi dữ liệu.
  Căn cứ: Rủi ro thấp, chỉ làm bằng chứng yếu hơn mức mong muốn; không gây mất dữ liệu và có thể gia cố sau mà không ảnh hưởng người dùng.
  file: `scripts/zalo-import-job-khoa.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

