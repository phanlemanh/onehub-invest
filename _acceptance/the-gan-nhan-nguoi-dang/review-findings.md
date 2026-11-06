## Trong hợp đồng

- **Hình dạng 5: Coverage khai trục «đơn vị giá» (và «chọn») nhưng ma trận TND-AC-6 không có phần tử đó**
  file: `app/tests/labels-nhom.test.tsx:559`
  severity: medium
  AC: AC-6
  source: measurement
  detail: contract.md mục Coverage khai trục lỗi theo ô gồm bốn phần tử «ô thường · hai đầu giá · đơn vị giá · ô chưa sửa». AC-6 hứa ba cách sửa (gõ, chọn, tick) và «đổi đơn vị giá thì mất lỗi của cả hai đầu giá». Bảng KY_VONG viết trước chỉ có ba bước: sau khi lưu, sau khi tick «Diện tích: không suy ra được», sau khi gõ nhan-price_min_vnd. Không bước nào đổi ToggleGroup đơn vị giá, cũng không bước nào chọn giá trị. Đường mã riêng `onValueChange={... setDonVi(...); boLoi(O_GIA) }` trong label-form-nhom.tsx không có phép đo. Đột biến bỏ dòng `boLoi(O_GIA)` trong ToggleGroup thì test vẫn xanh, vì đột biến đỏ duy nhất (banDot) chỉ gỡ `boLoi(...)` trong `dat`. Số assert không bằng số phần tử trục đã khai.
  rationale: AC-6 hứa đổi đơn vị giá thì mất lỗi cả hai đầu giá và Coverage khai trục này, nhưng phép đo không chạm đường đó nên lời hứa chưa được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Docstring của docBaiCum vẫn nói chỉ đọc chữ và cột ảnh, trong khi câu SELECT giờ đọc thêm sender_name, sender_id, posted_at**
  Người dùng thấy gì: Không ảnh hưởng gì đến người gắn nhãn: thẻ vẫn hiện đúng. Chỉ có một dòng ghi chú trong mã nói chưa đúng về những gì hàm được đọc.
  Căn cứ: Không đổi hành vi nào người dùng thấy, sửa lại chỉ là chỉnh một dòng ghi chú nên không đáng mở việc riêng.
  file: `app/src/lib/labels-cum.ts`
  severity: low
  Đề xuất: wont-fix

- **Giờ đăng của thẻ ghép lệch giữa lượt một và lượt hai sau khi đổi nguồn postedAt**
  Người dùng thấy gì: Với một số tin ghép, giờ đăng ở thẻ lượt một có thể khác giờ ở lượt hai, và khi không tìm thấy tin chữ thì thẻ có thể không hiện giờ. Người gắn nhãn tìm bài trong nhóm bằng tên và giờ có thể thấy hai giờ khác nhau cho cùng một tin.
  Căn cứ: Ảnh hưởng nhẹ và chỉ gặp ở tin ghép hiếm; không mất dữ liệu, người gắn vẫn tự đối chiếu được bằng tên và ID, nên ghi lại hạn chế này rồi xử lý cùng lúc với lượt hai.
  file: `app/src/lib/labels-queries.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: assert HTML «giờ tới phút của tin chữ» không phân biệt được hai giá trị vì fixture để hai giờ cùng một phút**
  Người dùng thấy gì: Phép kiểm tự động chưa phân biệt được giờ của tin chữ với giờ của bài ảnh trên chữ in ra thẻ, vì hai giờ trong dữ liệu thử rơi cùng một phút. Nếu thẻ in nhầm giờ bài ảnh thì phép kiểm đó vẫn qua.
  Căn cứ: Dữ liệu trả về đã được kiểm đúng giờ, rủi ro chỉ là nhầm giờ lúc in mà người gắn thấy ngay; sửa sau rẻ nên ghi lại hạn chế.
  file: `app/tests/labels-nguoi-dang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: đối chứng đỏ của phép âm «LO MA NHOM» là tự khẳng định, không chạy qua phép quét âm**
  Người dùng thấy gì: Chưa có bằng chứng chắc rằng phép kiểm sẽ báo đỏ nếu mã nhóm thật sự lọt ra màn hình hoặc dữ liệu trả về. Hiện chưa thấy mã nhóm bị lộ.
  Căn cứ: Không có dấu hiệu lộ dữ liệu thật, chỉ là lưới an toàn kiểm thử chưa được thử đến nơi; bổ sung sau không mất gì nhưng nên ghi để không tin quá vào phép kiểm này.
  file: `app/tests/labels-nguoi-dang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1: probe «ok luoc do tam» grep thứ tự dòng chữ thay vì đo hiệu ứng, và bỏ qua import tĩnh**
  Người dùng thấy gì: Bước kiểm tra rằng bài thử chỉ chạy trên cơ sở dữ liệu tạm hiện đúng, nhưng chỉ đọc thứ tự dòng chữ nên về sau có thể báo qua nhầm nếu ai thêm một phần nạp mới. Hiện tại không có dữ liệu thật nào bị ghi.
  Căn cứ: Hôm nay không gây hại gì cho dữ liệu thật; rủi ro chỉ xuất hiện nếu mã đổi về sau nên ghi lại hạn chế là đủ.
  file: `_acceptance/the-gan-nhan-nguoi-dang/probes/pham-vi.sh`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
