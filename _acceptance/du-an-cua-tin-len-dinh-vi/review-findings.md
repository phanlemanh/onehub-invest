## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **--ghi với đường dẫn tuyệt đối ghi sai chỗ (path.join không giữ đường tuyệt đối)**
  Người dùng thấy gì: Nếu người chạy ghi bảng số ra bằng đường dẫn đầy đủ thì tệp có thể báo lỗi hoặc nằm sai thư mục. Số đo vẫn chạy đúng và máy thu không bị ảnh hưởng.
  Căn cứ: Lỗi nhẹ, chỉ gặp khi người chạy gõ đường dẫn đầy đủ, không mất hay sai dữ liệu, người chạy thấy ngay và gõ lại bằng đường dẫn tương đối là xong.
  file: `pipeline/scripts/offer-project-that.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: bảng offer_project trong lược đồ tạm được gõ tay thay vì rút từ view của 105**
  Người dùng thấy gì: Nếu sau này cấu trúc nguồn định vị đổi, các bài kiểm tra của màn dòng chảy vẫn xanh dù màn thật có thể đọc sai. Người dùng chưa gặp ảnh hưởng gì hôm nay.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ làm bài kiểm tra tương lai kém nhạy; sửa sau vẫn rẻ và không mất dữ liệu.
  file: `app/tests/ops-dong-chay-fixture.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — đo chỉ dẫn thay vì đầu ra: kiem-sau.sql và sao-luu.sh chỉ bị grep chuỗi, không lần nào chạy**
  Người dùng thấy gì: Các tệp hướng dẫn kiểm sau và sao lưu khi áp lên máy thu mới chỉ được kiểm là có mặt và có đúng lệnh, chưa được chạy thử. Nếu có tên cột sai thì người áp sẽ gặp lỗi ngay lúc kiểm sau, chứ không bị mất dữ liệu.
  Căn cứ: Hậu quả nhẹ: lỗi nếu có sẽ hiện ngay khi người áp chạy lệnh kiểm, không làm mất hay lộ dữ liệu, và việc áp vẫn lùi được bằng tệp lùi đã kiểm.
  file: `pipeline/tests/offer-project-lui.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
