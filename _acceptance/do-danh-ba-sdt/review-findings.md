## Trong hợp đồng

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): PGTZ=UTC không được node-pg đọc nên phiên UTC của E3 chưa từng được dựng**
  file: `_acceptance/do-danh-ba-sdt/probes/db.mjs:192`
  severity: medium
  AC: AC-3
  source: measurement
  detail: E3 hứa «phiên DB đặt TimeZone=UTC» và in ok «hai lượt --write với phiên UTC». Probe chỉ truyền `chayLenh(["--write"], { PGTZ: "UTC" })`. Driver pg (pipeline/node_modules/pg/lib/connection-parameters.js) chỉ đọc các khoá env PGHOST/PGUSER/PGOPTIONS…, không đọc PGTZ (PGTZ là biến của libpq). Probe đặt một khoá mà bên chạy không đọc rồi tuyên bố điều kiện đã được dựng. Múi giờ phiên thực tế là mặc định của server, không được kiểm hay ghim. Trong probe không có câu `SHOW TimeZone` hay `SET` nào để xác nhận.
  rationale: AC-3 nêu rõ chạy hai lần cùng ngày theo giờ Asia/Ho_Chi_Minh «kể cả khi phiên DB đặt UTC», mà phép đo chưa dựng được điều kiện UTC đó.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ca «có vai đã rút vẫn tính không vai» không hề có vai rút nào**
  Người dùng thấy gì: Nếu ai đó vô tình đổi cách tính người có vai đã rút, phép kiểm đêm có thể đếm sai số người SĐT không vai mà các phép thử hiện tại không báo đỏ. Số liệu hiển thị hôm nay vẫn đúng.
  Căn cứ: Hậu quả nhẹ: chỉ là lỗ hổng bắt hồi quy trong tương lai, không làm mất hay lộ dữ liệu, và có thể bổ sung phép thử sau với chi phí rẻ.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): «cùng tham chiếu hàm extractPhones» chỉ là grep dòng import**
  Người dùng thấy gì: Phép thử hiện chỉ kiểm tệp có nạp đúng bộ bóc SĐT, chưa kiểm bộ bóc thực chạy. Nếu sau này có người thay bằng bản chép, số tin nhiều SĐT có thể lệch mà không ai hay.
  Căn cứ: Rủi ro thấp và chỉ xảy ra khi có thay đổi mã sau này; hiện lệnh vẫn đo đúng, và đối chiếu độc lập ở phép đo số liệu vẫn bắt lệch số.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): quét SĐT/khoá băm trong dq_check_results không có đối chứng dương, và thiếu ca sender_name**
  Người dùng thấy gì: Phép kiểm tra «không lộ số điện thoại hay khoá băm» chỉ biết báo sạch, chưa chứng minh được nó sẽ bắt được khi có số lọt vào. Sản phẩm vẫn chạy đúng, nhưng nếu sau này có số điện thoại lọt vào kết quả đo thì phép kiểm tra có thể không báo.
  Căn cứ: Nhẹ: chỉ là độ tin cậy của một phép kiểm tra phụ, hiện chưa thấy dữ liệu nào bị lộ, và bổ sung ca đối chứng sau này rẻ, không mất dữ liệu.
  file: `_acceptance/do-danh-ba-sdt/probes/db.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
