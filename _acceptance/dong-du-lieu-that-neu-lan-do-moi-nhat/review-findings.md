# Review findings: dong-du-lieu-that-neu-lan-do-moi-nhat (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Phần «lệnh thật» của HT30-AC-4 luôn qua mà không kiểm gì: ngoài kho git suite luôn bị kích**
  Người dùng thấy gì: Một bài kiểm tra tự động nói là thử lệnh thật nhưng thực ra luôn đậu, nên nó chưa chứng minh được việc báo «không đọc được sổ». Người dùng cuối không bị ảnh hưởng, chỉ là bằng chứng kiểm thử yếu hơn lời khai.
  Căn cứ: Hậu quả nhẹ vì chức năng đúng và chỉ bằng chứng kiểm thử yếu; không mất dữ liệu, sửa sau rẻ bằng cách chỉnh lời khai hoặc câu kiểm.
  file: `scripts/pipeline-that-hang-ngay.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **duongSo() giờ có thể trả null nhưng bên ghi sổ pipeline-that-hang-ngay.mjs vẫn dùng như chuỗi**
  Người dùng thấy gì: Khi công cụ git trên máy quá cũ, bước ghi sổ soát hằng ngày có thể báo lỗi khó hiểu thay vì thông báo rõ ràng. Chỉ xảy ra trong môi trường hiếm.
  Căn cứ: Hiếm gặp, chỉ gây lỗi báo chứ không mất hay lộ dữ liệu, và chạy lại sau khi sửa môi trường là xong.
  file: `scripts/pipeline-that-hang-ngay.mjs`
  severity: low
  Đề xuất: known-limits

- **Chiều đỏ của AC-4 đọc sổ theo đường tương đối với cwd của tiến trình test, có thể trúng sổ thật**
  Người dùng thấy gì: Bài kiểm tra có thể báo đỏ giả khi chạy trên máy đã có sổ soát hằng ngày thật. Người dùng cuối không thấy gì, chỉ làm người vận hành mất công tìm nguyên nhân.
  Căn cứ: Chỉ gây báo đỏ giả cho người vận hành, không ảnh hưởng dữ liệu hay người dùng, và rẻ để sửa khi có dịp.
  file: `scripts/pipeline-that-hang-ngay.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Phần «lệnh thật ngoài kho» của HT30-AC-4 luôn đậu: nhánh «không đọc được sổ» không bao giờ được gọi tới**
  Người dùng thấy gì: Bài kiểm tra «lệnh thật ngoài kho» luôn đậu nên chưa thật sự chứng minh việc báo không đọc được sổ qua lệnh thật. Chức năng cho người dùng không đổi.
  Căn cứ: Chỉ làm bằng chứng yếu, không gây mất mát cho người dùng, và có thể bổ sung lúc khác.
  file: `scripts/pipeline-that-hang-ngay.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Phép phá duongSo của HT30-AC-4 đọc sổ theo đường tương đối với cwd của tiến trình test, nên kết quả tuỳ vào chỗ chạy**
  Người dùng thấy gì: Chạy bài kiểm tra từ thư mục chính của máy thu có thể cho kết quả đỏ giả. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ gây đỏ giả khi chạy ở một chỗ nhất định, tự khắc phục bằng cách chạy ở worktree khác, không rủi ro dữ liệu.
  file: `scripts/pipeline-that-hang-ngay.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert «chuỗi có mặt» thay cho QUAN HỆ): ca lệnh thật AC-4 chấp nhận cả nhánh «chạy trong lượt này», nên không đo lời hứa «cwd ngoài kho → không đọc được sổ»**
  Người dùng thấy gì: Bài kiểm tra chấp nhận cả hai kết quả nên không bắt được lỗi nếu việc báo không đọc được sổ bị hỏng qua lệnh thật. Người dùng cuối chưa thấy ảnh hưởng.
  Căn cứ: Chỉ làm giảm khả năng phát hiện lỗi sau này, không gây hại tức thì, sửa rẻ.
  file: `scripts/pipeline-that-hang-ngay.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn phụ thuộc cây của người chạy): chiều đỏ AC-4 đọc đường tương đối theo process.cwd() của lượt test**
  Người dùng thấy gì: Kết quả bài kiểm tra phụ thuộc vào thư mục người vận hành chạy nó, có thể đỏ giả trên máy thu. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ gây đỏ giả cho người vận hành, không mất dữ liệu, và có cách tránh bằng chạy ở thư mục khác.
  file: `scripts/pipeline-that-hang-ngay.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
