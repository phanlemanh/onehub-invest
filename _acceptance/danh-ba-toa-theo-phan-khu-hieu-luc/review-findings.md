# Review findings: danh-ba-toa-theo-phan-khu-hieu-luc (round 3)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): T5 không được đọc trên HTML dù E2 hứa đọc dòng phụ của TỪNG toà trên HTML và trên dữ liệu bằng cùng một bảng**
  Người dùng thấy gì: Nếu trang Danh bạ vẽ sai dòng chữ phụ của một toà có hai tên gọi từ nguồn, bộ kiểm tự động vẫn báo xanh. Người vận hành chỉ thấy khi tự mở trang xem.
  Căn cứ: Hậu quả nhẹ: chỉ là chữ phụ của một toà đặc biệt, không mất hay lộ dữ liệu, mở trang là thấy ngay; hợp đồng đã ghi đây là hạn chế đã biết.
  file: `app/tests/registry-toa-hieu-luc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): payload stg_s09_item và meta s09_* viết tay theo đúng các khoá mà view 097 đọc**
  Người dùng thấy gì: Nếu phần nạp dữ liệu S09 sau này đổi cách đặt tên trường, bài kiểm vẫn xanh trong khi trang Danh bạ có thể xếp toà sai phân khu. Số đo trên dữ liệu thật vẫn bắt được, nhưng không chạy tự động khi gộp.
  Căn cứ: Rủi ro chỉ xảy ra khi có thay đổi khác trong tương lai và vẫn có số đo dữ liệu thật làm lưới đỡ; hiển thị sai tự khỏi khi sửa, không mất dữ liệu.
  file: `app/tests/registry-toa-hieu-luc.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): khacDuAn = 0 không có đối chứng dương**
  Người dùng thấy gì: Phép kiểm xác nhận không toà nào bị chuyển sang dự án khác có thể báo 0 ngay cả khi câu đếm bị hỏng. Khi đó một toà nhảy sang dự án khác có thể không bị phát hiện.
  Căn cứ: Hiện số liệu thật cho thấy không có toà nào đổi dự án, nên hậu quả thực tế chưa xảy ra; nếu có, người vận hành thấy toà lạc chỗ và sửa sau rẻ.
  file: `app/probes/registry-toa-hieu-luc.test.tsx`
  severity: low
  Đề xuất: known-limits

- **T5 chỉ được kiểm trên dữ liệu dungHangToa, không kiểm trên HTML như evals.yaml E2 ghi (r2)**
  Người dùng thấy gì: Một ca toà đặc biệt (có hai tên gọi từ nguồn) chưa được kiểm tự động trên màn hình thật. Nếu sau này dòng chữ phụ của toà đó vẽ sai trên trang Danh bạ thì bộ kiểm tra vẫn không báo.
  Căn cứ: Chỉ ảnh hưởng một toà trên trang nội bộ cho người vận hành, không làm mất hay lộ dữ liệu, và nếu có sai thì chỉ là chữ phụ hiển thị nên dễ phát hiện bằng mắt.
  file: `app/tests/registry-toa-hieu-luc.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): dòng phụ của T5 không được kiểm trên HTML dù evals hứa đọc TỪNG toà trên HTML (r2)**
  Người dùng thấy gì: Trang Danh bạ có thể vẽ sai dòng chữ phụ của một toà có hai tên gọi mà bộ kiểm tự động vẫn báo xanh. Người vận hành sẽ chỉ thấy khi tự mở trang xem.
  Căn cứ: Hậu quả nhẹ vì chỉ là chữ hiển thị của một toà ở trang chỉ đọc nội bộ, không làm hỏng dữ liệu, và bổ sung phép kiểm sau này không tốn nhiều.
  file: `app/tests/registry-toa-hieu-luc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture VIẾT TAY đúng khuôn bên đọc (meta S09 trên asset_nodes, bí danh ma_nguon, payload stg_s09_item) (r1)**
  Người dùng thấy gì: Nếu phần nạp dữ liệu S09 sau này đổi cách đặt tên trường, bài kiểm vẫn xanh trong khi trang Danh bạ có thể xếp toà sai phân khu. Số đo trên dữ liệu thật vẫn bắt được lệch này, nhưng không chạy tự động khi gộp.
  Căn cứ: Hậu quả chỉ xảy ra khi phần nạp đổi sau này, người vận hành thấy ngay toà xếp sai và sửa được, còn dựng thêm bài kiểm nối hai phía là việc riêng.
  file: `app/tests/registry-toa-hieu-luc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình cho T3, rỗng nghĩa trên fixture và không có chiều đỏ (r1)**
  Người dùng thấy gì: Bài kiểm cho toà có gốc trùng phân khu hiệu lực khá lỏng: nếu dòng phụ của toà đó bị bỏ hẳn, bài kiểm vẫn xanh. Trên trang thật, toà này hiện không có dòng phụ, đúng như mong muốn.
  Căn cứ: Hậu quả nhẹ, không làm mất hay sai dữ liệu người dùng, chỉ làm bài kiểm kém nhạy; siết lại sau rất rẻ.
  file: `app/tests/registry-toa-hieu-luc.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

