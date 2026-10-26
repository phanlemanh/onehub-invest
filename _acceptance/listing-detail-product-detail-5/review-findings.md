# Review findings — listing-detail-product-detail-5 (round 2)

## Trong hợp đồng

- **Hình dạng 4 (phép âm một mình, chiều đỏ không ghim đúng kiểu hỏng): phép focus() trong E9 không bắt được nút tabindex=-1, mà assert tabindex đã bị gỡ**
  file: `app/tests/listing-detail.test.tsx:345`
  severity: medium
  AC: AC-5
  source: measurement
  detail: Ở round này assert `nightButtons.every((b) => b.getAttribute("tabindex") !== "-1")` bị xoá. Chỗ của nó giờ là vòng `(b as HTMLButtonElement).focus(); assert.equal(document.activeElement, b)` cộng thêm `disabled === false`, và chiều đỏ là `nightButtons[1].disabled = true` thì focus() không vào được. Comment ghi rõ mục đích là bắt được lỗi «nút đêm không nhận focus bằng Tab» (khuôn cũ «thiếu tabindex=-1»). Nhưng trong jsdom, focus() trên một nút có tabindex=-1 VẪN đưa activeElement về nút đó. Đã chạy thử trong app/: `<button tabindex=-1>` gọi focus() thì activeElement là chính nút ấy. Vậy nếu component quay lại kiểu hỏng cũ (Base UI TooltipTrigger nhận tabIndex={-1}, nút ra khỏi thứ tự Tab), cả hai phép focus() và disabled===false vẫn xanh. Chiều đỏ chỉ đổi biến `disabled`, không phải biến thật sự gây hỏng (tabindex), nên nó chứng minh được dụng cụ đo phân biệt nút disabled, chứ không chứng minh được nút còn trong thứ tự Tab. Ở tầng jsdom, ca LD-AC-6 hiện không còn assert nào đỏ được khi tabindex=-1. Dòng expected của E9 trong evals.yaml cũng đã bỏ vế «không nút nào tabindex=-1». Phần bù duy nhất là smoke E19 (scripts/smoke-listing-detail.mjs, vòng Tab ≤ 3 lần từ nút «Lần gần nhất collector»), nhưng nó chỉ kiểm được rằng có MỘT nút đêm (nút đầu) lọt vào thứ tự Tab, không kiểm các nút còn lại.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chữ UI mới dùng đúng thuật ngữ mà CONTEXT.md ghi là _Avoid_ («listing tương tự») (r1)**
  Người dùng thấy gì: Trang listing gọi bảng so sánh là «Listing tương tự», trong khi từ điển sản phẩm muốn gọi là «Listing so sánh». Người dùng thấy hai tên khác nhau cho cùng một thứ ở các trang khác nhau, nhưng vẫn hiểu được.
  Căn cứ: Chỉ là lệch tên gọi, nhẹ với người dùng và không mất dữ liệu; đổi nhãn đồng loạt là việc rẻ nhưng phải do người quyết chọn tên chuẩn, vì hợp đồng đã ký đúng chữ hiện tại.
  file: `app/src/components/listing/listing-sections.tsx`
  severity: medium
  Đề xuất: known-limits

- **Nhãn Đặc điểm mới không có trong CONTEXT.md, và dòng Phòng ngủ viết khác quy ước «PN» (r1)**
  Người dùng thấy gì: Cùng một trang hiện số phòng ngủ hai kiểu: «2 phòng ngủ» ở hộp Đặc điểm và «2 PN» ở phần so sánh. Chỉ khác cách viết, không sai thông tin.
  Căn cứ: Hậu quả chỉ là chữ không đồng nhất, người dùng vẫn đọc đúng; sửa sau rẻ và không ảnh hưởng dữ liệu.
  file: `app/src/components/listing/listing-hero.tsx`
  severity: low
  Đề xuất: known-limits

- **ListingActions thành code chết sau khi bỏ khe actions của PageHeader (r1)**
  Người dùng thấy gì: Còn một tệp cũ không còn được dùng nữa trong mã nguồn. Người dùng không thấy gì khác đi.
  Căn cứ: Không ảnh hưởng người dùng, không mất dữ liệu; dọn lúc nào cũng được nên không cần mở việc riêng.
  file: `app/src/components/listing/listing-actions.tsx`
  severity: low
  Đề xuất: wont-fix

- **Thumbnail gallery đặt motion hover transition-opacity lên component Item đã cài (r1)**
  Người dùng thấy gì: Khi rê chuột lên ảnh nhỏ, ảnh sáng lên bằng hiệu ứng mờ dần thay vì kiểu đổi màu chuẩn của hệ thiết kế. Khác biệt gần như không nhận ra.
  Căn cứ: Chỉ là khác biệt thẩm mỹ rất nhỏ, không cản người dùng làm gì; sửa sau rẻ.
  file: `app/src/components/listing/listing-gallery.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (đo checkout khác thay vì cây đang kiểm): smoke mặc định :3460 và không kiểm server có phải từ worktree này (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bằng chứng kiểm tra có thể lấy từ bản chạy của một nhánh khác trên cùng máy, nên kết quả xanh hay đỏ có thể không phản ánh đúng trang đang giao. Người dùng cuối không bị ảnh hưởng trực tiếp.
  Căn cứ: Chỉ làm sai lệch bằng chứng nội bộ chứ không làm hỏng trang của người dùng; người chấm tự kiểm được bằng cách chạy đúng bản từ nhánh này.
  file: `scripts/smoke-listing-detail.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
