## Trong hợp đồng

(không có finding nào)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2/3: thước «không hẹp hơn bản trên main» là bản chép tay dùng lại chính lõi mới, nên phép so luôn đúng**
  Người dùng thấy gì: Phép kiểm «bộ soát mới không lỏng hơn bản cũ» có thể vẫn xanh dù sau này bộ soát bị siết hẹp lại, nên một lần sửa sai có thể lọt mà không ai thấy. Hiện chưa có tên nguồn nào bị rò vì chuyện này.
  Căn cứ: Đây là điểm yếu của phép kiểm chứ không phải lỗi đang làm rò dữ liệu, và các ca khác trong hồ sơ vẫn đo hành vi thật; ghi lại để lần sau ai sửa bộ soát biết không tin vào phép so này.
  file: `pipeline/scripts/soat-tang-a.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: fixture viết tay theo đúng bí danh cột của hàm nạp (ids, bang/cot, match_whole) thay cho DB thật**
  Người dùng thấy gì: Test của bước đo hằng ngày dùng dữ liệu dựng sẵn thay vì bảng thật, nên nếu cách đọc sổ nguồn lệch đi thì test này vẫn có thể xanh. Người dùng không thấy ảnh hưởng gì ngay.
  Căn cứ: Chỉ làm một test kém nhạy, không làm lộ hay mất dữ liệu, và các test chạy trên DB thật vẫn bắt được lệch; sửa sau cũng không đắt.
  file: `pipeline/scripts/do-hang-ngay.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2/4: chiều đỏ «hàm nạp rơi token định danh» tự lọc danh sách trong test và ghim thông điệp do chính test đặt, không đột biến hàm nạp nào**
  Người dùng thấy gì: Nếu hàm nạp sổ nguồn làm rơi mất một định danh, ca thử này không chắc báo đỏ, nên có thể bỏ sót việc một tên nguồn không còn được che. Hiện chưa thấy việc đó xảy ra.
  Căn cứ: Đây là độ nhạy của phép kiểm, không phải lỗi đang chạy; các chiều đỏ khác của hàm nạp đã đột biến thật nên rủi ro còn lại thấp và người dùng không bị ảnh hưởng.
  file: `pipeline/scripts/source-name-entries.itest.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
