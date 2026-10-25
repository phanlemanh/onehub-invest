## Trong hợp đồng

- **Hình dạng 3 (assert có mặt thay cho quan hệ): bậc Công suất lấy kỳ vọng từ chính đầu ra, không bao giờ đỏ**
  - file: `app/tests/listing-detail.test.tsx:486`
  - severity: high
  - AC: AC-8
  - source: measurement
  - detail: Ca 'LD-AC-9 bốn ô KPI' ghim hàng Công suất là `["Công suất", fmtPct(0.4), t[1].tier?.label ?? null, ...]`, trong đó `t` là kết quả của chính `listingTiles(LISTING, peers)`. Cột bậc vì thế được so với chính nó và đạt với mọi giá trị, kể cả null hay sai bậc. Lời hứa là một quan hệ: công suất 0.4 so với occ [0.2, 0.35, 0.6] (p30/p60/p90) phải ra một bậc xác định. Với giá thì ca có kiểm ngưỡng (dòng 492-493), còn với công suất thì không có ca nào. E14 vẫn ghi «bốn bộ [tiêu đề, giá trị, bậc, footer] đúng như ca ghim», nên phần bậc công suất của E14 không được đo.
  - rationale: AC-8 hứa bậc của bốn ô KPI giữ đúng công thức cũ; bậc Công suất không được đo độc lập nên lời hứa này chưa được chứng.

- **Hình dạng 5 (tuyên cả lớp nhưng chỉ có một điểm): nhãn «<Thứ>, <ngày>: <trạng thái>» chỉ ghim cho một trạng thái**
  - file: `app/tests/listing-detail.test.tsx:330`
  - severity: medium
  - AC: AC-5
  - source: measurement
  - detail: AC-5 hứa rằng mỗi đêm là một nút có nhãn «<Thứ>, <ngày>: <trạng thái>». Fixture LISTING.calendar cố ý trải đủ ba trạng thái (available false, true, null, tức Đã có khách đặt / Còn trống / Chưa rõ), nhưng chỉ `nightButtons[0]` được ghim trọn khuôn `^Thứ 3, 20/10/2026: Đã có khách đặt$`. Chín nút còn lại chỉ phải khớp `/2026: /`. Nhãn «Còn trống» và «Chưa rõ», cùng phần thứ trong tuần của các ngày khác, sai thì ca vẫn xanh. Cần ghim cả ba trạng thái, mỗi trạng thái một assert.
  - rationale: AC-5 hứa mỗi đêm là một nút có nhãn «<Thứ>, <ngày>: <trạng thái>», nhưng chỉ một trạng thái được ghim.

- **Hình dạng 4 (assertion âm tính đứng một mình): «nút đêm nhận focus bằng Tab» chỉ là tabindex !== '-1'**
  - file: `app/tests/listing-detail.test.tsx:329`
  - severity: medium
  - AC: AC-5
  - source: measurement
  - detail: `nightButtons.every((b) => b.getAttribute("tabindex") !== "-1")` là assert âm tính duy nhất cho lời hứa «nhận focus bằng Tab» của AC-5. Ca không có đối chứng dương: không focus thật, không kiểm `disabled`, không kiểm thứ tự Tab. Một nút `disabled` hay một nút không có thuộc tính tabindex đều đạt. Smoke cũng không có phép đo Tab nào tới ô đêm, chỉ đo nút tóm tắt «Công suất». Phần «nhận focus bằng Tab» của AC-5 vì thế chỉ được chứng bằng việc một thuộc tính vắng mặt.
  - rationale: AC-5 hứa mỗi đêm nhận focus bằng Tab; phép đo hiện chỉ là một thuộc tính vắng mặt, không chứng được lời hứa.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chữ UI mới dùng đúng thuật ngữ mà CONTEXT.md ghi là _Avoid_ («listing tương tự»)**
  Người dùng thấy gì: Trang listing gọi bảng so sánh là «Listing tương tự», trong khi từ điển sản phẩm muốn gọi là «Listing so sánh». Người dùng thấy hai tên khác nhau cho cùng một thứ ở các trang khác nhau, nhưng vẫn hiểu được.
  Căn cứ: Chỉ là lệch tên gọi, nhẹ với người dùng và không mất dữ liệu; đổi nhãn đồng loạt là việc rẻ nhưng phải do người quyết chọn tên chuẩn, vì hợp đồng đã ký đúng chữ hiện tại.
  file: `app/src/components/listing/listing-sections.tsx`
  severity: medium
  Đề xuất: known-limits

- **Nhãn Đặc điểm mới không có trong CONTEXT.md, và dòng Phòng ngủ viết khác quy ước «PN»**
  Người dùng thấy gì: Cùng một trang hiện số phòng ngủ hai kiểu: «2 phòng ngủ» ở hộp Đặc điểm và «2 PN» ở phần so sánh. Chỉ khác cách viết, không sai thông tin.
  Căn cứ: Hậu quả chỉ là chữ không đồng nhất, người dùng vẫn đọc đúng; sửa sau rẻ và không ảnh hưởng dữ liệu.
  file: `app/src/components/listing/listing-hero.tsx`
  severity: low
  Đề xuất: known-limits

- **ListingActions thành code chết sau khi bỏ khe actions của PageHeader**
  Người dùng thấy gì: Còn một tệp cũ không còn được dùng nữa trong mã nguồn. Người dùng không thấy gì khác đi.
  Căn cứ: Không ảnh hưởng người dùng, không mất dữ liệu; dọn lúc nào cũng được nên không cần mở việc riêng.
  file: `app/src/components/listing/listing-actions.tsx`
  severity: low
  Đề xuất: wont-fix

- **Thumbnail gallery đặt motion hover transition-opacity lên component Item đã cài**
  Người dùng thấy gì: Khi rê chuột lên ảnh nhỏ, ảnh sáng lên bằng hiệu ứng mờ dần thay vì kiểu đổi màu chuẩn của hệ thiết kế. Khác biệt gần như không nhận ra.
  Căn cứ: Chỉ là khác biệt thẩm mỹ rất nhỏ, không cản người dùng làm gì; sửa sau rẻ.
  file: `app/src/components/listing/listing-gallery.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (đo checkout khác thay vì cây đang kiểm): smoke mặc định :3460 và không kiểm server có phải từ worktree này**
  Người dùng thấy gì: Bằng chứng kiểm tra có thể lấy từ bản chạy của một nhánh khác trên cùng máy, nên kết quả xanh hay đỏ có thể không phản ánh đúng trang đang giao. Người dùng cuối không bị ảnh hưởng trực tiếp.
  Căn cứ: Chỉ làm sai lệch bằng chứng nội bộ chứ không làm hỏng trang của người dùng; người chấm tự kiểm được bằng cách chạy đúng bản từ nhánh này.
  file: `scripts/smoke-listing-detail.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
