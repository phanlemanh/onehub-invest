# Review findings: the-so-doc-gia-tri-song (round 2)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 — Fixture VIẾT TAY đúng khuôn bên đọc: evidence thẻ ghép căn không rút từ writer thật (029 / judge-run) (r1)**
  Người dùng thấy gì: Bài thử dùng dữ liệu chụp lúc chấm do tay dựng, nên nếu nơi sinh thẻ đổi cách ghi, bài thử vẫn xanh trong khi màn hình duyệt có thể sai. Người duyệt hiện chưa thấy lỗi nào.
  Căn cứ: Không có lỗi nào hiện ra cho người dùng, chỉ là bài thử kém nhạy với thay đổi tương lai; có thể bổ sung sau với chi phí thấp.
  file: `app/tests/the-so-gia-tri-song.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Assert «chuỗi có mặt» (includes) trong khi lời hứa là quan hệ bằng nhau giữa ô và giá trị sống (r1)**
  Người dùng thấy gì: Bài thử chấp nhận ô có thêm chữ thừa quanh giá trị đúng, nên một lỗi hiển thị nhỏ như số tầng bị dính thêm chữ có thể lọt qua. Hiện chưa có ô nào bị hiện sai.
  Căn cứ: Rủi ro thấp và chỉ ảnh hưởng trong trường hợp ô có chữ thừa; người duyệt vẫn nhìn thấy và tự nhận ra, sửa sau không tốn kém.
  file: `app/tests/the-so-gia-tri-song.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm-tính-một-mình ở GS-AC-8: chỉ kiểm nút vắng, không có đối chứng dương cho khu trạng thái đã quyết (r1)**
  Người dùng thấy gì: Với thẻ đã quyết mà tin rời kho, bài thử chỉ xác nhận ba nút biến mất, chưa xác nhận khu hiển thị kết quả đã quyết còn đó. Nếu khu đó mất, người duyệt sẽ thấy thẻ trống phần trạng thái mà bài thử không báo.
  Căn cứ: Hậu quả nhẹ, chỉ là thông tin trạng thái có thể thiếu trên thẻ cũ, không mất dữ liệu; tải lại không đổi nhưng thêm kiểm tra sau rất rẻ.
  file: `app/tests/the-so-gia-tri-song.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Chiều đỏ của nhãn So (GS-AC-1) không chạy lại assertion xanh mà dựng một assert nội tuyến, đường card không được chứng minh là đỏ (r1)**
  Người dùng thấy gì: Chưa có bằng chứng chắc rằng nếu nhãn So bị tính lại từ dữ liệu chụp cũ thì bài thử trên thẻ thật sẽ báo đỏ. Người duyệt hiện vẫn thấy nhãn đúng.
  Căn cứ: Chỉ là độ tin cậy của phép thử đảo chiều, không ảnh hưởng người dùng, và đường xanh đã kiểm nhãn đúng nên chi phí sửa vượt hậu quả.
  file: `app/tests/the-so-gia-tri-song.test.tsx`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
