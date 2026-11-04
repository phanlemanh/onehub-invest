# Review findings: can-gia-tot-sua-ba-loi (round 3)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bước E7 ghi nguyên chữ ô Tên vào observed, trong khi cùng eval đòi che tên người bán vì kho công khai**
  Người dùng thấy gì: Báo cáo bằng chứng có thể chép tên người bán thật lên kho công khai dù bước chụp hình đã che tên. Không ảnh hưởng người dùng cuối vì tên người bán vốn công khai.
  Căn cứ: Hậu quả nhẹ: tên người bán trên tin rao vốn đã công khai nên không lộ gì thêm, chỉ là tài liệu tự mâu thuẫn, sửa sau rẻ.
  file: `_acceptance/can-gia-tot-sua-ba-loi/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (không ghim thông điệp): ba đối chứng đỏ E1, E3 không chạy phép kiểm, không bắt thông điệp mà evals tuyên**
  Người dùng thấy gì: Một số bài kiểm tự động chứng minh được là bản hỏng áp được, nhưng chưa chắc bắt đúng lỗi nếu chữ giữ chỗ tên hay lộ tên nguồn quay lại. Người dùng hiện chưa thấy lỗi nào.
  Căn cứ: Hậu quả không chạm người dùng hiện tại, chỉ làm lưới an toàn về sau lỏng hơn; không mất hay lộ dữ liệu và bổ sung sau không đắt.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay): đối chứng của phép quét coChuGiuCho chỉ chạy trên DOM viết tay, không chạy trên bề mặt thật**
  Người dùng thấy gì: Phép kiểm chữ giữ chỗ tên chưa được thử đỏ trên màn hình thật, nên nếu có lỗi tương tự quay lại thì bài kiểm có thể không bắt được. Người dùng hiện thấy tên đúng.
  Căn cứ: Rủi ro chỉ là bỏ sót lỗi tái phát trong tương lai, người dùng tải lại là hết, không mất dữ liệu; nâng độ chặt sau không đắt.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): phép quét unknown trên HTML của thẻ Invest không có chiều đỏ nào**
  Người dùng thấy gì: Trên trang tin rao công khai, bài kiểm chữ giữ chỗ chưa được chứng minh bắt được lỗi, và có thể bỏ sót khi chữ này nằm lẫn với chữ khác. Hiện thẻ vẫn hiện Chưa có tên đúng.
  Căn cứ: Khách xem công khai hiện không bị ảnh hưởng, rủi ro chỉ là lưới kiểm lỏng về sau; sửa sau rẻ và không có dữ liệu bị mất hay lộ.
  file: `app/tests/tin-rao-cong-khai.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): trục D của contract không có ma trận ô Người xem cho AC-1, AC-2**
  Người dùng thấy gì: Một số màn hình dành cho vai Người xem chưa được kiểm đầy đủ về chữ giữ chỗ tên và lý do rời danh sách. Người dùng vai này chưa thấy lỗi nào được ghi nhận.
  Căn cứ: Mức phủ kiểm mỏng hơn khai báo nhưng chưa có lỗi thật nào với người xem; không mất hay lộ dữ liệu và có thể bổ sung sau với chi phí thấp.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Năm frame E7 đưa dữ liệu thật không che lên kho công khai: chữ bài gốc, ảnh tin, SĐT, tên người bán (r2 · tệp đã đổi)**
  Người dùng thấy gì: Ảnh chụp màn hình dùng làm bằng chứng đang để lộ nguyên văn bài gốc, ảnh tin rao và số điện thoại thật trên kho mã công khai, mà bình thường những thứ này chỉ người vận hành đăng nhập mới thấy.
  Căn cứ: Dữ liệu đã nằm trên kho công khai nên ai cũng xem được và không tự gỡ được; xử lý sau càng khó, nên cần người quyết cách làm mờ hoặc viết lại lịch sử.
  file: `_acceptance/can-gia-tot-sua-ba-loi/evidence/E7-ten.png`
  severity: high
  Đề xuất: new-contract

- **Điều kiện đếm nhiều tên trong SQL lệch với `tenTin` về khoảng trắng (r1)**
  Người dùng thấy gì: Hiếm khi một tài khoản người bán có tên lẫn ký tự lạ ở cuối, thẻ tin có thể hiện «nhiều tên» thay vì tên thật. Người xem chỉ thấy nhãn kém chính xác, không mất dữ liệu.
  Căn cứ: Chỉ ảnh hưởng nhãn hiển thị ở một số ít tài khoản có ký tự lạ, chưa thấy trên dữ liệu thật, và không làm lộ hay mất thông tin.
  file: `app/src/lib/offers-public.ts`
  severity: low
  Đề xuất: known-limits

- **Eval E8 của AC-6 đo route `/api/v1/listings` nhưng không khai route trong `paths` (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu sau này có người sửa hai tệp phục vụ danh sách tin rao, bằng chứng của việc này vẫn được coi là còn mới dù chưa đo lại. Người dùng cuối không thấy gì ngay.
  Căn cứ: Chỉ làm hệ nghiệm thu bỏ sót cảnh báo cũ về sau, không ảnh hưởng gì đến người dùng hôm nay và sửa sau rất rẻ.
  file: `_acceptance/can-gia-tot-sua-ba-loi/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Probe AC-4 báo xanh giả khi không so được tệp test: lỗi git bị nuốt thành 0 dòng xoá (r1)**
  Người dùng thấy gì: Nếu tệp kiểm cũ bị xoá hẳn, một phép kiểm phụ vẫn báo xanh. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Là kẽ hở của công cụ kiểm, chỉ xảy ra khi tệp bị xoá và các phép kiểm khác vẫn bắt được, nên chi phí sửa không đáng.
  file: `_acceptance/can-gia-tot-sua-ba-loi/probes/ca-cu-khong-doi.sh`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 — Không ghim thông điệp: ba đối chứng đỏ không chạy phép kiểm thật, nên thông điệp E1 và E3 khai «ném» không được chứng minh (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một số phép thử đối chứng chưa chứng minh được là báo đúng lỗi khi dữ liệu sai. Người dùng không thấy khác biệt, chỉ độ chắc của bằng chứng thấp hơn khai báo.
  Căn cứ: Chỉ làm yếu bằng chứng nội bộ, không ảnh hưởng hiển thị cho người dùng, và các giá trị đột biến vẫn đã được kiểm.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
