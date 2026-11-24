## Trong hợp đồng

- **Hình dạng 4 (âm tính một mình, không đối chứng dương): tầng màn của lát gắn mù chỉ được đo với đầu vào null**
  file: `app/tests/labels-lat-hai-khu-truc.test.tsx:103`
  severity: medium
  AC: AC-4
  source: measurement
  detail: Dòng 103-105: `const b = await bieuMau(MU, nhapChoLat(MU, DRAFT))`. Vì nhapChoLat(MU, DRAFT) luôn là null (dòng 92 đã ghim điều này), biểu mẫu của hai-khu-ghep-b nhận `tin.nhap = null`. Nên hai phép âm tính `b.querySelector("[data-labels-nhap]") === null` và `!b.querySelector("#nhan-building")?.getAttribute("value")` xanh bất kể cổng `hienNhap(lat)` mới thêm trong label-form-nhom.tsx (dòng 70 `useState(() => (tin.nhap && hienNhap(lat) ? ...))` và dòng 145 `{tin.nhap && hienNhap(lat) ? ...}`) có tồn tại hay không. Thử đột biến: đổi cả hai chỗ về `tin.nhap ? ...` (bỏ cổng ở màn), ca này vẫn xanh. Ca không có lần nào đưa một nháp khác null vào biểu mẫu của hai-khu-ghep-b để thấy màn tự chặn. Thế mà chú thích dòng 87 và contract AC-4 hứa «lát gắn mù không lộ nháp ở cả hai tầng (máy chủ lẫn màn)». Phép đo tầng màn ở đây rỗng. Thêm nữa, dòng 105 cũng xanh khi phần tử #nhan-building không có trên màn, vì `?.` trả undefined.
  rationale: AC-4 hứa lát gắn mù không lộ nháp ở cả máy chủ lẫn màn, nhưng phép đo tầng màn xanh cả khi bỏ cổng chặn, nên phần cam kết này chưa được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **s4-args.json đã commit là bản vòng 1 cũ: thiếu E5, E6, E7 đang có trong evals.yaml**
  Người dùng thấy gì: Một tệp cấu hình của lượt chấm còn là bản cũ, nên nếu ai chấm bằng tệp đó thì sẽ bỏ sót phép kiểm câu mô tả đầu trang. Người duyệt dùng màn nhãn không bị ảnh hưởng gì.
  Căn cứ: Chỉ ảnh hưởng quy trình chấm nội bộ, không đụng người dùng; bản đúng đã có sẵn trên cây làm việc, chỉ cần chọn đúng tệp khi chấm.
  file: `_acceptance/lat-hai-khu-truc-khai-o/s4-args.json`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo mã nguồn thay vì đầu ra): AC-5 so regex trên chữ nguồn labels-view.tsx, không dựng màn**
  Người dùng thấy gì: Phép kiểm câu mô tả đầu trang chỉ soi chữ trong mã, chưa dựng màn thật. Nếu sau này mã đổi cách viết, phép kiểm có thể báo đỏ giả hoặc để lọt một lỗi hiển thị.
  Căn cứ: Câu mô tả hiện đúng trên màn hiện tại; rủi ro chỉ là phép kiểm kém chắc, người dùng không mất dữ liệu và có thể tự thấy câu sai ngay trên trang.
  file: `app/tests/labels-lat-hai-khu-truc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc, không round-trip từ bên ghi)**
  Người dùng thấy gì: Phép kiểm dùng nháp viết tay theo khuôn mà màn đọc, chưa lấy nháp do trợ lý thật sinh ra. Nếu khuôn thật khác, các ô có thể không được điền sẵn dù phép kiểm vẫn xanh.
  Căn cứ: Nếu sai thì người duyệt chỉ phải tự điền hai ô, không mất dữ liệu, và thấy ngay trên màn; kiểm lại với nháp thật khá rẻ khi có dữ liệu.
  file: `app/tests/labels-lat-hai-khu-truc.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn hardcode gốc checkout của tác giả) trong tham số chấm S4 đã commit**
  Người dùng thấy gì: Tệp cấu hình chấm trỏ cứng vào thư mục làm việc trên máy của tác giả, nên chạy từ chỗ khác có thể gãy hoặc đo nhầm cây. Người dùng cuối không thấy gì.
  Căn cứ: Chỉ là đồ dùng nội bộ sinh lại mỗi vòng chấm, hỏng thì lộ ngay chứ không âm thầm; sửa không đáng công.
  file: `_acceptance/lat-hai-khu-truc-khai-o/s4-args.json`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 2/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/lat-hai-khu-truc-khai-o/s4-args.json) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

