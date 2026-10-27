# Review findings: airbnb-nghi-khong-hoi-sinh (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Un-retire qua nhánh upsert để geom kẹt ở điểm ngoài phường/NULL do nhánh cho nghỉ mới ghi**
  Người dùng thấy gì: Căn nghỉ rồi quay lại trong phường có thể mang một điểm bản đồ cũ hoặc trống đến lần cập nhật khu vực kế tiếp. Toạ độ hiển thị vẫn đúng và hiện chưa có màn hình nào đọc điểm này.
  Căn cứ: Hậu quả nhẹ vì số liệu người dùng thấy vẫn đúng và lệch tự hết sau một chu kỳ đêm, nên ghi lại là đủ, không cần mở việc riêng.
  file: `pipeline/transform-airbnb.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (ma trận / số assert = số phần tử): bộ đếm n của AN-AC-4 là phép đo tự đúng**
  Người dùng thấy gì: Bộ kiểm tự động có một phép đếm luôn báo đạt, nên nếu sau này có người bớt kiểm tra thì nó không báo động. Người dùng cuối không bị ảnh hưởng trực tiếp.
  Căn cứ: Không ảnh hưởng dữ liệu hay màn hình của người dùng; chỉ làm bộ kiểm yếu đi về sau, nên ghi lại để người sửa sau biết.
  file: `pipeline/scripts/airbnb-nghi.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): «reassign không đánh thức» ở dòng 1–2 của AN-AC-4 không phân biệt được bản sửa với bản cũ**
  Người dùng thấy gì: Hai trong ba tình huống kiểm tra cho căn đã nghỉ sẽ vẫn xanh kể cả khi lỗi cũ quay lại. Lỗi chính vẫn được bắt ở các ca khác, nên rủi ro cho người dùng thấp.
  Căn cứ: Lỗi chính đã có ca khác bắt được, phần yếu chỉ là độ chặt của bộ kiểm, không làm mất hay lộ dữ liệu của người dùng.
  file: `pipeline/scripts/airbnb-nghi.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay theo đúng khuôn bên đọc): ca đối chứng AN-AC-6 tự dựng một hàm giả khớp đúng mốc cắt của nhanhNghi**
  Người dùng thấy gì: Bộ kiểm tĩnh chứng minh khả năng bắt lỗi cũ trên một mẫu tự dựng chứ không trên tệp cũ thật. Người dùng không thấy khác biệt nào.
  Căn cứ: Chi phí dựng đối chứng từ lịch sử thật vượt xa lợi ích, vì ca chạy với cơ sở dữ liệu thật đã chứng minh lỗi cũ và không ảnh hưởng người dùng.
  file: `pipeline/scripts/airbnb-nghi.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3 (chỉ kiểm chuỗi có mặt trong khi lời hứa là quan hệ giữa giá trị): kiemNhanhNghi chỉ kiểm có `latitude =` và `longitude =`**
  Người dùng thấy gì: Phép kiểm nhanh trong CI chỉ thấy có ghi toạ độ chứ không biết ghi đúng giá trị hay không. Kiểm tra đầy đủ chỉ chạy tay trên máy có cơ sở dữ liệu thử.
  Căn cứ: Nếu ai đó ghi sai toạ độ, CI không báo nhưng bộ kiểm có cơ sở dữ liệu vẫn bắt được khi chạy tay, nên rủi ro thấp và người sửa có thể tự phát hiện.
  file: `pipeline/scripts/airbnb-nghi-chung.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
