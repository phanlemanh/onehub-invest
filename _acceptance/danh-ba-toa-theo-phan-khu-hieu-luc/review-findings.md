## Trong hợp đồng

- **Hình dạng 3 — Assert «chuỗi có mặt» trong HTML trong khi lời hứa DOM là quan hệ dòng phụ ↔ toà; T2-T4 không được đo trên DOM**
  AC: AC-2
  file: `app/tests/registry-toa-hieu-luc.test.tsx:382`
  severity: medium
  source: measurement
  detail: Đoạn E2 trong evals.yaml hứa rằng trên DOM của trang dự án D (renderToStaticMarkup DuAnContent), dòng phụ T1 BẮT ĐẦU bằng tên K, T2 bắt đầu bằng tên C, T3 không có tên nút và T4 có tên B mà không có cụm «S09 xếp lại». Trên DOM, test chỉ có `assert.ok(html.includes(h[T.T1].phu.replace(/&/g, "&amp;")))`. Đây là một chuỗi có mặt ở đâu đó trong toàn bộ HTML, không gắn với hàng của T1 và không kiểm vị trí đầu dòng. Các quan hệ của T2, T3, T4 (startsWith, !includes) chỉ được kiểm trên mảng trả về của dungHangToa (dòng 371-375), không phải trên DOM. Cả ba chiều đỏ (dòng 391-399) cũng chỉ chạy trên dungHangToa. Một lỗi ở du-an-toa-grid.tsx hay registry-grid.tsx, ví dụ vẽ phu sai hàng hoặc bỏ phu của T2-T4, sẽ không làm đỏ test, dù evals.yaml E2 liệt kê hai tệp đó trong paths.
  rationale: AC-2 đòi trên trang dự án dựng trong jsdom, dòng phụ của từng toà bắt đầu bằng tên nút hiệu lực và toà gốc bằng hiệu lực không có cụm «S09 xếp lại»; test chỉ kiểm chuỗi có mặt đâu đó trong HTML cho một toà, các toà còn lại chỉ kiểm trên mảng dữ liệu.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 — Fixture VIẾT TAY đúng khuôn bên đọc (meta S09 trên asset_nodes, bí danh ma_nguon, payload stg_s09_item)**
  Người dùng thấy gì: Nếu phần nạp dữ liệu S09 sau này đổi cách đặt tên trường, bài kiểm vẫn xanh trong khi trang Danh bạ có thể xếp toà sai phân khu. Số đo trên dữ liệu thật vẫn bắt được lệch này, nhưng không chạy tự động khi gộp.
  Căn cứ: Hậu quả chỉ xảy ra khi phần nạp đổi sau này, người vận hành thấy ngay toà xếp sai và sửa được, còn dựng thêm bài kiểm nối hai phía là việc riêng.
  file: `app/tests/registry-toa-hieu-luc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình cho T3, rỗng nghĩa trên fixture và không có chiều đỏ**
  Người dùng thấy gì: Bài kiểm cho toà có gốc trùng phân khu hiệu lực khá lỏng: nếu dòng phụ của toà đó bị bỏ hẳn, bài kiểm vẫn xanh. Trên trang thật, toà này hiện không có dòng phụ, đúng như mong muốn.
  Căn cứ: Hậu quả nhẹ, không làm mất hay sai dữ liệu người dùng, chỉ làm bài kiểm kém nhạy; siết lại sau rất rẻ.
  file: `app/tests/registry-toa-hieu-luc.test.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

