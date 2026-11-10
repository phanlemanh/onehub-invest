# Review findings: the-gan-nhan-nguoi-dang (round 2)

## Trong hợp đồng

Không có finding nào ở vòng này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Docstring của docBaiCum vẫn nói chỉ đọc chữ và cột ảnh, trong khi câu SELECT giờ đọc thêm sender_name, sender_id, posted_at (r1)**
  Người dùng thấy gì: Không ảnh hưởng gì đến người gắn nhãn: thẻ vẫn hiện đúng. Chỉ có một dòng ghi chú trong mã nói chưa đúng về những gì hàm được đọc.
  Căn cứ: Không đổi hành vi nào người dùng thấy, sửa lại chỉ là chỉnh một dòng ghi chú nên không đáng mở việc riêng.
  file: `app/src/lib/labels-cum.ts`
  severity: low
  Đề xuất: wont-fix

- **Giờ đăng của thẻ ghép lệch giữa lượt một và lượt hai sau khi đổi nguồn postedAt (r1)**
  Người dùng thấy gì: Với một số tin ghép, giờ đăng ở thẻ lượt một có thể khác giờ ở lượt hai, và khi không tìm thấy tin chữ thì thẻ có thể không hiện giờ. Người gắn nhãn tìm bài trong nhóm bằng tên và giờ có thể thấy hai giờ khác nhau cho cùng một tin.
  Căn cứ: Ảnh hưởng nhẹ và chỉ gặp ở tin ghép hiếm; không mất dữ liệu, người gắn vẫn tự đối chiếu được bằng tên và ID, nên ghi lại hạn chế này rồi xử lý cùng lúc với lượt hai.
  file: `app/src/lib/labels-queries.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: assert HTML «giờ tới phút của tin chữ» không phân biệt được hai giá trị vì fixture để hai giờ cùng một phút (r1)**
  Người dùng thấy gì: Phép kiểm tự động chưa phân biệt được giờ của tin chữ với giờ của bài ảnh trên chữ in ra thẻ, vì hai giờ trong dữ liệu thử rơi cùng một phút. Nếu thẻ in nhầm giờ bài ảnh thì phép kiểm đó vẫn qua.
  Căn cứ: Dữ liệu trả về đã được kiểm đúng giờ, rủi ro chỉ là nhầm giờ lúc in mà người gắn thấy ngay; sửa sau rẻ nên ghi lại hạn chế.
  file: `app/tests/labels-nguoi-dang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: đối chứng đỏ của phép âm «LO MA NHOM» là tự khẳng định, không chạy qua phép quét âm (r1)**
  Người dùng thấy gì: Chưa có bằng chứng chắc rằng phép kiểm sẽ báo đỏ nếu mã nhóm thật sự lọt ra màn hình hoặc dữ liệu trả về. Hiện chưa thấy mã nhóm bị lộ.
  Căn cứ: Không có dấu hiệu lộ dữ liệu thật, chỉ là lưới an toàn kiểm thử chưa được thử đến nơi; bổ sung sau không mất gì nhưng nên ghi để không tin quá vào phép kiểm này.
  file: `app/tests/labels-nguoi-dang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1: probe «ok luoc do tam» grep thứ tự dòng chữ thay vì đo hiệu ứng, và bỏ qua import tĩnh (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bước kiểm tra rằng bài thử chỉ chạy trên cơ sở dữ liệu tạm hiện đúng, nhưng chỉ đọc thứ tự dòng chữ nên về sau có thể báo qua nhầm nếu ai thêm một phần nạp mới. Hiện tại không có dữ liệu thật nào bị ghi.
  Căn cứ: Hôm nay không gây hại gì cho dữ liệu thật; rủi ro chỉ xuất hiện nếu mã đổi về sau nên ghi lại hạn chế là đủ.
  file: `_acceptance/the-gan-nhan-nguoi-dang/probes/pham-vi.sh`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
