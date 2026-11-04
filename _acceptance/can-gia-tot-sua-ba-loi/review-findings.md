## Trong hợp đồng

- **E7 đo thiếu khổ nhìn so với AC-5: chỉ trang căn số âm được đo ở cả hai khổ**
  file: `_acceptance/can-gia-tot-sua-ba-loi/evals.yaml:61`
  severity: medium
  AC: AC-5
  source: conventions
  detail: AC-5 (contract.md dòng 29) yêu cầu mở cả ba trang (căn unknown, căn số âm, căn trong danh sách) ở khổ 390 px và khổ màn hình; Trục E của contract cũng gán 390 px | màn hình cho AC-5. E7 chỉ ghi hai khổ cho căn số âm (E7-ly-do-390.png, E7-ly-do-man.png). Bước E7-ten (dòng 61) và bước crumb (dòng 63: E7-crumb-sheet.png, E7-crumb-bang.png) mỗi bước một frame, không ghi khổ, nên E7 có thể PASS mà chưa từng bấm crumb mở sheet ở 390 px. Notes của contract chỉ khai giới hạn hạng 31 và AC-6, không khai giới hạn này. Cần thêm bước và frame cho khổ còn thiếu, hoặc ghi rõ giới hạn ở contract để người ký biết.

- **E7 chỉ đo hai khổ cho căn số âm, trong khi AC-5 đòi cả ba trang ở 390 px và màn hình**
  file: `_acceptance/can-gia-tot-sua-ba-loi/evals.yaml:54`
  severity: medium
  AC: AC-5
  source: bugs
  detail: AC-5 trong contract.md ghi: vai Vận hành mở trang căn unknown, trang căn số âm và trang căn còn trong danh sách «ở khổ 390 px và khổ màn hình». Các bước và expected của E7 chỉ yêu cầu hai khổ cho căn số âm (E7-ly-do-390.png, E7-ly-do-man.png). Ô Tên của căn unknown (E7-ten.png) và hai lần bấm crumb (E7-crumb-sheet.png, E7-crumb-bang.png) không ghi khổ và chỉ có một frame mỗi loại. E7 vì vậy có thể PASS mà chưa từng đo ô Tên hay crumb mở sheet ở 390 px. Eval tuyên phủ AC-5 nhưng đo hẹp hơn lời hứa, và lượt 3 sửa đúng khối bước này mà chưa vá. Cách sửa: thêm frame và phép đo 390 px cho ô Tên và cho crumb, hoặc thu hẹp AC-5 qua quyết định có ghi sổ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **paths của E8 và E7 thiếu tệp mà chính phép đo đi qua, nên hồ sơ không bị coi là cũ khi các tệp đó đổi**
  Người dùng thấy gì: Nếu sau này có người sửa một số tệp liên quan đến trang tin rao và trang chi tiết căn, hồ sơ nghiệm thu vẫn báo còn mới dù chưa đo lại. Người dùng cuối không thấy lỗi nào ngay, chỉ là rủi ro bỏ sót khi kiểm lại.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu; chỉ làm hồ sơ kiểm tra lỏng hơn, ghi lại để người sau biết là đủ.
  file: `_acceptance/can-gia-tot-sua-ba-loi/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **paths của E7 và E2 thiếu tệp quyết định kết quả, nên bằng chứng có thể được mang sang khi đã cũ**
  Người dùng thấy gì: Nếu có người sửa phần quyết định chữ tên người đăng hoặc phần mở chi tiết căn sau khi đã ký, hồ sơ vẫn coi kết quả cũ là còn hiệu lực. Người vận hành có thể vẫn thấy chữ giữ chỗ nếu lỗi quay lại mà không ai đo lại.
  Căn cứ: Rủi ro chỉ xảy ra khi có sửa đổi sau này, người dùng tự phát hiện được và sửa lại rẻ; ghi giới hạn là đủ.
  file: `_acceptance/can-gia-tot-sua-ba-loi/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Trang hồ sơ hiện «Lượt chấm 0», «Token 0» dù đã chấm 3 lượt: thiếu dữ liệu bị hiển thị thành số 0**
  Người dùng thấy gì: Trang hồ sơ nghiệm thu hiện số lượt chấm và token bằng 0 dù thực tế đã chấm 3 lượt, nên người ký có thể hiểu nhầm là chưa đo. Người dùng cuối của ứng dụng không bị ảnh hưởng.
  Căn cứ: Chỉ là số hiển thị sai trên trang nội bộ do công cụ ngoài sinh ra, không mất dữ liệu; sửa đúng chỗ là ở công cụ đó chứ không ở tính năng này.
  file: `_acceptance/can-gia-tot-sua-ba-loi/evidence-page.html`
  severity: low
  Đề xuất: wont-fix

- **Bước E7 ghi nguyên chữ ô Tên vào observed, trong khi cùng eval đòi che tên người bán vì kho công khai (r3 · tệp đã đổi)**
  Người dùng thấy gì: Báo cáo bằng chứng có thể chép tên người bán thật lên kho công khai dù bước chụp hình đã che tên. Không ảnh hưởng người dùng cuối vì tên người bán vốn công khai.
  Căn cứ: Hậu quả nhẹ: tên người bán trên tin rao vốn đã công khai nên không lộ gì thêm, chỉ là tài liệu tự mâu thuẫn, sửa sau rẻ.
  file: `_acceptance/can-gia-tot-sua-ba-loi/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (không ghim thông điệp): ba đối chứng đỏ E1, E3 không chạy phép kiểm, không bắt thông điệp mà evals tuyên (r3)**
  Người dùng thấy gì: Một số bài kiểm tự động chứng minh được là bản hỏng áp được, nhưng chưa chắc bắt đúng lỗi nếu chữ giữ chỗ tên hay lộ tên nguồn quay lại. Người dùng hiện chưa thấy lỗi nào.
  Căn cứ: Hậu quả không chạm người dùng hiện tại, chỉ làm lưới an toàn về sau lỏng hơn; không mất hay lộ dữ liệu và bổ sung sau không đắt.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay): đối chứng của phép quét coChuGiuCho chỉ chạy trên DOM viết tay, không chạy trên bề mặt thật (r3)**
  Người dùng thấy gì: Phép kiểm chữ giữ chỗ tên chưa được thử đỏ trên màn hình thật, nên nếu có lỗi tương tự quay lại thì bài kiểm có thể không bắt được. Người dùng hiện thấy tên đúng.
  Căn cứ: Rủi ro chỉ là bỏ sót lỗi tái phát trong tương lai, người dùng tải lại là hết, không mất dữ liệu; nâng độ chặt sau không đắt.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): phép quét unknown trên HTML của thẻ Invest không có chiều đỏ nào (r3)**
  Người dùng thấy gì: Trên trang tin rao công khai, bài kiểm chữ giữ chỗ chưa được chứng minh bắt được lỗi, và có thể bỏ sót khi chữ này nằm lẫn với chữ khác. Hiện thẻ vẫn hiện Chưa có tên đúng.
  Căn cứ: Khách xem công khai hiện không bị ảnh hưởng, rủi ro chỉ là lưới kiểm lỏng về sau; sửa sau rẻ và không có dữ liệu bị mất hay lộ.
  file: `app/tests/tin-rao-cong-khai.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): trục D của contract không có ma trận ô Người xem cho AC-1, AC-2 (r3)**
  Người dùng thấy gì: Một số màn hình dành cho vai Người xem chưa được kiểm đầy đủ về chữ giữ chỗ tên và lý do rời danh sách. Người dùng vai này chưa thấy lỗi nào được ghi nhận.
  Căn cứ: Mức phủ kiểm mỏng hơn khai báo nhưng chưa có lỗi thật nào với người xem; không mất hay lộ dữ liệu và có thể bổ sung sau với chi phí thấp.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Năm frame E7 đưa dữ liệu thật không che lên kho công khai: chữ bài gốc, ảnh tin, SĐT, tên người bán (r2)**
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

- **Hình dạng 4 — Không ghim thông điệp: ba đối chứng đỏ không chạy phép kiểm thật, nên thông điệp E1 và E3 khai «ném» không được chứng minh (r1)**
  Người dùng thấy gì: Một số phép thử đối chứng chưa chứng minh được là báo đúng lỗi khi dữ liệu sai. Người dùng không thấy khác biệt, chỉ độ chắc của bằng chứng thấp hơn khai báo.
  Căn cứ: Chỉ làm yếu bằng chứng nội bộ, không ảnh hưởng hiển thị cho người dùng, và các giá trị đột biến vẫn đã được kiểm.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 5/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/can-gia-tot-sua-ba-loi/evals.yaml, _acceptance/can-gia-tot-sua-ba-loi/evidence-page.html) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
