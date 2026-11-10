# Review findings: s03-len-nhanh-nac-1 (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **BỎ LƯỢT dựa trên giả định «ba bước một giao dịch, lùi trọn», nhưng refresh-bait-gap ở cây này không chạy trong một giao dịch**
  Người dùng thấy gì: Khi lượt nạp nhanh đụng khoá đúng lúc đang tính lại chỉ số chênh giá, một số tin có thể tạm mất chỉ số này cho tới lượt tính lại kế tiếp, trong khi hệ thống chỉ báo là bỏ lượt.
  Căn cứ: Hậu quả nhẹ và tự hồi phục ở lượt chạy sau, không mất dữ liệu gốc; hàng riêng đã nhận việc sửa nên chỉ cần ghi rõ thứ tự gộp.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: known-limits

- **Khoá cloud-sync-do.lock bị giành khi tệp pid chưa kịp ghi, lệch khuôn go_khoa_cu đang có**
  Người dùng thấy gì: Hiếm khi hai lượt đo có thể chạy chồng nhau nếu cùng khởi động trong cùng một khoảnh khắc, làm số đo bị ghi hai lần.
  Căn cứ: Khe thời gian rất hẹp, hậu quả chỉ là chạy trùng việc đo chứ không mất dữ liệu, và lượt sau tự chạy lại bình thường.
  file: `scripts/cloud-sync-do.sh`
  severity: low
  Đề xuất: known-limits

- **Khoá đo cloud-sync-do.lock có khe đua: thư mục khoá chưa có tệp pid bị bên kia coi là khoá chết, xoá đi rồi chiếm lại**
  Người dùng thấy gì: Hiếm khi lượt đồng bộ và job đo hằng giờ có thể cùng chạy bảy bước đo một lúc, khiến số đo bị tính trùng.
  Căn cứ: Khe chỉ vài micro giây và đồng bộ chạm khoá sau nhiều bước mạng, nên khó xảy ra; nếu xảy ra thì chạy lại là xong, không mất dữ liệu.
  file: `scripts/cloud-sync.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): chiều đỏ SK-AC-3 chỉ ghim «chưa xong trong 20 s», không đối chứng dương nên không phân biệt được «treo sau khoá» với «chạy chậm»**
  Người dùng thấy gì: Bài kiểm tra việc bỏ lượt khi bị khoá có thể vẫn báo xanh dù cơ chế giới hạn thời gian chờ khoá hỏng, nên một lỗi treo lượt nạp có thể lọt qua mà không ai biết.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp lúc này, chỉ giảm độ tin cậy của phép kiểm; bổ sung đối chứng sau này rẻ và không gấp.
  file: `scripts/zalo-import-job-khoa.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): «sale_offers S03 không đổi» không có ca đối chứng cho thấy số đếm sẽ đổi khi transform chạy trọn**
  Người dùng thấy gì: Phép kiểm khẳng định lượt bị bỏ không ghi gì có thể xanh ngay cả khi lượt đó thực ra đã chạy trọn, nên không chứng minh được lời hứa không ghi dữ liệu.
  Căn cứ: Rủi ro thấp, chỉ làm bằng chứng yếu hơn mức mong muốn; không gây mất dữ liệu và có thể gia cố sau mà không ảnh hưởng người dùng.
  file: `scripts/zalo-import-job-khoa.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

