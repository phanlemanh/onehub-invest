# Review findings: do-khu-vuc-tu-dung-moi (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Gác main dùng path.resolve thay cho realpathSync: chạy qua đường symlink thì thoát 0 im lặng (PASS giả)**
  Người dùng thấy gì: Nếu chạy phép đo này qua đường tắt cũ (~/dev/one-invest), nó không đo gì cả mà vẫn báo thành công, nên người xem mã thoát sẽ tưởng đã đạt.
  Căn cứ: Chỉ xảy ra khi cố ý gọi qua đường tắt cũ, không mất hay lộ dữ liệu, người dùng tránh được bằng cách chạy bằng đường thật và sửa sau rẻ.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: medium
  Đề xuất: known-limits

- **--pha thiếu giá trị hoặc đứng không có --thu bị lờ im lặng, script chạy chiều xanh**
  Người dùng thấy gì: Gõ thiếu giá trị của cờ chọn chiều đỏ thì phép đo lặng lẽ chạy chiều xanh và báo đạt, trong khi người gõ tưởng mình đang thử chiều đỏ.
  Căn cứ: Chỉ xảy ra khi gõ sai lệnh, không ảnh hưởng dữ liệu, chạy lại với lệnh đúng là hết và hậu quả nhẹ.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: low
  Đề xuất: known-limits

- **--pha mo-loc: lệnh trả meta trong finally che mất lỗi thật của transform**
  Người dùng thấy gì: Khi phép đo gặp lỗi thật giữa chừng ở chiều kiểm bộ lọc, thông báo lỗi bị thay bằng một câu chung chung nên khó biết nguyên nhân thật.
  Căn cứ: Chỉ làm khó chẩn đoán trong tình huống đã lỗi, mọi thay đổi vẫn được hoàn tác, không mất dữ liệu và người dùng chạy lại để điều tra được.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: medium
  Đề xuất: known-limits

- **Cờ --pha thiếu giá trị hoặc thiếu --thu thì lặng lẽ rơi về chiều thường**
  Người dùng thấy gì: Gõ thiếu giá trị hoặc thiếu cờ đi kèm thì phép đo chạy chiều khác với chiều người gõ muốn mà không báo gì.
  Căn cứ: Chỉ xảy ra khi gõ sai lệnh, không mất dữ liệu, chạy lại là xong và sửa sau rẻ.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: ca KDM-AC-4 dựng tay đầu vào cho soBam thay vì lấy từ bam()**
  Người dùng thấy gì: Test chỉ chứng minh phần so sánh băm đúng, chưa chứng minh phần tính băm thật đổi khi bảng đổi, nên dòng báo bảng không đổi có thể xanh dù phần tính băm hỏng.
  Căn cứ: Hợp đồng đã chủ động chọn ca thuần này, không làm mất hay lộ dữ liệu, và rủi ro chỉ là một kết quả xanh sai ở công cụ đo nội bộ.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
