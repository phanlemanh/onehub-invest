# Review findings: suite-scripts-vao-luot-cham (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **DB oneinvest_ci_scripts_<pid> mồ côi khi lệnh bị SIGKILL, không có bước quét như pattern db-thu.sh**
  Người dùng thấy gì: Nếu lượt chạy thử bị giết cứng giữa chừng, một cơ sở dữ liệu tạm nằm lại trên máy dùng chung và chiếm chỗ cho tới khi ai đó xoá tay.
  Căn cứ: Chỉ xảy ra khi tiến trình bị giết cứng, hiếm; dữ liệu thật không bị đụng, chỉ tốn chỗ và người vận hành xoá tay được.
  file: `scripts/suite-neu-doi.mjs`
  severity: medium
  Đề xuất: known-limits

- **Bước CI chạy bằng `bash -eo pipefail`, khác shell mặc định của GitHub (`bash -e`), mà ma trận vẫn ghi «tương đương: nguyên văn»**
  Người dùng thấy gì: Lượt chạy thử tại máy có thể nghiêm hơn CI một chút ở các bước có ống nối lệnh, nên hiếm khi báo đỏ ở máy mà CI vẫn xanh.
  Căn cứ: Sai khác này chỉ làm máy chặt hơn CI, không làm lọt lỗi; hậu quả nhẹ và ghi lại như giới hạn đã biết là đủ.
  file: `scripts/suite-neu-doi.mjs`
  severity: low
  Đề xuất: known-limits

- **Bước chạy detached: SIGHUP (đóng terminal hay phiên) để node --test mồ côi và DB oneinvest_ci_scripts_<pid> không bao giờ bị xoá**
  Người dùng thấy gì: Nếu đóng cửa sổ terminal hay phiên khi lượt chạy thử đang chạy, bài test có thể vẫn chạy ngầm và để lại cơ sở dữ liệu tạm trên máy dùng chung.
  Căn cứ: Chỉ xảy ra khi đóng phiên giữa lượt chạy, không mất dữ liệu thật; người vận hành dừng tiến trình và xoá cơ sở dữ liệu tạm bằng tay được.
  file: `scripts/suite-neu-doi.mjs`
  severity: medium
  Đề xuất: known-limits

- **dropdb lỗi bị nuốt im lặng, lệnh vẫn báo xanh trong khi DB tạm bị rò**
  Người dùng thấy gì: Nếu việc xoá cơ sở dữ liệu tạm thất bại vì lỗi hạ tầng, lệnh vẫn báo xanh và không cảnh báo, để lại một cơ sở dữ liệu thừa.
  Căn cứ: Cần lỗi hạ tầng đi kèm mới xảy ra, kết quả chạy thử vẫn đúng, chỉ rò chỗ chứa và dọn tay được.
  file: `scripts/suite-neu-doi.mjs`
  severity: low
  Đề xuất: known-limits

- **--ho-so hay --root thiếu giá trị bị bỏ qua im lặng: không ghi run-log mà vẫn thoát 0**
  Người dùng thấy gì: Gõ thiếu giá trị sau cờ hồ sơ hoặc gốc kho thì lệnh vẫn chạy xanh nhưng không ghi bằng chứng, hoặc chạy trên cây khác ý định.
  Căn cứ: Lỗi do gõ sai lệnh, người dùng thấy ngay khi không có dòng bằng chứng và chạy lại được; không mất dữ liệu.
  file: `scripts/suite-neu-doi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): «DB bị xoá» kiểm bằng coDb(...) === false, không có đối chứng dương nào cho thấy coDb trả true khi DB còn sống**
  Người dùng thấy gì: Bài kiểm việc dọn cơ sở dữ liệu tạm có thể vẫn xanh dù việc dọn không chạy, nên khó phát hiện nếu sau này việc dọn hỏng.
  Căn cứ: Không ảnh hưởng người dùng hôm nay; chỉ làm lưới an toàn yếu đi, sửa sau không đắt và không mất gì.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): assert «không tạo hồ sơ hay run-log» không thể đỏ, và mã thoát 2 không ghim thông điệp**
  Người dùng thấy gì: Bài kiểm trường hợp hồ sơ không tồn tại có thể xanh dù lệnh thoát vì lý do khác, nên khó phát hiện nếu hành vi này hỏng.
  Căn cứ: Không có hậu quả trực tiếp cho người dùng; chỉ làm bằng chứng yếu hơn mức nên có, sửa sau được.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: «đối chứng» đổi ảnh services chỉ so hằng "postgres:16" với đầu ra docker, không chạy bộ dò lệch ảnh nào**
  Người dùng thấy gì: Bài kiểm ảnh cơ sở dữ liệu của job không thật sự chứng minh việc phát hiện lệch phiên bản, nên nếu CI đổi ảnh có thể không bị báo.
  Căn cứ: Hậu quả nhẹ, chỉ là lưới kiểm lỏng hơn lời nói; không mất dữ liệu và bổ sung sau được.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
