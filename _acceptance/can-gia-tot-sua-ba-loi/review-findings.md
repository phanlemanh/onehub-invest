# Review findings: can-gia-tot-sua-ba-loi (round 1)

## Trong hợp đồng

- **AC-7: test không chặn trần 300 giây, chỉ in số giây ra log**
  AC: AC-7
  file: `app/tests/can-gia-tot-doi-chieu.test.tsx:117`
  severity: medium
  source: conventions
  detail: AC-7 yêu cầu xong trong tối đa 300 giây để trần 600 giây còn dư ít nhất 2 lần. Ca CGT-DC chỉ `console.log` số giây; không có assert nào trên `Date.now() - batDau`, và timeout của ca vẫn là 600_000. Vì vậy ca chạy 590 giây vẫn exit 0. Executor E9 chỉ có `exit 0`, còn điều kiện «giây không quá 300» phải có người đọc dòng log, nên lệnh ghim lại không tự đỏ khi chậm trở lại. Đối chứng đỏ cũng chỉ phủ lấy mẫu, tuần tự và quá giới hạn song song, không có đối chứng cho thời gian, trong khi evals.yaml ghi mỗi phép đo có đối chứng đỏ trên cùng dữ liệu. Không tự sửa: cần thêm assert thời gian kèm đối chứng, hoặc ghi rõ trong hợp đồng rằng 300 giây là phép đo một lần do người đọc.

- **Hình dạng 4 — Assertion âm-tính-một-mình: sheet của 8 dòng có tên chỉ kiểm «không có unknown», không kiểm tên đúng**
  AC: AC-1
  file: `app/tests/can-gia-tot-biet-can.test.tsx:1075`
  severity: medium
  source: measurement
  detail: Dòng 1075 chỉ có `assert.ok(!coChuGiuCho(sheet.textContent))`. Dòng 1076 chỉ thêm phép dương khi `m.ten === null` (n06, n07). Với 8 dòng có tên (n01–n05, n08–n10), sheet không có assert nào so với `m.ten`. Sheet vẽ tên ở `deal-sheet.tsx:98` dạng `d.sellerName ?? "Người đăng chưa có tên"`. Nếu sheet làm mất tên, hiện sai tên, hoặc hiện «Người đăng chưa có tên» cho n01, ca vẫn xanh. Lời hứa trái ngược: E1 ghi «mỗi dòng so getDeals thật rồi so ô tên trên hàng bảng, sheet và trang», và comment ma trận ghi «một [assert] trên từng bề mặt». Hàng và trang có `assert.equal` với `m.ten`, riêng sheet thì không.

- **Hình dạng 3 — Lời hứa là quan hệ nhưng chỉ in chuỗi: E9 (AC-7) không assert «giây ≤ 300», còn «n = tin P1 bán» so một biến với chính nó**
  AC: AC-7
  file: `app/tests/can-gia-tot-doi-chieu.test.tsx:117`
  severity: medium
  source: measurement
  detail: AC-7 và E9 hứa ca xong trong tối đa 300 giây, và dòng in có n bằng «tin P1 bán». Thời gian chỉ xuất hiện trong `console.log` ở dòng 117, không có assert nào; trần duy nhất là `timeout: 600_000`. Vì vậy chạy 590 giây vẫn exit 0, và phép đo chỉ dựa vào người đọc dòng in. Quan hệ n = «tin P1 bán» cũng rỗng nghĩa: dòng 117 và dòng 138 đều in cùng một biến `p1.length`, nên hai số luôn bằng nhau. Dữ kiện 1.483 tin của AC-7 cũng không được ghim bằng assert.

- **Hình dạng 5 — Tuyên quét lớp nhưng chỉ có điểm-case: CGB-AC-6 ghi «ma trận qua route» mà route chỉ kiểm 2/8 dòng**
  AC: AC-6
  file: `app/tests/tin-rao-cong-khai.test.tsx:495`
  severity: medium
  source: measurement
  detail: Tên ca là «ma trận tên qua hàm, route và vùng máy chủ thật». E8 ghi «So qua getPublicOffers, route /api/v1/listings và vùng máy chủ thật», còn AC-6 hứa «ở cả ba đường… kể cả Na và Anh Unknown». Chỉ `kiemTenInvest` (đường hàm) lặp đủ `MA_TRAN_TEN`. Đường route chỉ có hai assert điểm ở dòng 495–496 (`ten-0`, `ten-5`). Các dòng ` UNKNOWN `, rỗng, toàn khoảng trắng, NULL, `Na`, `Anh Unknown` không được kiểm trên route, và số assert ở đường này không bằng số phần tử ma trận. Vùng máy chủ cũng không kiểm `Na` và `Anh Unknown` giữ nguyên: chỉ có `includes("Bán Thật")`, `includes("Chưa có tên")` và một regex âm.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Điều kiện đếm nhiều tên trong SQL lệch với `tenTin` về khoảng trắng**
  Người dùng thấy gì: Hiếm khi một tài khoản người bán có tên lẫn ký tự lạ ở cuối, thẻ tin có thể hiện «nhiều tên» thay vì tên thật. Người xem chỉ thấy nhãn kém chính xác, không mất dữ liệu.
  Căn cứ: Chỉ ảnh hưởng nhãn hiển thị ở một số ít tài khoản có ký tự lạ, chưa thấy trên dữ liệu thật, và không làm lộ hay mất thông tin.
  file: `app/src/lib/offers-public.ts`
  severity: low
  Đề xuất: known-limits

- **Eval E8 của AC-6 đo route `/api/v1/listings` nhưng không khai route trong `paths`**
  Người dùng thấy gì: Nếu sau này có người sửa hai tệp phục vụ danh sách tin rao, bằng chứng của việc này vẫn được coi là còn mới dù chưa đo lại. Người dùng cuối không thấy gì ngay.
  Căn cứ: Chỉ làm hệ nghiệm thu bỏ sót cảnh báo cũ về sau, không ảnh hưởng gì đến người dùng hôm nay và sửa sau rất rẻ.
  file: `_acceptance/can-gia-tot-sua-ba-loi/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Probe AC-4 báo xanh giả khi không so được tệp test: lỗi git bị nuốt thành 0 dòng xoá**
  Người dùng thấy gì: Nếu tệp kiểm cũ bị xoá hẳn, một phép kiểm phụ vẫn báo xanh. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Là kẽ hở của công cụ kiểm, chỉ xảy ra khi tệp bị xoá và các phép kiểm khác vẫn bắt được, nên chi phí sửa không đáng.
  file: `_acceptance/can-gia-tot-sua-ba-loi/probes/ca-cu-khong-doi.sh`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 — Không ghim thông điệp: ba đối chứng đỏ không chạy phép kiểm thật, nên thông điệp E1 và E3 khai «ném» không được chứng minh**
  Người dùng thấy gì: Một số phép thử đối chứng chưa chứng minh được là báo đúng lỗi khi dữ liệu sai. Người dùng không thấy khác biệt, chỉ độ chắc của bằng chứng thấp hơn khai báo.
  Căn cứ: Chỉ làm yếu bằng chứng nội bộ, không ảnh hưởng hiển thị cho người dùng, và các giá trị đột biến vẫn đã được kiểm.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
