## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: offer_project trong lược đồ tạm là bảng tám cột gõ tay**
  Người dùng thấy gì: Một số bài test của màn dòng chảy dùng bảng mẫu tự gõ tay thay cho bảng thật. Nếu sau này cấu trúc bảng thật đổi, các test ấy vẫn báo xanh dù màn hình có thể đã lệch.
  Căn cứ: Chỉ làm test kém nhạy chứ không làm người dùng thấy số sai hôm nay, và bài kiểm trên dữ liệu thật vẫn bắt được lệch; ghi lại là đủ.
  file: `app/tests/ops-dong-chay-fixture.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 — đo chỉ dẫn thay vì đầu ra: DV7-AC-10a grep chữ trong sao-luu.sh, kiem-sau.sql, README mà không chạy**
  Người dùng thấy gì: Bài kiểm chỉ xác nhận các tệp sao lưu và kiểm sau có chứa đúng chữ cần thiết, chứ chưa chạy thử chúng. Nếu một câu trong tệp kiểm sau viết sai, người áp lên máy thu chỉ phát hiện lúc chạy thật.
  Căn cứ: Hậu quả nhẹ vì lỗi nếu có sẽ lộ ngay khi người ký chạy lệnh kiểm sau, không mất dữ liệu, và có thể sửa rồi chạy lại.
  file: `pipeline/tests/offer-project-lui.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính đứng một mình: data_level_units không chứa 'offer_located('**
  Người dùng thấy gì: Bài kiểm xác nhận rằng cách tính bậc dữ liệu không gọi từng tin một chỉ bằng việc không thấy một cái tên trong mã. Nếu về sau có người viết lại theo kiểu chậm bằng tên khác, bài kiểm vẫn xanh và việc tính bậc có thể chậm đi mà không ai báo.
  Căn cứ: Số liệu người dùng thấy vẫn đúng, chỉ có nguy cơ chậm đi về sau, và một bài đo thời gian riêng đã canh giới hạn tốc độ nên ghi lại là đủ.
  file: `pipeline/tests/offer-project.itest.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
