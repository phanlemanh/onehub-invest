# Review findings: chuyen-huong-ma-thi-truong (round 3)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **/yield?market=a&market=b sập 500: tham số URL dạng mảng đi thẳng vào giaiMaKhuVuc, không kiểm kiểu ở biên**
  Người dùng thấy gì: Nếu ai đó mở trang Ước tính lợi suất với địa chỉ có hai thị trường lặp lại, trang báo lỗi thay vì rơi về thị trường mặc định như trước. Chỉ gặp khi tự gõ hoặc dán địa chỉ bất thường.
  Căn cứ: Link do hệ thống tạo ra không bao giờ lặp tham số nên người dùng thường không gặp, và nếu gặp thì tải lại bằng địa chỉ chuẩn là xong, không mất dữ liệu.
  file: `app/src/app/(app)/yield/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **thiTruongDaDoi không kiểm country, URL sai bị 308 vĩnh viễn sang đích vô nghĩa**
  Người dùng thấy gì: Nếu gõ sai phần đầu địa chỉ thị trường, trang có thể chuyển vĩnh viễn sang một địa chỉ vô nghĩa rồi mới báo không tìm thấy. Người dùng cuối vẫn thấy trang không tồn tại.
  Căn cứ: Chỉ xảy ra với địa chỉ gõ sai, kết quả cuối vẫn là trang không tìm thấy nên hậu quả nhẹ, nhưng trình duyệt có thể nhớ lần chuyển hướng nhầm và người dùng tự xoá được bằng cách xoá lịch sử.
  file: `app/src/lib/ma-thi-truong.ts`
  severity: low
  Đề xuất: known-limits

- **Module và hàm mới đặt tên tiếng Việt, trái quy ước «Code, API, types: tiếng Anh», kể cả trong gói public data-api**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối; chỉ khiến mã nguồn công khai của API lẫn tên tiếng Việt, khác quy ước đặt tên của dự án.
  Căn cứ: Không ảnh hưởng chức năng hay dữ liệu, chỉ là thẩm mỹ mã nguồn, và đổi tên sau này rẻ khi cần.
  file: `data-api/src/lib/ma-thi-truong.ts`
  severity: low
  Đề xuất: wont-fix

- **/yield?market=a&market=b ném TypeError: tham số lặp (mảng) đi thẳng vào giaiMaKhuVuc, hồi quy so với trước**
  Người dùng thấy gì: Mở trang Ước tính lợi suất với thị trường lặp hai lần sẽ ra trang lỗi, trong khi trước đây trang vẫn mở bằng thị trường mặc định.
  Căn cứ: Chỉ xuất hiện với địa chỉ tự gõ bất thường, không mất dữ liệu, và người dùng tự khắc phục bằng cách mở lại địa chỉ chuẩn.
  file: `app/src/app/(app)/yield/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **thiTruongDaDoi không kiểm country nên URL rác bị 308 sang đích vô nghĩa, trái AC-4**
  Người dùng thấy gì: Địa chỉ thị trường gõ sai phần đầu có thể bị chuyển vĩnh viễn sang địa chỉ vô nghĩa rồi báo không tìm thấy.
  Căn cứ: Chỉ với địa chỉ gõ sai và người dùng vẫn nhận trang không tìm thấy như trước, nên ảnh hưởng nhẹ và không mất dữ liệu.
  file: `app/src/lib/ma-thi-truong.ts`
  severity: low
  Đề xuất: known-limits

- **E12 lọc bỏ dòng đỏ cấp tệp, nên tệp test vỡ lúc nạp bị nuốt khi nhánh đã có ca đỏ khác**
  Người dùng thấy gì: Người dùng không thấy gì; chỉ là bước kiểm tự động có thể bỏ sót một tệp kiểm thử mới bị hỏng khi nhánh đã có ca đỏ khác.
  Căn cứ: Không ảnh hưởng sản phẩm đã ra mắt, chỉ làm lưới kiểm lỏng hơn ở một tình huống hiếm, và người rà soát vẫn thấy được khi đọc kết quả.
  file: `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — assert «chuỗi có mặt» cho lời hứa quan hệ «mã trong kết quả là mã dài»**
  Người dùng thấy gì: Người dùng không thấy gì; phép kiểm tự động chỉ xác nhận mã dài có xuất hiện đâu đó trong kết quả chứ không soi từng dòng.
  Căn cứ: Không có lỗi sản phẩm nào được chỉ ra, chỉ là lưới kiểm chưa chặt, nên không cần chặn việc ra mắt.
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — E8 tuyên ma trận 9 ô data-api «mang mã dài» nhưng chỉ có điểm-case /v1/markets/:id**
  Người dùng thấy gì: Người dùng không thấy gì; phép kiểm chỉ xác nhận mã trả về cho một trong chín lời gọi API công khai, nên các lời gọi còn lại chưa được đo.
  Căn cứ: Chưa có bằng chứng sản phẩm trả sai, chỉ là phạm vi kiểm hẹp hơn lời tuyên bố, và bổ sung sau không ảnh hưởng người dùng.
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — đối chứng đột biến không ghim thông điệp thật: E6 tự viết thông điệp, E7 thiếu tên ô**
  Người dùng thấy gì: Người dùng không thấy gì; phép tự kiểm chứng của bộ kiểm thử báo lỗi bằng thông điệp tự đặt nên kém tin cậy hơn dự định.
  Căn cứ: Chỉ làm bộ kiểm yếu hơn ở một chỗ, không gây sai lệch dữ liệu hay hành vi nào cho người dùng.
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — đột biến «luôn tra» không ghim thông điệp E4 hứa và không chạy qua assert đếm thật**
  Người dùng thấy gì: Người dùng không thấy gì; bước tự kiểm chứng của bộ kiểm thử có thể vẫn xanh dù phép đếm truy vấn bị làm yếu đi.
  Căn cứ: Không phải lỗi sản phẩm, chỉ làm lưới an toàn tương lai kém chặt, và nâng cấp sau rất rẻ.
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture Đà Nẵng dựng tay đúng khuôn WHERE của route, lệch khuôn E6 khai và ô <phường> không được gọi**
  Người dùng thấy gì: Người dùng không thấy gì; dữ liệu thử dựng tay nên hai trường hợp mã phường chưa được đo đúng như mô tả.
  Căn cứ: Chưa có bằng chứng người dùng gặp sai, và phép đo thật sẽ có khi dữ liệu phường thật được nạp, nên có thể ghi nhận rồi theo dõi.
  file: `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — đối chứng E12 chỉ thử hàm lọc thuần, nhãn 'ca đỏ mới' là chuỗi tĩnh, không ghim thông điệp thật**
  Người dùng thấy gì: Người dùng không thấy gì; bước tự kiểm chứng cuối cùng của bộ kiểm thử chỉ thử một phần nên có thể bỏ sót một kiểu lỗi test.
  Căn cứ: Chỉ là lưới kiểm lỏng ở tình huống hiếm, không ảnh hưởng dữ liệu hay trải nghiệm người dùng.
  file: `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

