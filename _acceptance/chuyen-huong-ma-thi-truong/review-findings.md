## Trong hợp đồng

- **scope.sh không cho phép app/src/lib/dq-labels.ts mà nhánh đã đổi tệp này, nên E9 đỏ ở HEAD**
  file: `_acceptance/chuyen-huong-ma-thi-truong/probes/scope.sh:20`
  severity: high
  AC: AC-9
  source: conventions
  detail: Commit d3f37a0f (mục N1-5) thêm hai nhãn S04/danang và S04/haiphong vào app/src/lib/dq-labels.ts. Danh sách cho phép trong hàm kiem() không có tệp này, cũng không có glob nào khớp. Đã chạy `bash _acceptance/chuyen-huong-ma-thi-truong/probes/scope.sh "$PWD"` trên HEAD: ra `NGOÀI PHẠM VI app/src/lib/dq-labels.ts` và không in `SCOPE OK`. Vì vậy E9/AC-9 đỏ một cách tất định, chạy lại bao nhiêu lần cũng vậy. Thêm nữa, contract, card và evals không có AC hay eval nào phủ thay đổi này: paths của các eval không nhắc dq-labels.ts ngoài E11/E12 quét chung app/src/**, và hai nhãn mới không có ca test riêng. Hai hướng xử lý: khai dq-labels.ts vào phạm vi của hàng (cả scope.sh lẫn contract, có ghi quyết định), hoặc tách commit này ra PR riêng. Không nên để nguyên cả hai phía lệch nhau.

- **E9 đỏ ở HEAD: danh sách cho phép của scope.sh thiếu app/src/lib/dq-labels.ts mà commit d3f37a0f vừa sửa**
  file: `_acceptance/chuyen-huong-ma-thi-truong/probes/scope.sh:21`
  severity: high
  AC: AC-9
  source: bugs
  detail: Commit d3f37a0f thêm nhãn S04/danang và S04/haiphong vào app/src/lib/dq-labels.ts nhưng không thêm tệp này vào nhánh case của hàm kiem. Đã chạy thật ở HEAD: `bash probes/scope.sh "$PWD"` thoát 1 và in `NGOÀI PHẠM VI app/src/lib/dq-labels.ts`, không ra 'SCOPE OK'. Vì vậy E9 (AC-9) trượt ở vòng này. Bằng chứng PASS của E9 trong evidence-report.md là từ r1, chạy trước commit đó. Hướng sửa: thêm tệp vào allowlist nếu sửa nhãn được tính là trong phạm vi (giám sát đã duyệt N1-5), hoặc tách commit này ra khỏi hàng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **/yield?market=a&market=b giờ sập 500 vì tham số URL dạng mảng đi thẳng vào giaiMaKhuVuc**
  Người dùng thấy gì: Nếu ai đó mở trang Ước tính lợi suất với đường dẫn lặp tham số thị trường (ví dụ ghi hai lần), trang báo lỗi thay vì hiện bình thường như trước. Đường dẫn bình thường vẫn mở đúng.
  Căn cứ: Chỉ xảy ra với đường dẫn bị gõ hoặc ghép sai, hiếm gặp; người dùng tải lại bằng đường dẫn chuẩn là xem được, không mất hay lộ dữ liệu, và sửa sau vẫn rẻ.
  file: `app/src/app/(app)/yield/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **thiTruongDaDoi không kiểm country, nên URL rác bị 308 sang đích không tồn tại, trái AC-4**
  Người dùng thấy gì: Một đường link sai với tiền tố quốc gia lạ có thể bị chuyển vĩnh viễn sang một địa chỉ vô nghĩa rồi mới báo không tìm thấy. Người dùng vẫn chỉ thấy trang không tìm thấy.
  Căn cứ: Hậu quả cuối vẫn là trang không tìm thấy như trước, chỉ có rủi ro nhỏ là trình duyệt nhớ đích sai; không mất dữ liệu và chỉ xảy ra với link sai tự gõ.
  file: `app/src/lib/ma-thi-truong.ts`
  severity: low
  Đề xuất: known-limits

- **E12 bỏ dòng đỏ cấp tệp nên tệp test vỡ lúc nạp bị bỏ sót khi có ca đỏ khác (tồn từ r1, chưa sửa)**
  Người dùng thấy gì: Phép kiểm tự động có thể bỏ sót một tệp kiểm thử bị hỏng khi nhánh đang có sẵn ca đỏ khác. Người dùng cuối không bị ảnh hưởng trực tiếp.
  Căn cứ: Chỉ làm yếu lưới an toàn nội bộ trong tình huống hẹp, không ảnh hưởng người dùng và có thể phát hiện lại bằng chạy test thủ công.
  file: `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **/yield?market=a&market=b ném TypeError, trước thay đổi vẫn hiện trang (tồn từ r1, chưa sửa)**
  Người dùng thấy gì: Mở trang Ước tính lợi suất với tham số thị trường lặp hai lần sẽ báo lỗi, trong khi trước đây vẫn hiện trang mặc định.
  Căn cứ: Nhẹ và tự gỡ được bằng cách bỏ tham số thừa hoặc tải lại; link chuẩn của hệ thống không gặp lỗi này.
  file: `app/src/app/(app)/yield/page.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — assert «chuỗi có mặt» trong khi lời hứa là quan hệ: mã trong kết quả phải là mã dài**
  Người dùng thấy gì: Phép kiểm tự động chưa chặt hết, nên một lỗi trả sai mã thị trường ở thống kê tài sản có thể lọt qua mà không báo đỏ.
  Căn cứ: Không có lỗi người dùng thấy được ở hiện tại, chỉ là lưới kiểm thử còn lỏng; siết lại sau không tốn kém và không mất dữ liệu.
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên ma trận 9 ô data-api cho AC-8 nhưng chỉ một điểm kiểm «mang mã dài»**
  Người dùng thấy gì: Phép kiểm tự động chỉ xác nhận mã thị trường ở một trong chín điểm của API công khai, nên lỗi ở các điểm còn lại có thể không bị bắt.
  Căn cứ: Chỉ là lỗ hổng kiểm thử, người dùng chưa gặp lỗi nào; bổ sung kiểm thử sau là rẻ và không ảnh hưởng dữ liệu.
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — đối chứng đột biến không chạy qua phép đo thật, thông điệp ghim do chính đối chứng tự viết**
  Người dùng thấy gì: Bước tự kiểm tra phép đo có thể vẫn xanh dù phép đo thật bị làm yếu đi, nên độ tin cậy của kết quả nghiệm thu thấp hơn vẻ ngoài.
  Căn cứ: Không ảnh hưởng người dùng cuối; chỉ giảm độ tin của bộ kiểm thử, sửa sau không tốn kém.
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — đối chứng E12 chỉ thử hàm lọc thuần, không ghim thông điệp và bỏ qua đường đọc ca đỏ**
  Người dùng thấy gì: Bước tự kiểm tra của công cụ đo chưa bao phủ trường hợp tệp kiểm thử bị hỏng, nên lỗi loại này có thể bị bỏ sót.
  Căn cứ: Chỉ là lỗ hổng nội bộ của công cụ kiểm, người dùng không gặp; hiếm xảy ra và có thể phát hiện bằng chạy test thủ công.
  file: `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

